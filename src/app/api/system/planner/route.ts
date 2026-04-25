import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const body = await request.json();
    const item = await systemService.savePlannerItem(user.id, body, user.sessionId!);
    return NextResponse.json(item);
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  try {
    await systemService.deletePlannerItem(user.id, id, user.sessionId!);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    try {
        const items = await systemService.getPlannerItems(userId, user.sessionId!);
        return NextResponse.json(items);
    } catch (error: unknown) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
