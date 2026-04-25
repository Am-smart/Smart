import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../api-utils';
import { learningController } from '@/lib/controllers/learning.controller';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId') || undefined;

  try {
    const courses = await learningController.getCourses(user, teacherId);
    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    try {
        await learningController.deleteCourse(user, id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const body = await request.json();
    const course = await learningController.saveCourse(user, body);
    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
