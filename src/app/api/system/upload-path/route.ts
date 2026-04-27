import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const { fileName, category } = await request.json();
    const filePath = `${category}/${user.id}/${Date.now()}_${fileName}`;

    await systemService.createLogAsync({
        level: 'info',
        category: 'management',
        message: `File upload initiated: ${fileName} in category ${category}`,
        user_id: user.id
    });

    return NextResponse.json({ filePath });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
