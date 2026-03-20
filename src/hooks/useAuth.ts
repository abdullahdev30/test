// =============================================================================
// hooks/useAuth.ts  —  React hook for all auth actions
// =============================================================================
// Calls your internal Next.js /api/auth/* routes (never the backend directly).
// No localStorage — all tokens live in HTTP-only cookies set by the server.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
  deviceId?: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SetPasswordData {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  isLoading: boolean;
  error: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ── Internal fetch helper ──────────────────────────────────────────────────
  const request = useCallback(
    async (endpoint: string, body?: Record<string, unknown>) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/auth/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // credentials: 'include' ensures cookies are sent/received
          credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Something went wrong');
        }

        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── 1. LOGIN ──────────────────────────────────────────────────────────────
  // On success → access + refresh tokens stored in HTTP-only cookies
  // Redirects to /dashboard
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await request('login', credentials);
      router.push('/dashboard');
      router.refresh(); // force server-component re-render to pick up new session
    },
    [request, router]
  );

  // ── 2. SIGNUP ─────────────────────────────────────────────────────────────
  // On success → redirects to verify-email page
  const signup = useCallback(
    async (userData: SignupData) => {
      const data = await request('signup', userData);
      router.push(`/verify-email?email=${encodeURIComponent(userData.email)}`);
      return data;
    },
    [request, router]
  );

  // ── 3. VERIFY EMAIL ───────────────────────────────────────────────────────
  // On success → redirects to dashboard (session cookie set by server)
  const verifyEmail = useCallback(
    async (email: string, otp: string) => {
      await request('verify-email', { email, otp });
      router.push('/dashboard');
      router.refresh();
    },
    [request, router]
  );

  // ── 4. FORGOT PASSWORD ────────────────────────────────────────────────────
  // Sends OTP to email — no redirect, caller controls the UI flow
  const forgotPassword = useCallback(
    async (email: string) => {
      return await request('forgot-password', { email });
    },
    [request]
  );

  // ── 5. VERIFY RESET OTP ───────────────────────────────────────────────────
  // Backend returns a resetToken; server stores it in an HTTP-only cookie.
  // Redirects to reset-password page with the email as a query param.
  const verifyResetOtp = useCallback(
    async (email: string, otp: string) => {
      const data = await request('verify-reset-otp', { email, otp });
      router.push(
        `/reset-password?email=${encodeURIComponent(email)}`
      );
      return data;
    },
    [request, router]
  );

  // ── 6. RESET PASSWORD ─────────────────────────────────────────────────────
  // Reads reset_token from cookie (server-side), clears it after use.
  // Redirects to /login on success.
  const resetPassword = useCallback(
    async (data: ResetPasswordData) => {
      await request('reset-password', data);
      router.push('/login');
    },
    [request, router]
  );

  // ── 7. REFRESH TOKEN ──────────────────────────────────────────────────────
  // Silently refreshes the access token using the refresh_token cookie.
  // Call this when a backend request returns 401.
  const refreshToken = useCallback(async () => {
    return await request('refresh-token');
  }, [request]);

  // ── 8. LOGOUT ─────────────────────────────────────────────────────────────
  // Invalidates current session on the backend + clears all auth cookies.
  const logout = useCallback(async () => {
    await request('logout');
    router.push('/login');
    router.refresh();
  }, [request, router]);

  // ── 9. LOGOUT ALL SESSIONS ────────────────────────────────────────────────
  // Invalidates ALL sessions on the backend + clears all auth cookies.
  const logoutAll = useCallback(async () => {
    await request('logout-all');
    router.push('/login');
    router.refresh();
  }, [request, router]);

  // ── 10. CHANGE PASSWORD ───────────────────────────────────────────────────
  // Requires the user to be logged in (uses session_id cookie).
  const changePassword = useCallback(
    async (data: ChangePasswordData) => {
      return await request('change-password', data);
    },
    [request]
  );

  // ── 11. SET PASSWORD (Google accounts) ───────────────────────────────────
  // For users who signed up via Google and want to set a password.
  const setPassword = useCallback(
    async (data: SetPasswordData) => {
      return await request('set-password', data);
    },
    [request]
  );

  // ── 12. CLEAR ERROR ───────────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  return {
    // Actions
    login,
    signup,
    verifyEmail,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    refreshToken,
    logout,
    logoutAll,
    changePassword,
    setPassword,
    clearError,

    // State
    isLoading,
    error,
  };
};

export default useAuth;