import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { Enrollment, Submission, QuizSubmission, Course, Assignment, Quiz, User } from '@/lib/types';

const DB_NAME = 'smartlms-offline-v3';
const DB_VERSION = 3;
const STORE_SYNC = 'sync-queue';
const STORE_CACHE = 'lms-cache';

export interface QueueItem {
  id?: number;
  type: 'ENROLL' | 'SUBMISSION' | 'QUIZ_SUBMISSION' | 'PROFILE_UPDATE' | 'COURSE_SAVE' | 'ASSIGNMENT_SAVE' | 'QUIZ_SAVE';
  payload: unknown;
  userEmail?: string;
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

  const addToQueue = useCallback(async (type: QueueItem['type'], payload: unknown, userEmail?: string) => {
    if (!db) return;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC, 'readwrite');
        const store = tx.objectStore(STORE_SYNC);
        const request = store.add({ type, payload, userEmail, timestamp: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }, [db]);

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
        const client = createSupabaseClient(item.userEmail);
        let success = false;
        switch (item.type) {
          case 'ENROLL':
            const { error: enrollError } = await client.from('enrollments').upsert(item.payload as Partial<Enrollment>, { onConflict: 'course_id,student_email' });
            if (!enrollError) success = true;
            break;
          case 'SUBMISSION':
            const { error: subError } = await client.from('submissions').upsert(item.payload as Partial<Submission>, { onConflict: 'assignment_id,student_email' });
            if (!subError) success = true;
            break;
          case 'QUIZ_SUBMISSION':
            const { error: quizError } = await client.from('quiz_submissions').upsert(item.payload as Partial<QuizSubmission>, { onConflict: 'quiz_id,student_email' });
            if (!quizError) success = true;
            break;
          case 'PROFILE_UPDATE':
            const { error: profError } = await client.from('users').update(item.payload as Partial<User>).eq('email', (item.payload as { email: string }).email);
            if (!profError) success = true;
            break;
          case 'COURSE_SAVE':
            const { error: cError } = await client.from('courses').upsert(item.payload as Partial<Course>, { onConflict: 'id' });
            if (!cError) success = true;
            break;
          case 'ASSIGNMENT_SAVE':
            const { error: aError } = await client.from('assignments').upsert(item.payload as Partial<Assignment>, { onConflict: 'id' });
            if (!aError) success = true;
            break;
          case 'QUIZ_SAVE':
            const { error: qError } = await client.from('quizzes').upsert(item.payload as Partial<Quiz>, { onConflict: 'id' });
            if (!qError) success = true;
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

  const pullData = useCallback(async (userEmail: string, role: string) => {
    if (!isOnline) return;
    try {
        const client = createSupabaseClient(userEmail);
        if (role === 'student') {
            const [courses, enrollments, assignments, quizzes] = await Promise.all([
                client.from('courses').select('*').eq('status', 'published'),
                client.from('enrollments').select('*, courses(*)').eq('student_email', userEmail),
                client.from('assignments').select('*, courses(*)').eq('status', 'published'),
                client.from('quizzes').select('*, courses(*)').eq('status', 'published')
            ]);

            if (courses.data) await setCache('all_courses', courses.data);
            if (enrollments.data) await setCache('my_enrollments', enrollments.data);
            if (assignments.data) await setCache('all_assignments', assignments.data);
            if (quizzes.data) await setCache('all_quizzes', quizzes.data);
        } else if (role === 'teacher') {
             const [courses, assignments, quizzes] = await Promise.all([
                client.from('courses').select('*').eq('teacher_email', userEmail),
                client.from('assignments').select('*, courses(*)').eq('teacher_email', userEmail),
                client.from('quizzes').select('*, courses(*)').eq('teacher_email', userEmail)
            ]);

            if (courses.data) await setCache('teacher_courses', courses.data);
            if (assignments.data) await setCache('teacher_assignments', assignments.data);
            if (quizzes.data) await setCache('teacher_quizzes', quizzes.data);
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
