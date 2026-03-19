import { http } from '@/lib/http';
import { createSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await http.post<any>('/auth/verify-email', body);

    // If your verify-email returns a token/session, set it here
    if (data.access_token) {
      await createSession(data.access_token);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}