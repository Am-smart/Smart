import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { systemController } from '@/lib/controllers/system.controller';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });

  try {
    await systemController.enrollInCourse(user, courseId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
