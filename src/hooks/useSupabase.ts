import { useAuth } from '@/components/auth/AuthContext';
import { useCallback } from 'react';
import { User, Course, Enrollment, Assignment, Quiz, Discussion, Notification, Maintenance } from '@/lib/types';
import { useIndexedDB } from './useIndexedDB';
import * as actions from '@/lib/api-actions';

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

    const users = await actions.getUsers();
    const data = users.find(u => u.id === id) || null;
    if (data && data.id === user?.id) await setCache('current_user', data);
    return data as User | null;
  }, [user?.id, isOnline, getCache, setCache]);

  const saveUser = useCallback(async (u: Partial<User>): Promise<User> => {
    const res = await actions.saveUser(u);
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

    const data = await actions.getCourses(teacherId);
    const key = teacherId ? 'teacher_courses' : 'all_courses';
    if (data) await setCache(key, data);

    return data as unknown as Course[] || [];
  }, [isOnline, getCache, setCache]);

  // Enrollment operations
  const getEnrollments = useCallback(async (studentId: string): Promise<Enrollment[]> => {
    if (!isOnline) {
      const cached = await getCache<Enrollment[]>('my_enrollments');
      return cached || [];
    }

    const data = await actions.getEnrollments(studentId);
    if (data) await setCache('my_enrollments', data);
    return data as unknown as Enrollment[] || [];
  }, [isOnline, getCache, setCache]);

  const enrollInCourse = useCallback(async (courseId: string): Promise<Enrollment> => {
    const res = await actions.enrollInCourse(courseId);
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

    const data = await actions.getAssignments(teacherId, courseId);
    const key = teacherId ? 'teacher_assignments' : 'all_assignments';
    if (data) await setCache(key, data);

    return data as unknown as Assignment[] || [];
  }, [isOnline, getCache, setCache]);

  // Quiz operations
  const getQuizzes = useCallback(async (courseId?: string, teacherId?: string): Promise<Quiz[]> => {
    if (!isOnline) {
      const key = teacherId ? 'teacher_quizzes' : 'all_quizzes';
      const cached = await getCache<Quiz[]>(key);
      if (courseId && cached) return cached.filter(q => q.course_id === courseId);
      return cached || [];
    }

    const data = await actions.getQuizzes(courseId, teacherId);
    const key = teacherId ? 'teacher_quizzes' : 'all_quizzes';
    if (data) await setCache(key, data);

    return data as unknown as Quiz[] || [];
  }, [isOnline, getCache, setCache]);

  // Discussion operations
  const getDiscussions = useCallback(async (courseId: string): Promise<Discussion[]> => {
    return await actions.getDiscussions(courseId) as unknown as Discussion[];
  }, []);

  // Notification operations
  const getNotifications = useCallback(async (userId: string): Promise<Notification[]> => {
    return await actions.getNotifications(userId) as unknown as Notification[];
  }, []);

  // Maintenance operations
  const getMaintenance = useCallback(async (): Promise<Maintenance> => {
    const data = await actions.getMaintenance();
    return data as unknown as Maintenance;
  }, []);

  return {
    user,
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
