import { useAuth } from '@/components/auth/AuthContext';
import { useMemo, useCallback } from 'react';
import { getClient } from '@/lib/supabase';
import { User, Course, Enrollment, Assignment, Quiz, Discussion, Notification, Maintenance } from '@/lib/types';

export const useSupabase = () => {
  const { user } = useAuth();

  const client = useMemo(() => getClient(user?.email), [user?.email]);

  // User operations
  const getUser = useCallback(async (email: string): Promise<User | null> => {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, [client]);

  const saveUser = useCallback(async (u: Partial<User>): Promise<User> => {
    const { data, error } = await client
      .from('users')
      .upsert(u, { onConflict: 'email' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [client]);

  // Course operations
  const getCourses = useCallback(async (teacherEmail?: string): Promise<Course[]> => {
    let query = client.from('courses').select('*');
    if (teacherEmail) {
      query = query.eq('teacher_id', teacherEmail);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [client]);

  // Enrollment operations
  const getEnrollments = useCallback(async (studentEmail: string): Promise<Enrollment[]> => {
    const { data, error } = await client
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_id', studentEmail);
    if (error) throw error;
    return data || [];
  }, [client]);

  const enrollInCourse = useCallback(async (courseId: string, studentEmail: string): Promise<Enrollment> => {
    const { data, error } = await client
      .from('enrollments')
      .upsert({ course_id: courseId, student_id: studentEmail }, { onConflict: 'course_id,student_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [client]);

  // Assignment operations
  const getAssignments = useCallback(async (teacherEmail?: string, courseId?: string): Promise<Assignment[]> => {
    let query = client.from('assignments').select('*, courses(*)');
    if (teacherEmail) query = query.eq('teacher_id', teacherEmail);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [client]);

  // Quiz operations
  const getQuizzes = useCallback(async (courseId?: string, teacherEmail?: string): Promise<Quiz[]> => {
    let query = client.from('quizzes').select('*, courses(*)');
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherEmail) query = query.eq('teacher_id', teacherEmail);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [client]);

  // Discussion operations
  const getDiscussions = useCallback(async (courseId: string): Promise<Discussion[]> => {
    const { data, error } = await client
      .from('discussions')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [client]);

  // Notification operations
  const getNotifications = useCallback(async (userEmail: string): Promise<Notification[]> => {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userEmail)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [client]);

  // Maintenance operations
  const getMaintenance = useCallback(async (): Promise<Maintenance> => {
    const { data, error } = await client
      .from('maintenance')
      .select('*')
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data || { enabled: false, schedules: [] };
  }, [client]);

  return {
    client,
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
