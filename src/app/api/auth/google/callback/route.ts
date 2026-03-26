import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_MAX_AGE = 60 * 60 * 24; // 24 hours
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const OAUTH_STATE_COOKIE = 'oauth_google_state_cookie';

function resolveApiBaseUrl(): string {
  const base = process.env.API_URL || '';
  return base.replace(/\/+$/, '');
}

function sanitizeNextPath(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/')) return '/dashboard';
  if (raw.startsWith('//')) return '/dashboard';
  return raw;
}

function getToken(payload: Record<string, unknown>, kind: 'access' | 'refresh'): string | undefined {
  const topLevelCandidates =
    kind === 'access'
      ? ['accessToken', 'access_token', 'token']
      : ['refreshToken', 'refresh_token'];

  for (const key of topLevelCandidates) {
    const value = payload[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }

  const nested = (payload.data ?? payload.result) as Record<string, unknown> | undefined;
  if (nested) {
    for (const key of topLevelCandidates) {
      const value = nested[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  const baseUrl = resolveApiBaseUrl();
  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get('next'));

  if (!baseUrl) {
    return NextResponse.redirect(new URL('/login?error=missing_api_url', request.url));
  }

  const oauthError = request.nextUrl.searchParams.get('error');
  if (oauthError) {
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, '', { ...COOKIE_OPTS, maxAge: 0 });
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthError)}`, request.url),
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  if (!code) {
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, '', { ...COOKIE_OPTS, maxAge: 0 });
    return NextResponse.redirect(new URL('/login?error=missing_oauth_code', request.url));
  }

  try {
    const callbackUrl = new URL(`${baseUrl}/auth/google/callback`);
    callbackUrl.searchParams.set('code', code);
    if (state) callbackUrl.searchParams.set('state', state);

    const cookieStore = await cookies();
    const oauthStateCookieRaw = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    const oauthStateCookie = oauthStateCookieRaw ? decodeURIComponent(oauthStateCookieRaw) : '';

    const res = await fetch(callbackUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(oauthStateCookie ? { Cookie: oauthStateCookie } : {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({} as Record<string, unknown>));
      const message = typeof body.message === 'string' ? body.message : `oauth_callback_failed_${res.status}`;
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
      );
    }

    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const accessToken = getToken(data, 'access');
    const refreshToken = getToken(data, 'refresh');

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login?error=missing_access_token', request.url));
    }

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
    cookieStore.set(OAUTH_STATE_COOKIE, '', { ...COOKIE_OPTS, maxAge: 0 });

    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch {
    return NextResponse.redirect(new URL('/login?error=google_callback_failed', request.url));
  }
}
