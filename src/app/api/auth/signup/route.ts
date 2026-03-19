import { http } from '@/lib/http';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await http.post<any>('/auth/signup', {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
      confirmPassword: body.confirmPassword,
      timezone: body.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return NextResponse.json({ success: true, message: data.message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}