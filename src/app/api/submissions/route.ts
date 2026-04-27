import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { assessmentController } from '@/lib/controllers/assessment.controller';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get('assignmentId') || undefined;
  const studentId = searchParams.get('studentId') || undefined;

  try {
    const submissions = await assessmentController.getSubmissions(user, assignmentId, studentId);
    return NextResponse.json(submissions);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get('assignmentId');
  const type = searchParams.get('type'); // 'assignment' or 'quiz'

  try {
    const body = await request.json();
    if (type === 'quiz') {
        const result = await assessmentController.submitQuiz(user, assignmentId!, body);
        return NextResponse.json(result);
    } else {
        const submission = await assessmentController.submitAssignment(user, assignmentId!, body);
        return NextResponse.json(submission);
    }
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('id');

    if (!submissionId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    try {
        const body = await request.json();
        await assessmentController.gradeSubmission(user, submissionId, body);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
