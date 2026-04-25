import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/auth.service';
import { verifyToken } from '@/lib/crypto';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('app-user-session');

  if (token) {
    const session = await verifyToken(token.value);
    if (session && session.sessionId) {
      await authService.logout(session.sessionId as string);
    }
  }

  cookieStore.delete('app-user-session');
  return NextResponse.json({ success: true });
}
