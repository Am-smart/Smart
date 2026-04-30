import { withHandler } from '@/app/api/api-utils';
import { assessmentController } from '@/lib/controllers/assessment.controller';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get('assignmentId') || undefined;
  const studentId = searchParams.get('studentId') || undefined;
  return assessmentController.getSubmissions(user, assignmentId, studentId);
});

export const POST = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get('assignmentId');
  const type = searchParams.get('type');
  const body = await request.json();

  if (!assignmentId) throw new Error('assignmentId is required');

  if (type === 'quiz') {
    return assessmentController.submitQuiz(user, assignmentId, body);
  } else {
    return assessmentController.submitAssignment(user, assignmentId, body);
  }
});

export const PATCH = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const body = await request.json();
  if (!id) throw new Error('id is required');
  await assessmentController.gradeSubmission(user, id, body);
  return { success: true };
});
