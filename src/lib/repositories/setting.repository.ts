import { supabase, withSession } from '../supabase';
import { Setting } from '../types';

export class SettingRepository {
  async findAll(sessionId: string): Promise<Setting[]> {
    const { data, error } = await withSession(supabase.from('settings'), sessionId).select('*');
    if (error) throw new Error(error.message);
    return data as Setting[];
  }

  async update(key: string, value: unknown, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase, sessionId)
        .rpc('update_setting', {
            p_key: key,
            p_value: value
        });

    if (error) throw new Error(error.message);
  }
}
