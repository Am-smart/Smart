import { withHandler } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';

export const GET = withHandler(async (user) => {
  // Use user.sessionId if user is authenticated, otherwise use undefined for public access
  return systemService.getMaintenance(user?.sessionId || undefined);
}, { requireAuth: false });

export const POST = withHandler(async (user, request) => {
    const body = await request.json();
    await systemService.updateMaintenance(user, body, user.sessionId!);
    return { success: true };
});
