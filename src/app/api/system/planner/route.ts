import { withHandler } from '@/app/api/api-utils';
import { systemController } from '@/lib/controllers/system.controller';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) throw new Error('userId is required');
  return systemController.getPlannerItems(user, userId);
});

export const POST = withHandler(async (user, request) => {
  const body = await request.json();
  return systemController.savePlannerItem(user, body);
});

export const DELETE = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) throw new Error('id is required');
  const { systemService } = await import('@/lib/services/system.service');
  await systemService.deletePlannerItem(user.id, id, user.sessionId!);
  return { success: true };
});
