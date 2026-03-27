import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
};

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.API_URL ?? '';

  try {
    if (accessToken && baseUrl) {
      const commonHeaders = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      };

      const deleteAllSessions = await fetch(`${baseUrl}/auth/sessions`, {
        method: 'DELETE',
        headers: commonHeaders,
      });

      if (!deleteAllSessions.ok) {
        await fetch(`${baseUrl}/auth/logout-all`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({}),
        });
      }
    }
  } catch {
    // Best-effort backend revoke. We still clear local cookies.
  }

  cookieStore.set('access_token', '', COOKIE_OPTS);
  cookieStore.set('refresh_token', '', COOKIE_OPTS);
  cookieStore.set('platform_connections', '', COOKIE_OPTS);
  cookieStore.set('session_ids', '', COOKIE_OPTS);

  return NextResponse.json({ success: true });
}
