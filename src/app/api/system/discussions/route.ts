import { withHandler } from '@/app/api/api-utils';
import { systemController } from '@/lib/controllers/system.controller';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  if (!courseId) throw new Error('courseId is required');
  return systemController.getDiscussions(user, courseId);
});

export const POST = withHandler(async (user, request) => {
  const body = await request.json();
  return systemController.saveDiscussionPost(user, body);
});
