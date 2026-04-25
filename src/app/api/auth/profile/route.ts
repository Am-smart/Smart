import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../api-utils';
import { userService } from '@/lib/services/user.service';
import { UserMapper } from '@/lib/mappers';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const updates = await request.json();
    const updated = await userService.updateUserProfile(user, user.id, updates, user.sessionId!);
    return NextResponse.json(UserMapper.toDTO(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
