'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import { usePosts } from '@/hooks/usePosts';
import type { AutomationCreateAndQueueInput } from '@/lib/api/posts';

type PublishMode = 'manualDraft' | 'scheduled';
type AssetType = 'image' | 'video' | 'document';

function combineDateAndTime(dateValue: string, timeValue: string): string | null {
  if (!dateValue || !timeValue) return null;
  const iso = new Date(`${dateValue}T${timeValue}`).toISOString();
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

export default function AutomationCreateQueuePage() {
  const router = useRouter();
  const { createAutomationQueuedPost } = usePosts();

  const [title, setTitle] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [publishMode, setPublishMode] = useState<PublishMode>('scheduled');
  const [sourceTimezone, setSourceTimezone] = useState('UTC');
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [autoQueue, setAutoQueue] = useState(true);

  const [assetType, setAssetType] = useState<AssetType>('image');
  const [assetUrl, setAssetUrl] = useState('');
  const [socialConnectionId, setSocialConnectionId] = useState('');
  const [provider, setProvider] = useState('linkedin');
  const [providerTargetId, setProviderTargetId] = useState('');
  const [providerTargetName, setProviderTargetName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const scheduledFor = publishMode === 'scheduled'
      ? combineDateAndTime(dateValue, timeValue)
      : null;

    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }

    if (!socialConnectionId.trim()) {
      setFormError('socialConnectionId is required.');
      return;
    }

    if (publishMode === 'scheduled' && !scheduledFor) {
      setFormError('Scheduled mode requires date and time.');
      return;
    }

    const payload: AutomationCreateAndQueueInput = {
      title: title.trim(),
      captionText: captionText.trim(),
      publishMode,
      sourceTimezone: sourceTimezone.trim() || 'UTC',
      scheduledFor: scheduledFor ?? null,
      approvalRequired,
      metadata: {},
      assets: assetUrl.trim()
        ? [{
          assetType,
          sourceUrl: assetUrl.trim(),
        }]
        : [],
      targets: [{
        provider: provider.trim(),
        socialConnectionId: socialConnectionId.trim(),
        providerTargetId: providerTargetId.trim() || undefined,
        providerTargetName: providerTargetName.trim() || undefined,
        scheduledFor: scheduledFor ?? undefined,
      }],
      autoQueue,
    };

    setIsSubmitting(true);
    try {
      const result = await createAutomationQueuedPost(payload);
      if (!result.success) {
        setFormError(result.error ?? 'Failed to create automation queued post.');
        return;
      }

      if (result.post?.id) {
        router.push(`/posts/${result.post.id}`);
      } else {
        router.push('/posts');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="p-6 lg:p-10 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Automation Create + Queue</h1>
          <p className="text-text-secondary mt-2 font-medium">
            Uses `/posts/automation/create-and-queue`.
          </p>
        </div>
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-text-secondary/20 text-text-secondary hover:text-text-primary hover:border-text-secondary/40 transition-colors font-bold"
        >
          <ArrowLeft size={16} />
          Back to Posts
        </Link>
      </div>

      {formError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {formError}
        </div>
      )}

      <div className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-6 md:p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-bold text-text-primary block">
              Title
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="text-sm font-bold text-text-primary block">
              Caption
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={captionText}
                onChange={(event) => setCaptionText(event.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="text-sm font-bold text-text-primary block">
              Publish Mode
              <select
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={publishMode}
                onChange={(event) => setPublishMode(event.target.value as PublishMode)}
              >
                <option value="manualDraft">Manual Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>
            <label className="text-sm font-bold text-text-primary block">
              Timezone
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={sourceTimezone}
                onChange={(event) => setSourceTimezone(event.target.value)}
              />
            </label>
            <label className="text-sm font-bold text-text-primary block">
              Date
              <input
                type="date"
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
              />
            </label>
            <label className="text-sm font-bold text-text-primary block">
              Time
              <input
                type="time"
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={timeValue}
                onChange={(event) => setTimeValue(event.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-bold text-text-primary block">
              Asset Type
              <select
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={assetType}
                onChange={(event) => setAssetType(event.target.value as AssetType)}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
            </label>
            <label className="text-sm font-bold text-text-primary block">
              Asset URL (optional)
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                placeholder="https://example.com/banner.png"
                value={assetUrl}
                onChange={(event) => setAssetUrl(event.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-bold text-text-primary block">
              Provider
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
              />
            </label>
            <label className="text-sm font-bold text-text-primary block">
              socialConnectionId (UUID)
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={socialConnectionId}
                onChange={(event) => setSocialConnectionId(event.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-bold text-text-primary block">
              providerTargetId (optional)
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={providerTargetId}
                onChange={(event) => setProviderTargetId(event.target.value)}
              />
            </label>
            <label className="text-sm font-bold text-text-primary block">
              providerTargetName (optional)
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={providerTargetName}
                onChange={(event) => setProviderTargetName(event.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-text-primary">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={approvalRequired}
                onChange={(event) => setApprovalRequired(event.target.checked)}
              />
              Approval Required
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoQueue}
                onChange={(event) => setAutoQueue(event.target.checked)}
              />
              Auto Queue
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Plus size={16} />
            {isSubmitting ? 'Submitting...' : 'Create & Queue'}
          </button>
        </form>
      </div>
    </section>
  );
}
