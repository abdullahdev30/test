'use client';

import { useState, useCallback, useEffect } from 'react';

/** * Status types for the UI 
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'unknown';

export interface PlatformStatus {
  connected: boolean;
  status: ConnectionStatus;
  providerAccountName?: string | null;
  username: string | null;
  socialConnectionId?: string | null;
}

const POLL_INTERVAL_MS = 20_000; // Auto-refresh every 20 seconds
const PLATFORMS = ['instagram', 'google-business-profile', 'facebook', 'linkedin'] as const;
type PlatformKey = (typeof PLATFORMS)[number];

export function useSocial() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [statusData, setStatusData] = useState<Record<string, PlatformStatus>>({});
  const [error, setError] = useState<Record<string, string | null>>({});

  /**
   * REFRESH ALL: Calls live status API for each platform and updates button state.
   */
  const refreshAll = useCallback(async () => {
    try {
      const responses = await Promise.all(
        PLATFORMS.map(async (platform) => {
          try {
            const res = await fetch(`/api/social/${platform}/status`, {
              cache: 'no-store',
              credentials: 'same-origin',
            });

            if (res.status === 401) {
              return { platform, unauthorized: true, data: null as Record<string, unknown> | null };
            }
            if (!res.ok) {
              return { platform, unauthorized: false, data: null as Record<string, unknown> | null };
            }

            const data = (await res.json()) as Record<string, unknown>;
            return { platform, unauthorized: false, data };
          } catch {
            return { platform, unauthorized: false, data: null as Record<string, unknown> | null };
          }
        }),
      );

      if (responses.some((r) => r.unauthorized)) return;

      const mappedConnections: Record<PlatformKey, PlatformStatus> = {
        instagram: { connected: false, status: 'disconnected', username: null, providerAccountName: null, socialConnectionId: null },
        'google-business-profile': { connected: false, status: 'disconnected', username: null, providerAccountName: null, socialConnectionId: null },
        facebook: { connected: false, status: 'disconnected', username: null, providerAccountName: null, socialConnectionId: null },
        linkedin: { connected: false, status: 'disconnected', username: null, providerAccountName: null, socialConnectionId: null },
      };

      for (const item of responses) {
        const status = item.data?.status as string | undefined;
        const connection = item.data?.connection as Record<string, unknown> | undefined;
        const username =
          (item.data?.providerAccountName as string | null | undefined) ??
          (item.data?.username as string | null | undefined) ??
          (connection?.providerAccountName as string | null | undefined) ??
          (connection?.providerAccountId as string | null | undefined) ??
          null;
        const socialConnectionId =
          (item.data?.socialConnectionId as string | null | undefined) ??
          (connection?.id as string | null | undefined) ??
          (connection?.socialConnectionId as string | null | undefined) ??
          null;

        mappedConnections[item.platform] = {
          connected: status === 'connected',
          status: status === 'connected' ? 'connected' : 'disconnected',
          username: status === 'connected' ? username : null,
          providerAccountName: status === 'connected' ? username : null,
          socialConnectionId: status === 'connected' ? socialConnectionId : null,
        };
      }

      setStatusData(mappedConnections);
    } catch (err) {
      console.error("Failed to sync social status:", err);
    }
  }, []);

  /**
   * INITIALIZE: Start the polling loop on mount.
   */
  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshAll]);

  /**
   * CONNECT: Initiates OAuth flow.
   * Redirects window to the provider (LinkedIn, etc).
   */
  const connect = async (platform: string) => {
    setLoading(prev => ({ ...prev, [platform]: true }));
    setError(prev => ({ ...prev, [platform]: null }));
    try {
      const res = await fetch(`/api/social/${platform}/connect`, {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (res.status === 401) {
        setError(prev => ({ ...prev, [platform]: 'Session expired. Please log in again.' }));
        return;
      }

      const data = await res.json();
      const authUrl = data.authUrl ?? data.url;

      if (!authUrl) {
        setError(prev => ({ ...prev, [platform]: 'No authorization URL received.' }));
        return;
      }

      // Redirect the user to the social platform
      window.location.href = authUrl;
    } catch {
      setError(prev => ({ ...prev, [platform]: `Failed to start ${platform} connection.` }));
    } finally {
      // We don't set loading to false here because the page is redirecting
    }
  };

  /**
   * DISCONNECT: Clears token and updates UI.
   */
  const disconnect = async (platform: string) => {
    setLoading(prev => ({ ...prev, [platform]: true }));
    setError(prev => ({ ...prev, [platform]: null }));

    try {
      const res = await fetch(`/api/social/${platform}/disconnect`, {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(prev => ({ ...prev, [platform]: body.error ?? 'Disconnect failed.' }));
      }
      
      // Trigger a fresh status check to update the UI
      await refreshAll();
    } catch {
      setError(prev => ({ ...prev, [platform]: 'Disconnect request failed.' }));
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  /**
   * HELPER: Quick check for UI rendering
   */
  const isConnected = (platform: string) => statusData[platform]?.connected === true;

  return {
    loading,
    statusData,
    error,
    isConnected,
    connect,
    disconnect,
    refreshAll,
  };
}
