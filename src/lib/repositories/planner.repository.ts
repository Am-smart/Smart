import { supabase, withSession } from '../supabase';
import { PlannerItem } from '../types';

export class PlannerRepository {
  async findByUserId(userId: string, sessionId: string): Promise<PlannerItem[]> {
    const { data, error } = await withSession(supabase.from('planner'), sessionId)
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data as PlannerItem[];
  }

  async upsert(item: Partial<PlannerItem>, sessionId: string): Promise<PlannerItem> {
    const { version, id, ...itemData } = item;

    let query = withSession(supabase.from('planner'), sessionId)
      .upsert({
        ...itemData,
        ...(id ? { id } : {}),
        updated_at: new Date().toISOString(),
        version: (version || 0) + 1
      });

    if (id && version) {
      query = query.eq('id', id).eq('version', version);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (id && version && error.code === 'PGRST116') {
        throw new Error('Conflict detected: Planner item has been updated by another user.');
      }
      throw new Error(error.message);
    }
    return data as PlannerItem;
  }

  async delete(id: string, userId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('planner'), sessionId)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }
}
