import { withHandler } from '@/app/api/api-utils';
import { assessmentController } from '@/lib/controllers/assessment.controller';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || undefined;
  const teacherId = searchParams.get('teacherId') || undefined;
  return assessmentController.getQuizzes(user, courseId, teacherId);
});

export const POST = withHandler(async (user, request) => {
  const body = await request.json();
  return assessmentController.saveQuiz(user, body);
});

export const DELETE = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) throw new Error('id is required');
  const { assessmentService } = await import('@/lib/services/assessment.service');
  await assessmentService.deleteQuiz(id, user.sessionId!);
  return { success: true };
});
