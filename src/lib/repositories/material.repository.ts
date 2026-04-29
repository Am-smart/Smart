import { supabase, withSession } from '../supabase';
import { Material } from '../types';

export class MaterialRepository {
  async findById(id: string, sessionId: string): Promise<Material | null> {
    const { data, error } = await withSession(supabase.from('materials').select('*').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error((error as Error).message);
    return data as Material;
  }

  async findByCourseId(courseId: string, sessionId: string): Promise<Material[]> {
    const { data, error } = await withSession(supabase.from('materials'), sessionId)
      .select('*, courses(*)')
      .eq('course_id', courseId);

    if (error) throw new Error((error as Error).message);
    return data as Material[];
  }

  async findAll(courseId?: string, sessionId?: string): Promise<Material[]> {
    let query = withSession(supabase.from('materials').select('*, courses(*)'), sessionId);
    if (courseId) query = query.eq('course_id', courseId);

    const { data, error } = await query;
    if (error) throw new Error((error as Error).message);
    return data as Material[];
  }

  async upsert(material: Partial<Material>, sessionId: string): Promise<Material> {
    const { version, id, ...materialData } = material;

    let query = withSession(supabase.from('materials'), sessionId)
      .upsert({
        ...materialData,
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
        throw new Error('Conflict detected: Material has been updated by another user.');
      }
      throw new Error((error as Error).message);
    }
    return data as Material;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('materials'), sessionId)
      .delete()
      .eq('id', id);

    if (error) throw new Error((error as Error).message);
  }
}
