import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../api-utils';
import { learningService } from '@/lib/services/learning.service';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const body = await request.json();
    const { lessonId, courseId } = body;
    const result = await learningService.markLessonComplete(user.id, lessonId, courseId, user.sessionId!);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    try {
        const completions = await learningService.getLessonCompletions(userId, user.sessionId!);
        return NextResponse.json(completions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
