import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ─── Cookie config ────────────────────────────────────────────────────────────
// path '/' — must be readable by ALL routes (not /connections only)
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365, // 1 year — connection state is long-lived
};

const PLATFORM_CONNECTIONS_COOKIE = 'platform_connections';

/**
 * Attempt a silent server-to-server token refresh.
 * Returns a fresh access token string, or null on failure.
 */
async function silentRefresh(): Promise<string | null> {
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
    const newRefreshToken: string | undefined = data.refreshToken ?? data.refresh_token;
    if (!newAccessToken) return null;

    // Set the fresh access_token cookie so subsequent code can read it
    cookieStore.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    if (newRefreshToken) {
      cookieStore.set('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return newAccessToken;
  } catch {
    return null;
  }
}

/**
 * GET /api/social/[platform]/callback
 *
 * The OAuth provider redirects here after user grants permission.
 * Flow:
 *   1. Validate code param from provider.
 *   2. Get access_token from cookie; if missing → try silent refresh.
 *   3. Only redirect to /login if BOTH token AND refresh fail.
 *   4. Forward code+state to backend; exchange for platform tokens.
 *   5. Store {status:'connected', username, providerAccountName} in httpOnly cookie.
 *   6. Redirect to /connections?success=<platform> — NEVER to /dashboard.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = request.nextUrl;

  // ── 1. OAuth provider error ───────────────────────────────────────────────
  const oauthError = searchParams.get('error');
  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/connections?error=${encodeURIComponent(oauthError)}&platform=${platform}`, request.url)
    );
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/connections?error=no_code', request.url));
  }

  // ── 2. Resolve access token (with silent refresh fallback) ────────────────
  const cookieStore = await cookies();
  let token = cookieStore.get('access_token')?.value;

  if (!token) {
    // Try silent refresh BEFORE ever touching /login
    token = await silentRefresh() ?? undefined;
  }

  if (!token) {
    // Both token AND refresh failed — only now send to /login as last resort
    return NextResponse.redirect(new URL('/login?callbackUrl=/connections', request.url));
  }

  // ── 3. Forward code+state to backend ─────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_SOCIAL_BASE_URL;
  let username: string | null = null;

  try {
    const callbackUrl = new URL(`${baseUrl}/social-connections/${platform}/callback`);
    callbackUrl.searchParams.set('code', code);
    if (state) callbackUrl.searchParams.set('state', state);

    const res = await fetch(callbackUrl.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.message ?? `Backend error ${res.status}`;
      return NextResponse.redirect(
        new URL(`/connections?error=${encodeURIComponent(msg)}&platform=${platform}`, request.url)
      );
    }

    const data = await res.json();

    // Extract username from several possible response shapes
    const conn = data?.connection ?? data?.data ?? data;
    username =
      (conn?.providerAccountName as string) ??
      (conn?.providerAccountId as string) ??
      (data?.metadata?.email as string) ??
      null;

    // ── 4. If username still missing, call status endpoint for it ─────────
    if (!username) {
      const statusRes = await fetch(`${baseUrl}/social-connections/${platform}/status`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      }).catch(() => null);

      if (statusRes?.ok) {
        const statusData = await statusRes.json().catch(() => ({}));
        const sc = statusData?.connection as Record<string, unknown> | undefined;
        username =
          (sc?.providerAccountName as string) ??
          (sc?.providerAccountId as string) ??
          null;
      }
    }
  } catch {
    return NextResponse.redirect(
      new URL(`/connections?error=callback_failed&platform=${platform}`, request.url)
    );
  }

  // ── 5. Store connection in httpOnly cookie ────────────────────────────────
  const raw = cookieStore.get(PLATFORM_CONNECTIONS_COOKIE)?.value;
  let connections: Record<string, unknown> = {};
  try { connections = raw ? JSON.parse(raw) : {}; } catch { connections = {}; }

  connections[platform] = {
    status: 'connected',
    username,
    providerAccountName: username, // always store both for compatibility
  };

  // ── 6. Redirect to /connections — NOT /dashboard ──────────────────────────
  const response = NextResponse.redirect(new URL(`/connections?success=${platform}`, request.url));
  response.cookies.set(PLATFORM_CONNECTIONS_COOKIE, JSON.stringify(connections), COOKIE_OPTS);

  return response;
}
