import { withHandler } from '@/app/api/api-utils';
import { learningController } from '@/lib/controllers/learning.controller';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  if (!courseId) throw new Error('courseId is required');
  return learningController.getLessons(user, courseId);
});

export const POST = withHandler(async (user, request) => {
  const body = await request.json();
  return learningController.saveLesson(user, body);
});

export const DELETE = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) throw new Error('id is required');
  const { learningService } = await import('@/lib/services/learning.service');
  await learningService.deleteLesson(id, user.sessionId!);
  return { success: true };
});
