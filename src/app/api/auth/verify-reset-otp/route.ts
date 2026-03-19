import { http } from '@/lib/http';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Call backend to verify OTP
    const data = await http.post<any>('/auth/verify-reset-otp', body);

    // DEBUG: Check what your backend actually returns
    // It might be data.resetToken or data.reset_token
    const token = data.resetToken || data.reset_token;

    if (!token) {
      return NextResponse.json({ error: "No reset token received from server" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });

    // Store in HTTP-only cookie
    response.cookies.set('reset_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}