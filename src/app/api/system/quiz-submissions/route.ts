import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { assessmentService } from '@/lib/services/assessment.service';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get('quizId') || undefined;
  const studentId = searchParams.get('studentId') || undefined;

  try {
    const submissions = await assessmentService.getQuizSubmissions(quizId, studentId, user.sessionId!);
    return NextResponse.json(submissions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
