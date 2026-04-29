import { supabase, withSession } from '../supabase';
import { Assignment } from '../types';

export class AssignmentRepository {
  async findById(id: string, sessionId: string): Promise<Assignment | null> {
    const { data, error } = await withSession(supabase.from('assignments').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error((error as Error).message);
    return data as Assignment;
  }

  async findAll(teacherId?: string, courseId?: string, sessionId?: string): Promise<Assignment[]> {
    let query = withSession(supabase.from('assignments').select('*, courses(*)'), sessionId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw new Error((error as Error).message);
    return data as Assignment[];
  }

  async upsert(assignment: Partial<Assignment>, sessionId: string): Promise<Assignment> {
    const { version, id, courses, ...assignmentData } = assignment;
    void courses;

    let query = withSession(supabase.from('assignments'), sessionId)
      .upsert({
        ...assignmentData,
        ...(id ? { id } : {}),
        updated_at: new Date().toISOString(),
        version: (version || 0) + 1
      } as Record<string, unknown>);

    if (id && version) {
      query = query.eq('id', id).eq('version', version);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (id && version && error.code === 'PGRST116') {
        throw new Error('Conflict detected: Assignment has been updated by another user.');
      }
      throw new Error((error as Error).message);
    }
    return data as Assignment;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('assignments'), sessionId)
      .delete()
      .eq('id', id);

    if (error) throw new Error((error as Error).message);
  }
}
