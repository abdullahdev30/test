import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SOCIAL_API_URL = process.env.SOCIAL_API_URL || 'https://wenona-polydisperse-aracely.ngrok-free.dev/social-connections';

/**
 * /api/social/[platform]/[action]
 * Proxies social connection requests to the external API,
 * reading the access_token from the httpOnly cookie server-side.
 * The external backend URL and token are NEVER sent to the client.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string; action: string }> }
) {
  const { platform, action } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${SOCIAL_API_URL}/${platform}/${action}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Social API request failed' }, { status: 502 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string; action: string }> }
) {
  const { platform, action } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${SOCIAL_API_URL}/${platform}/${action}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Social API request failed' }, { status: 502 });
  }
}
