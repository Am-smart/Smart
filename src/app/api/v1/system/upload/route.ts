import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return handleUnauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const filePath = `${category}/${user.id}/${Date.now()}_${fileName}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('lms-files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('lms-files')
      .getPublicUrl(filePath);

    await systemService.createLogAsync({
        level: 'info',
        category: 'management',
        message: `File uploaded: ${fileName} in category ${category}`,
        user_id: user.id,
        metadata: { filePath, publicUrl }
    });

    return NextResponse.json({ filePath, publicUrl });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
