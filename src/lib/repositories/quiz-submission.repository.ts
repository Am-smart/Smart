import { supabase, withSession } from '../supabase';
import { QuizSubmission } from '../types';

export class QuizSubmissionRepository {
  async findById(id: string, sessionId: string): Promise<QuizSubmission | null> {
    const { data, error } = await withSession(supabase.from('quiz_submissions').select('*, quizzes(*), users(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error((error as Error).message);
    return data as QuizSubmission;
  }

  async findAll(quizId?: string, studentId?: string, sessionId?: string): Promise<QuizSubmission[]> {
    let query = supabase.from('quiz_submissions').select('*, quizzes(*), users(*)');
    if (sessionId) {
      query = withSession(query, sessionId);
    }
    if (quizId) query = query.eq('quiz_id', quizId);
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw new Error((error as Error).message);
    return data as QuizSubmission[];
  }

  async insert(submission: Partial<QuizSubmission>, sessionId: string): Promise<QuizSubmission> {
    const { quizzes: _, users: __, ...submissionData } = submission as Record<string, unknown>;
    const { data, error } = await withSession(supabase.from('quiz_submissions'), sessionId)
      .insert(submissionData)
      .select()
      .single();

    if (error) throw new Error((error as Error).message);
    return data as QuizSubmission;
  }

  async findAttempts(quizId: string, studentId: string, sessionId: string): Promise<QuizSubmission[]> {
    const { data, error } = await withSession(supabase.from('quiz_submissions'), sessionId)
      .select('attempt_number')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .order('attempt_number', { ascending: false });

    if (error) throw new Error((error as Error).message);
    return data as QuizSubmission[];
  }
}
