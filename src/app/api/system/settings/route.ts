import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../api-utils';
import { systemService } from '@/lib/services/system.service';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const settings = await systemService.getSettings(user, user.sessionId!);
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    try {
        const { key, value } = await request.json();
        await systemService.updateSetting(user, key, value, user.sessionId!);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
