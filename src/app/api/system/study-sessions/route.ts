import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../api-utils';
import { learningService } from '@/lib/services/learning.service';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const { session, xpEarned } = await request.json();
    await learningService.saveStudySession(user.id, session, xpEarned || 0, user.sessionId!);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
