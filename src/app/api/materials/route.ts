import { withHandler } from '@/app/api/api-utils';
import { learningController } from '@/lib/controllers/learning.controller';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || undefined;
  return learningController.getMaterials(user, courseId);
});

export const POST = withHandler(async (user, request) => {
  const body = await request.json();
  return learningController.saveMaterial(user, body);
});

export const DELETE = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) throw new Error('id is required');
  await learningController.deleteMaterial(user, id);
  return { success: true };
});
