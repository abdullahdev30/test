'use client';

import React, { useState, useEffect } from 'react';
import { 
  Instagram, Facebook, Linkedin, Globe, 
  Link as LinkIcon, Link2Off, AlertCircle, RefreshCw, CheckCircle2, X 
} from 'lucide-react';
import { useSocial } from '@/hooks/useSocial';
import { Button, Card, Spinner } from '@/components/common';

const PLATFORMS = [
  { id: 'ig', name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500', apiName: 'instagram' },
  { id: 'gb', name: 'Google Business', icon: Globe, color: 'from-blue-500 to-cyan-400', apiName: 'google-business-profile' },
  { id: 'fb', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-400', apiName: 'facebook' },
  { id: 'li', name: 'LinkedIn', icon: Linkedin, color: 'from-sky-600 to-sky-400', apiName: 'linkedin' },
];

export default function SocialConnections() {
  const { loading, statusData, error, isConnected, connect, disconnect, refreshAll } = useSocial();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // 1. Handle Hydration & URL Notifications
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const err = searchParams.get('error');

    if (success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL params drive one-time toast state after OAuth callback
      setToast({ 
        type: 'success', 
        msg: `${success.charAt(0).toUpperCase() + success.slice(1)} linked successfully!` 
      });
      refreshAll();
    } else if (err) {
      setToast({ type: 'error', msg: decodeURIComponent(err) });
    }

    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [refreshAll]);

  return (
    <section className="p-6 md:p-10 bg-[var(--background)] min-h-screen relative">
      
      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <Card className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300
          ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-bold">{toast.msg}</p>
          <Button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 p-0 h-auto" variant="ghost" size="sm"><X size={14} /></Button>
        </Card>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Social Infrastructure</h2>
            <p className="text-[var(--text-secondary)] text-xs mt-1 font-medium uppercase tracking-wider opacity-60">
              API Node Management
            </p>
          </div>
          <Button
            onClick={refreshAll}
            variant="outline"
            size="sm"
            className="rounded-lg border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            <RefreshCw size={14} className={Object.values(loading).some(Boolean) ? 'animate-spin' : ''} />
            Sync All
          </Button>
        </header>

        {/* --- GRID LAYOUT --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {PLATFORMS.map((item) => {
            const connected = isConnected(item.apiName);
            const isLoading = loading[item.apiName];
            const apiError = error[item.apiName];
            const platformStatus = statusData[item.apiName];
            const accountName = platformStatus?.providerAccountName || platformStatus?.username;
            const Icon = item.icon;

            return (
              <Card
                key={item.id}
                className={`group relative flex flex-col p-6 rounded-2xl border transition-all duration-300 min-h-[280px]
                  ${connected 
                    ? 'border-[var(--primary)] bg-[var(--bg-secondary)] shadow-md' 
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)]'}`}
              >
                {/* Header: Icon & Status Dot */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg shadow-black/10`}>
                    <Icon size={20} />
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--background)] border border-[var(--border-color)]">
                    <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-[var(--text-primary)]">
                      {connected ? 'Live' : 'Off'}
                    </span>
                  </div>
                </div>

                {/* Content: Title & Account Info */}
                <div className="flex-grow mb-6">
                  <h3 className="text-lg font-extrabold text-[var(--text-primary)] mb-1">{item.name}</h3>
                  {connected && accountName ? (
                    <div className="flex items-center gap-1 text-[var(--primary)] mb-2">
                      <CheckCircle2 size={10} />
                      <span className="text-[11px] font-bold truncate">@{accountName}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-2 opacity-40">Unauthorized</p>
                  )}
                  
                  <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed opacity-80">
                    {connected 
                      ? `Protocol active. Automations for ${item.name} are currently operational.`
                      : `Sync required to enable ${item.name} content distribution.`}
                  </p>

                  {apiError && (
                    <div className="mt-3 text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {apiError}
                    </div>
                  )}
                </div>

                {/* Footer: Action Button */}
                <div className="mt-auto">
                  {connected ? (
                    <Button
                      disabled={isLoading}
                      onClick={() => disconnect(item.apiName)}
                      variant="outline"
                      className="w-full py-2.5 rounded-xl font-bold text-[10px] uppercase bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white border-red-500/10"
                    >
                      {isLoading ? <Spinner size="sm" /> : <Link2Off size={14} />}
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      disabled={isLoading}
                      onClick={() => connect(item.apiName)}
                      className="w-full py-2.5 rounded-xl font-bold text-[10px] uppercase bg-[var(--primary)] text-white hover:brightness-110 shadow-lg shadow-[var(--primary)]/10 active:scale-[0.97]"
                    >
                      {isLoading ? <Spinner size="sm" /> : <LinkIcon size={14} />}
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
