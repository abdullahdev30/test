'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import { BarChart3, CalendarClock, CheckCircle2, Clock3, FileText, Plus, ShieldAlert } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import type { PostItem } from '@/lib/api/posts';

function normalize(value?: string | null): string {
  return (value ?? '').toLowerCase();
}

function isPublished(post: PostItem): boolean {
  const status = normalize(post.status);
  return status.includes('published') || status.includes('success') || status.includes('complete');
}

function isPending(post: PostItem): boolean {
  const approval = normalize(post.approvalStatus);
  const status = normalize(post.status);
  return approval === 'pending' || status.includes('pending') || status.includes('approval');
}

function isScheduled(post: PostItem): boolean {
  const mode = normalize(post.publishMode);
  return mode === 'scheduled' || !!post.scheduledFor;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function toHoursRemaining(value?: string | null): string {
  if (!value) return '-';
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return '-';
  const diffMs = ts - Date.now();
  if (diffMs <= 0) return 'due now';
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  return `${hours}h left`;
}

export default function DashboardPage() {
  const { posts, pendingApprovalPosts, isLoading, error } = usePosts();

  const allPosts = useMemo(() => {
    const map = new Map<string, PostItem>();
    for (const post of posts) map.set(post.id, post);
    for (const post of pendingApprovalPosts) map.set(post.id, post);
    return Array.from(map.values());
  }, [pendingApprovalPosts, posts]);

  const metrics = useMemo(() => {
    const total = allPosts.length;
    const published = allPosts.filter(isPublished).length;
    const pending = allPosts.filter(isPending).length;
    const scheduled = allPosts.filter(isScheduled).length;
    const upcoming = allPosts
      .filter((post) => !!post.scheduledFor)
      .sort((a, b) => {
        const aTime = Date.parse(a.scheduledFor ?? '') || Number.MAX_SAFE_INTEGER;
        const bTime = Date.parse(b.scheduledFor ?? '') || Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 3);

    return { total, published, pending, scheduled, upcoming };
  }, [allPosts]);

  const statusChart = useMemo(() => {
    const published = metrics.published;
    const pending = metrics.pending;
    const scheduled = metrics.scheduled;
    const total = Math.max(metrics.total, 1);
    return [
      { label: 'Published', value: published, percent: Math.round((published / total) * 100), color: 'bg-emerald-500' },
      { label: 'Pending Approval', value: pending, percent: Math.round((pending / total) * 100), color: 'bg-amber-500' },
      { label: 'Scheduled', value: scheduled, percent: Math.round((scheduled / total) * 100), color: 'bg-blue-500' },
    ];
  }, [metrics]);

  const sourceChart = useMemo(() => {
    const sourceCounts = allPosts.reduce<Record<string, number>>((acc, post) => {
      const key = post.sourceType || 'manual';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const total = Math.max(allPosts.length, 1);
    return Object.entries(sourceCounts)
      .map(([label, value]) => ({
        label,
        value,
        percent: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [allPosts]);

  return (
    <div className="p-6 lg:p-10 max-w-[1450px] mx-auto min-h-screen">
      <div className="mb-8 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Automation Dashboard</h1>
          <p className="text-text-secondary mt-2 font-medium">
            Monitor automation volume, approvals, and next scheduled posts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Create New Post
          </Link>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-text-secondary/20 text-text-secondary hover:text-text-primary hover:border-text-secondary/40 transition-colors font-bold"
          >
            <BarChart3 size={16} />
            Open Automation
          </Link>
        </div>
      </div>

      {(isLoading || error) && (
        <div className="mb-6 rounded-2xl border border-text-secondary/10 bg-bg-primary px-4 py-3 text-sm font-medium">
          {isLoading && <p className="text-text-secondary">Loading automation data...</p>}
          {error && <p className="text-red-600">{error}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Total Posts" value={metrics.total} icon={<FileText size={17} />} />
        <MetricCard title="Published" value={metrics.published} icon={<CheckCircle2 size={17} />} />
        <MetricCard title="Pending Approval" value={metrics.pending} icon={<ShieldAlert size={17} />} />
        <MetricCard title="Scheduled" value={metrics.scheduled} icon={<CalendarClock size={17} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <div className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-6">
          <h2 className="text-xl font-black text-text-primary mb-4">Status Split</h2>
          <div className="space-y-3">
            {statusChart.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <p className="font-bold text-text-primary">{item.label}</p>
                  <p className="text-text-secondary">{item.value} ({item.percent}%)</p>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-black text-text-primary mt-8 mb-4">Source Type Split</h3>
          <div className="space-y-3">
            {sourceChart.length === 0 && <p className="text-sm text-text-secondary">No source data available.</p>}
            {sourceChart.map((item) => (
              <div key={item.label} className="rounded-xl border border-text-secondary/10 p-3">
                <p className="text-sm font-bold text-text-primary">{item.label}</p>
                <p className="text-xs text-text-secondary mt-1">{item.value} posts ({item.percent}%)</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-5">
            <h2 className="text-lg font-black text-text-primary mb-4">Next 3 Upcoming Posts</h2>
            {metrics.upcoming.length === 0 ? (
              <p className="text-sm text-text-secondary">No upcoming posts found.</p>
            ) : (
              <div className="space-y-3">
                {metrics.upcoming.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="block rounded-xl border border-text-secondary/10 p-3 hover:border-text-secondary/30 transition-colors"
                  >
                    <p className="font-bold text-text-primary truncate">{post.title || 'Untitled post'}</p>
                    <p className="text-xs text-text-secondary mt-1">{formatDateTime(post.scheduledFor)}</p>
                    <p className="text-xs text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      Reminder: {toHoursRemaining(post.scheduledFor)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <article className="bg-bg-primary rounded-2xl border border-text-secondary/10 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">{title}</h2>
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-3xl font-black text-text-primary mt-2">{value}</p>
    </article>
  );
}
