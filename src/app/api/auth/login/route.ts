import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authController } from '@/lib/controllers/auth.controller';
import { signData } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await authController.login(body);

    if (result.success && result.user && result.sessionId) {
      const sessionData = {
        id: result.user.id,
        sessionId: result.sessionId,
        email: result.user.email,
        role: result.user.role,
        full_name: result.user.full_name
      };
      const token = await signData(sessionData);

      const cookieStore = await cookies();
      cookieStore.set('app-user-session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
