import { http } from '@/lib/http';
import { createSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const data = await http.post<any>('/auth/login', {
      email: body.email,
      password: body.password,
      deviceId: "web-chrome-device-001", 
    });

    if (data.access_token || data.accessToken) {
      await createSession(data.access_token || data.accessToken);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No token received" }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}