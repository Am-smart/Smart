import { withSession } from '../supabase';
import { supabaseServer as supabase } from '../supabase-server';
import { Assignment, Quiz, Submission, QuizSubmission } from '../types';
import { dbUtils } from './db-utils';

export const assessmentDb = {
  // Assignment Operations
  async findAssignmentById(id: string, sessionId: string): Promise<Assignment | null> {
    const { data, error } = await withSession(supabase.from('assignments').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Assignment;
  },

  async findAllAssignments(teacherId?: string, courseId?: string, sessionId?: string): Promise<Assignment[]> {
    let query = withSession(supabase.from('assignments').select('*, courses(*)'), sessionId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Assignment[];
  },

  async upsertAssignment(assignment: Partial<Assignment>, sessionId: string): Promise<Assignment> {
    return dbUtils.upsert(supabase.from('assignments'), assignment, 'Assignment', sessionId, { excludeFields: ['courses', 'course'] });
  },

  async deleteAssignment(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('assignments'), sessionId).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Quiz Operations
  async findQuizById(id: string, sessionId: string): Promise<Quiz | null> {
    const { data, error } = await withSession(supabase.from('quizzes').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Quiz;
  },

  async findAllQuizzes(courseId?: string, teacherId?: string, sessionId?: string): Promise<Quiz[]> {
    let query = withSession(supabase.from('quizzes').select('*, courses(*)'), sessionId);
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Quiz[];
  },

  async upsertQuiz(quiz: Partial<Quiz>, sessionId: string): Promise<Quiz> {
    return dbUtils.upsert(supabase.from('quizzes'), quiz, 'Quiz', sessionId, { excludeFields: ['courses', 'course'] });
  },

  async deleteQuiz(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('quizzes'), sessionId).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Submission Operations
  async findSubmissionById(id: string, sessionId: string): Promise<Submission | null> {
    const { data, error } = await withSession(supabase.from('submissions').select('*, assignments(*), users!student_id(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Submission;
  },

  async findAllSubmissions(assignmentId?: string, studentId?: string, sessionId?: string): Promise<Submission[]> {
    let query = withSession(supabase.from('submissions').select('*, assignments(*), users!student_id(*)'), sessionId);
    if (assignmentId) query = query.eq('assignment_id', assignmentId);
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Submission[];
  },

  async upsertSubmission(submission: Partial<Submission>, sessionId: string): Promise<Submission> {
    return dbUtils.upsert(supabase.from('submissions'), submission, 'Submission', sessionId, {
      onConflict: 'assignment_id_student_id',
      excludeFields: ['assignments', 'assignment', 'users', 'student']
    });
  },

  async deleteSubmission(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('submissions'), sessionId).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Quiz Submission Operations
  async findQuizSubmissionById(id: string, sessionId: string): Promise<QuizSubmission | null> {
    const { data, error } = await withSession(supabase.from('quiz_submissions').select('*, quizzes(*), users!student_id(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as QuizSubmission;
  },

  async findAllQuizSubmissions(quizId?: string, studentId?: string, sessionId?: string): Promise<QuizSubmission[]> {
    let query = withSession(supabase.from('quiz_submissions').select('*, quizzes(*), users!student_id(*)'), sessionId);
    if (quizId) query = query.eq('quiz_id', quizId);
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as QuizSubmission[];
  },

  async insertQuizSubmission(submission: Partial<QuizSubmission>, sessionId: string): Promise<QuizSubmission> {
    const { quizzes: _quizzes, quiz: _quiz, users: _users, student: _student, ...submissionData } = submission as Record<string, unknown>;
    const { data, error } = await withSession(supabase.from('quiz_submissions'), sessionId)
      .insert(submissionData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as QuizSubmission;
  },

  async findQuizAttempts(quizId: string, studentId: string, sessionId: string): Promise<QuizSubmission[]> {
    const { data, error } = await withSession(supabase.from('quiz_submissions'), sessionId)
      .select('attempt_number')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .order('attempt_number', { ascending: false });
    if (error) throw new Error(error.message);
    return data as QuizSubmission[];
  }
};
