import { useState, useEffect, useCallback } from 'react';
import { supabase, withSession } from '@/lib/supabase';
import { Enrollment, Submission, QuizSubmission, Course, Assignment, Quiz, User } from '@/lib/types';

const DB_NAME = 'smartlms-offline-v3';
const DB_VERSION = 3;
const STORE_SYNC = 'sync-queue';
const STORE_CACHE = 'lms-cache';

export interface QueueItem {
  id?: number;
  type: 'ENROLL' | 'SUBMISSION' | 'QUIZ_SUBMISSION' | 'PROFILE_UPDATE' | 'COURSE_SAVE' | 'ASSIGNMENT_SAVE' | 'QUIZ_SAVE' | 'DISCUSSION_POST' | 'PLANNER_UPDATE' | 'SETTING_UPDATE';
  payload: unknown;
  sessionId?: string;
  timestamp: number;
}

export const useIndexedDB = () => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SYNC)) {
        db.createObjectStore(STORE_SYNC, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event: Event) => {
      setDb((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getQueue = useCallback(async (): Promise<QueueItem[]> => {
    if (!db) return [];
    return new Promise<QueueItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC, 'readonly');
      const store = tx.objectStore(STORE_SYNC);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as QueueItem[]);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  const removeFromQueue = useCallback(async (id: number) => {
    if (!db) return;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC, 'readwrite');
        const store = tx.objectStore(STORE_SYNC);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }, [db]);

  const addToQueue = useCallback(async (type: QueueItem['type'], payload: unknown, sessionId?: string) => {
    if (!db) return;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC, 'readwrite');
        const store = tx.objectStore(STORE_SYNC);
        const request = store.add({ type, payload, sessionId, timestamp: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }, [db]);

  const setCache = useCallback(async (key: string, data: unknown) => {
    if (!db) return;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_CACHE, 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        const request = store.put({ key, data, timestamp: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }, [db]);

  const getCache = useCallback(async <T>(key: string): Promise<T | null> => {
    if (!db) return null;
    return new Promise<T | null>((resolve) => {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ? (request.result.data as T) : null);
        request.onerror = () => resolve(null);
    });
  }, [db]);

  const processSync = useCallback(async () => {
    if (!isOnline || !db) return;
    const queue = await getQueue();
    if (queue.length === 0) return;

    console.log(`Processing sync queue: ${queue.length} items`);

    for (const item of queue) {
      try {
        let success = false;
        switch (item.type) {
          case 'ENROLL':
            const { error: enrollError } = await withSession(supabase.from('enrollments'), item.sessionId).upsert(item.payload as Partial<Enrollment>, { onConflict: 'course_id,student_id' });
            if (!enrollError) success = true;
            break;
          case 'SUBMISSION':
            const { error: subError } = await withSession(supabase.from('submissions'), item.sessionId).upsert(item.payload as Partial<Submission>, { onConflict: 'assignment_id,student_id' });
            if (!subError) success = true;
            break;
          case 'QUIZ_SUBMISSION':
            const { error: quizError } = await withSession(supabase.from('quiz_submissions'), item.sessionId).upsert(item.payload as Partial<QuizSubmission>, { onConflict: 'quiz_id,student_id' });
            if (!quizError) success = true;
            break;
          case 'PROFILE_UPDATE':
            const { error: profError } = await withSession(supabase.from('users'), item.sessionId).update(item.payload as Partial<User>).eq('id', (item.payload as { id: string }).id);
            if (!profError) success = true;
            break;
          case 'COURSE_SAVE':
            const { error: cError } = await withSession(supabase.from('courses'), item.sessionId).upsert(item.payload as Partial<Course>, { onConflict: 'id' });
            if (!cError) success = true;
            break;
          case 'ASSIGNMENT_SAVE':
            const { error: aError } = await withSession(supabase.from('assignments'), item.sessionId).upsert(item.payload as Partial<Assignment>, { onConflict: 'id' });
            if (!aError) success = true;
            break;
          case 'QUIZ_SAVE':
            const { error: qError } = await withSession(supabase.from('quizzes'), item.sessionId).upsert(item.payload as Partial<Quiz>, { onConflict: 'id' });
            if (!qError) success = true;
            break;
          case 'DISCUSSION_POST':
            const { error: dError } = await withSession(supabase.from('discussions'), item.sessionId).insert([item.payload]);
            if (!dError) success = true;
            break;
          case 'PLANNER_UPDATE':
            const { error: pError } = await withSession(supabase.from('planner'), item.sessionId).upsert(item.payload as Record<string, unknown>, { onConflict: 'id' });
            if (!pError) success = true;
            break;
          case 'SETTING_UPDATE':
            const { p_key, p_value } = item.payload as { p_key: string, p_value: unknown };
            const { error: sError } = await withSession(supabase, item.sessionId).rpc('update_setting', { p_key, p_value });
            if (!sError) success = true;
            break;
        }

        if (success && item.id) {
          await removeFromQueue(item.id);
        }
      } catch (err) {
        console.error('Sync failed for item:', item, err);
      }
    }
  }, [isOnline, db, getQueue, removeFromQueue]);

  const pullData = useCallback(async (userId: string, sessionId: string, role: string) => {
    if (!isOnline) return;
    try {
        if (role === 'student') {
            const [courses, enrollments, assignments, quizzes, materials, planner, liveClasses, discussions] = await Promise.all([
                withSession(supabase.from('courses'), sessionId).select('*').eq('status', 'published'),
                withSession(supabase.from('enrollments'), sessionId).select('*, courses(*)').eq('student_id', userId),
                withSession(supabase.from('assignments'), sessionId).select('*, courses(*)').eq('status', 'published'),
                withSession(supabase.from('quizzes'), sessionId).select('*, courses(*)').eq('status', 'published'),
                withSession(supabase.from('materials'), sessionId).select('*, courses(*)'),
                withSession(supabase.from('planner'), sessionId).select('*').eq('user_id', userId),
                withSession(supabase.from('live_classes'), sessionId).select('*, courses(*)'),
                withSession(supabase.from('discussions'), sessionId).select('*, users(full_name)').order('created_at', { ascending: false }).limit(100)
            ]);

            if (courses.data) await setCache('all_courses', courses.data);
            if (enrollments.data) await setCache('my_enrollments', enrollments.data);
            if (assignments.data) await setCache('all_assignments', assignments.data);
            if (quizzes.data) await setCache('all_quizzes', quizzes.data);
            if (materials.data) await setCache('all_materials', materials.data);
            if (planner.data) await setCache('planner_items', planner.data);
            if (liveClasses.data) await setCache('all_live_classes', liveClasses.data);
            if (discussions.data) await setCache('recent_discussions', discussions.data);
        } else if (role === 'teacher') {
             const [courses, assignments, quizzes, materials, submissions, liveClasses] = await Promise.all([
                withSession(supabase.from('courses'), sessionId).select('*').eq('teacher_id', userId),
                withSession(supabase.from('assignments'), sessionId).select('*, courses(*)').eq('teacher_id', userId),
                withSession(supabase.from('quizzes'), sessionId).select('*, courses(*)').eq('teacher_id', userId),
                withSession(supabase.from('materials'), sessionId).select('*').eq('teacher_id', userId),
                withSession(supabase.from('submissions'), sessionId).select('*, assignments(*), users(*)'),
                withSession(supabase.from('live_classes'), sessionId).select('*').eq('teacher_id', userId)
            ]);

            if (courses.data) await setCache('teacher_courses', courses.data);
            if (assignments.data) await setCache('teacher_assignments', assignments.data);
            if (quizzes.data) await setCache('teacher_quizzes', quizzes.data);
            if (materials.data) await setCache('teacher_materials', materials.data);
            if (submissions.data) await setCache('teacher_submissions', submissions.data);
            if (liveClasses.data) await setCache('teacher_live_classes', liveClasses.data);
        } else if (role === 'admin') {
            const [users, courses, logs, settings] = await Promise.all([
                withSession(supabase.from('users'), sessionId).select('*'),
                withSession(supabase.from('courses'), sessionId).select('*'),
                withSession(supabase.from('system_logs'), sessionId).select('*').limit(100),
                withSession(supabase.from('settings'), sessionId).select('*')
            ]);

            if (users.data) await setCache('admin_users', users.data);
            if (courses.data) await setCache('admin_courses', courses.data);
            if (logs.data) await setCache('admin_logs', logs.data);
            if (settings.data) await setCache('admin_settings', settings.data);
        }
    } catch (err) {
        console.error('Data pull failed:', err);
    }
  }, [isOnline, setCache]);

  useEffect(() => {
    if (isOnline && db) {
      processSync();
    }
  }, [isOnline, db, processSync]);

  return { addToQueue, getQueue, removeFromQueue, setCache, getCache, processSync, pullData, isOnline };
};
