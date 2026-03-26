'use client';

import Link from 'next/link';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { usePosts } from '@/hooks/usePosts';
import type { PostItem } from '@/lib/api/posts';

function formatStatus(post: PostItem): string {
  const raw = post.status ?? post.publishMode ?? 'draft';
  return raw.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim();
}

function getPostPreview(post: PostItem): string | null {
  const assets = Array.isArray(post.assets) ? post.assets : [];
  const candidate = assets.find((asset) => typeof asset.previewUrl === 'string' && asset.previewUrl)
    ?? assets.find((asset) => typeof asset.url === 'string' && asset.url);

  if (!candidate) return null;
  return (candidate.previewUrl as string | undefined) ?? (candidate.url as string | undefined) ?? null;
}

export default function PostsPage() {
  const { posts, isLoading, error, cacheSavedAt, refreshFromApi, runDueJobs } = usePosts();
  const [runNotice, setRunNotice] = useState<string | null>(null);
  const [isRunningDueJobs, setIsRunningDueJobs] = useState(false);

  async function handleRunDueJobs() {
    setRunNotice(null);
    setIsRunningDueJobs(true);
    try {
      const result = await runDueJobs();
      if (!result.success) {
        setRunNotice(result.error ?? 'Failed to run due jobs.');
        return;
      }
      setRunNotice('Due publish jobs triggered successfully.');
    } finally {
      setIsRunningDueJobs(false);
    }
  }

  return (
    <section className="p-6 lg:p-10 max-w-[1300px] mx-auto min-h-screen">
      <div className="mb-8 flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Posts</h1>
          <p className="text-text-secondary mt-2 font-medium">
            All posts list with title, image and status.
          </p>
          {cacheSavedAt && (
            <p className="text-xs text-text-secondary mt-2">
              Showing cached data saved at {new Date(cacheSavedAt).toLocaleString()}.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunDueJobs}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition-colors font-bold text-sm"
            type="button"
            disabled={isRunningDueJobs}
          >
            {isRunningDueJobs ? 'Running...' : 'Run Due Jobs'}
          </button>
          <Link
            href="/posts/automation"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary font-bold hover:bg-primary/5 transition-colors text-sm"
          >
            Automation + Queue
          </Link>
          <button
            onClick={() => refreshFromApi()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-text-secondary/20 text-text-secondary hover:text-text-primary hover:border-text-secondary/40 transition-colors font-bold"
            type="button"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Create Post
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}
      {runNotice && (
        <div className="mb-6 rounded-2xl border border-text-secondary/10 bg-bg-primary px-4 py-3 text-sm font-medium text-text-primary">
          {runNotice}
        </div>
      )}

      <div className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-5 md:p-6">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="min-h-[340px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl font-black text-text-primary">No Posts Found</h2>
            <p className="text-text-secondary mt-2 mb-6">
              Create your first post and it will appear here.
            </p>
            <Link
              href="/posts/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const preview = getPostPreview(post);
              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-text-secondary/10 p-3 md:p-4 hover:border-text-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/posts/${post.id}`}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-secondary border border-text-secondary/10 flex-shrink-0"
                    >
                      {preview ? (
                        <img src={preview} alt={post.title ?? 'Post'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary">
                          <FileText size={20} />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link href={`/posts/${post.id}`} className="block">
                        <h3 className="font-black text-text-primary truncate">
                          {post.title || 'Untitled post'}
                        </h3>
                      </Link>
                      <p className="text-xs text-text-secondary mt-1">
                        Status:
                        {' '}
                        <span className="font-bold">{formatStatus(post)}</span>
                      </p>
                    </div>

                    <Link
                      href={`/posts/${post.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 text-primary font-bold hover:bg-primary/5 transition-colors text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
