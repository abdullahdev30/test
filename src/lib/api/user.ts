'use server';

import { cookies } from 'next/headers';
import { http } from '../http';

/** Read the access token from httpOnly cookies (server-side only) */
async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value;
}

// ─────────────────────────────────────────────
// USER DATA SERVER ACTIONS
// ─────────────────────────────────────────────

/** getUser() — fetches the current user profile from /auth/me */
export async function getUser() {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated', user: null };

  try {
    const data = await http.get('/auth/me', token);
    return { success: true, user: data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user';
    return { success: false, error: message, user: null };
  }
}

/** updateProfile(data) — updates name and timezone */
export async function updateProfile(data: {
  firstName: string;
  lastName: string;
  timezone?: string;
}) {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    await http.post(
      '/auth/profile',
      {
        firstName: data.firstName,
        lastName: data.lastName,
        timezone: data.timezone ?? 'UTC',
      },
      token,
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return { success: false, error: message };
  }
}

/** uploadAvatar(formData) — uploads a profile avatar */
export async function uploadAvatar(formData: FormData) {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated', avatarUrl: null };

  try {
    const data = await http.postForm('/auth/avatar', formData, token);
    return { success: true, avatarUrl: data.avatarUrl || null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Avatar upload failed';
    return { success: false, error: message, avatarUrl: null };
  }
}

/** getSessions() — lists all active sessions */
export async function getSessions() {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated', sessions: [] };

  try {
    const data = await http.get('/auth/sessions', token);
    return { success: true, sessions: Array.isArray(data) ? data : [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sessions';
    return { success: false, error: message, sessions: [] };
  }
}

/** revokeSession(id) — revokes a specific session by ID */
export async function revokeSession(id: string) {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    await http.delete(`/auth/sessions/${id}`, token);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to revoke session';
    return { success: false, error: message };
  }
}

/** logoutAll() — signs out all devices and clears local cookies */
export async function logoutAll() {
  const token = await getAccessToken();

  try {
    if (token) {
      await http.post('/auth/logout-all', {}, token);
    }
  } catch {
    // Best-effort
  }

  // Clear cookies regardless
  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  };
  cookieStore.set('access_token', '', cookieOpts);
  cookieStore.set('refresh_token', '', cookieOpts);

  return { success: true };
}
