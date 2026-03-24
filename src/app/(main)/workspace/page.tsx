"use client";

import React, { useState } from 'react';
import { AlertCircle, Target, Activity, Settings, LayoutDashboard, Key, ExternalLink, ActivitySquare } from 'lucide-react';
import Link from 'next/link';

export default function WorkspaceOverviewPage() {
  const [isOnboarded, setIsOnboarded] = useState(false); // Map to /workspace/me/onboarding-status GET

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
            <h1 className="text-3xl font-semibold text-text-primary tracking-tight">Acme Agency Hub</h1>
            <p className="text-sm font-semibold text-text-secondary mt-1 flex items-center gap-2">
              socialai.com/acme-agency <ExternalLink size={14} className="opacity-50" />
            </p>
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
                <span className="text-text-secondary">80%</span>
              </div>
              <div className="w-full h-2 bg-text-secondary/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-background border border-text-secondary/10 rounded-lg">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Identity Tone</p>
                <p className="text-sm font-semibold text-text-primary">Configured</p>
              </div>
              <div className="p-4 bg-background border border-text-secondary/10 rounded-lg">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Target Audience</p>
                <p className="text-sm font-semibold text-orange-500">Missing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Strategy Widget */}
        <div className="bg-bg-primary rounded-lg border border-text-secondary/10 p-8 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Key size={20} className="text-primary" strokeWidth={1.5} />
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">Current Strategy</h2>
            </div>
            <Link href="/workspace/settings/keywords" className="text-xs font-semibold text-primary hover:underline">
              Manage
            </Link>
          </div>
          <p className="text-sm text-text-secondary mb-6">Top 5 keywords defining your content generation strategy.</p>

          <div className="space-y-3 flex-1">
            {[
              { k: "social media automation", type: "Primary", weight: "98%" },
              { k: "ai content generator", type: "Primary", weight: "92%" },
              { k: "agency software tools", type: "Secondary", weight: "85%" },
              { k: "b2b marketing automation", type: "Secondary", weight: "79%" },
              { k: "growth hacking software", type: "Secondary", weight: "64%" }
            ].map((kw, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-background border border-text-secondary/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-text-secondary opacity-50">0{i + 1}</span>
                  <span className="text-sm font-semibold text-text-primary">{kw.k}</span>
                  {kw.type === "Primary" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Primary"></span>}
                </div>
                <div className="text-xs font-semibold text-text-secondary">
                  {kw.weight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
