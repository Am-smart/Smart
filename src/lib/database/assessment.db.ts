import { withSession } from '../supabase';
import { supabaseServer as supabase } from '../supabase-server';
import { Assignment, Quiz, Submission, QuizSubmission } from '../types';

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
    const { version, id, courses: _courses, course: _course, ...assignmentData } = assignment as Record<string, unknown>;
    const currentVersion = typeof version === 'number' ? version : 0;
    let query = withSession(supabase.from('assignments'), sessionId)
      .upsert({
        ...assignmentData,
        ...(id ? { id } : {}),
        updated_at: new Date().toISOString(),
        version: currentVersion + 1
      } as Record<string, unknown>);

    if (id && version) {
      query = query.eq('id', id).eq('version', version);
    }

    const { data, error } = await query.select().single();
    if (error) {
      if (id && version && error.code === 'PGRST116') {
        throw new Error('Conflict detected: Assignment has been updated by another user.');
      }
      throw new Error(error.message);
    }
    return data as Assignment;
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
    const { version, id, courses: _courses, course: _course, ...quizData } = quiz as Record<string, unknown>;
    const currentVersion = typeof version === 'number' ? version : 0;
    let query = withSession(supabase.from('quizzes'), sessionId)
      .upsert({
        ...quizData,
        ...(id ? { id } : {}),
        updated_at: new Date().toISOString(),
        version: currentVersion + 1
      } as Record<string, unknown>);

    if (id && version) {
      query = query.eq('id', id).eq('version', version);
    }

    const { data, error } = await query.select().single();
    if (error) {
      if (id && version && error.code === 'PGRST116') {
        throw new Error('Conflict detected: Quiz has been updated by another user.');
      }
      throw new Error(error.message);
    }
    return data as Quiz;
  },

  async deleteQuiz(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('quizzes'), sessionId).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Submission Operations
  async findSubmissionById(id: string, sessionId: string): Promise<Submission | null> {
    const { data, error } = await withSession(supabase.from('submissions').select('*, assignments(*), users(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Submission;
  },

  async findAllSubmissions(assignmentId?: string, studentId?: string, sessionId?: string): Promise<Submission[]> {
    let query = withSession(supabase.from('submissions').select('*, assignments(*), users(*)'), sessionId);
    if (assignmentId) query = query.eq('assignment_id', assignmentId);
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Submission[];
  },

  async upsertSubmission(submission: Partial<Submission>, sessionId: string): Promise<Submission> {
    const { version, id, assignments: _assignments, assignment: _assignment, users: _users, student: _student, ...submissionData } = submission as Record<string, unknown>;
    const currentVersion = typeof version === 'number' ? version : 0;
    let query = withSession(supabase.from('submissions'), sessionId)
      .upsert({
        ...submissionData,
        ...(id ? { id } : {}),
        updated_at: new Date().toISOString(),
        version: currentVersion + 1
      } as Record<string, unknown>, { onConflict: 'assignment_id, student_id' });

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
  },

  async deleteSubmission(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('submissions'), sessionId).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Quiz Submission Operations
  async findQuizSubmissionById(id: string, sessionId: string): Promise<QuizSubmission | null> {
    const { data, error } = await withSession(supabase.from('quiz_submissions').select('*, quizzes(*), users(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as QuizSubmission;
  },

  async findAllQuizSubmissions(quizId?: string, studentId?: string, sessionId?: string): Promise<QuizSubmission[]> {
    let query = withSession(supabase.from('quiz_submissions').select('*, quizzes(*), users(*)'), sessionId);
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
