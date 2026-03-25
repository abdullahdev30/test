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
}

const POLL_INTERVAL_MS = 20_000; // Auto-refresh every 20 seconds

export function useSocial() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [statusData, setStatusData] = useState<Record<string, PlatformStatus>>({});
  const [error, setError] = useState<Record<string, string | null>>({});

  /**
   * REFRESH ALL: Syncs the UI with the platform_connections cookie/backend.
   * This is the single source of truth for the "Live/Off" status.
   */
  const refreshAll = useCallback(async () => {
    try {
      const res = await fetch('/api/social/connections', { 
        cache: 'no-store',
        credentials: 'same-origin' 
      });

      if (res.status === 401) return; // Silent skip if session is dead
      if (!res.ok) return;

      const data = await res.json();

      if (data.connections) {
        const mappedConnections = Object.keys(data.connections).reduce((acc, key) => {
          const conn = data.connections[key];
          acc[key] = {
            ...conn,
            // Ensure UI has a valid string for the username badge
            providerAccountName: conn.providerAccountName || conn.username || null,
            connected: conn.status === 'connected' || conn.connected === true
          };
          return acc;
        }, {} as Record<string, PlatformStatus>);

        setStatusData(mappedConnections);
      }
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