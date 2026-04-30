import { withSession } from '../supabase';
import { supabaseServer as supabase } from '../supabase-server';
import { Maintenance } from '../types';

export class MaintenanceRepository {
  async getMaintenance(sessionId?: string): Promise<Maintenance> {
    let query = supabase.from('maintenance').select('*');
    if (sessionId) {
        query = withSession(query, sessionId);
    }

    const { data, error } = await query.maybeSingle();
    if (error && error.code !== 'PGRST116') throw new Error((error as Error).message);
    return data as Maintenance || { enabled: false, schedules: [] };
  }

  async update(maintenance: Partial<Maintenance>, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('maintenance'), sessionId)
        .update(maintenance)
        .eq('id', maintenance.id);

    if (error) throw new Error((error as Error).message);
  }
}
