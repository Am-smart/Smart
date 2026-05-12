import { withHandler } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';

export const POST = withHandler(async (user, request) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const category = formData.get('category') as string || 'general';

  if (!file) {
    throw new Error('No file provided');
  }

  return await systemService.uploadFile(file, category, user.id, user.sessionId!);
}, { requireAuth: true, checkCSRF: true });
