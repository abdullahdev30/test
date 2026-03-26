import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getValidToken } from '@/lib/api/socialAuth';

const PLATFORMS = ['instagram', 'google-business-profile', 'facebook', 'linkedin'] as const;
const PLATFORM_CONNECTIONS_COOKIE = 'platform_connections';

/**
 * GET /api/social/connections
 * Returns all platform connection statuses + usernames from the cookie cache.
 */
export async function GET() {
  const token = await getValidToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();

  // Read cached connection data (written by callback + status sync)
  const raw = cookieStore.get(PLATFORM_CONNECTIONS_COOKIE)?.value;
  let cached: Record<string, { status?: string; username?: string | null; providerAccountName?: string | null }> = {};
  try { cached = raw ? JSON.parse(raw) : {}; } catch { cached = {}; }

  // Build response — UI gets instant data with no extra backend calls
  const result = PLATFORMS.reduce<
    Record<string, { connected: boolean; username: string | null; providerAccountName: string | null; status: string }>
  >((acc, p) => {
    // Backward compatibility: old key "google" -> new key "google-business-profile"
    const entry = p === 'google-business-profile' ? (cached[p] ?? cached.google) : cached[p];
    const name = entry?.providerAccountName ?? entry?.username ?? null;
    acc[p] = {
      connected: entry?.status === 'connected',
      username: name,
      providerAccountName: name,
      status: entry?.status ?? 'disconnected',
    };
    return acc;
  }, {});

  return NextResponse.json({ connections: result });
}
