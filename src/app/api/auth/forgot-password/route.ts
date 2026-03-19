import { http } from '@/lib/http';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('reset_token')?.value;

    if (!token) {
      // This triggers the "Unexpected token <" if the frontend fetch URL is wrong
      return NextResponse.json({ error: "Session expired. Please verify OTP again." }, { status: 401 });
    }

    // Call backend with the token pulled from the cookie
    await http.post('/auth/reset-password', {
      email: body.email,
      resetToken: token,
      newPassword: body.newPassword,
      confirmPassword: body.confirmPassword,
    });

    const response = NextResponse.json({ success: true });
    
    // Cleanup: Remove the token so it can't be used again
    response.cookies.set('reset_token', '', { path: '/', maxAge: 0 });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}