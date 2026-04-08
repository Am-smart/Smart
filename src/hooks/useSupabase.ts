import { useAuth } from '@/components/auth/AuthContext';
import { useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { User, Course, Enrollment, Assignment, Quiz, Discussion, Notification, Maintenance } from '@/lib/types';

export const useSupabase = () => {
  const { user } = useAuth();

  const client = useMemo(() => createSupabaseClient(user?.email), [user?.email]);

  // User operations
  const getUser = async (email: string): Promise<User | null> => {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  const saveUser = async (u: Partial<User>): Promise<User> => {
    const { data, error } = await client
      .from('users')
      .upsert(u, { onConflict: 'email' })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  // Course operations
  const getCourses = async (teacherEmail?: string): Promise<Course[]> => {
    let query = client.from('courses').select('*');
    if (teacherEmail) {
      query = query.eq('teacher_email', teacherEmail);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Enrollment operations
  const getEnrollments = async (studentEmail: string): Promise<Enrollment[]> => {
    const { data, error } = await client
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_email', studentEmail);
    if (error) throw error;
    return data || [];
  };

  const enrollInCourse = async (courseId: string, studentEmail: string): Promise<Enrollment> => {
    const { data, error } = await client
      .from('enrollments')
      .upsert({ course_id: courseId, student_email: studentEmail }, { onConflict: 'course_id,student_email' })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  // Assignment operations
  const getAssignments = async (teacherEmail?: string, courseId?: string): Promise<Assignment[]> => {
    let query = client.from('assignments').select('*, courses(*)');
    if (teacherEmail) query = query.eq('teacher_email', teacherEmail);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Quiz operations
  const getQuizzes = async (courseId?: string, teacherEmail?: string): Promise<Quiz[]> => {
    let query = client.from('quizzes').select('*, courses(*)');
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherEmail) query = query.eq('teacher_email', teacherEmail);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Discussion operations
  const getDiscussions = async (courseId: string): Promise<Discussion[]> => {
    const { data, error } = await client
      .from('discussions')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  };

  // Notification operations
  const getNotifications = async (userEmail: string): Promise<Notification[]> => {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  // Maintenance operations
  const getMaintenance = async (): Promise<Maintenance> => {
    const { data, error } = await client
      .from('maintenance')
      .select('*')
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data || { enabled: false, schedules: [] };
  };

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
