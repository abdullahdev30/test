"use client";

import React, { useMemo, useState, useTransition } from 'react';
import { AlertCircle, Settings, LayoutDashboard, Key, ExternalLink, ActivitySquare, Loader2, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/hooks/useWorkspace';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function WorkspaceOverviewPage() {
  const {
    workspace,
    businessProfile,
    keywords,
    onboardingStatus,
    isLoading,
    createWorkspace,
    refresh,
  } = useWorkspace();

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();

  const isOnboarded = onboardingStatus?.onboardingCompleted ?? !!(workspace && businessProfile?.businessName);

  const bpFields = [
    businessProfile?.businessName,
    businessProfile?.industry,
    businessProfile?.websiteUrl,
    businessProfile?.country,
    businessProfile?.brandTone,
    businessProfile?.targetAudience,
    businessProfile?.description,
    businessProfile?.timezone,
  ];
  const filledCount = bpFields.filter(Boolean).length;
  const completeness = Math.round((filledCount / bpFields.length) * 100);

  const keywordStats = useMemo(() => {
    const primary = keywords.filter((k) => String(k.keywordType).toLowerCase() === 'primary').length;
    const secondary = keywords.length - primary;
    return { total: keywords.length, primary, secondary };
  }, [keywords]);

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) return;
    setCreateError(null);
    startCreateTransition(async () => {
      const result = await createWorkspace({
        name: newWorkspaceName.trim(),
        slug: slugify(newWorkspaceName),
      });

      if (!result.success) {
        setCreateError(result.error ?? 'Failed to create workspace');
        return;
      }

      setNewWorkspaceName('');
      await refresh();
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-primary opacity-60" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8 max-w-4xl mx-auto min-h-screen font-sans">
        <div className="bg-bg-primary rounded-2xl border border-text-secondary/10 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <PlusCircle size={22} className="text-primary" />
            <h1 className="text-2xl font-semibold text-text-primary">Create Your Workspace</h1>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            No workspace found for this account. Create one to continue.
          </p>

          {createError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              {createError}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name (e.g. Albatross Vibe)"
              className="flex-1 px-4 py-3 bg-background border border-text-secondary/10 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleCreateWorkspace}
              disabled={isCreating || !newWorkspaceName.trim()}
              className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const workspaceName = workspace.name ?? 'Your Workspace';
  const workspaceSlug = workspace.slug ? `socialai.com/${workspace.slug}` : '';

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen font-sans">
      {!isOnboarded && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-orange-600 bg-orange-500/20 p-2 rounded-md">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary">Onboarding Incomplete</h4>
              <p className="text-xs text-text-secondary mt-0.5">Complete business profile and keywords to finish setup.</p>
            </div>
          </div>
          <Link href="/workspace/onboarding" className="px-4 py-2 bg-text-primary text-background rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
            Complete Onboarding
          </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-text-secondary/10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center shadow-inner">
            <LayoutDashboard size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-text-primary tracking-tight">{workspaceName}</h1>
            {workspaceSlug && (
              <p className="text-sm font-semibold text-text-secondary mt-1 flex items-center gap-2">
                {workspaceSlug} <ExternalLink size={14} className="opacity-50" />
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/workspace/settings/profile" className="flex items-center gap-2 px-5 py-2.5 bg-background border border-text-secondary/10 hover:border-text-secondary/30 text-text-primary rounded-lg text-sm font-semibold transition-all">
            <Settings size={18} strokeWidth={1.5} /> Profile Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-bg-primary rounded-lg border border-text-secondary/10 p-8 shadow-sm h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <ActivitySquare size={20} className="text-emerald-500" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">Business Health</h2>
          </div>
          <p className="text-sm text-text-secondary mb-8">Overall profile completeness and workspace readiness.</p>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="w-full">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-text-primary">Profile Completeness</span>
                <span className="text-text-secondary">{completeness}%</span>
              </div>
              <div className="w-full h-2 bg-text-secondary/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${completeness}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-background border border-text-secondary/10 rounded-lg">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Identity Tone</p>
                <p className={`text-sm font-semibold ${businessProfile?.brandTone ? 'text-text-primary' : 'text-orange-500'}`}>
                  {businessProfile?.brandTone ?? 'Missing'}
                </p>
              </div>
              <div className="p-4 bg-background border border-text-secondary/10 rounded-lg">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Target Audience</p>
                <p className={`text-sm font-semibold ${businessProfile?.targetAudience ? 'text-text-primary' : 'text-orange-500'}`}>
                  {businessProfile?.targetAudience ?? 'Missing'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary rounded-lg border border-text-secondary/10 p-8 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Key size={20} className="text-primary" strokeWidth={1.5} />
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">Keywords</h2>
            </div>
            <Link href="/workspace/settings/keywords" className="text-xs font-semibold text-primary hover:underline">
              Manage
            </Link>
          </div>
          <p className="text-sm text-text-secondary mb-6">Loaded from `/workspace/me/keywords`.</p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 bg-background border border-text-secondary/10 rounded-lg">
              <p className="text-[10px] uppercase text-text-secondary font-bold">Total</p>
              <p className="text-lg font-semibold text-text-primary">{keywordStats.total}</p>
            </div>
            <div className="p-3 bg-background border border-text-secondary/10 rounded-lg">
              <p className="text-[10px] uppercase text-text-secondary font-bold">Primary</p>
              <p className="text-lg font-semibold text-text-primary">{keywordStats.primary}</p>
            </div>
            <div className="p-3 bg-background border border-text-secondary/10 rounded-lg">
              <p className="text-[10px] uppercase text-text-secondary font-bold">Secondary</p>
              <p className="text-lg font-semibold text-text-primary">{keywordStats.secondary}</p>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-auto">
            {keywords.length === 0 ? (
              <p className="text-sm text-text-secondary">No keywords yet.</p>
            ) : (
              keywords.slice(0, 8).map((kw) => (
                <div key={kw.id} className="flex items-center justify-between px-3 py-2 bg-background border border-text-secondary/10 rounded-lg">
                  <span className="text-sm text-text-primary">{kw.keyword}</span>
                  <span className="text-[10px] uppercase font-bold text-text-secondary">{kw.keywordType}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
