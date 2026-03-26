'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock3, ImagePlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { usePosts } from '@/hooks/usePosts';
import type { CreatePostInput } from '@/lib/schemas';

type PublishMode = 'manualDraft' | 'scheduled';

function combineDateAndTime(dateValue: string, timeValue: string): string | null {
  if (!dateValue || !timeValue) return null;
  const iso = new Date(`${dateValue}T${timeValue}`).toISOString();
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function inferAssetType(file: File): 'image' | 'video' | 'document' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
}

export default function NewPostPage() {
  const router = useRouter();
  const { createNewPost, uploadAssetFile, clearError } = usePosts();

  const [title, setTitle] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [publishMode, setPublishMode] = useState<PublishMode>('manualDraft');
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [sourceTimezone, setSourceTimezone] = useState('UTC');
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    clearError();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError('Post title is required.');
      return;
    }

    const scheduledFor = publishMode === 'scheduled'
      ? combineDateAndTime(dateValue, timeValue)
      : null;

    if (publishMode === 'scheduled' && !scheduledFor) {
      setFormError('Please set both date and time for scheduled post.');
      return;
    }

    const payload: CreatePostInput = {
      title: cleanTitle,
      captionText: captionText.trim(),
      publishMode,
      sourceTimezone: sourceTimezone.trim() || 'UTC',
      scheduledFor: scheduledFor ?? undefined,
    };

    setIsSubmitting(true);
    try {
      const created = await createNewPost(payload);
      if (!created.success || !created.post?.id) {
        setFormError(created.error ?? 'Failed to create post.');
        return;
      }

      if (assetFile) {
        const upload = await uploadAssetFile(created.post.id, {
          file: assetFile,
          assetType: inferAssetType(assetFile),
        });

        if (!upload.success) {
          setFormError(upload.error ?? 'Post created but asset upload failed.');
          return;
        }
      }

      router.push(`/posts/${created.post.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="p-6 lg:p-10 max-w-4xl mx-auto min-h-screen">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Create New Post</h1>
          <p className="text-text-secondary mt-2 font-medium">
            Create a post and optionally attach image/video asset.
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
          <label className="text-sm font-bold text-text-primary block">
            Post Title
            <input
              className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Launch Campaign Post"
            />
          </label>

          <label className="text-sm font-bold text-text-primary block">
            Caption
            <textarea
              className="mt-1.5 w-full min-h-[130px] rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={captionText}
              onChange={(event) => setCaptionText(event.target.value)}
              placeholder="Write your post caption..."
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-bold text-text-primary block">
              Publish Mode
              <select
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={publishMode}
                onChange={(event) => setPublishMode(event.target.value as PublishMode)}
              >
                <option value="manualDraft">Manual Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>

            <label className="text-sm font-bold text-text-primary block">
              Source Timezone
              <input
                className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={sourceTimezone}
                onChange={(event) => setSourceTimezone(event.target.value)}
                placeholder="UTC"
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
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
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
                  className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  value={timeValue}
                  onChange={(event) => setTimeValue(event.target.value)}
                />
              </label>
            </div>
          )}

          <label className="text-sm font-bold text-text-primary block">
            <span className="inline-flex items-center gap-2">
              <ImagePlus size={15} />
              Attach Image/Video
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              className="mt-1.5 w-full rounded-xl border border-text-secondary/20 bg-transparent px-3 py-2.5 text-sm"
              onChange={(event) => setAssetFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Plus size={16} />
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </form>
      </div>
    </section>
  );
}
