'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eye, FileText, Plus, RefreshCw, Send } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import type { PostItem } from '@/lib/api/posts';

type FilterKey = 'all' | 'published' | 'pending' | 'scheduled';

const PAGE_SIZE = 10;
const LIVE_REFRESH_MS = 15000;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All Posts' },
  { key: 'published', label: 'Published' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'scheduled', label: 'Scheduled' },
];

function normalizeText(value?: string | null): string {
  return (value ?? '').toLowerCase();
}

function toStatus(post: PostItem): string {
  const value = post.status ?? post.publishMode ?? 'draft';
  return value.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim();
}

function isPublished(post: PostItem): boolean {
  const status = normalizeText(post.status);
  return status.includes('published') || status.includes('success') || status.includes('complete');
}

function isPendingApproval(post: PostItem): boolean {
  const approval = normalizeText(post.approvalStatus);
  const status = normalizeText(post.status);
  return approval === 'pending' || status.includes('pending') || status.includes('approval');
}

function isScheduled(post: PostItem): boolean {
  const mode = normalizeText(post.publishMode);
  return mode === 'scheduled' || !!post.scheduledFor;
}

function getPreview(post: PostItem): string | null {
  const assets = Array.isArray(post.assets) ? post.assets : [];
  const first = assets.find((asset) => typeof asset.previewUrl === 'string' || typeof asset.url === 'string');
  if (!first) return null;
  return (first.previewUrl as string | undefined) ?? (first.url as string | undefined) ?? null;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function AutomationPage() {
  const {
    posts,
    pendingApprovalPosts,
    isLoading,
    error,
    refreshFromApi,
    refreshPendingApprovalFromApi,
    runDueJobs,
    approveExistingPost,
    rejectExistingPost,
  } = usePosts();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRunningDue, setIsRunningDue] = useState(false);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([refreshFromApi(), refreshPendingApprovalFromApi()]);
    const id = setInterval(() => {
      void Promise.all([refreshFromApi(), refreshPendingApprovalFromApi()]);
    }, LIVE_REFRESH_MS);
    return () => clearInterval(id);
  }, [refreshFromApi, refreshPendingApprovalFromApi]);

  const allPosts = useMemo(() => {
    const map = new Map<string, PostItem>();
    for (const item of posts) map.set(item.id, item);
    for (const item of pendingApprovalPosts) map.set(item.id, item);
    return Array.from(map.values()).sort((a, b) => {
      const aTime = Date.parse(a.updatedAt ?? a.createdAt ?? '') || 0;
      const bTime = Date.parse(b.updatedAt ?? b.createdAt ?? '') || 0;
      return bTime - aTime;
    });
  }, [pendingApprovalPosts, posts]);

  const filteredPosts = useMemo(() => {
    switch (filter) {
      case 'published':
        return allPosts.filter(isPublished);
      case 'pending':
        return allPosts.filter(isPendingApproval);
      case 'scheduled':
        return allPosts.filter(isScheduled);
      default:
        return allPosts;
    }
  }, [allPosts, filter]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  async function handleRunDueJobs() {
    setNotice(null);
    setIsRunningDue(true);
    try {
      const result = await runDueJobs();
      if (!result.success) {
        setNotice(result.error ?? 'Failed to run due publish jobs.');
        return;
      }
      setNotice('Publish queue run started.');
      await Promise.all([refreshFromApi(), refreshPendingApprovalFromApi()]);
    } finally {
      setIsRunningDue(false);
    }
  }

  async function handleApprove(postId: string) {
    setBusyPostId(postId);
    setNotice(null);
    try {
      const result = await approveExistingPost(postId, 'Approved by user');
      if (!result.success) {
        setNotice(result.error ?? 'Failed to approve post.');
        return;
      }
      setNotice('Post approved.');
      await Promise.all([refreshFromApi(), refreshPendingApprovalFromApi()]);
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleReject(postId: string) {
    setBusyPostId(postId);
    setNotice(null);
    try {
      const result = await rejectExistingPost(postId, 'Rejected by user');
      if (!result.success) {
        setNotice(result.error ?? 'Failed to reject post.');
        return;
      }
      setNotice('Post rejected.');
      await Promise.all([refreshFromApi(), refreshPendingApprovalFromApi()]);
    } finally {
      setBusyPostId(null);
    }
  }

  function handleFilterChange(next: FilterKey) {
    setFilter(next);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <section className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-screen">
      <div className="mb-7 flex flex-col xl:flex-row gap-4 xl:items-end xl:justify-between">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Automation</h1>
          <p className="text-text-secondary mt-2 font-medium">Live post table with approval and queue actions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => Promise.all([refreshFromApi(), refreshPendingApprovalFromApi()])}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-text-secondary/20 text-text-secondary hover:text-text-primary hover:border-text-secondary/40 transition-colors font-bold text-sm"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleRunDueJobs}
            disabled={isRunningDue}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors font-bold text-sm disabled:opacity-60"
          >
            <Send size={16} />
            {isRunningDue ? 'Running...' : 'Run Publish Queue'}
          </button>
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity text-sm"
          >
            <Plus size={16} />
            Create New Post
          </Link>
        </div>
      </div>

      {(error || notice) && (
        <div className="mb-6 rounded-2xl border border-text-secondary/10 bg-bg-primary px-4 py-3 text-sm font-medium">
          {error && <p className="text-red-600">{error}</p>}
          {notice && <p className="text-emerald-700">{notice}</p>}
        </div>
      )}

      <div className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-5 md:p-6">
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => handleFilterChange(item.key)}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                filter === item.key
                  ? 'bg-primary text-white'
                  : 'border border-text-secondary/20 text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading automation posts...</p>
        ) : filteredPosts.length === 0 ? (
          <div className="min-h-[280px] flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-black text-text-primary">No Posts In This Category</h2>
            <p className="text-text-secondary mt-2 mb-6">Create a new post to start your automation workflow.</p>
            <Link
              href="/posts/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Create New Post
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-secondary border-b border-text-secondary/10">
                    <th className="py-2.5 font-bold">Post</th>
                    <th className="py-2.5 font-bold">Status</th>
                    <th className="py-2.5 font-bold">Source</th>
                    <th className="py-2.5 font-bold">Scheduled</th>
                    <th className="py-2.5 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePosts.map((post) => {
                    const preview = getPreview(post);
                    const pending = isPendingApproval(post);
                    return (
                      <tr key={post.id} className="border-b border-text-secondary/10 last:border-b-0">
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <div className="w-11 h-11 rounded-lg bg-secondary overflow-hidden border border-text-secondary/10">
                              {preview ? (
                                <img src={preview} alt={post.title ?? 'Post preview'} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                  <FileText size={16} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-text-primary truncate">{post.title || 'Untitled post'}</p>
                              <p className="text-xs text-text-secondary truncate">{post.captionText || 'No caption'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-2 text-text-primary font-semibold">
                          {toStatus(post)}
                          {post.approvalStatus && (
                            <span className="block text-xs text-text-secondary mt-1">Approval: {post.approvalStatus}</span>
                          )}
                        </td>
                        <td className="py-3 pr-2 text-text-primary">{post.sourceType || 'manual'}</td>
                        <td className="py-3 pr-2 text-text-secondary">{formatDateTime(post.scheduledFor)}</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/posts/${post.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary font-bold hover:bg-primary/5 transition-colors text-xs"
                            >
                              <Eye size={13} />
                              View
                            </Link>
                            {pending && (
                              <>
                                <button
                                  type="button"
                                  disabled={busyPostId === post.id}
                                  onClick={() => handleApprove(post.id)}
                                  className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busyPostId === post.id}
                                  onClick={() => handleReject(post.id)}
                                  className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="px-4 py-2 rounded-xl border border-text-secondary/20 text-text-primary font-bold hover:border-text-secondary/40 transition-colors"
                >
                  View More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
