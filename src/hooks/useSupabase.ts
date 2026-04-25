import { useAuth } from '@/components/auth/AuthContext';
import { useCallback, useMemo } from 'react';
import { supabase, withSession } from '@/lib/supabase';
import { User, Course, Enrollment, Assignment, Quiz, Discussion, Notification, Maintenance } from '@/lib/types';
import { useIndexedDB } from './useIndexedDB';
import { apiClient } from '@/lib/api-client';

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

    const users = await apiClient.get<User[]>('/api/system/users');
    const data = users.find(u => u.id === id) || null;
    if (data && data.id === user?.id) await setCache('current_user', data);
    return data;
  }, [user?.id, isOnline, getCache, setCache]);

  const saveUser = useCallback(async (u: Partial<User>): Promise<User> => {
    const res = await apiClient.post<User>('/api/system/users/update', u);
    return res;
  }, []);

  // Course operations
  const getCourses = useCallback(async (teacherId?: string): Promise<Course[]> => {
    if (!isOnline) {
      const key = teacherId ? 'teacher_courses' : 'all_courses';
      const cached = await getCache<Course[]>(key);
      return cached || [];
    }

    const data = await apiClient.get<Course[]>(teacherId ? `/api/courses?teacherId=${teacherId}` : '/api/courses');
    const key = teacherId ? 'teacher_courses' : 'all_courses';
    if (data) await setCache(key, data);

    return data || [];
  }, [isOnline, getCache, setCache]);

  // Enrollment operations
  const getEnrollments = useCallback(async (studentId: string): Promise<Enrollment[]> => {
    if (!isOnline) {
      const cached = await getCache<Enrollment[]>('my_enrollments');
      return cached || [];
    }

    const data = await apiClient.get<Enrollment[]>(`/api/system/enrollments?studentId=${studentId}`);
    if (data) await setCache('my_enrollments', data);
    return data || [];
  }, [isOnline, getCache, setCache]);

  const enrollInCourse = useCallback(async (courseId: string): Promise<Enrollment> => {
    await apiClient.post(`/api/system/enroll?courseId=${courseId}`);
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

    let url = '/api/assignments?';
    if (teacherId) url += `teacherId=${teacherId}&`;
    if (courseId) url += `courseId=${courseId}`;
    const data = await apiClient.get<Assignment[]>(url);
    const key = teacherId ? 'teacher_assignments' : 'all_assignments';
    if (data) await setCache(key, data);

    return data || [];
  }, [isOnline, getCache, setCache]);

  // Quiz operations
  const getQuizzes = useCallback(async (courseId?: string, teacherId?: string): Promise<Quiz[]> => {
    if (!isOnline) {
      const key = teacherId ? 'teacher_quizzes' : 'all_quizzes';
      const cached = await getCache<Quiz[]>(key);
      if (courseId && cached) return cached.filter(q => q.course_id === courseId);
      return cached || [];
    }

    let url = '/api/quizzes?';
    if (teacherId) url += `teacherId=${teacherId}&`;
    if (courseId) url += `courseId=${courseId}`;
    const data = await apiClient.get<Quiz[]>(url);
    const key = teacherId ? 'teacher_quizzes' : 'all_quizzes';
    if (data) await setCache(key, data);

    return data || [];
  }, [isOnline, getCache, setCache]);

  // Discussion operations
  const getDiscussions = useCallback(async (courseId: string): Promise<Discussion[]> => {
    return await apiClient.get<Discussion[]>(`/api/system/discussions?courseId=${courseId}`);
  }, []);

  // Notification operations
  const getNotifications = useCallback(async (userId: string): Promise<Notification[]> => {
    return await apiClient.get<Notification[]>(`/api/system/notifications?userId=${userId}`);
  }, []);

  // Maintenance operations
  const getMaintenance = useCallback(async (): Promise<Maintenance> => {
    return await apiClient.get<Maintenance>('/api/system/maintenance');
  }, []);

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
