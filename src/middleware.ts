import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes — any path under these prefixes requires authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/workspace',
  '/settings',
  '/connections',
  '/scheduler',
];

// Routes that authenticated users should not access
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth cookies. For protected routes/APIs, allow either access or refresh cookie.
  // This prevents unnecessary redirects when access token is missing but refresh token exists.
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const hasAccessToken = !!accessToken;
  const hasSessionCookie = !!(accessToken || refreshToken);

  // ── Protect BFF API routes — return 401 JSON (not a redirect) ───────────
  const PROTECTED_API_PREFIXES = ['/api/workspace', '/api/social'];
  if (!hasSessionCookie && PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return applySecurityHeaders(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  // Redirect authenticated users away from auth pages
  if (hasAccessToken && AUTH_ROUTES.some((r) => pathname === r)) {
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
