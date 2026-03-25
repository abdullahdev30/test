import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '@/lib/api/socialAuth';
import { cookies } from 'next/headers';

// ─── Cookie config ────────────────────────────────────────────────────────────
// path '/' — cookie must be readable by ALL routes, not just /connections
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // 'lax' required so OAuth redirect back sets the cookie
  path: '/',
};

const PLATFORM_CONNECTIONS_COOKIE = 'platform_connections';
const CONNECTIONS_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Read the cached platform_connections JSON cookie */
async function getPlatformConnections(): Promise<Record<string, unknown>> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PLATFORM_CONNECTIONS_COOKIE)?.value;
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

/** Persist updated platform_connections JSON cookie */
async function setPlatformConnections(data: Record<string, unknown>) {
  const cookieStore = await cookies();
  cookieStore.set(PLATFORM_CONNECTIONS_COOKIE, JSON.stringify(data), {
    ...COOKIE_OPTS,
    maxAge: CONNECTIONS_MAX_AGE,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — status check (called by useSocial polling)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; action: string }> }
) {
  const { platform, action } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SOCIAL_BASE_URL;

  // getValidToken() auto-refreshes if access_token cookie is missing
  const token = await getValidToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const callWithToken = (authToken: string) =>
      fetch(`${baseUrl}/social-connections/${platform}/${action}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        cache: 'no-store',
      });

    let response = await callWithToken(token);
    if (response.status === 401) {
      const refreshed = await getValidToken({ forceRefresh: true });
      if (refreshed) {
        response = await callWithToken(refreshed);
      }
    }

    if (!response.ok) {
      // For live status checks, treat non-2xx as disconnected and keep user on same page.
      if (action === 'status') {
        const connections = await getPlatformConnections();
        delete connections[platform];
        await setPlatformConnections(connections);
        return NextResponse.json({
          status: 'disconnected',
          connected: false,
          username: null,
          providerAccountName: null,
          connection: null,
        });
      }
      return NextResponse.json({ error: `Backend Error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();

    // Sync platform status into the local cookie cache from live status
    if (action === 'status') {
      const conn = data?.connection;
      const username = conn?.providerAccountName || conn?.providerAccountId || data?.username || null;
      const connections = await getPlatformConnections();
      if (data?.status === 'connected') {
        connections[platform] = {
          status: 'connected',
          username,
          providerAccountName: username,
        };
      } else {
        delete connections[platform];
      }
      await setPlatformConnections(connections);

      return NextResponse.json({
        ...data,
        status: data?.status === 'connected' ? 'connected' : 'disconnected',
        connected: data?.status === 'connected',
        username: data?.status === 'connected' ? username : null,
        providerAccountName: data?.status === 'connected' ? username : null,
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Connection to backend failed' }, { status: 502 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — connect (get OAuth URL) or disconnect (clear tokens)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; action: string }> }
) {
  const { platform, action } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SOCIAL_BASE_URL;

  // Auto-refresh on missing access_token
  const token = await getValidToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── CONNECT: return fresh OAuth URL ──────────────────────────────────────
  if (action === 'connect') {
    try {
      const connectWithToken = (authToken: string) =>
        fetch(`${baseUrl}/social-connections/${platform}/connect`, {
          method: 'GET',
          headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
          cache: 'no-store',
        });

      let res = await connectWithToken(token);
      if (res.status === 401) {
        const refreshed = await getValidToken({ forceRefresh: true });
        if (refreshed) {
          res = await connectWithToken(refreshed);
        }
      }

      if (!res.ok) {
        return NextResponse.json({ error: `Backend error ${res.status}` }, { status: res.status });
      }

      const data = await res.json();
      const authUrl = data.authUrl ?? data.url ?? data.redirectUrl;

      if (!authUrl) {
        return NextResponse.json({ error: 'No OAuth URL returned from backend' }, { status: 502 });
      }

      // Return the auth URL — client redirects window.location to it
      return NextResponse.json({ authUrl });
    } catch {
      return NextResponse.json({ error: 'Failed to get OAuth URL' }, { status: 500 });
    }
  }

  // ── DISCONNECT: call backend + clear local cookie entry ──────────────────
  if (action === 'disconnect') {
    try {
      let authToken = token;
      let res = await fetch(`${baseUrl}/social-connections/${platform}/disconnect`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
      });

      if (res.status === 401) {
        const refreshed = await getValidToken({ forceRefresh: true });
        if (refreshed) {
          authToken = refreshed;
          res = await fetch(`${baseUrl}/social-connections/${platform}/disconnect`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
          });
        }
      }

      // Best-effort backend disconnect
      if (!res.ok && res.status !== 401) {
        await res.text().catch(() => null);
      }

      // Remove platform from local cookie cache immediately
      const connections = await getPlatformConnections();
      delete connections[platform];
      await setPlatformConnections(connections);

      return NextResponse.json({ disconnected: true });
    } catch {
      return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — backward compatibility (same as POST disconnect)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; action: string }> }
) {
  const { platform } = await params;

  const token = await getValidToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SOCIAL_BASE_URL;
  try {
    let res = await fetch(`${baseUrl}/social-connections/${platform}/disconnect`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    if (res.status === 401) {
      const refreshed = await getValidToken({ forceRefresh: true });
      if (refreshed) {
        res = await fetch(`${baseUrl}/social-connections/${platform}/disconnect`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${refreshed}`, Accept: 'application/json' },
        });
      }
    }

    const connections = await getPlatformConnections();
    delete connections[platform];
    await setPlatformConnections(connections);

    return NextResponse.json({ disconnected: true });
  } catch {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
