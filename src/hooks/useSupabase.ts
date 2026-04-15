import { useAuth } from '@/components/auth/AuthContext';
import { useCallback } from 'react';
import { supabase, withSession } from '@/lib/supabase';
import { User, Course, Enrollment, Assignment, Quiz, Discussion, Notification, Maintenance } from '@/lib/types';

export const useSupabase = () => {
  const { user } = useAuth();

  // User operations
  const getUser = useCallback(async (id: string): Promise<User | null> => {
    const { data, error } = await withSession(supabase.from('users'), user?.sessionId)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, [user?.sessionId]);

  const saveUser = useCallback(async (u: Partial<User>): Promise<User> => {
    const { data, error } = await withSession(supabase.from('users'), user?.sessionId)
      .upsert(u, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [user?.sessionId]);

  // Course operations
  const getCourses = useCallback(async (teacherId?: string): Promise<Course[]> => {
    let query = withSession(supabase.from('courses'), user?.sessionId).select('*');
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [user?.sessionId]);

  // Enrollment operations
  const getEnrollments = useCallback(async (studentId: string): Promise<Enrollment[]> => {
    const { data, error } = await withSession(supabase.from('enrollments'), user?.sessionId)
      .select('*, courses(*)')
      .eq('student_id', studentId);
    if (error) throw error;
    return data || [];
  }, [user?.sessionId]);

  const enrollInCourse = useCallback(async (courseId: string, studentId: string): Promise<Enrollment> => {
    const { data, error } = await withSession(supabase.from('enrollments'), user?.sessionId)
      .upsert({ course_id: courseId, student_id: studentId }, { onConflict: 'course_id,student_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [user?.sessionId]);

  // Assignment operations
  const getAssignments = useCallback(async (teacherId?: string, courseId?: string): Promise<Assignment[]> => {
    let query = withSession(supabase.from('assignments'), user?.sessionId).select('*, courses(*)');
    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [user?.sessionId]);

  // Quiz operations
  const getQuizzes = useCallback(async (courseId?: string, teacherId?: string): Promise<Quiz[]> => {
    let query = withSession(supabase.from('quizzes'), user?.sessionId).select('*, courses(*)');
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [user?.sessionId]);

  // Discussion operations
  const getDiscussions = useCallback(async (courseId: string): Promise<Discussion[]> => {
    const { data, error } = await withSession(supabase.from('discussions'), user?.sessionId)
      .select('*, users(full_name, email)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [user?.sessionId]);

  // Notification operations
  const getNotifications = useCallback(async (userId: string): Promise<Notification[]> => {
    const { data, error } = await withSession(supabase.from('notifications'), user?.sessionId)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [user?.sessionId]);

  // Maintenance operations
  const getMaintenance = useCallback(async (): Promise<Maintenance> => {
    const { data, error } = await withSession(supabase.from('maintenance'), user?.sessionId)
      .select('*')
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data || { enabled: false, schedules: [] };
  }, [user?.sessionId]);

  return {
    client: supabase,
    getUser,
    saveUser,
    getCourses,
    getEnrollments,
    enrollInCourse,
    getAssignments,
    getQuizzes,
    getDiscussions,
    getNotifications,
    getMaintenance,
  };
};
