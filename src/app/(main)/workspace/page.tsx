"use client";

import React from 'react';
import { AlertCircle, Target, Activity, Settings, LayoutDashboard, Key, ExternalLink, ActivitySquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/hooks/useWorkspace';

export default function WorkspaceOverviewPage() {
  const { workspace, businessProfile, isLoading } = useWorkspace();

  // Derive onboarding completeness from real data
  const isOnboarded = !!(workspace && businessProfile?.businessName);

  // Profile completeness: count filled fields
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-primary opacity-60" />
      </div>
    );
  }

  const workspaceName = workspace?.name ?? 'Your Workspace';
  const workspaceSlug = workspace?.slug ? `socialai.com/${workspace.slug}` : '';

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen font-sans">

      {/* Dynamic Onboarding Banner */}
      {!isOnboarded && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-orange-600 bg-orange-500/20 p-2 rounded-md">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary">Onboarding Incomplete</h4>
              <p className="text-xs text-text-secondary mt-0.5">Missing fields detected in your Business Profile and Strategy setups.</p>
            </div>
          </div>
          <Link href="/workspace/onboarding" className="px-4 py-2 bg-text-primary text-background rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
            Complete Onboarding
          </Link>
        </div>
      )}

      {/* Header section */}
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
        {/* Business Health Widget */}
        <div className="bg-bg-primary rounded-lg border border-text-secondary/10 p-8 shadow-sm h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <ActivitySquare size={20} className="text-emerald-500" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">Business Health</h2>
          </div>
          <p className="text-sm text-text-secondary mb-8">Overall profile completeness and system readiness. Complete setups ensure AI generates better content.</p>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="w-full">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-text-primary">Profile Completeness</span>
                <span className="text-text-secondary">{completeness}%</span>
              </div>
              <div className="w-full h-2 bg-text-secondary/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${completeness}%` }}
                />
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

        {/* Current Strategy Widget */}
        <div className="bg-bg-primary rounded-lg border border-text-secondary/10 p-8 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Key size={20} className="text-primary" strokeWidth={1.5} />
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">Business Profile</h2>
            </div>
            <Link href="/workspace/settings/profile" className="text-xs font-semibold text-primary hover:underline">
              Edit
            </Link>
          </div>
          <p className="text-sm text-text-secondary mb-6">Your registered business details used for AI content generation.</p>

          <div className="space-y-3 flex-1">
            {[
              { label: 'Business Name', value: businessProfile?.businessName },
              { label: 'Industry', value: businessProfile?.industry },
              { label: 'Website', value: businessProfile?.websiteUrl },
              { label: 'Location', value: [businessProfile?.city, businessProfile?.country].filter(Boolean).join(', ') || undefined },
              { label: 'Language', value: businessProfile?.defaultLanguage },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-background border border-text-secondary/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-text-secondary opacity-50">0{i + 1}</span>
                  <span className="text-sm font-semibold text-text-secondary">{item.label}</span>
                </div>
                <div className={`text-xs font-semibold ${item.value ? 'text-text-primary' : 'text-orange-400'}`}>
                  {item.value ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
