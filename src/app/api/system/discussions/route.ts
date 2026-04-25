import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { systemController } from '@/lib/controllers/system.controller';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });

  try {
    const discussions = await systemController.getDiscussions(user, courseId);
    return NextResponse.json(discussions);
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
        const { communicationService } = await import('@/lib/services/communication.service');
        await communicationService.deleteDiscussionPost(user, id, user.sessionId!);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const body = await request.json();
    const post = await systemController.saveDiscussionPost(user, body);
    return NextResponse.json(post);
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
