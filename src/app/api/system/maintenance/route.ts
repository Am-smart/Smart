import { withHandler } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';

export const GET = withHandler(async (user) => {
  return systemService.getMaintenance(user?.sessionId || undefined);
}, { requireAuth: false });
