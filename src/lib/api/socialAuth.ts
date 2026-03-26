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
import { refreshWithBackend } from './refresh';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // Must be lax for OAuth callback compatibility
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // 1 day (access token)
};

const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (refresh token)
const ACCESS_MAX_AGE = 60 * 15; // 15 minutes

/** Low-level: just read the raw access_token cookie. */
export async function getRawToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get('access_token')?.value;
}

/**
 * refreshAccessToken()
 *
 * Forces refresh using refresh_token cookie and rewrites access/refresh cookies.
 * Returns fresh access token or null.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const store = await cookies();
  const refreshToken = store.get('refresh_token')?.value;
  if (!refreshToken) return null;

  try {
    const refreshed = await refreshWithBackend(refreshToken);
    if (!refreshed?.accessToken) {
      // Refresh token is invalid — clear both cookies.
      store.set('access_token', '', { ...COOKIE_OPTS, maxAge: 0 });
      store.set('refresh_token', '', { ...COOKIE_OPTS, maxAge: 0 });
      return null;
    }

    store.set('access_token', refreshed.accessToken, { ...COOKIE_OPTS, maxAge: ACCESS_MAX_AGE });
    if (refreshed.refreshToken) {
      store.set('refresh_token', refreshed.refreshToken, { ...COOKIE_OPTS, maxAge: REFRESH_MAX_AGE });
    }

    return refreshed.accessToken;
  } catch {
    return null;
  }
}

/**
 * getValidToken()
 *
 * Returns a valid access token string, or null if the session is fully dead.
 * Internally attempts a silent token refresh when the cookie is missing.
 */
export async function getValidToken(options?: { forceRefresh?: boolean }): Promise<string | null> {
  const store = await cookies();
  const token = store.get('access_token')?.value;

  // Token present — use it as-is (backend will 401 if truly expired,
  // but 15-min maxAge means it's almost always fresh).
  if (token && !options?.forceRefresh) return token;

  // No access token — try a silent refresh using the refresh_token cookie.
  return refreshAccessToken();
}
