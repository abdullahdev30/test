'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock3, Save } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';

function toLocalDatetime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoFromLocal(value: string): string {
  return new Date(value).toISOString();
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatStatus(raw?: string): string {
  if (!raw) return 'draft';
  return raw.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim();
}

export default function SchedulerPage() {
  const { posts, isLoading, error, updateExistingPost } = usePosts();
  const [localTimes, setLocalTimes] = useState<Record<string, string>>({});
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const schedulerPosts = useMemo(() => {
    return posts.filter((post) => {
      const mode = (post.publishMode ?? '').toLowerCase();
      const status = (post.status ?? '').toLowerCase();
      const hasSchedule = typeof post.scheduledFor === 'string' && post.scheduledFor.length > 0;
      return mode === 'scheduled' || mode === 'manualdraft' || status.includes('draft') || hasSchedule;
    });
  }, [posts]);

  async function saveSchedule(postId: string, fallbackTime?: string | null) {
    const nextLocal = localTimes[postId] ?? toLocalDatetime(fallbackTime);
    if (!nextLocal) return;

    setNotice(null);
    setSavingById((prev) => ({ ...prev, [postId]: true }));
    try {
      const result = await updateExistingPost(postId, {
        publishMode: 'scheduled',
        sourceTimezone: timezone,
        scheduledFor: toIsoFromLocal(nextLocal),
      });

      if (result.success) {
        setNotice('Schedule updated successfully.');
      }
    } finally {
      setSavingById((prev) => ({ ...prev, [postId]: false }));
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-text-primary tracking-tight">Scheduler</h1>
        <p className="text-text-secondary mt-2 font-medium">
          Scheduled draft posts with editable posting times.
        </p>
      </div>

      {(error || notice) && (
        <div className="mb-6 rounded-2xl border border-text-secondary/10 bg-bg-primary px-4 py-3">
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          {notice && <p className="text-emerald-600 text-sm font-medium">{notice}</p>}
        </div>
      )}

      <div className="bg-bg-primary rounded-[32px] border border-text-secondary/10 p-6 md:p-8 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading scheduled posts...</p>
        ) : schedulerPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-[#F3E8FF] text-[#7C3AED] rounded-full flex items-center justify-center mb-6">
              <Calendar size={32} />
            </div>
            <h2 className="text-2xl font-black text-text-primary mb-2">No Scheduled Draft Posts</h2>
            <p className="text-text-secondary font-medium mb-8 max-w-sm">
              Create a post first, then schedule it from the Posts module.
            </p>
            <Link
              href="/posts"
              className="px-6 py-3 bg-[#7C3AED] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Open Posts
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {schedulerPosts.map((post) => {
              const currentLocal = localTimes[post.id] ?? toLocalDatetime(post.scheduledFor);
              const isSaving = !!savingById[post.id];
              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-text-secondary/10 p-4 md:p-5 hover:border-text-secondary/30 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="text-base md:text-lg font-black text-text-primary">
                        {post.title || 'Untitled post'}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Status:
                        {' '}
                        <span className="font-bold">{formatStatus(post.status ?? post.publishMode)}</span>
                      </p>
                      <p className="text-xs md:text-sm text-text-secondary mt-1 line-clamp-2">
                        {post.captionText || 'No caption available'}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-2">
                        <Clock3 size={13} />
                        Current time: {formatDateTime(post.scheduledFor)}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <input
                        type="datetime-local"
                        value={currentLocal}
                        onChange={(event) =>
                          setLocalTimes((prev) => ({ ...prev, [post.id]: event.target.value }))
                        }
                        className="rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <button
                        type="button"
                        disabled={isSaving || !currentLocal}
                        onClick={() => saveSchedule(post.id, post.scheduledFor)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        <Save size={14} />
                        {isSaving ? 'Saving...' : 'Save Time'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
