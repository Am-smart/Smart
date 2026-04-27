import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { userService } from '@/lib/services/user.service';
import { UserMapper } from '@/lib/mappers';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const updates = await request.json();
    const updated = await userService.updateUserProfile(user, user.id, updates, user.sessionId!);
    return NextResponse.json(UserMapper.toDTO(updated));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
