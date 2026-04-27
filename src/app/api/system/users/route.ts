import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { userService } from '@/lib/services/user.service';
import { UserMapper } from '@/lib/mappers';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const users = await userService.getAllUsers(user, user.sessionId!);
    return NextResponse.json(users.map(UserMapper.toDTO));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    try {
        await userService.deleteUser(user, id, user.sessionId!);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
