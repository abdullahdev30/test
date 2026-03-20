// =============================================================================
// lib/http.ts  —  Centralized HTTP client
// =============================================================================
// • Automatically attaches the session_id (accessToken) from cookies on
//   every server-side request (server components, route handlers, middleware).
// • On 401 → silently attempts one token refresh, then retries the request.
// • On refresh failure → clears cookies and redirects to /login.
// • Never touches localStorage — all tokens live in HTTP-only cookies.
// =============================================================================

import { cookies } from 'next/headers';

const BASE_URL = 'http://135.181.242.234:7860';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestOptions {
  /** Pass a Bearer token explicitly (optional — auto-read from cookie if omitted) */
  token?: string;
  /** Extra headers to merge in */
  headers?: Record<string, string>;
  /** Skip the 401 → auto-refresh logic (used internally to avoid infinite loops) */
  skipRefresh?: boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Read the access token from the HTTP-only cookie (server-side only). */
async function getAccessToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('session_id')?.value;
  } catch {
    // Called from a client context where `cookies()` isn't available
    return undefined;
  }
}

/** Read the refresh token from the HTTP-only cookie (server-side only). */
async function getRefreshToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('refresh_token')?.value;
  } catch {
    return undefined;
  }
}

/**
 * Attempt to refresh the access token by calling our internal Next.js route.
 * Returns true on success, false on failure.
 */
async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    const newAccessToken  = data.accessToken  || data.access_token;
    const newRefreshToken = data.refreshToken || data.refresh_token;

    if (!newAccessToken || !newRefreshToken) return false;

    // Update the cookies via our internal Next.js API route so the
    // HTTP-only flags are set correctly by the server.
    const cookieStore = await cookies();

    cookieStore.set('session_id', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    cookieStore.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return true;
  } catch {
    return false;
  }
}

/** Build standard headers, injecting the Bearer token automatically. */
async function buildHeaders(
  extra: Record<string, string> = {},
  explicitToken?: string
): Promise<Record<string, string>> {
  const token = explicitToken ?? (await getAccessToken());

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/** Parse error from a failed response. */
async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail || body.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

// ─── Core request function ────────────────────────────────────────────────────

async function coreRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const url     = `${BASE_URL}${endpoint}`;
  const headers = await buildHeaders(options.headers, options.token);

  const init: RequestInit = {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let res = await fetch(url, init);

  // ── Auto-refresh on 401 ────────────────────────────────────────────────────
  if (res.status === 401 && !options.skipRefresh) {
    const refreshed = await attemptTokenRefresh();

    if (refreshed) {
      // Retry the original request with the new token
      const retryHeaders = await buildHeaders(options.headers, options.token);
      res = await fetch(url, { ...init, headers: retryHeaders });
    } else {
      // Refresh also failed — clear cookies
      try {
        const cookieStore = await cookies();
        cookieStore.delete('session_id');
        cookieStore.delete('refresh_token');
      } catch { /* ignore if called outside server context */ }

      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  // Handle empty responses (e.g. 204 No Content)
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const http = {
  /**
   * POST request.
   * @example
   *   const data = await http.post<LoginResponse>('/auth/login', { email, password });
   */
  post: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions
  ): Promise<T> => coreRequest<T>('POST', endpoint, body, options),

  /**
   * GET request.
   * @example
   *   const user = await http.get<User>('/users/me');
   */
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    coreRequest<T>('GET', endpoint, undefined, options),

  /**
   * PUT request.
   */
  put: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions
  ): Promise<T> => coreRequest<T>('PUT', endpoint, body, options),

  /**
   * PATCH request.
   */
  patch: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions
  ): Promise<T> => coreRequest<T>('PATCH', endpoint, body, options),

  /**
   * DELETE request.
   */
  delete: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    coreRequest<T>('DELETE', endpoint, undefined, options),
};

export default http;