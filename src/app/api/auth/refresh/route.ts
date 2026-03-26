import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshWithBackend } from '@/lib/api/refresh';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // 'lax' required for OAuth cross-site redirect compatibility
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_MAX_AGE = 60 * 60 * 24;           // 1 day
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Simple in-memory rate limiter (per IP, max 5 requests/minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

/**
 * POST /api/auth/refresh
 * Reads the httpOnly refresh_token cookie, calls the backend refresh endpoint,
 * and sets brand-new access_token + refresh_token httpOnly cookies.
 * Returns 200 on success, 401 on failure (with cookies cleared).
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many refresh requests' }, { status: 429 });
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const refreshed = await refreshWithBackend(refreshToken);
    if (!refreshed?.accessToken) {
      // Refresh token invalid/expired — clear cookies and force re-login
      cookieStore.set('access_token', '', { ...COOKIE_OPTS, maxAge: 0 });
      cookieStore.set('refresh_token', '', { ...COOKIE_OPTS, maxAge: 0 });
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }

    // Set fresh httpOnly cookies
    cookieStore.set('access_token', refreshed.accessToken, {
      ...COOKIE_OPTS,
      maxAge: ACCESS_MAX_AGE,
    });
    if (refreshed.refreshToken) {
      cookieStore.set('refresh_token', refreshed.refreshToken, {
        ...COOKIE_OPTS,
        maxAge: REFRESH_MAX_AGE,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Refresh request failed' }, { status: 500 });
  }
}
