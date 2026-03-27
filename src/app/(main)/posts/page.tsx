'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eye, FileText, Flag, Plus, RefreshCw, Send } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import type { PostItem } from '@/lib/api/posts';
import { Alert, Button, Card } from '@/components/common';

type FilterKey = 'all' | 'draft' | 'published' | 'pending' | 'scheduled';

const PAGE_SIZE = 10;
const LIVE_REFRESH_MS = 15000;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All Posts' },
  { key: 'draft', label: 'Draft' },
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

function isDraft(post: PostItem): boolean {
  const status = normalizeText(post.status);
  const mode = normalizeText(post.publishMode);
  if (status.includes('draft')) return true;
  if (isPublished(post)) return false;
  if (hasError(post)) return false;
  return mode === 'manual' || mode === 'manualdraft';
}

function hasError(post: PostItem): boolean {
  const status = normalizeText(post.status);
  return !!post.lastError || status.includes('error') || status.includes('fail');
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
    queuePublish,
    approveExistingPost,
    rejectExistingPost,
  } = usePosts();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRunningDue, setIsRunningDue] = useState(false);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([refreshFromApi({ silent: true }), refreshPendingApprovalFromApi({ silent: true })]);
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void Promise.all([refreshFromApi({ silent: true }), refreshPendingApprovalFromApi({ silent: true })]);
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
      case 'draft':
        return allPosts.filter(isDraft);
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
      const draftPosts = allPosts.filter(isDraft);
      let queuedCount = 0;
      let queueFailures = 0;

      for (const post of draftPosts) {
        const queued = await queuePublish(post.id);
        if (queued.success) {
          queuedCount += 1;
        } else {
          queueFailures += 1;
        }
      }

      const result = await runDueJobs();
      if (!result.success) {
        setNotice(result.error ?? 'Failed to run due publish jobs.');
        return;
      }

      if (queueFailures > 0) {
        setNotice(`Queued ${queuedCount} draft posts. ${queueFailures} failed to queue. Publish jobs processed.`);
      } else {
        setNotice(`Queued ${queuedCount} draft posts and processed publish jobs.`);
      }
      await Promise.all([refreshFromApi({ silent: true }), refreshPendingApprovalFromApi({ silent: true })]);
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
      await Promise.all([refreshFromApi({ silent: true }), refreshPendingApprovalFromApi({ silent: true })]);
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
      await Promise.all([refreshFromApi({ silent: true }), refreshPendingApprovalFromApi({ silent: true })]);
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
          <Button
            type="button"
            onClick={() => Promise.all([refreshFromApi(), refreshPendingApprovalFromApi()])}
            variant="outline"
            className="text-sm"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            type="button"
            onClick={handleRunDueJobs}
            disabled={isRunningDue}
            variant="outline"
            className="text-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Send size={16} />
            {isRunningDue ? 'Running...' : 'Move Drafts & Publish'}
          </Button>
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
        <Alert variant={error ? 'alert' : 'success'} className="mb-6">
          {error || notice}
        </Alert>
      )}

      <Card className="rounded-[28px] p-5 md:p-6">
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map((item) => (
            <Button
              type="button"
              key={item.key}
              onClick={() => handleFilterChange(item.key)}
              variant={filter === item.key ? 'primary' : 'outline'}
              size="sm"
              className={`text-sm ${
                filter === item.key
                  ? ''
                  : 'text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
              }`}
            >
              {item.label}
            </Button>
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
                          <div className="inline-flex items-center gap-2">
                            <StatusIndicator post={post} />
                            <span>{toStatus(post)}</span>
                          </div>
                          {post.approvalStatus && (
                            <span className="block text-xs text-text-secondary mt-1">Approval: {post.approvalStatus}</span>
                          )}
                          {post.lastError && (
                            <span className="block text-xs text-red-600 mt-1 truncate max-w-[240px]">{post.lastError}</span>
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
                                <Button
                                  type="button"
                                  disabled={busyPostId === post.id}
                                  onClick={() => handleApprove(post.id)}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg border-emerald-300 text-emerald-700 text-xs hover:bg-emerald-50"
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  disabled={busyPostId === post.id}
                                  onClick={() => handleReject(post.id)}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg border-red-300 text-red-700 text-xs hover:bg-red-50"
                                >
                                  Reject
                                </Button>
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
                <Button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  variant="outline"
                  className="text-text-primary hover:border-text-secondary/40"
                >
                  View More
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  );
}

function StatusIndicator({ post }: { post: PostItem }) {
  if (hasError(post)) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" title="Error" />;
  }

  if (isPublished(post)) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="Published" />;
  }

  if (isScheduled(post)) {
    return <Flag size={12} className="text-amber-500" title="Scheduled" />;
  }

  if (isDraft(post)) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400" title="Draft" />;
  }

  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" title="Unknown" />;
}
