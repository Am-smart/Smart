import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/lib/services/course.service';
import { userService } from '@/lib/services/user.service';
import { rbac } from '@/lib/auth/rbac';

export async function GET(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id');
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const courses = await courseService.getCourses(undefined, sessionId);
    return NextResponse.json({ courses });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id');
  const userId = req.headers.get('x-user-id');
  if (!sessionId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const user = await userService.getCurrentUser(userId, sessionId);

    if (!rbac.can(user, 'course:create')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const course = await courseService.saveCourse(user, body, sessionId);
    return NextResponse.json({ course });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
