import { supabase, withSession } from '../supabase';
import { Submission } from '../types';

export class SubmissionRepository {
  async findById(id: string, sessionId: string): Promise<Submission | null> {
    const { data, error } = await withSession(supabase.from('submissions').select('*, assignments(*), users(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Submission;
  }

  async findAll(assignmentId?: string, studentId?: string, sessionId?: string): Promise<Submission[]> {
    let query = supabase.from('submissions').select('*, assignments(*), users(*)');
    if (sessionId) {
      query = withSession(query, sessionId);
    }
    if (assignmentId) query = query.eq('assignment_id', assignmentId);
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Submission[];
  }

  async upsert(submission: Partial<Submission>, sessionId: string): Promise<Submission> {
    const { version, id, assignments: _, users: __, ...submissionData } = submission as unknown;

    let query = withSession(supabase.from('submissions'), sessionId)
      .upsert({
        ...submissionData,
        ...(id ? { id } : {}),
        updated_at: new Date().toISOString(),
        version: (version || 0) + 1
      }, { onConflict: 'assignment_id, student_id' });

    if (id && version) {
      query = query.eq('id', id).eq('version', version);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (id && version && error.code === 'PGRST116') {
        throw new Error('Conflict detected: Submission has been updated by another user.');
      }
      throw new Error(error.message);
    }
    return data as Submission;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('submissions'), sessionId)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
