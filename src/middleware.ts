import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes — any path under these prefixes requires authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/workspace',
  '/settings',
  '/connections',
  '/posts',
  '/scheduler',
];

// Routes that authenticated users should not access
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_MAX_AGE = 60 * 60 * 24; // 24h
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7d

// Security headers applied to ALL responses
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    // Back-end origins — never use NEXT_PUBLIC_ here; these are server-side only
    "connect-src 'self' http://135.181.242.234:7860",
    "frame-ancestors 'none'",
  ].join('; '),
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function sanitizeInternalPath(value: string | null, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  return value;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const searchParams = request.nextUrl.searchParams;

  // OAuth handoff support: some providers redirect back with tokens in query params.
  // Capture them once, write httpOnly cookies, and continue to the intended route.
  const oauthAccessToken =
    searchParams.get('access_token') ??
    searchParams.get('accessToken') ??
    searchParams.get('token');
  const oauthRefreshToken =
    searchParams.get('refresh_token') ?? searchParams.get('refreshToken');

  if (oauthAccessToken) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('access_token');
    cleanUrl.searchParams.delete('accessToken');
    cleanUrl.searchParams.delete('token');
    cleanUrl.searchParams.delete('refresh_token');
    cleanUrl.searchParams.delete('refreshToken');

    const callbackUrl = sanitizeInternalPath(cleanUrl.searchParams.get('callbackUrl'), '/dashboard');
    const redirectTarget =
      AUTH_ROUTES.some((r) => pathname === r) ? new URL(callbackUrl, request.url) : cleanUrl;

    const response = NextResponse.redirect(redirectTarget);
    response.cookies.set('access_token', oauthAccessToken, {
      ...COOKIE_OPTS,
      maxAge: ACCESS_MAX_AGE,
    });
    if (oauthRefreshToken) {
      response.cookies.set('refresh_token', oauthRefreshToken, {
        ...COOKIE_OPTS,
        maxAge: REFRESH_MAX_AGE,
      });
    }
    return applySecurityHeaders(response);
  }

  // Read auth cookies. For protected routes/APIs, allow either access or refresh cookie.
  // This prevents unnecessary redirects when access token is missing but refresh token exists.
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const hasSessionCookie = !!(accessToken || refreshToken);

  // ── Protect BFF API routes — return 401 JSON (not a redirect) ───────────
  const PROTECTED_API_PREFIXES = ['/api/workspace', '/api/social'];
  if (!hasSessionCookie && PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return applySecurityHeaders(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  // Redirect authenticated users away from auth pages
  if (hasSessionCookie && AUTH_ROUTES.some((r) => pathname === r)) {
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    return applySecurityHeaders(response);
  }

  // Redirect unauthenticated users away from protected pages
  if (!hasSessionCookie && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const callbackUrl = encodeURIComponent(pathname);
    const response = NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, request.url),
    );
    return applySecurityHeaders(response);
  }

  // Apply security headers to all other responses
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
