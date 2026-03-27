"use client";

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Checkbox, Input, Textarea } from '@/components/common';

type ProfileForm = {
  businessName: string;
  brandSlug: string;
  industry: string;
  category: string;
  subcategory: string;
  description: string;
  websiteUrl: string;
  country: string;
  city: string;
  timezone: string;
  defaultLanguage: string;
  brandTone: string;
  targetAudience: string;
  servicesText: string;
  goalsText: string;
  preferredPlatformsText: string;
  postingFrequency: string;
  approvalRequired: boolean;
};

const EMPTY_FORM: ProfileForm = {
  businessName: '',
  brandSlug: '',
  industry: '',
  category: '',
  subcategory: '',
  description: '',
  websiteUrl: '',
  country: '',
  city: '',
  timezone: '',
  defaultLanguage: 'English',
  brandTone: '',
  targetAudience: '',
  servicesText: '',
  goalsText: '',
  preferredPlatformsText: '',
  postingFrequency: '',
  approvalRequired: false,
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function listToTextarea(value: unknown): string {
  return toStringArray(value).join('\n');
}

function textareaToList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value: unknown): string {
  if (!value || typeof value !== 'string') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const {
    businessProfile,
    patchBusinessProfile,
    upsertBusinessProfile,
    deleteWorkspace,
    isLoading,
  } = useWorkspace();
  const [isSaving, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  useEffect(() => {
    if (!businessProfile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form when profile is not yet loaded
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      businessName: String(businessProfile.businessName ?? ''),
      brandSlug: String(businessProfile.brandSlug ?? ''),
      industry: String(businessProfile.industry ?? ''),
      category: String(businessProfile.category ?? ''),
      subcategory: String(businessProfile.subcategory ?? ''),
      description: String(businessProfile.description ?? ''),
      websiteUrl: String(businessProfile.websiteUrl ?? ''),
      country: String(businessProfile.country ?? ''),
      city: String(businessProfile.city ?? ''),
      timezone: String(businessProfile.timezone ?? ''),
      defaultLanguage: String(businessProfile.defaultLanguage ?? 'English'),
      brandTone: String(businessProfile.brandTone ?? ''),
      targetAudience: String(businessProfile.targetAudience ?? ''),
      servicesText: listToTextarea(businessProfile.services),
      goalsText: listToTextarea(businessProfile.goals),
      preferredPlatformsText: listToTextarea(businessProfile.preferredPlatforms),
      postingFrequency: String(businessProfile.postingFrequency ?? ''),
      approvalRequired: Boolean(businessProfile.approvalRequired),
    });
  }, [businessProfile]);

  const parsedServices = useMemo(() => textareaToList(form.servicesText), [form.servicesText]);
  const parsedGoals = useMemo(() => textareaToList(form.goalsText), [form.goalsText]);
  const parsedPlatforms = useMemo(
    () => textareaToList(form.preferredPlatformsText),
    [form.preferredPlatformsText],
  );

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      if (!form.businessName.trim()) {
        setError('Business name is required');
        return;
      }

      const normalizedBusinessName = form.businessName.trim();

      const payload = {
        brandSlug: form.brandSlug.trim() || undefined,
        industry: form.industry.trim() || undefined,
        category: form.category.trim() || undefined,
        subcategory: form.subcategory.trim() || undefined,
        description: form.description.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        country: form.country.trim() || undefined,
        city: form.city.trim() || undefined,
        timezone: form.timezone.trim() || undefined,
        defaultLanguage: form.defaultLanguage.trim() || undefined,
        brandTone: form.brandTone.trim() || undefined,
        targetAudience: form.targetAudience.trim() || undefined,
        services: parsedServices,
        goals: parsedGoals,
        preferredPlatforms: parsedPlatforms,
        postingFrequency: form.postingFrequency.trim() || undefined,
        approvalRequired: form.approvalRequired,
      };

      const result = businessProfile
        ? await patchBusinessProfile({
            businessName: normalizedBusinessName || undefined,
            ...payload,
          })
        : await upsertBusinessProfile({
            businessName: normalizedBusinessName,
            ...payload,
          });

      if (!result.success) {
        setError(result.error ?? 'Failed to save profile');
        return;
      }
      setSuccess('Business profile saved');
    });
  };

  const handleDeleteWorkspace = () => {
    setError(null);
    setSuccess(null);

    const confirmed = window.confirm(
      'Are you sure you want to delete this workspace? This action cannot be undone.',
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      const result = await deleteWorkspace();
      if (!result.success) {
        setError(result.error ?? 'Failed to delete workspace');
        return;
      }

      setSuccess('Workspace deleted successfully');
      router.push('/workspace');
      router.refresh();
    });
  };

  return (
    <div className="p-8 font-sans">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-text-secondary/10">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Business Profile</h2>
          <p className="text-sm text-text-secondary mt-1">Manage standard identity and content strategy defaults.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          isLoading={isSaving}
          className="gap-2 px-6 py-2 rounded-lg text-sm font-semibold"
        >
          <Save size={16} /> Save Changes
        </Button>
      </div>

      {error && (
        <Alert variant="alert" className="mb-4 text-xs">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4 text-xs">
          {success}
        </Alert>
      )}

      <div className="space-y-12">
        <section>
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Business Identity</h3>
            <p className="text-xs text-text-secondary mt-1">Core brand naming and classification fields from your API profile.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Business Name</label>
              <Input
                value={form.businessName}
                onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="Your business name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Brand Slug</label>
              <Input
                value={form.brandSlug}
                onChange={(e) => setForm((prev) => ({ ...prev, brandSlug: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="flowsync-automation"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Industry</label>
              <Input
                value={form.industry}
                onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="Technology"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Category</label>
              <Input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="Software"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-text-primary">Subcategory</label>
              <Input
                value={form.subcategory}
                onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="Automation & Workflow Orchestration"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-text-primary">Description</label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="border-text-secondary/10 rounded-lg min-h-[120px] resize-none"
                variant="filled"
                placeholder="Describe your business profile..."
              />
            </div>
          </div>
        </section>

        <hr className="border-text-secondary/10" />

        <section>
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Location And Website</h3>
            <p className="text-xs text-text-secondary mt-1">Public location and website metadata.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Website URL</label>
              <Input
                value={form.websiteUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="https://www.flowsyncautomation.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Country</label>
              <Input
                value={form.country}
                onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="United States"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">City</label>
              <Input
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="Miami"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Timezone</label>
              <Input
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="EST"
              />
            </div>
          </div>
        </section>

        <hr className="border-text-secondary/10" />

        <section>
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Content Preferences</h3>
            <p className="text-xs text-text-secondary mt-1">Language, tone, audience and publishing rules.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Default Language</label>
              <Input
                value={form.defaultLanguage}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultLanguage: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="English"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Brand Tone</label>
              <Input
                value={form.brandTone}
                onChange={(e) => setForm((prev) => ({ ...prev, brandTone: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="Professional, clear, and solution-oriented"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Posting Frequency</label>
              <Input
                value={form.postingFrequency}
                onChange={(e) => setForm((prev) => ({ ...prev, postingFrequency: e.target.value }))}
                className="border-text-secondary/10 rounded-lg"
                variant="filled"
                placeholder="daily"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Approval Required</label>
              <label className="flex items-center gap-3 px-3 py-3 bg-background border border-text-secondary/10 rounded-lg text-sm text-text-primary cursor-pointer">
                <Checkbox
                  checked={form.approvalRequired}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, approvalRequired: e.target.checked }))
                  }
                />
                Require approval before posting
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Target Audience</label>
              <Textarea
                rows={4}
                value={form.targetAudience}
                onChange={(e) => setForm((prev) => ({ ...prev, targetAudience: e.target.value }))}
                className="border-text-secondary/10 rounded-lg min-h-[120px] resize-none"
                variant="filled"
                placeholder="Small to mid-sized businesses, startups, and enterprises..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Services</label>
              <Textarea
                rows={4}
                value={form.servicesText}
                onChange={(e) => setForm((prev) => ({ ...prev, servicesText: e.target.value }))}
                className="border-text-secondary/10 rounded-lg min-h-[120px] resize-none"
                variant="filled"
                placeholder={"One per line or comma separated\nWorkflow automation\nAPI integration"}
              />
              <p className="text-[11px] text-text-secondary">{parsedServices.length} services detected</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Goals</label>
              <Textarea
                rows={4}
                value={form.goalsText}
                onChange={(e) => setForm((prev) => ({ ...prev, goalsText: e.target.value }))}
                className="border-text-secondary/10 rounded-lg min-h-[120px] resize-none"
                variant="filled"
                placeholder={"One per line or comma separated\nSimplify complex workflows"}
              />
              <p className="text-[11px] text-text-secondary">{parsedGoals.length} goals detected</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Preferred Platforms</label>
              <Textarea
                rows={4}
                value={form.preferredPlatformsText}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, preferredPlatformsText: e.target.value }))
                }
                className="border-text-secondary/10 rounded-lg min-h-[120px] resize-none"
                variant="filled"
                placeholder={"One per line or comma separated\nLinkedIn\nTwitter\nGBP"}
              />
              <p className="text-[11px] text-text-secondary">
                {parsedPlatforms.length} platforms detected
              </p>
            </div>
          </div>
        </section>

        <hr className="border-text-secondary/10" />

        <section>
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">System Fields (Read-only)</h3>
            <p className="text-xs text-text-secondary mt-1">These values come from backend state and are displayed for reference.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Profile Id</label>
              <Input
                readOnly
                value={String(businessProfile?.id ?? '')}
                className="bg-bg-primary border-text-secondary/10 rounded-lg text-text-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Workspace Id</label>
              <Input
                readOnly
                value={String(businessProfile?.workspaceId ?? '')}
                className="bg-bg-primary border-text-secondary/10 rounded-lg text-text-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Onboarding Completed</label>
              <Input
                readOnly
                value={businessProfile?.onboardingCompleted ? 'Yes' : 'No'}
                className="bg-bg-primary border-text-secondary/10 rounded-lg text-text-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Onboarding Completed At</label>
              <Input
                readOnly
                value={formatDate(businessProfile?.onboardingCompletedAt)}
                className="bg-bg-primary border-text-secondary/10 rounded-lg text-text-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Created At</label>
              <Input
                readOnly
                value={formatDate(businessProfile?.createdAt)}
                className="bg-bg-primary border-text-secondary/10 rounded-lg text-text-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Updated At</label>
              <Input
                readOnly
                value={formatDate(businessProfile?.updatedAt)}
                className="bg-bg-primary border-text-secondary/10 rounded-lg text-text-secondary"
              />
            </div>
          </div>
        </section>

        <hr className="border-text-secondary/10" />

        <Card className="rounded-xl border-red-500/30 bg-red-500/5 p-6">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">Danger Zone</h3>
            <p className="text-xs text-text-secondary mt-1">
              Deleting the workspace will remove its profile and related workspace data.
            </p>
          </div>
          <Button
            onClick={handleDeleteWorkspace}
            disabled={isDeleting || isLoading}
            variant="alert"
            isLoading={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
          >
            <Trash2 size={16} />
            Delete Workspace
          </Button>
        </Card>
      </div>
    </div>
  );
}
