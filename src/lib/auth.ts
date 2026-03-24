'use server';

import { cookies } from 'next/headers';
import { http } from './http';
import {
  LoginSchema,
  SignupSchema,
  VerifyEmailSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  SetPasswordSchema,
} from './schemas';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

const ACCESS_MAX_AGE = 60 * 15;          // 15 minutes
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Read the access token from httpOnly cookies (server-side only) */
async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value;
}

/** Read the refresh token from httpOnly cookies (server-side only) */
async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('refresh_token')?.value;
}

/** Set auth cookies — called after login or email verification */
async function setAuthCookies(accessToken: string, refreshToken?: string) {
  const cookieStore = await cookies();
  cookieStore.set('access_token', accessToken, {
    ...COOKIE_OPTS,
    maxAge: ACCESS_MAX_AGE,
  });
  if (refreshToken) {
    cookieStore.set('refresh_token', refreshToken, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_MAX_AGE,
    });
  }
}

/** Clear auth cookies — called on logout */
async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.set('access_token', '', { ...COOKIE_OPTS, maxAge: 0 });
  cookieStore.set('refresh_token', '', { ...COOKIE_OPTS, maxAge: 0 });
}

// ─────────────────────────────────────────────
// AUTH SERVER ACTIONS
// ─────────────────────────────────────────────

/**
 * refreshAccessToken() — reads refresh_token cookie, calls backend,
 * and sets new httpOnly access_token + refresh_token cookies.
 * Returns { success: true } or { success: false, error }.
 * Clears all cookies if the refresh token is invalid/expired.
 */
export async function refreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return { success: false, error: 'No refresh token available' };
  }

  try {
    const data = await http.post('/auth/refresh', { refreshToken });

    const newAccessToken = data.accessToken || data.access_token;
    const newRefreshToken = data.refreshToken || data.refresh_token;

    if (!newAccessToken) {
      await clearAuthCookies();
      return { success: false, error: 'Refresh returned no token' };
    }

    await setAuthCookies(newAccessToken, newRefreshToken ?? refreshToken);
    return { success: true };
  } catch {
    await clearAuthCookies();
    return { success: false, error: 'Session expired. Please log in again.' };
  }
}

/** login(email, password) — authenticates and sets httpOnly cookies */
export async function login(email: string, password: string) {
  const parsed = LoginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const data = await http.post('/auth/login', {
      email: parsed.data.email,
      password: parsed.data.password,
      deviceId: 'web-nextjs-bff',
    });

    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;

    if (!accessToken) {
      return { success: false, error: 'No token received from server' };
    }

    await setAuthCookies(accessToken, refreshToken);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return { success: false, error: message };
  }
}

/** signup(data) — registers a new user (does NOT set cookies; requires email verification) */
export async function signup(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = SignupSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await http.post('/auth/register', {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      password: parsed.data.password,
      timezone: 'UTC',
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signup failed';
    return { success: false, error: message };
  }
}

/** verifyEmail(email, otp) — verifies OTP and sets httpOnly cookies on success */
export async function verifyEmail(email: string, otp: string) {
  const parsed = VerifyEmailSchema.safeParse({ email, otp });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const data = await http.post('/auth/verify-email', {
      email: parsed.data.email,
      otp: parsed.data.otp,
    });

    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;

    if (accessToken) {
      await setAuthCookies(accessToken, refreshToken);
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return { success: false, error: message };
  }
}

/** resendVerification(email) — resends the email OTP */
export async function resendVerification(email: string) {
  try {
    await http.post('/auth/resend-verification', { email });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resend code';
    return { success: false, error: message };
  }
}

/** logout() — invalidates session and clears cookies */
export async function logout() {
  const token = await getAccessToken();
  try {
    if (token) {
      await http.post('/auth/logout', {}, token);
    }
  } catch {
    // Best-effort — always clear cookies
  } finally {
    await clearAuthCookies();
  }
  return { success: true };
}

/** getSession() — returns the current user session; auto-refreshes if access token is expired */
export async function getSession(): Promise<{ user: null } | { user: Record<string, unknown> }> {
  const token = await getAccessToken();

  // No access token — try to get one via refresh before giving up
  if (!token) {
    const refreshed = await refreshAccessToken();
    if (!refreshed.success) return { user: null };
    const newToken = await getAccessToken();
    if (!newToken) return { user: null };
    try {
      const data = await http.get('/auth/me', newToken);
      return { user: data };
    } catch {
      return { user: null };
    }
  }

  try {
    const data = await http.get('/auth/me', token);
    return { user: data };
  } catch {
    // Access token likely expired — attempt silent refresh + retry
    const refreshed = await refreshAccessToken();
    if (!refreshed.success) return { user: null };

    const newToken = await getAccessToken();
    if (!newToken) return { user: null };

    try {
      const data = await http.get('/auth/me', newToken);
      return { user: data };
    } catch {
      return { user: null };
    }
  }
}


/** forgotPassword(email) — sends a password reset OTP */
export async function forgotPassword(email: string) {
  const parsed = ForgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await http.post('/auth/forgot-password', { email: parsed.data.email });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send reset email';
    return { success: false, error: message };
  }
}

/** verifyResetOtp(email, otp) — verifies reset OTP and returns resetToken */
export async function verifyResetOtp(email: string, otp: string) {
  try {
    const data = await http.post('/auth/verify-reset-otp', { email, otp });
    const resetToken = data.resetToken || data.token;
    return { success: true, resetToken };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OTP verification failed';
    return { success: false, error: message, resetToken: undefined };
  }
}

/** resetPassword(data) — resets the password using a reset token */
export async function resetPassword(data: {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const parsed = ResetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await http.post('/auth/reset-password', {
      email: parsed.data.email,
      resetToken: parsed.data.resetToken,
      newPassword: parsed.data.newPassword,
      confirmPassword: parsed.data.confirmPassword,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Password reset failed';
    return { success: false, error: message };
  }
}

/** changePassword(data) — changes the current user's password */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const parsed = ChangePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    await http.post(
      '/auth/change-password',
      {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      },
      token,
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to change password';
    return { success: false, error: message };
  }
}

/** setPassword(data) — sets a password for OAuth-only accounts */
export async function setPassword(data: { password: string; confirmPassword: string }) {
  const parsed = SetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    await http.post(
      '/auth/set-password',
      {
        password: parsed.data.password,
        confirmPassword: parsed.data.confirmPassword,
      },
      token,
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to set password';
    return { success: false, error: message };
  }
}
