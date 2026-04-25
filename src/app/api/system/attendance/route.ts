import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../api-utils';
import { communicationService } from '@/lib/services/communication.service';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const { liveClassId } = await request.json();
    await communicationService.recordAttendance(user.id, liveClassId, user.sessionId!);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
