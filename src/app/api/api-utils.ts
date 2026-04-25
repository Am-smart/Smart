import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/crypto';
import { userService } from '@/lib/services/user.service';
import { User } from '@/lib/types';

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('app-user-session');
  if (!token) return null;

  const session = await verifyToken(token.value);
  if (!session || !session.sessionId) return null;

  return userService.getCurrentUser(session.id as string, session.sessionId as string);
}

export function handleUnauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
