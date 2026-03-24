'use client';

import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, Linkedin, Globe, Zap, Loader2 } from 'lucide-react';

const PLATFORMS = [
  { id: 'ig', name: 'Instagram', icon: <Instagram size={24} />, apiName: 'instagram' },
  { id: 'gb', name: 'Google Business', icon: <Globe size={24} />, apiName: 'google' },
  { id: 'fb', name: 'Facebook', icon: <Facebook size={24} />, apiName: 'facebook' },
  { id: 'li', name: 'Linkedin', icon: <Linkedin size={24} />, apiName: 'linkedin' },
];

// All requests go through /api/social — token and backend URL are server-side only
const socialFetch = (platform: string, action: string, method = 'GET') =>
  fetch(`/api/social/${platform}/${action}`, { method }).then((r) => r.json());

export default function SocialConnections() {
  const [activeId, setActiveId] = useState('li');
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [statusData, setStatusData] = useState<{ [key: string]: Record<string, unknown> }>({});

  const fetchStatus = async (apiName: string, id: string) => {
    try {
      const data = await socialFetch(apiName, 'status');
      setStatusData((prev) => ({ ...prev, [id]: data }));
    } catch {
      // Silently ignore — status will just show as disconnected
    }
  };

  const handleConnect = async (apiName: string, id: string) => {
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const data = await socialFetch(apiName, 'connect');
      if (data.url) {
        window.location.href = data.url;
      } else {
        fetchStatus(apiName, id);
      }
    } catch {
      // handled silently
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDisconnect = async (apiName: string, id: string) => {
    if (!confirm('Disconnect this account?')) return;
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await socialFetch(apiName, 'disconnect', 'DELETE');
      fetchStatus(apiName, id);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    const activePlatform = PLATFORMS.find((p) => p.id === activeId);
    if (activePlatform) fetchStatus(activePlatform.apiName, activeId);
  }, [activeId]);

  return (
    <section className="p-10 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h2 className="text-2xl font-black text-text-primary">Social Connections</h2>
          <p className="text-[11px] font-bold tracking-widest text-text-secondary mt-1 uppercase">INFRASTRUCTURE HUB</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLATFORMS.map((item) => {
            const isActive = activeId === item.id;
            const isConnected = statusData[item.id]?.connected === true;

            return (
              <div
                key={item.id}
                onClick={() => setActiveId(item.id)}
                className={`relative flex flex-col p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 aspect-square
                  ${isActive ? 'border-primary bg-bg-primary shadow-xl shadow-primary/10' : 'border-transparent bg-bg-primary opacity-60'}`}
              >
                <div className="flex items-center gap-4 mb-auto">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${isActive ? 'bg-secondary text-primary' : 'bg-background text-text-secondary'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-text-primary leading-tight">{item.name}</h4>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
                      {isConnected ? '🟢 Linked' : '🔒 Scheduled'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-text-secondary my-4">
                  {isConnected ? `Your ${item.name} is active and ready.` : `Module for ${item.name} deployment.`}
                </p>

                <button
                  disabled={loading[item.id]}
                  onClick={(e) => {
                    e.stopPropagation();
                    isConnected ? handleDisconnect(item.apiName, item.id) : handleConnect(item.apiName, item.id);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[12px] uppercase transition-all
                    ${isActive ? 'bg-primary text-white' : 'bg-background text-text-secondary/40'}`}
                >
                  {loading[item.id] ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}