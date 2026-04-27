import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';
import { SystemMapper } from '@/lib/mappers/domain-to-dto.mapper';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    const logs = await systemService.getLogs(user, limit, user.sessionId!);
    return NextResponse.json(logs.map(SystemMapper.toSystemLogDTO));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    try {
        const body = await request.json();
        const updated = await systemService.updateLog(user, id, body, user.sessionId!);
        return NextResponse.json(SystemMapper.toSystemLogDTO(updated));
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
