import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../../api-utils';
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
