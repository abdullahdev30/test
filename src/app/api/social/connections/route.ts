import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PLATFORMS = ['instagram', 'google', 'facebook', 'linkedin'] as const;
const PLATFORM_CONNECTIONS_COOKIE = 'platform_connections';

// ─── Cookie config ────────────────────────────────────────────────────────────
// path '/' — must be readable by ALL routes (not scoped to /connections)
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/** Silent token refresh — server-to-server call to the backend refresh endpoint. */
async function refreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshTok = cookieStore.get('refresh_token')?.value;
  if (!refreshTok) return null;

  const BASE_URL = process.env.API_URL || '';
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTok }),
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = await res.json();
    const newAccessToken: string | undefined = data.accessToken ?? data.access_token;
    if (!newAccessToken) return null;

    // Persist new access_token cookie
    cookieStore.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return newAccessToken;
  } catch {
    return null;
  }
}

/** Get a valid access token, auto-refreshing if missing. */
async function getValidToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (token) return token;
  return refreshToken();
}

/**
 * GET /api/social/connections
 * Returns all platform connection statuses + usernames from the cookie cache.
 */
export async function GET(request: NextRequest) {
  const token = await getValidToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();

  // Read cached connection data (written by callback + status sync)
  const raw = cookieStore.get(PLATFORM_CONNECTIONS_COOKIE)?.value;
  let cached: Record<string, { status?: string; username?: string | null; providerAccountName?: string | null }> = {};
  try { cached = raw ? JSON.parse(raw) : {}; } catch { cached = {}; }

  // Build response — UI gets instant data with no extra backend calls
  const result = PLATFORMS.reduce<
    Record<string, { connected: boolean; username: string | null; providerAccountName: string | null; status: string }>
  >((acc, p) => {
    const entry = cached[p];
    const name = entry?.providerAccountName ?? entry?.username ?? null;
    acc[p] = {
      connected: entry?.status === 'connected',
      username: name,
      providerAccountName: name,
      status: entry?.status ?? 'disconnected',
    };
    return acc;
  }, {});

  return NextResponse.json({ connections: result });
}
