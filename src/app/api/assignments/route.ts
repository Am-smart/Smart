import { withHandler } from '@/app/api/api-utils';
import { assessmentController } from '@/lib/controllers/assessment.controller';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId') || undefined;
  const courseId = searchParams.get('courseId') || undefined;
  return assessmentController.getAssignments(user, teacherId, courseId);
});

export const POST = withHandler(async (user, request) => {
  const body = await request.json();
  return assessmentController.saveAssignment(user, body);
});

export const DELETE = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) throw new Error('id is required');
  // Add deleteAssignment to assessmentController if not present,
  // or use assessmentService directly if no controller method exists.
  // In our assessment.controller.ts, it was missing.
  const { assessmentService } = await import('@/lib/services/assessment.service');
  await assessmentService.deleteAssignment(id, user.sessionId!);
  return { success: true };
});
