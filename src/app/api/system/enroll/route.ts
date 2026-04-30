import { withHandler } from '@/app/api/api-utils';
import { systemController } from '@/lib/controllers/system.controller';

export const POST = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) throw new Error('courseId is required');
    await systemController.enrollInCourse(user, courseId);
    return { success: true };
});

export const DELETE = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');
    if (!courseId || !studentId) throw new Error('courseId and studentId are required');
    await systemController.unenrollFromCourse(user, courseId, studentId);
    return { success: true };
});
