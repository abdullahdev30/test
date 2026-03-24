import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * GET /api/auth/session
 * Returns the current user session for client-side hooks (useAuth).
 * Reads from httpOnly access_token cookie — safe for RSC and client components.
 */
export async function GET() {
  const session = await getSession();
  return NextResponse.json(session);
}
