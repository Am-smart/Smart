import { withHandler } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';

export const GET = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const { rbac } = await import('@/lib/auth/rbac');
    if (!rbac.can(user, 'system:manage')) throw new Error('Unauthorized');

    const logs = await systemService.getLogs(user, limit, user.sessionId!);
    const { SystemMapper } = await import('@/lib/mappers');
    return logs.map(SystemMapper.toSystemLogDTO);
});

export const POST = withHandler(async (user, request) => {
    const body = await request.json();
    await systemService.createLog({
        ...body,
        user_id: user.id
    }, user.sessionId!);
    return { success: true };
});
