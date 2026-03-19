import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';
const RESET_TOKEN_NAME = 'reset_token';

export async function createSession(token: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days
  
  // Sets an HTTP-only, Secure cookie
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

export async function getSession() {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value;
}