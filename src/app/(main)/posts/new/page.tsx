'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock3, ImagePlus, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePosts } from '@/hooks/usePosts';
import type { CreatePostInput } from '@/lib/schemas';

type PublishMode = 'manual' | 'scheduled';
type AssetType = 'image' | 'video' | 'document';
type Provider = 'linkedin' | 'facebook' | 'instagram' | 'google_business_profile';

const PLATFORM_OPTIONS: Array<{ label: string; value: Provider }> = [
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Google Business Profile', value: 'google_business_profile' },
];

const PROVIDER_TO_CONNECTION_KEY: Record<Provider, string> = {
  linkedin: 'linkedin',
  facebook: 'facebook',
  instagram: 'instagram',
  google_business_profile: 'google-business-profile',
};

interface SocialConnection {
  connected: boolean;
  status: string;
  socialConnectionId: string | null;
  username?: string | null;
  providerAccountName?: string | null;
}

function extractSocialConnectionId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const connection = (record.connection && typeof record.connection === 'object')
    ? (record.connection as Record<string, unknown>)
    : null;

  const fromRoot =
    (record.socialConnectionId as string | undefined) ??
    (record.id as string | undefined);
  const fromConnection =
    (connection?.socialConnectionId as string | undefined) ??
    (connection?.id as string | undefined);

  return fromConnection ?? fromRoot ?? null;
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

export default function CreateAutomationPostPage() {
  const router = useRouter();
  const { createNewPost, setTargetsForPost, uploadAssetFile, queuePublish, clearError } = usePosts();

  const [title, setTitle] = useState('April Campaign Launch');
  const [captionText, setCaptionText] = useState('Launching our April campaign with fresh offers.');
  const [publishMode, setPublishMode] = useState<PublishMode>('manual');
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [sourceTimezone, setSourceTimezone] = useState('Asia/Karachi');
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [automated, setAutomated] = useState(false);
  const [campaignMeta, setCampaignMeta] = useState('april-2026');
  const [selectedProviders, setSelectedProviders] = useState<Record<Provider, boolean>>({
    linkedin: false,
    facebook: false,
    instagram: false,
    google_business_profile: false,
  });
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [queueAfterCreate, setQueueAfterCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [connectionData, setConnectionData] = useState<Record<string, SocialConnection>>({});
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeProviders = useMemo(
    () => PLATFORM_OPTIONS.filter((platform) => selectedProviders[platform.value]).map((platform) => platform.value),
    [selectedProviders],
  );

  function toggleProvider(provider: Provider) {
    setSelectedProviders((prev) => ({ ...prev, [provider]: !prev[provider] }));
  }

  async function loadConnections() {
    setIsLoadingConnections(true);
    setConnectionError(null);
    try {
      const entries = await Promise.all(
        PLATFORM_OPTIONS.map(async (platform) => {
          const statusKey = PROVIDER_TO_CONNECTION_KEY[platform.value];
          const response = await fetch(`/api/social/${statusKey}/status`, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
          });

          if (!response.ok) {
            return [statusKey, { connected: false, status: 'disconnected', socialConnectionId: null }] as const;
          }

          const data = (await response.json()) as Record<string, unknown>;
          const connected = data.status === 'connected' || data.connected === true;
          const socialConnectionId = connected ? extractSocialConnectionId(data) : null;
          const username =
            (data.providerAccountName as string | undefined) ??
            (data.username as string | undefined) ??
            null;

          return [
            statusKey,
            {
              connected,
              status: connected ? 'connected' : 'disconnected',
              socialConnectionId,
              username,
              providerAccountName: username,
            },
          ] as const;
        }),
      );

      setConnectionData(Object.fromEntries(entries));
    } catch {
      setConnectionError('Failed to load social connection status.');
    } finally {
      setIsLoadingConnections(false);
    }
  }

  useEffect(() => {
    void loadConnections();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    clearError();

    if (!title.trim()) {
      setFormError('Post title is required.');
      return;
    }

    const scheduledFor = publishMode === 'scheduled'
      ? combineDateAndTime(dateValue, timeValue)
      : null;

    if (publishMode === 'scheduled' && !scheduledFor) {
      setFormError('Please set both date and time for scheduled publish mode.');
      return;
    }

    if (activeProviders.length === 0) {
      setFormError('Please select at least one platform.');
      return;
    }

    const postPayload: CreatePostInput = {
      title: title.trim(),
      captionText: captionText.trim(),
      publishMode,
      sourceType: automated ? 'automated' : 'manual',
      sourceTimezone: sourceTimezone.trim() || 'Asia/Karachi',
      approvalRequired,
      scheduledFor: scheduledFor ?? undefined,
      metadata: {
        campaign: campaignMeta.trim() || undefined,
        automated,
      },
    };

    setIsSubmitting(true);
    try {
      const created = await createNewPost(postPayload);
      if (!created.success || !created.post?.id) {
        setFormError(created.error ?? 'Failed to create post.');
        return;
      }

      const latestConnections = await Promise.all(
        activeProviders.map(async (provider) => {
          const statusKey = PROVIDER_TO_CONNECTION_KEY[provider];
          const response = await fetch(`/api/social/${statusKey}/status`, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
          });

          if (!response.ok) {
            return { provider, socialConnectionId: null as string | null };
          }

          const data = (await response.json()) as Record<string, unknown>;
          const connected = data.status === 'connected' || data.connected === true;
          const socialConnectionId = connected ? extractSocialConnectionId(data) : null;
          return { provider, socialConnectionId };
        }),
      );

      const disconnected = latestConnections.filter((item) => !item.socialConnectionId);
      if (disconnected.length > 0) {
        const names = PLATFORM_OPTIONS
          .filter((platform) => disconnected.some((entry) => entry.provider === platform.value))
          .map((platform) => platform.label)
          .join(', ');
        setFormError(`Connect platform first (${names}) from Connections page, then try again.`);
        return;
      }

      const targetResult = await setTargetsForPost(created.post.id, {
        targets: activeProviders.map((provider) => ({
          provider,
          socialConnectionId:
            latestConnections.find((entry) => entry.provider === provider)?.socialConnectionId ?? undefined,
          scheduledFor: scheduledFor ?? undefined,
        })),
      });

      if (!targetResult.success) {
        setFormError(targetResult.error ?? 'Post created, but platform targets failed.');
        return;
      }

      if (assetFile) {
        const upload = await uploadAssetFile(created.post.id, {
          file: assetFile,
          assetType: inferAssetType(assetFile),
        });

        if (!upload.success) {
          setFormError(upload.error ?? 'Post created, but asset upload failed.');
          return;
        }
      }

      if (queueAfterCreate) {
        const queued = await queuePublish(created.post.id);
        if (!queued.success) {
          setFormError(queued.error ?? 'Post created, but queue publish failed.');
          return;
        }
      }

      router.push(`/posts/${created.post.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="p-6 lg:p-10 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Create Automation Post</h1>
          <p className="text-text-secondary mt-2 font-medium">
            Select platforms with checkboxes, set time/timezone, and create the post.
          </p>
        </div>
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-text-secondary/20 text-text-secondary hover:text-text-primary hover:border-text-secondary/40 transition-colors font-bold"
        >
          <ArrowLeft size={16} />
          Back to Automation
        </Link>
      </div>

      {(formError || connectionError) && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {formError || connectionError}
        </div>
      )}

      <div className="bg-bg-primary rounded-[28px] border border-text-secondary/10 p-6 md:p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm font-bold text-text-primary block">
              Publish Mode
              <select
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={publishMode}
                onChange={(event) => setPublishMode(event.target.value as PublishMode)}
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>
            <label className="text-sm font-bold text-text-primary block">
              Source Timezone
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={sourceTimezone}
                onChange={(event) => setSourceTimezone(event.target.value)}
              />
            </label>
            <label className="text-sm font-bold text-text-primary block">
              Metadata Campaign
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                value={campaignMeta}
                onChange={(event) => setCampaignMeta(event.target.value)}
              />
            </label>
          </div>

          {publishMode === 'scheduled' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-bold text-text-primary block">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} />
                  Day
                </span>
                <input
                  type="date"
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  value={dateValue}
                  onChange={(event) => setDateValue(event.target.value)}
                />
              </label>
              <label className="text-sm font-bold text-text-primary block">
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={15} />
                  Time
                </span>
                <input
                  type="time"
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
                  value={timeValue}
                  onChange={(event) => setTimeValue(event.target.value)}
                />
              </label>
            </div>
          )}

          <div className="rounded-2xl border border-text-secondary/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-black text-text-primary uppercase tracking-wide">Platforms</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadConnections}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-text-secondary/20 text-text-secondary text-xs font-bold hover:text-text-primary hover:border-text-secondary/40 transition-colors"
                >
                  <RefreshCw size={12} className={isLoadingConnections ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <Link
                  href="/connections"
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors"
                >
                  Connect Platforms
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PLATFORM_OPTIONS.map((platform) => (
                <label key={platform.value} className="inline-flex items-center justify-between gap-2 text-sm font-bold text-text-primary border border-text-secondary/10 rounded-lg px-2.5 py-2">
                  <span className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedProviders[platform.value]}
                    onChange={() => toggleProvider(platform.value)}
                  />
                  {platform.label}
                  </span>
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      connectionData[PROVIDER_TO_CONNECTION_KEY[platform.value]]?.connected
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    }`}
                    title={connectionData[PROVIDER_TO_CONNECTION_KEY[platform.value]]?.connected ? 'Connected' : 'Disconnected'}
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="text-sm font-bold text-text-primary block">
            <span className="inline-flex items-center gap-2">
              <ImagePlus size={15} />
              Upload Asset (Image or Video)
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
              onChange={(event) => setAssetFile(event.target.files?.[0] ?? null)}
            />
          </label>

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
                checked={automated}
                onChange={(event) => setAutomated(event.target.checked)}
              />
              Automated Post
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={queueAfterCreate}
                onChange={(event) => setQueueAfterCreate(event.target.checked)}
              />
              Queue Publish After Create
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Plus size={16} />
            {isSubmitting ? 'Creating...' : 'Create Automation Post'}
          </button>
        </form>
      </div>
    </section>
  );
}
