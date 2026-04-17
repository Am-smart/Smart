import { useAuth } from '@/components/auth/AuthContext';
import { useCallback, useMemo } from 'react';
import { supabase, withSession } from '@/lib/supabase';
import { User, Course, Enrollment, Assignment, Quiz, Discussion, Notification, Maintenance } from '@/lib/types';
import { useIndexedDB } from './useIndexedDB';
import { saveUser as saveUserAction, enrollInCourse as enrollInCourseAction } from '@/lib/data-actions';

export const useSupabase = () => {
  const { user } = useAuth();
  const { isOnline, getCache, setCache } = useIndexedDB();

  // User operations
  const getUser = useCallback(async (id: string): Promise<User | null> => {
    if (!isOnline) {
      const cached = await getCache<User>('current_user');
      if (cached && cached.id === id) return cached;
      const adminCached = await getCache<User[]>('admin_users');
      return adminCached?.find(u => u.id === id) || null;
    }

    const { data, error } = await withSession(supabase.from('users'), user?.sessionId)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (data && data.id === user?.id) await setCache('current_user', data);
    return data;
  }, [user?.sessionId, user?.id, isOnline, getCache, setCache]);

  const saveUser = useCallback(async (u: Partial<User>): Promise<User> => {
    const res = await saveUserAction(u);
    if (!res.success) throw new Error('Failed to save user');
    return res.data as User;
  }, []);

  // Course operations
  const getCourses = useCallback(async (teacherId?: string): Promise<Course[]> => {
    if (!isOnline) {
      const key = teacherId ? 'teacher_courses' : 'all_courses';
      const cached = await getCache<Course[]>(key);
      return cached || [];
    }

    let query = withSession(supabase.from('courses'), user?.sessionId).select('*');
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    const { data, error } = await query;
    if (error) throw error;

    const key = teacherId ? 'teacher_courses' : 'all_courses';
    if (data) await setCache(key, data);

    return data || [];
  }, [user?.sessionId, isOnline, getCache, setCache]);

  // Enrollment operations
  const getEnrollments = useCallback(async (studentId: string): Promise<Enrollment[]> => {
    if (!isOnline) {
      const cached = await getCache<Enrollment[]>('my_enrollments');
      return cached || [];
    }

    const { data, error } = await withSession(supabase.from('enrollments'), user?.sessionId)
      .select('*, courses(*)')
      .eq('student_id', studentId);
    if (error) throw error;
    if (data) await setCache('my_enrollments', data);
    return data || [];
  }, [user?.sessionId, isOnline, getCache, setCache]);

  const enrollInCourse = useCallback(async (courseId: string): Promise<Enrollment> => {
    const res = await enrollInCourseAction(courseId);
    if (!res.success) throw new Error('Failed to enroll in course');
    return { course_id: courseId, student_id: user?.id || '' } as Enrollment;
  }, [user?.id]);

  // Assignment operations
  const getAssignments = useCallback(async (teacherId?: string, courseId?: string): Promise<Assignment[]> => {
    if (!isOnline) {
      const key = teacherId ? 'teacher_assignments' : 'all_assignments';
      const cached = await getCache<Assignment[]>(key);
      if (courseId && cached) return cached.filter(a => a.course_id === courseId);
      return cached || [];
    }

    let query = withSession(supabase.from('assignments'), user?.sessionId).select('*, courses(*)');
    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;

    const key = teacherId ? 'teacher_assignments' : 'all_assignments';
    if (data) await setCache(key, data);

    return data || [];
  }, [user?.sessionId, isOnline, getCache, setCache]);

  // Quiz operations
  const getQuizzes = useCallback(async (courseId?: string, teacherId?: string): Promise<Quiz[]> => {
    if (!isOnline) {
      const key = teacherId ? 'teacher_quizzes' : 'all_quizzes';
      const cached = await getCache<Quiz[]>(key);
      if (courseId && cached) return cached.filter(q => q.course_id === courseId);
      return cached || [];
    }

    let query = withSession(supabase.from('quizzes'), user?.sessionId).select('*, courses(*)');
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    const { data, error } = await query;
    if (error) throw error;

    const key = teacherId ? 'teacher_quizzes' : 'all_quizzes';
    if (data) await setCache(key, data);

    return data || [];
  }, [user?.sessionId, isOnline, getCache, setCache]);

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

  const proxiedClient = useMemo(() => {
    return new Proxy(supabase, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (prop === 'from' || prop === 'rpc') {
          return (...args: unknown[]) => {
            const result = (value as (...args: unknown[]) => unknown).apply(target, args);
            return withSession(result, user?.sessionId);
          };
        }
        return value;
      }
    });
  }, [user?.sessionId]);

  return {
    client: proxiedClient,
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
