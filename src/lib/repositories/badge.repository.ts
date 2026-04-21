import { supabase, withSession } from '../supabase';
import { Badge, UserBadge } from '../types';

export class BadgeRepository {
  async findAll(): Promise<Badge[]> {
    const { data, error } = await supabase.from('badges').select('*');
    if (error) throw new Error(error.message);
    return data as Badge[];
  }

  async findByUserId(userId: string, sessionId: string): Promise<UserBadge[]> {
    const { data, error } = await withSession(supabase.from('user_badges'), sessionId)
      .select('*, badges(*)')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data as UserBadge[];
  }

  async upsert(badge: Partial<Badge>, sessionId: string): Promise<Badge> {
    const { version, id, ...badgeData } = badge;

    let query = withSession(supabase.from('badges'), sessionId)
      .upsert({
        ...badgeData,
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
        throw new Error('Conflict detected: Badge has been updated by another user.');
      }
      throw new Error(error.message);
    }
    return data as Badge;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('badges'), sessionId)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async assignToUser(userBadge: Partial<UserBadge>, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('user_badges'), sessionId)
        .insert([{
            ...userBadge,
            awarded_at: new Date().toISOString()
        }]);

    if (error) throw new Error(error.message);
  }
}
