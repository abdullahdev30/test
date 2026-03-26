'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login as loginAction, logout as logoutAction } from '@/lib/api/auth';

export interface AuthUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Fetch current session on mount via a public API route
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, []);

  const waitForSessionCookie = useCallback(async (attempts = 12, delayMs = 150) => {
    for (let i = 0; i < attempts; i += 1) {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as { user?: unknown };
          if (data.user) return true;
        }
      } catch {
        // Keep retrying until attempts are exhausted.
      }

      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return false;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      startTransition(async () => {
        try {
          const result = await loginAction(email, password);
          if (!result.success) {
            setError(result.error ?? 'Login failed');
            setIsLoading(false);
            return;
          }

          const sessionReady = await waitForSessionCookie();
          if (!sessionReady) {
            setError('Login succeeded, but session is still syncing. Please try again.');
            setIsLoading(false);
            return;
          }

          // Re-fetch session to populate user state
          const res = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { Accept: 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user || null);
          }
          router.push('/dashboard');
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Login failed';
          setError(message);
        } finally {
          setIsLoading(false);
        }
      });
    },
    [router, startTransition, waitForSessionCookie],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        await logoutAction();
        setUser(null);
        router.push('/login');
      } catch {
        // Force redirect even on error
        setUser(null);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    });
  }, [router, startTransition]);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    clearError,
  };
};
