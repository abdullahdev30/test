/**
 * socialAuth.ts — server-side only helper
 *
 * getValidToken():
 *   1. Read access_token cookie.
 *   2. If missing → call POST /api/auth/refresh (server-to-server).
 *   3. Return fresh token, or null if both token AND refresh fail.
 *
 * Import this in every social API route instead of reading the cookie directly.
 */

import { cookies } from 'next/headers';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // Must be lax for OAuth callback compatibility
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // 1 day (access token)
};

const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (refresh token)

/** Low-level: just read the raw access_token cookie. */
export async function getRawToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get('access_token')?.value;
}

/**
 * getValidToken()
 *
 * Returns a valid access token string, or null if the session is fully dead.
 * Internally attempts a silent token refresh when the cookie is missing.
 */
export async function getValidToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get('access_token')?.value;

  // Token present — use it as-is (backend will 401 if truly expired,
  // but 15-min maxAge means it's almost always fresh).
  if (token) return token;

  // No access token — try a silent refresh using the refresh_token cookie.
  const refreshToken = store.get('refresh_token')?.value;
  if (!refreshToken) return null;

  const BASE_URL = process.env.API_URL || '';

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!res.ok) {
      // Refresh token is invalid — clear both cookies so middleware picks it up.
      store.set('access_token', '', { ...COOKIE_OPTS, maxAge: 0 });
      store.set('refresh_token', '', { ...COOKIE_OPTS, maxAge: 0 });
      return null;
    }

    const data = await res.json();
    const newAccessToken: string | undefined = data.accessToken ?? data.access_token;
    const newRefreshToken: string | undefined = data.refreshToken ?? data.refresh_token;

    if (!newAccessToken) return null;

    store.set('access_token', newAccessToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 });
    if (newRefreshToken) {
      store.set('refresh_token', newRefreshToken, { ...COOKIE_OPTS, maxAge: REFRESH_MAX_AGE });
    }

    return newAccessToken;
  } catch {
    return null;
  }
}
