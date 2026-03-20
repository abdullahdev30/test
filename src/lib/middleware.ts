// =============================================================================
// middleware.ts  —  Place this at the ROOT of your project (next to package.json)
// =============================================================================
// Protects /dashboard (and any route you add to PROTECTED_PATHS).
// If the user has a valid session_id cookie  → allow.
// If not but has a refresh_token             → redirect to /api/auth/refresh-token then retry.
// Otherwise                                  → redirect to /login.
// Also redirects logged-in users away from /login and /signup.
// =============================================================================
 
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
 
const PROTECTED_PATHS = ['/dashboard'];
const AUTH_PATHS      = ['/login', '/signup'];
 
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken  = request.cookies.get('session_id')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
 
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage  = AUTH_PATHS.some((p) => pathname.startsWith(p));
 
  // ── Already logged in → skip login/signup pages ───────────────────────────
  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
 
  // ── Protected route ───────────────────────────────────────────────────────
  if (isProtected) {
    if (accessToken) {
      return NextResponse.next(); // valid session → allow
    }
 
    if (refreshToken) {
      // Access token expired but refresh token exists →
      // redirect through the refresh endpoint then back to the original page
      const refreshUrl = new URL('/api/auth/refresh-token', request.url);
      refreshUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(refreshUrl);
    }
 
    // No tokens at all → send to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
 
  return NextResponse.next();
}
 
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public files  (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};