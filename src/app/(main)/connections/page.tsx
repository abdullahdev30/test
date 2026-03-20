"use client";

import React, { useState } from 'react';
import { Link2, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, Plus, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: <Facebook size={24} />, color: 'bg-blue-600', description: 'Pages & Groups' },
  { id: 'instagram', name: 'Instagram', icon: <Instagram size={24} />, color: 'bg-pink-600', description: 'Business & Creator' },
  { id: 'twitter', name: 'X / Twitter', icon: <Twitter size={24} />, color: 'bg-black', description: 'Profile Analytics' },
  { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin size={24} />, color: 'bg-sky-700', description: 'Company Pages' },
  { id: 'youtube', name: 'YouTube', icon: <Youtube size={24} />, color: 'bg-red-600', description: 'Channel Insights' },
  { id: 'tiktok', name: 'TikTok', icon: <MessageCircle size={24} />, color: 'bg-zinc-900', description: 'Creator Tools' },
];

export default function ConnectionsPage() {
  const [activeConnections, setActiveConnections] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = (id: string) => {
    setIsConnecting(id);
    setTimeout(() => {
      setActiveConnections([...activeConnections, id]);
      setIsConnecting(null);
    }, 1500); // Simulate OAuth connection delay
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 font-sans relative">
      <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Connections</h1>
          <p className="text-text-secondary mt-2 font-bold uppercase text-[11px] tracking-[0.2em]">Manage linked social accounts</p>
        </div>
        <div className="bg-primary/10 text-primary px-5 py-3 rounded-2xl">
          <span className="font-black text-lg">{activeConnections.length}</span> <span className="text-sm font-bold uppercase tracking-widest pl-1">Accounts Linked</span>
        </div>
      </div>

      {activeConnections.length === 0 && (
         <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-[32px] p-8 mb-10 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
               <Link2 size={28} />
            </div>
            <div>
               <h3 className="text-xl font-black text-blue-700 mb-1">Start by adding a connection</h3>
               <p className="text-blue-600/70 font-bold text-sm">Select a network below to link it to your workspace and begin synchronizing analytics.</p>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
        {SOCIAL_PLATFORMS.map((platform) => {
          const isConnected = activeConnections.includes(platform.id);
          const isCurrentlyConnecting = isConnecting === platform.id;

          return (
            <div key={platform.id} className={`bg-bg-primary rounded-[40px] border p-8 shadow-sm transition-all group ${isConnected ? 'border-primary/30 shadow-primary/5' : 'border-text-secondary/10 hover:border-primary/20'}`}>
              <div className="flex items-start justify-between mb-8">
                <div className={`w-14 h-14 ${platform.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                  {platform.icon}
                </div>
                {isConnected && (
                  <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 size={14} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Connected</span>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-black text-text-primary">{platform.name}</h3>
                <p className="text-text-secondary text-xs uppercase tracking-widest font-bold mt-1.5 mb-8">{platform.description}</p>
              </div>

              {!isConnected ? (
                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={isConnecting !== null}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 border-text-secondary/10 hover:border-primary/40 hover:bg-primary/5 active:scale-95 text-text-primary ${isCurrentlyConnecting ? 'opacity-50' : ''}`}
                >
                  {isCurrentlyConnecting ? (
                     <><Loader2 size={16} className="animate-spin text-primary" /> Connecting...</>
                  ) : (
                     <><Plus size={16} className="text-text-secondary" /> Add Connection</>
                  )}
                </button>
              ) : (
                <button
                  className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-between px-6 transition-all bg-background border border-text-secondary/10 hover:bg-primary/5 hover:border-primary/20 text-text-secondary active:scale-95"
                >
                  Manage Account <ChevronRight size={16} className="text-primary" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
