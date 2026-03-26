'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, Eye, ImagePlus, Link2, Save, Send, ShieldCheck, ShieldX } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import type { PostAsset } from '@/lib/api/posts';
import type { UpdatePostInput } from '@/lib/schemas';

type PublishMode = 'manual' | 'manualDraft' | 'scheduled';
type TabKey = 'overview' | 'edit' | 'assets';
type AssetType = 'image' | 'video' | 'document';

interface EditDraft {
  title: string;
  captionText: string;
  publishMode: PublishMode;
  dateValue: string;
  timeValue: string;
  sourceTimezone: string;
  metadataNote: string;
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

function getAssetUrl(asset: PostAsset): string {
  return (asset.previewUrl as string | undefined) ?? (asset.url as string | undefined) ?? '';
}

function formatStatus(value?: string): string {
  return (value ?? 'draft').replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim();
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function inferAssetType(file: File): AssetType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
}

export default function AutomationPostDetailsPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id ?? '';

  const {
    isLoading,
    error,
    getPostByIdFromStore,
    refreshFromApi,
    updateExistingPost,
    attachAssetsByUrl,
    uploadAssetFile,
    queuePublish,
    approveExistingPost,
    rejectExistingPost,
  } = usePosts();

  const post = useMemo(() => getPostByIdFromStore(postId), [getPostByIdFromStore, postId]);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [assetUrl, setAssetUrl] = useState('');
  const [assetUrlType, setAssetUrlType] = useState<AssetType>('image');
  const [reviewReason, setReviewReason] = useState('Approved by user');
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (!post) return;
    setDraft({
      title: post.title ?? '',
      captionText: post.captionText ?? '',
      publishMode: post.publishMode === 'scheduled' ? 'scheduled' : post.publishMode === 'manualDraft' ? 'manualDraft' : 'manual',
      dateValue: toDateInput(post.scheduledFor),
      timeValue: toTimeInput(post.scheduledFor),
      sourceTimezone: post.sourceTimezone ?? 'UTC',
      metadataNote: String((post.metadata as Record<string, unknown> | undefined)?.note ?? ''),
    });
  }, [post]);

  async function handleSave() {
    if (!postId || !draft) return;
    setFormError(null);
    setNotice(null);

    if (!draft.title.trim()) {
      setFormError('Title is required.');
      return;
    }

    const scheduledFor = draft.publishMode === 'scheduled'
      ? combineDateAndTime(draft.dateValue, draft.timeValue)
      : null;

    if (draft.publishMode === 'scheduled' && !scheduledFor) {
      setFormError('Scheduled mode requires date and time.');
      return;
    }

    const payload: UpdatePostInput = {
      title: draft.title.trim(),
      captionText: draft.captionText.trim(),
      publishMode: draft.publishMode === 'manualDraft' ? 'manual' : draft.publishMode,
      sourceTimezone: draft.sourceTimezone.trim() || 'UTC',
      scheduledFor: scheduledFor ?? null,
      metadata: draft.metadataNote.trim() ? { note: draft.metadataNote.trim() } : undefined,
    };

    setIsSaving(true);
    try {
      const result = await updateExistingPost(postId, payload);
      if (!result.success) {
        setFormError(result.error ?? 'Failed to update post.');
        return;
      }
      setNotice('Post updated successfully.');
      await refreshFromApi();
      setActiveTab('overview');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadFile() {
    if (!postId || !assetFile) return;
    setFormError(null);
    setNotice(null);
    setIsUploading(true);
    try {
      const result = await uploadAssetFile(postId, {
        file: assetFile,
        assetType: inferAssetType(assetFile),
      });
      if (!result.success) {
        setFormError(result.error ?? 'Failed to upload asset.');
        return;
      }
      setNotice('Asset uploaded successfully.');
      setAssetFile(null);
      await refreshFromApi();
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAttachUrl() {
    if (!postId) return;
    setFormError(null);
    setNotice(null);

    if (!assetUrl.trim()) {
      setFormError('Asset URL is required.');
      return;
    }

    setIsAttaching(true);
    try {
      const result = await attachAssetsByUrl(postId, {
        assets: [
          {
            assetType: assetUrlType,
            sourceUrl: assetUrl.trim(),
          },
        ],
      });
      if (!result.success) {
        setFormError(result.error ?? 'Failed to attach URL asset.');
        return;
      }
      setNotice('Asset attached successfully.');
      setAssetUrl('');
      await refreshFromApi();
    } finally {
      setIsAttaching(false);
    }
  }

  async function handleQueue() {
    if (!postId) return;
    setFormError(null);
    setNotice(null);
    setIsQueueing(true);
    try {
      const result = await queuePublish(postId);
      if (!result.success) {
        setFormError(result.error ?? 'Failed to queue publish.');
        return;
      }
      setNotice('Post queued for publishing.');
      await refreshFromApi();
    } finally {
      setIsQueueing(false);
    }
  }

  async function handleApprove() {
    if (!postId) return;
    setFormError(null);
    setNotice(null);
    setIsApproving(true);
    try {
      const result = await approveExistingPost(postId, reviewReason || 'Approved by user');
      if (!result.success) {
        setFormError(result.error ?? 'Failed to approve.');
        return;
      }
      setNotice('Post approved.');
      await refreshFromApi();
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    if (!postId) return;
    setFormError(null);
    setNotice(null);
    if (!reviewReason.trim()) {
      setFormError('Reject reason is required.');
      return;
    }
    setIsRejecting(true);
    try {
      const result = await rejectExistingPost(postId, reviewReason.trim());
      if (!result.success) {
        setFormError(result.error ?? 'Failed to reject.');
        return;
      }
      setNotice('Post rejected.');
      await refreshFromApi();
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <section className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Automation Post</h1>
          <p className="text-text-secondary mt-2 font-medium">
            Single post details, edit, approval, queue, and asset preview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-text-secondary/20 text-text-secondary hover:text-text-primary hover:border-text-secondary/40 transition-colors font-bold"
          >
            <ArrowLeft size={16} />
            Back to Automation
          </Link>
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity"
          >
            New Post
          </Link>
        </div>
      </div>

      {(error || formError || notice) && (
        <div className="mb-6 rounded-2xl border border-text-secondary/10 bg-bg-primary px-4 py-3 text-sm font-medium">
          {error && <p className="text-red-600">{error}</p>}
          {formError && <p className="text-red-600">{formError}</p>}
          {notice && <p className="text-emerald-700">{notice}</p>}
        </div>
      )}

      {!post && isLoading && (
        <div className="rounded-2xl border border-text-secondary/10 bg-bg-primary p-6 text-text-secondary">
          Loading post...
        </div>
      )}

      {!post && !isLoading && (
        <div className="rounded-2xl border border-text-secondary/10 bg-bg-primary p-6">
          <h2 className="text-xl font-black text-text-primary mb-2">Post Not Found</h2>
          <p className="text-text-secondary mb-4">The post was not found in local store. Refresh to load latest.</p>
          <button
            type="button"
            onClick={() => refreshFromApi()}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity"
          >
            Refresh
          </button>
        </div>
      )}

      {post && draft && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
          <div className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-6 md:p-8">
            <div className="flex flex-wrap gap-2 mb-6">
              <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
              <TabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')} label="Edit" />
              <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} label="Assets" />
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <DetailRow label="Title" value={post.title || '-'} />
                <DetailRow label="Caption" value={post.captionText || '-'} multiline />
                <DetailRow label="Status" value={formatStatus(post.status)} />
                <DetailRow label="Approval Status" value={post.approvalStatus || '-'} />
                <DetailRow label="Publish Mode" value={post.publishMode || '-'} />
                <DetailRow label="Publish/Schedule Time" value={formatDateTime(post.scheduledFor)} />
                <DetailRow label="Source Type" value={post.sourceType || 'manual'} />
                <DetailRow label="Timezone" value={post.sourceTimezone || '-'} />
                <DetailRow label="Created At" value={formatDateTime(post.createdAt)} />
                <DetailRow label="Updated At" value={formatDateTime(post.updatedAt)} />
                <DetailRow label="Assets" value={String(Array.isArray(post.assets) ? post.assets.length : 0)} />
              </div>
            )}

            {activeTab === 'edit' && (
              <div className="space-y-4">
                <label className="text-sm font-bold text-text-primary block">
                  Title
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
                    className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="text-sm font-bold text-text-primary block">
                  Caption
                  <textarea
                    value={draft.captionText}
                    onChange={(event) => setDraft((prev) => (prev ? { ...prev, captionText: event.target.value } : prev))}
                    className="mt-1.5 w-full min-h-[130px] rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="text-sm font-bold text-text-primary block">
                    Publish Mode
                    <select
                      value={draft.publishMode}
                      onChange={(event) => setDraft((prev) => (prev ? { ...prev, publishMode: event.target.value as PublishMode } : prev))}
                      className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                    >
                      <option value="manual">Manual</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </label>
                  <label className="text-sm font-bold text-text-primary block">
                    Source Timezone
                    <input
                      value={draft.sourceTimezone}
                      onChange={(event) => setDraft((prev) => (prev ? { ...prev, sourceTimezone: event.target.value } : prev))}
                      className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                    />
                  </label>
                </div>

                {draft.publishMode === 'scheduled' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-sm font-bold text-text-primary block">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={15} />
                        Day
                      </span>
                      <input
                        type="date"
                        value={draft.dateValue}
                        onChange={(event) => setDraft((prev) => (prev ? { ...prev, dateValue: event.target.value } : prev))}
                        className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                      />
                    </label>
                    <label className="text-sm font-bold text-text-primary block">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={15} />
                        Time
                      </span>
                      <input
                        type="time"
                        value={draft.timeValue}
                        onChange={(event) => setDraft((prev) => (prev ? { ...prev, timeValue: event.target.value } : prev))}
                        className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                      />
                    </label>
                  </div>
                )}

                <label className="text-sm font-bold text-text-primary block">
                  Metadata Note
                  <input
                    value={draft.metadataNote}
                    onChange={(event) => setDraft((prev) => (prev ? { ...prev, metadataNote: event.target.value } : prev))}
                    className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  />
                </label>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <Save size={15} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="text-sm font-bold text-text-primary block">
                    <span className="inline-flex items-center gap-2">
                      <ImagePlus size={15} />
                      Upload File Asset
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(event) => setAssetFile(event.target.files?.[0] ?? null)}
                      className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleUploadFile}
                    disabled={!assetFile || isUploading}
                    className="self-end inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-primary/30 text-primary font-bold hover:bg-primary/5 transition-colors disabled:opacity-60"
                  >
                    <ImagePlus size={15} />
                    {isUploading ? 'Uploading...' : 'Upload Asset'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_190px_170px] gap-3">
                  <input
                    value={assetUrl}
                    onChange={(event) => setAssetUrl(event.target.value)}
                    className="rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                    placeholder="https://example.com/asset.png"
                  />
                  <select
                    value={assetUrlType}
                    onChange={(event) => setAssetUrlType(event.target.value as AssetType)}
                    className="rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAttachUrl}
                    disabled={isAttaching || !assetUrl.trim()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-primary/30 text-primary font-bold hover:bg-primary/5 transition-colors disabled:opacity-60"
                  >
                    <Link2 size={15} />
                    {isAttaching ? 'Attaching...' : 'Attach URL'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(post.assets ?? []).map((asset, index) => {
                    const url = getAssetUrl(asset);
                    const type = String(asset.assetType ?? 'asset').toLowerCase();
                    return (
                      <article key={`${asset.id ?? index}`} className="rounded-xl border border-text-secondary/10 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-2">
                          {asset.assetType ?? 'asset'}
                        </p>
                        {type.includes('image') && url && (
                          <img src={url} alt="Asset preview" className="w-full h-44 object-cover rounded-lg border border-text-secondary/10" />
                        )}
                        {type.includes('video') && url && (
                          <video controls className="w-full h-44 rounded-lg border border-text-secondary/10">
                            <source src={url} />
                          </video>
                        )}
                        {!type.includes('image') && !type.includes('video') && (
                          <p className="text-xs text-text-secondary">Preview not available for this asset type.</p>
                        )}
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary"
                          >
                            <Eye size={12} />
                            Open Asset
                          </a>
                        )}
                        <div className="mt-2 text-[11px] text-text-secondary space-y-1">
                          <p>ID: {String(asset.id ?? '-')}</p>
                          <p>Sort: {String(asset.sortOrder ?? 0)}</p>
                        </div>
                      </article>
                    );
                  })}
                  {(post.assets ?? []).length === 0 && (
                    <p className="text-sm text-text-secondary">No assets available for this post.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-5 h-fit space-y-5">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-text-secondary mb-2">Quick Actions</h2>
              <button
                type="button"
                onClick={handleQueue}
                disabled={isQueueing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-50 transition-colors disabled:opacity-60"
              >
                <Send size={15} />
                {isQueueing ? 'Queueing...' : 'Queue Publish'}
              </button>
            </div>

            <div className="pt-4 border-t border-text-secondary/10">
              <h2 className="text-sm font-black uppercase tracking-wide text-text-secondary mb-2">Approval</h2>
              <input
                value={reviewReason}
                onChange={(event) => setReviewReason(event.target.value)}
                className="w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                placeholder="Approval or reject reason"
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors disabled:opacity-60"
                >
                  <ShieldCheck size={14} />
                  {isApproving ? '...' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <ShieldX size={14} />
                  {isRejecting ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'border border-text-secondary/20 text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
      }`}
    >
      {label}
    </button>
  );
}

function DetailRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="rounded-xl border border-text-secondary/10 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className={`text-sm font-semibold text-text-primary mt-1 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
    </div>
  );
}
