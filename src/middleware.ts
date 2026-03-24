import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. You MUST export a function named 'middleware'
export function middleware(request: NextRequest) {
    // Check for your cookie (verify the name matches your backend: 'accessToken', 'session', etc.)
    const token = request.cookies.get('accessToken')?.value;
    const { pathname } = request.nextUrl;

    // 2. Logic for "Later Use" / Persistence
    // If token exists and user is on Login/Register -> Send to Dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 3. Logic for Protected Routes
    // If no token and user is trying to access Dashboard -> Send to Login
    if (!token && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

// 4. The Config (This tells Next.js which routes to run the middleware on)
export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register'],
};