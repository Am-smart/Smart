import { withHandler } from '@/app/api/api-utils';
import { systemController } from '@/lib/controllers/system.controller';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) throw new Error('userId is required');
  return systemController.getNotifications(user, userId);
});

export const PATCH = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const body = await request.json();

    const { communicationService } = await import('@/lib/services/communication.service');

    if (body.markAll && userId) {
        await communicationService.markAllNotificationsAsRead(userId, user.sessionId!);
        return { success: true };
    }

    if (id) {
        await communicationService.markNotificationAsRead(id, user.sessionId!);
        return { success: true };
    }

    throw new Error('id or userId (with markAll) is required');
});
