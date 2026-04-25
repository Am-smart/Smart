import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../api-utils';
import { enrollmentService } from '@/lib/services/enrollment.service';

export async function DELETE(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');

    if (!courseId || !studentId) return NextResponse.json({ error: 'courseId and studentId are required' }, { status: 400 });

    try {
        await enrollmentService.removeEnrollment(user, courseId, studentId, user.sessionId!);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
