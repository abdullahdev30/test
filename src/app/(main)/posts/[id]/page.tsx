'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, ImagePlus, Link2, Plus, Save, Send, ShieldCheck, ShieldX } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import type { PostAsset } from '@/lib/api/posts';
import type { UpdatePostInput } from '@/lib/schemas';

type PublishMode = 'manualDraft' | 'scheduled';
type AssetType = 'image' | 'video' | 'document';
interface PostDraft {
  title: string;
  captionText: string;
  publishMode: PublishMode;
  dateValue: string;
  timeValue: string;
  sourceTimezone: string;
}

function toDateInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function toTimeInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(11, 16);
}

function combineDateAndTime(dateValue: string, timeValue: string): string | null {
  if (!dateValue || !timeValue) return null;
  const iso = new Date(`${dateValue}T${timeValue}`).toISOString();
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function inferAssetType(file: File): AssetType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
}

function getAssetUrl(asset: PostAsset): string {
  return (asset.previewUrl as string | undefined) ?? (asset.url as string | undefined) ?? '';
}

function formatStatus(raw?: string): string {
  if (!raw) return 'draft';
  return raw.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim();
}

function buildDraft(post: { title?: string; captionText?: string; publishMode?: string; scheduledFor?: string | null; sourceTimezone?: string }): PostDraft {
  return {
    title: post.title ?? '',
    captionText: post.captionText ?? '',
    publishMode: post.publishMode === 'scheduled' ? 'scheduled' : 'manualDraft',
    dateValue: toDateInput(post.scheduledFor),
    timeValue: toTimeInput(post.scheduledFor),
    sourceTimezone: post.sourceTimezone ?? 'UTC',
  };
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id ?? '';

  const {
    isLoading,
    error,
    getPostByIdFromStore,
    refreshFromApi,
    updateExistingPost,
    uploadAssetFile,
    attachAssetsByUrl,
    setTargetsForPost,
    queuePublish,
    approveExistingPost,
    rejectExistingPost,
  } = usePosts();

  const post = useMemo(() => getPostByIdFromStore(postId), [getPostByIdFromStore, postId]);

  const [draftById, setDraftById] = useState<Record<string, PostDraft>>({});

  const [fileAsset, setFileAsset] = useState<File | null>(null);
  const [urlAsset, setUrlAsset] = useState('');
  const [urlAssetType, setUrlAssetType] = useState<AssetType>('image');
  const [targetProvider, setTargetProvider] = useState('linkedin');
  const [targetSocialConnectionId, setTargetSocialConnectionId] = useState('');
  const [targetProviderTargetId, setTargetProviderTargetId] = useState('');
  const [targetProviderTargetName, setTargetProviderTargetName] = useState('');
  const [targetDateValue, setTargetDateValue] = useState('');
  const [targetTimeValue, setTargetTimeValue] = useState('');
  const [reviewReason, setReviewReason] = useState('Approved by user');

  const [savingPost, setSavingPost] = useState(false);
  const [savingFileAsset, setSavingFileAsset] = useState(false);
  const [savingUrlAsset, setSavingUrlAsset] = useState(false);
  const [savingTargets, setSavingTargets] = useState(false);
  const [savingQueuePublish, setSavingQueuePublish] = useState(false);
  const [savingApprove, setSavingApprove] = useState(false);
  const [savingReject, setSavingReject] = useState(false);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const activeDraft = useMemo(
    () => (post ? draftById[post.id] ?? buildDraft(post) : null),
    [post, draftById],
  );

  function updateActiveDraft(patch: Partial<PostDraft>) {
    if (!post || !activeDraft) return;
    setDraftById((prev) => ({
      ...prev,
      [post.id]: { ...activeDraft, ...patch },
    }));
  }

  function resetActiveDraft() {
    if (!post) return;
    setDraftById((prev) => {
      const next = { ...prev };
      delete next[post.id];
      return next;
    });
  }

  async function savePost() {
    if (!postId) return;
    setFormError(null);
    setFormNotice(null);

    if (!activeDraft) {
      setFormError('Post is not ready for editing.');
      return;
    }

    if (!activeDraft.title.trim()) {
      setFormError('Post title is required.');
      return;
    }

    const scheduledFor = activeDraft.publishMode === 'scheduled'
      ? combineDateAndTime(activeDraft.dateValue, activeDraft.timeValue)
      : null;
    if (activeDraft.publishMode === 'scheduled' && !scheduledFor) {
      setFormError('Please set both date and time.');
      return;
    }

    const payload: UpdatePostInput = {
      title: activeDraft.title.trim(),
      captionText: activeDraft.captionText.trim(),
      publishMode: activeDraft.publishMode,
      sourceTimezone: activeDraft.sourceTimezone.trim() || 'UTC',
      scheduledFor: scheduledFor ?? null,
    };

    setSavingPost(true);
    try {
      const result = await updateExistingPost(postId, payload);
      if (!result.success) {
        setFormError(result.error ?? 'Failed to update post.');
        return;
      }
      resetActiveDraft();
      setFormNotice('Post updated successfully.');
    } finally {
      setSavingPost(false);
    }
  }

  async function uploadFileAsset() {
    if (!postId || !fileAsset) return;
    setFormError(null);
    setFormNotice(null);
    setSavingFileAsset(true);
    try {
      const result = await uploadAssetFile(postId, {
        file: fileAsset,
        assetType: inferAssetType(fileAsset),
      });
      if (!result.success) {
        setFormError(result.error ?? 'Failed to upload file asset.');
        return;
      }
      setFormNotice('Asset uploaded successfully.');
      setFileAsset(null);
    } finally {
      setSavingFileAsset(false);
    }
  }

  async function attachUrlAsset() {
    if (!postId) return;
    setFormError(null);
    setFormNotice(null);

    if (!urlAsset.trim()) {
      setFormError('Asset URL is required.');
      return;
    }

    setSavingUrlAsset(true);
    try {
      const result = await attachAssetsByUrl(postId, {
        assets: [
          {
            assetType: urlAssetType,
            sourceUrl: urlAsset.trim(),
          },
        ],
      });
      if (!result.success) {
        setFormError(result.error ?? 'Failed to attach URL asset.');
        return;
      }
      setFormNotice('URL asset attached successfully.');
      setUrlAsset('');
    } finally {
      setSavingUrlAsset(false);
    }
  }

  async function setTargets() {
    if (!postId) return;
    setFormError(null);
    setFormNotice(null);

    if (!targetSocialConnectionId.trim()) {
      setFormError('socialConnectionId is required to set targets.');
      return;
    }

    const scheduledFor = combineDateAndTime(targetDateValue, targetTimeValue);

    setSavingTargets(true);
    try {
      const result = await setTargetsForPost(postId, {
        targets: [
          {
            provider: targetProvider.trim(),
            socialConnectionId: targetSocialConnectionId.trim(),
            providerTargetId: targetProviderTargetId.trim() || undefined,
            providerTargetName: targetProviderTargetName.trim() || undefined,
            scheduledFor: scheduledFor ?? undefined,
          },
        ],
      });

      if (!result.success) {
        setFormError(result.error ?? 'Failed to set targets.');
        return;
      }

      setFormNotice('Targets updated successfully.');
    } finally {
      setSavingTargets(false);
    }
  }

  async function queuePostForPublish() {
    if (!postId) return;
    setFormError(null);
    setFormNotice(null);
    setSavingQueuePublish(true);
    try {
      const result = await queuePublish(postId);
      if (!result.success) {
        setFormError(result.error ?? 'Failed to queue post.');
        return;
      }
      setFormNotice('Post queued for publishing.');
    } finally {
      setSavingQueuePublish(false);
    }
  }

  async function approvePostNow() {
    if (!postId) return;
    setFormError(null);
    setFormNotice(null);
    setSavingApprove(true);
    try {
      const result = await approveExistingPost(postId, reviewReason || 'Approved by user');
      if (!result.success) {
        setFormError(result.error ?? 'Failed to approve post.');
        return;
      }
      setFormNotice('Post approved successfully.');
    } finally {
      setSavingApprove(false);
    }
  }

  async function rejectPostNow() {
    if (!postId) return;
    setFormError(null);
    setFormNotice(null);
    if (!reviewReason.trim()) {
      setFormError('Reject reason is required.');
      return;
    }

    setSavingReject(true);
    try {
      const result = await rejectExistingPost(postId, reviewReason.trim());
      if (!result.success) {
        setFormError(result.error ?? 'Failed to reject post.');
        return;
      }
      setFormNotice('Post rejected successfully.');
    } finally {
      setSavingReject(false);
    }
  }

  return (
    <section className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Post Details</h1>
          <p className="text-text-secondary mt-2 font-medium">
            Full post page with edit and asset management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-text-secondary/20 text-text-secondary hover:text-text-primary hover:border-text-secondary/40 transition-colors font-bold"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Create Post
          </Link>
        </div>
      </div>

      {(error || formError || formNotice) && (
        <div className="mb-6 rounded-2xl border border-text-secondary/10 bg-bg-primary px-4 py-3 text-sm font-medium">
          {error && <p className="text-red-600">{error}</p>}
          {formError && <p className="text-red-600">{formError}</p>}
          {formNotice && <p className="text-emerald-600">{formNotice}</p>}
        </div>
      )}

      {!post && isLoading && (
        <div className="rounded-2xl border border-text-secondary/10 bg-bg-primary p-6">
          <p className="text-text-secondary">Loading post...</p>
        </div>
      )}

      {!post && !isLoading && (
        <div className="rounded-2xl border border-text-secondary/10 bg-bg-primary p-6">
          <h2 className="text-xl font-black text-text-primary mb-2">Post Not Found In Cache</h2>
          <p className="text-text-secondary mb-4">
            This post is not available in local cache yet. You can fetch latest posts once.
          </p>
          <button
            type="button"
            onClick={() => refreshFromApi()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity"
          >
            Refresh Posts
          </button>
        </div>
      )}

      {post && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-6 md:p-8 space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="px-2.5 py-1 rounded-full bg-secondary text-text-secondary font-bold">
                {formatStatus(post.status ?? post.publishMode)}
              </span>
              <span className="text-text-secondary">Post ID: {post.id}</span>
            </div>

            <label className="text-sm font-bold text-text-primary block">
              Title
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={activeDraft?.title ?? ''}
                onChange={(event) => updateActiveDraft({ title: event.target.value })}
              />
            </label>

            <label className="text-sm font-bold text-text-primary block">
              Caption
              <textarea
                className="mt-1.5 w-full min-h-[170px] rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={activeDraft?.captionText ?? ''}
                onChange={(event) => updateActiveDraft({ captionText: event.target.value })}
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="text-sm font-bold text-text-primary block">
                Publish Mode
                <select
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  value={activeDraft?.publishMode ?? 'manualDraft'}
                  onChange={(event) => updateActiveDraft({ publishMode: event.target.value as PublishMode })}
                >
                  <option value="manualDraft">Manual Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </label>

              <label className="text-sm font-bold text-text-primary block">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} />
                  Day
                </span>
                <input
                  type="date"
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  value={activeDraft?.dateValue ?? ''}
                  onChange={(event) => updateActiveDraft({ dateValue: event.target.value })}
                  disabled={activeDraft?.publishMode !== 'scheduled'}
                />
              </label>

              <label className="text-sm font-bold text-text-primary block">
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={15} />
                  Time
                </span>
                <input
                  type="time"
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  value={activeDraft?.timeValue ?? ''}
                  onChange={(event) => updateActiveDraft({ timeValue: event.target.value })}
                  disabled={activeDraft?.publishMode !== 'scheduled'}
                />
              </label>
            </div>

            <label className="text-sm font-bold text-text-primary block">
              Source Timezone
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={activeDraft?.sourceTimezone ?? 'UTC'}
                onChange={(event) => updateActiveDraft({ sourceTimezone: event.target.value })}
              />
            </label>

            <button
              type="button"
              disabled={savingPost}
              onClick={savePost}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              <Save size={16} />
              {savingPost ? 'Saving...' : 'Save Post'}
            </button>
          </div>

          <aside className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-6 space-y-6 h-fit">
            <div>
              <h2 className="text-xl font-black text-text-primary mb-3">Attach Asset</h2>
              <label className="text-sm font-bold text-text-primary block">
                <span className="inline-flex items-center gap-2">
                  <ImagePlus size={15} />
                  Upload Image/Video
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  onChange={(event) => setFileAsset(event.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                disabled={!fileAsset || savingFileAsset}
                onClick={uploadFileAsset}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary font-bold hover:bg-primary/5 transition-colors disabled:opacity-60"
              >
                <ImagePlus size={14} />
                {savingFileAsset ? 'Uploading...' : 'Upload File'}
              </button>
            </div>

            <div className="pt-4 border-t border-text-secondary/10">
              <h2 className="text-xl font-black text-text-primary mb-3">Targets & Queue</h2>
              <label className="text-sm font-bold text-text-primary block">
                Provider
                <input
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  value={targetProvider}
                  onChange={(event) => setTargetProvider(event.target.value)}
                />
              </label>
              <label className="text-sm font-bold text-text-primary block mt-3">
                socialConnectionId (UUID)
                <input
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  value={targetSocialConnectionId}
                  onChange={(event) => setTargetSocialConnectionId(event.target.value)}
                />
              </label>
              <label className="text-sm font-bold text-text-primary block mt-3">
                providerTargetId (optional)
                <input
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  value={targetProviderTargetId}
                  onChange={(event) => setTargetProviderTargetId(event.target.value)}
                />
              </label>
              <label className="text-sm font-bold text-text-primary block mt-3">
                providerTargetName (optional)
                <input
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  value={targetProviderTargetName}
                  onChange={(event) => setTargetProviderTargetName(event.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <input
                  type="date"
                  className="rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  value={targetDateValue}
                  onChange={(event) => setTargetDateValue(event.target.value)}
                />
                <input
                  type="time"
                  className="rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  value={targetTimeValue}
                  onChange={(event) => setTargetTimeValue(event.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={savingTargets}
                onClick={setTargets}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary font-bold hover:bg-primary/5 transition-colors disabled:opacity-60"
              >
                <Save size={14} />
                {savingTargets ? 'Saving Targets...' : 'Set Targets'}
              </button>
              <button
                type="button"
                disabled={savingQueuePublish}
                onClick={queuePostForPublish}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-50 transition-colors disabled:opacity-60"
              >
                <Send size={14} />
                {savingQueuePublish ? 'Queueing...' : 'Queue Publish'}
              </button>
            </div>

            <div className="pt-4 border-t border-text-secondary/10">
              <h2 className="text-xl font-black text-text-primary mb-3">Approval Actions</h2>
              <label className="text-sm font-bold text-text-primary block">
                Reason
                <input
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  value={reviewReason}
                  onChange={(event) => setReviewReason(event.target.value)}
                />
              </label>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  disabled={savingApprove}
                  onClick={approvePostNow}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-50 transition-colors disabled:opacity-60"
                >
                  <ShieldCheck size={14} />
                  {savingApprove ? 'Approving...' : 'Approve'}
                </button>
                <button
                  type="button"
                  disabled={savingReject}
                  onClick={rejectPostNow}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-700 font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <ShieldX size={14} />
                  {savingReject ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-text-primary block">
                <span className="inline-flex items-center gap-2">
                  <Link2 size={15} />
                  Attach Asset URL
                </span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="https://example.com/asset.jpg"
                  value={urlAsset}
                  onChange={(event) => setUrlAsset(event.target.value)}
                />
              </label>
              <select
                className="mt-2 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={urlAssetType}
                onChange={(event) => setUrlAssetType(event.target.value as AssetType)}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
              <button
                type="button"
                disabled={!urlAsset.trim() || savingUrlAsset}
                onClick={attachUrlAsset}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary font-bold hover:bg-primary/5 transition-colors disabled:opacity-60"
              >
                <Link2 size={14} />
                {savingUrlAsset ? 'Attaching...' : 'Attach URL'}
              </button>
            </div>

            <div>
              <h3 className="text-sm font-black text-text-primary mb-2 uppercase tracking-wide">Assets</h3>
              {Array.isArray(post.assets) && post.assets.length > 0 ? (
                <div className="space-y-2">
                  {post.assets.map((asset, index) => {
                    const assetUrl = getAssetUrl(asset);
                    return (
                      <div
                        key={`${asset.id ?? 'asset'}-${index}`}
                        className="rounded-xl border border-text-secondary/10 p-2.5"
                      >
                        <p className="text-xs font-bold text-text-primary mb-1">
                          {asset.assetType ?? 'asset'}
                        </p>
                        {assetUrl ? (
                          <a
                            href={assetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary break-all"
                          >
                            {assetUrl}
                          </a>
                        ) : (
                          <p className="text-xs text-text-secondary">No preview URL</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No assets attached yet.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
