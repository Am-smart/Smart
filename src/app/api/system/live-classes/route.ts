import { withHandler } from '@/app/api/api-utils';
import { systemController } from '@/lib/controllers/system.controller';

export const GET = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId') || undefined;
    const teacherId = searchParams.get('teacherId') || undefined;
    return systemController.getLiveClasses(user, courseId, teacherId);
});

export const POST = withHandler(async (user, request) => {
    const body = await request.json();
    const { communicationService } = await import('@/lib/services/communication.service');
    const { rbac } = await import('@/lib/auth/rbac');

    if (!rbac.can(user, 'course:update')) throw new Error('Unauthorized');

    const { CommunicationMapper } = await import('@/lib/mappers');
    const result = await communicationService.saveLiveClass(user, body, user.sessionId!);
    return CommunicationMapper.toLiveClassDTO(result);
});

export const DELETE = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('id is required');

    const { rbac } = await import('@/lib/auth/rbac');
    if (!rbac.can(user, 'course:update')) throw new Error('Unauthorized');

    const { communicationService } = await import('@/lib/services/communication.service');
    await communicationService.deleteLiveClass(id, user.sessionId!);
    return { success: true };
});
