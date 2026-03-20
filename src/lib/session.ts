// =============================================================================
// lib/session.ts  —  Cookie-based session helpers (server-side only)
// =============================================================================
 
import { cookies } from 'next/headers';
 
const ACCESS_TOKEN_COOKIE  = 'session_id';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const RESET_TOKEN_COOKIE   = 'reset_token';
 
// ─── Access token ─────────────────────────────────────────────────────────────
 
export async function createSession(accessToken: string) {
  (await cookies()).set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}
 
export async function getSession(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}
 
export async function deleteSession() {
  (await cookies()).delete(ACCESS_TOKEN_COOKIE);
}
 
// ─── Refresh token ───────────────────────────────────────────────────────────
 
export async function createRefreshSession(refreshToken: string) {
  (await cookies()).set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}
 
export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}
 
export async function deleteRefreshToken() {
  (await cookies()).delete(REFRESH_TOKEN_COOKIE);
}
 
// ─── Reset token (temporary, one-time use) ────────────────────────────────────
 
export async function createResetToken(token: string) {
  (await cookies()).set(RESET_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });
}
 
export async function getResetToken(): Promise<string | undefined> {
  return (await cookies()).get(RESET_TOKEN_COOKIE)?.value;
}
 
export async function deleteResetToken() {
  (await cookies()).delete(RESET_TOKEN_COOKIE);
}
 
// ─── Convenience ─────────────────────────────────────────────────────────────
 
export async function clearAllAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
 
export async function isAuthenticated(): Promise<boolean> {
  const token = await getSession();
  return Boolean(token);
}