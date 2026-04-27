import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { learningController } from '@/lib/controllers/learning.controller';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || undefined;

  try {
    const materials = await learningController.getMaterials(user, courseId);
    return NextResponse.json(materials);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const body = await request.json();
    const material = await learningController.saveMaterial(user, body);
    return NextResponse.json(material);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    try {
        await learningController.deleteMaterial(user, id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
