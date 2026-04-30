import { withHandler } from '@/app/api/api-utils';
import { systemController } from '@/lib/controllers/system.controller';

export const GET = withHandler(async (user) => {
  return systemController.getAllUsers(user);
});

export const DELETE = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('id is required');

    const { rbac } = await import('@/lib/auth/rbac');
    if (!rbac.can(user, 'user:manage')) throw new Error('Unauthorized');

    const { userService } = await import('@/lib/services/user.service');
    await userService.deleteUser(user, id, user.sessionId!);
    return { success: true };
});
