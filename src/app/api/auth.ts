// =============================================================================
// lib/auth.ts  —  All auth API calls (called from Next.js /api/auth/* routes)
// =============================================================================
// Every token is stored in HTTP-only cookies — nothing in localStorage.
// Cookie map:
//   session_id    → accessToken  (7 days)
//   refresh_token → refreshToken (30 days)
//   reset_token   → resetToken   (10 min, temp)
// =============================================================================

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BASE_URL = 'http://135.181.242.234:7860';

// ─── Low-level fetch helpers ──────────────────────────────────────────────────

async function backendPost<T>(
  endpoint: string,
  body: Record<string, unknown>,
  accessToken?: string
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || 'Backend request failed');
  }

  return res.json();
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  // Access token — 7 days
  response.cookies.set('session_id', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  // Refresh token — 30 days
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set('session_id', '', { path: '/', maxAge: 0 });
  response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });
}

// ─── 1. LOGIN ─────────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { email, password, deviceId }
// Sets: session_id + refresh_token cookies

export async function loginHandler(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    const data = await backendPost<{
      accessToken?: string;
      access_token?: string;
      refreshToken?: string;
      refresh_token?: string;
    }>('/auth/login', {
      email: body.email,
      password: body.password,
      deviceId: body.deviceId || 'web-chrome-device-001',
    });

    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'No tokens received from server' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// ─── 2. SIGNUP ────────────────────────────────────────────────────────────────
// POST /auth/signup
// Body: { firstName, lastName, email, password, confirmPassword, timezone }

export async function signupHandler(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    const data = await backendPost<{ message?: string }>('/auth/signup', {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
      confirmPassword: body.confirmPassword,
      timezone:
        body.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return NextResponse.json({ success: true, message: data.message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─── 3. VERIFY EMAIL ──────────────────────────────────────────────────────────
// POST /auth/verify-email
// Body: { email, otp }
// Sets session if backend returns an accessToken after verification

export async function verifyEmailHandler(
  request: Request
): Promise<NextResponse> {
  try {
    const body = await request.json();

    const data = await backendPost<{
      accessToken?: string;
      access_token?: string;
      refreshToken?: string;
      refresh_token?: string;
    }>('/auth/verify-email', {
      email: body.email,
      otp: body.otp,
    });

    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;

    const response = NextResponse.json({ success: true });

    if (accessToken && refreshToken) {
      setAuthCookies(response, accessToken, refreshToken);
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─── 4. FORGOT PASSWORD ───────────────────────────────────────────────────────
// POST /auth/forgot-password
// Body: { email }
// Sends OTP to email, no cookies set

export async function forgotPasswordHandler(
  request: Request
): Promise<NextResponse> {
  try {
    const body = await request.json();

    const data = await backendPost<{ message?: string }>(
      '/auth/forgot-password',
      { email: body.email }
    );

    return NextResponse.json({ success: true, message: data.message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─── 5. VERIFY RESET OTP ─────────────────────────────────────────────────────
// POST /auth/verify-reset-otp
// Body: { email, otp }
// Sets: reset_token cookie (10 min, one-time use)

export async function verifyResetOtpHandler(
  request: Request
): Promise<NextResponse> {
  try {
    const body = await request.json();

    const data = await backendPost<{
      message?: string;
      resetToken?: string;
      reset_token?: string;
    }>('/auth/verify-reset-otp', {
      email: body.email,
      otp: body.otp,
    });

    const resetToken = data.resetToken || data.reset_token;

    if (!resetToken) {
      return NextResponse.json(
        { error: 'No reset token received from server' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set('reset_token', resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─── 6. RESET PASSWORD ───────────────────────────────────────────────────────
// POST /auth/reset-password
// Body: { email, newPassword, confirmPassword }
// Reads reset_token from cookie, clears it after use

export async function resetPasswordHandler(
  request: Request
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const resetToken = cookieStore.get('reset_token')?.value;

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Session expired. Please verify OTP again.' },
        { status: 401 }
      );
    }

    await backendPost('/auth/reset-password', {
      email: body.email,
      resetToken,
      newPassword: body.newPassword,
      confirmPassword: body.confirmPassword,
    });

    const response = NextResponse.json({ success: true });
    // Clear the one-time reset token
    response.cookies.set('reset_token', '', { path: '/', maxAge: 0 });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─── 7. REFRESH TOKEN ────────────────────────────────────────────────────────
// POST /auth/refresh-token
// Reads refresh_token from cookie, issues new access + refresh tokens

export async function refreshTokenHandler(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      );
    }

    const data = await backendPost<{
      accessToken?: string;
      access_token?: string;
      refreshToken?: string;
      refresh_token?: string;
    }>('/auth/refresh-token', { refreshToken });

    const newAccessToken = data.accessToken || data.access_token;
    const newRefreshToken = data.refreshToken || data.refresh_token;

    if (!newAccessToken || !newRefreshToken) {
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });
    setAuthCookies(response, newAccessToken, newRefreshToken);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// ─── 8. LOGOUT (current session) ─────────────────────────────────────────────
// POST /auth/logout  (🔒 requires Authorization header)
// Clears all auth cookies

export async function logoutHandler(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('session_id')?.value;

    if (accessToken) {
      // Best-effort — tell the backend to invalidate the session
      await backendPost('/auth/logout', {}, accessToken).catch(() => {});
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  } catch (error: any) {
    // Even if the backend call fails, clear local cookies
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  }
}

// ─── 9. LOGOUT ALL SESSIONS ──────────────────────────────────────────────────
// POST /auth/logout-all  (🔒 requires Authorization header)
// Invalidates all sessions on the backend + clears cookies

export async function logoutAllHandler(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('session_id')?.value;

    if (accessToken) {
      await backendPost('/auth/logout-all', {}, accessToken).catch(() => {});
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  } catch (error: any) {
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  }
}

// ─── 10. CHANGE PASSWORD ─────────────────────────────────────────────────────
// POST /auth/change-password  (🔒 requires Authorization header)
// Body: { currentPassword, newPassword, confirmPassword }

export async function changePasswordHandler(
  request: Request
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('session_id')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await backendPost(
      '/auth/change-password',
      {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
      },
      accessToken
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─── 11. SET PASSWORD (Google OAuth accounts) ────────────────────────────────
// POST /auth/set-password  (🔒 requires Authorization header)
// Body: { password, confirmPassword }

export async function setPasswordHandler(
  request: Request
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('session_id')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await backendPost(
      '/auth/set-password',
      {
        password: body.password,
        confirmPassword: body.confirmPassword,
      },
      accessToken
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─── 12. GET SESSION (middleware / server components) ────────────────────────
// Returns the raw access token from cookie — use in server-side auth checks

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('session_id')?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken();
  return Boolean(token);
}