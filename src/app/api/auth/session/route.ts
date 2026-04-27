import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { verifyToken } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('app-user-session');
  if (!token) return NextResponse.json(null);

  const session = await verifyToken(token.value);
  return NextResponse.json(session);
}
