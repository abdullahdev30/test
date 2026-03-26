import { NextRequest, NextResponse } from 'next/server';

const OAUTH_STATE_COOKIE = 'oauth_google_state_cookie';
const OAUTH_STATE_MAX_AGE = 60 * 10; // 10 minutes

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

function asAbsoluteUrl(candidate: string, request: NextRequest): string {
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
  return new URL(candidate, request.url).toString();
}

function extractCookiePairsFromSetCookie(res: Response): string[] {
  // Node/Undici in Next may expose either getSetCookie() or only get('set-cookie').
  const headersWithGetSetCookie = res.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = headersWithGetSetCookie.getSetCookie?.() ?? [];

  const rawValues =
    setCookies.length > 0
      ? setCookies
      : (() => {
          const single = res.headers.get('set-cookie');
          return single ? [single] : [];
        })();

  const pairs: string[] = [];
  for (const raw of rawValues) {
    // Best effort parser: split cookie blocks, then keep only "name=value".
    const cookieBlocks = raw
      .split(/,(?=\s*[!#$%&'*+\-.^_`|~0-9A-Za-z]+=)/g)
      .map((v) => v.trim())
      .filter(Boolean);

    for (const block of cookieBlocks) {
      const pair = block.split(';')[0]?.trim();
      if (pair && pair.includes('=')) {
        pairs.push(pair);
      }
    }
  }
  return pairs;
}

function findAuthUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;

  const direct =
    (data.authUrl as string | undefined) ??
    (data.url as string | undefined) ??
    (data.redirectUrl as string | undefined) ??
    (data.authorizationUrl as string | undefined);
  if (typeof direct === 'string' && direct.length > 0) return direct;

  const nested = (data.data ?? data.result) as Record<string, unknown> | undefined;
  if (nested) {
    const nestedUrl =
      (nested.authUrl as string | undefined) ??
      (nested.url as string | undefined) ??
      (nested.redirectUrl as string | undefined) ??
      (nested.authorizationUrl as string | undefined);
    if (typeof nestedUrl === 'string' && nestedUrl.length > 0) return nestedUrl;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl) {
    return NextResponse.redirect(new URL('/login?error=missing_api_url', request.url));
  }

  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get('next'));
  const callbackUrl = new URL('/api/auth/google/callback', request.url);
  callbackUrl.searchParams.set('next', nextPath);

  const encodedCallback = encodeURIComponent(callbackUrl.toString());
  const endpointCandidates = [
    `${baseUrl}/auth/google?redirectUri=${encodedCallback}`,
    `${baseUrl}/auth/google?redirect_uri=${encodedCallback}`,
    `${baseUrl}/auth/google?callbackUrl=${encodedCallback}`,
    `${baseUrl}/auth/google?callback_url=${encodedCallback}`,
    `${baseUrl}/auth/google`,
  ];

  for (const endpoint of endpointCandidates) {
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        redirect: 'manual',
      });

      const location = res.headers.get('location');
      if (location) {
        const response = NextResponse.redirect(asAbsoluteUrl(location, request));
        const cookiePairs = extractCookiePairsFromSetCookie(res);
        if (cookiePairs.length > 0) {
          response.cookies.set(OAUTH_STATE_COOKIE, encodeURIComponent(cookiePairs.join('; ')), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: OAUTH_STATE_MAX_AGE,
          });
        }
        return response;
      }

      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      const authUrl = findAuthUrl(data);
      if (authUrl) {
        const response = NextResponse.redirect(authUrl);
        const cookiePairs = extractCookiePairsFromSetCookie(res);
        if (cookiePairs.length > 0) {
          response.cookies.set(OAUTH_STATE_COOKIE, encodeURIComponent(cookiePairs.join('; ')), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: OAUTH_STATE_MAX_AGE,
          });
        }
        return response;
      }

      if (res.status === 404 || res.status === 405) {
        continue;
      }
    } catch {
      // Try next candidate endpoint.
    }
  }

  // Last-resort fallback: direct redirect to backend OAuth start endpoint.
  return NextResponse.redirect(`${baseUrl}/auth/google`);
}
