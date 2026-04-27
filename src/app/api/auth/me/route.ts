import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { UserMapper } from '@/lib/mappers';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();
  return NextResponse.json(UserMapper.toDTO(user));
}
