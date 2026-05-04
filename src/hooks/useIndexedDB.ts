import { useState, useEffect, useCallback } from 'react';
import { Submission, QuizSubmission, Course, User, PlannerItem, Discussion } from '@/lib/types';
import * as actions from '@/lib/api-actions';

const DB_NAME = 'smartlms-offline-v3';
const DB_VERSION = 3;
const STORE_SYNC = 'sync-queue';
const STORE_CACHE = 'lms-cache';

export interface QueueItem {
  id?: number;
  type: 'ENROLL' | 'SUBMISSION' | 'QUIZ_SUBMISSION' | 'PROFILE_UPDATE' | 'COURSE_SAVE' | 'ASSIGNMENT_SAVE' | 'QUIZ_SAVE' | 'DISCUSSION_POST' | 'PLANNER_UPDATE' | 'SETTING_UPDATE' | 'LESSON_COMPLETE' | 'ATTENDANCE';
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
            const { course_id, enrollmentCode } = item.payload as { course_id: string, enrollmentCode?: string };
            const enrollRes = await actions.enrollInCourse(course_id, enrollmentCode);
            if (enrollRes.success) success = true;
            break;
          case 'SUBMISSION':
            const { assignment_id, ...subContent } = item.payload as Partial<Submission> & { assignment_id: string };
            const subRes = await actions.submitAssignment(assignment_id, subContent);
            if (subRes.success) success = true;
            break;
          case 'QUIZ_SUBMISSION':
            const { quiz_id, ...quizContent } = item.payload as Partial<QuizSubmission> & { quiz_id: string };
            const quizRes = await actions.submitQuiz(quiz_id, quizContent);
            if (quizRes.success) success = true;
            break;
          case 'PROFILE_UPDATE':
            const profRes = await actions.saveUser(item.payload as Partial<User>);
            if (profRes.success) success = true;
            break;
          case 'COURSE_SAVE':
            const courseRes = await actions.saveCourse(item.payload as Partial<Course>);
            if (courseRes.success) success = true;
            break;
          case 'ASSIGNMENT_SAVE':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const assignRes = await actions.saveAssignment(item.payload as any);
            if (assignRes.success) success = true;
            break;
          case 'QUIZ_SAVE':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const qRes = await actions.saveQuiz(item.payload as any);
            if (qRes.success) success = true;
            break;
          case 'DISCUSSION_POST':
            const dRes = await actions.saveDiscussionPost(item.payload as Partial<Discussion>);
            if (dRes.success) success = true;
            break;
          case 'PLANNER_UPDATE':
            const pRes = await actions.savePlannerItem(item.payload as Partial<PlannerItem>);
            if (pRes.success) success = true;
            break;
          case 'SETTING_UPDATE':
            const { p_key, p_value } = item.payload as { p_key: string, p_value: unknown };
            const sRes = await actions.updateSetting(p_key, p_value);
            if (sRes.success) success = true;
            break;
          case 'LESSON_COMPLETE':
            const { lesson_id, course_id: l_course_id } = item.payload as { lesson_id: string, course_id: string };
            const lcRes = await actions.markLessonComplete(lesson_id, l_course_id);
            if (lcRes.success) success = true;
            break;
          case 'ATTENDANCE':
            const { live_class_id } = item.payload as { live_class_id: string };
            const attRes = await actions.recordAttendance(live_class_id);
            if (attRes.success) success = true;
            break;
        }

        if (success && item.id) {
          await removeFromQueue(item.id);
        }
      } catch (err: unknown) {
        console.error('Sync failed for item:', item, err);
        const error = err as Error;
        const terminalErrors = ['Conflict detected', 'Forbidden', 'Unauthorized', 'Invalid enrollment code', 'Course not found', 'User not found'];
        const isTerminal = terminalErrors.some(msg => error.message?.includes(msg));

        if (isTerminal && item.id) {
          console.warn('Terminal error during sync, removing item from queue:', item, error.message);
          await removeFromQueue(item.id);
        }
      }
    }
  }, [isOnline, db, getQueue, removeFromQueue]);

  const pullData = useCallback(async (userId: string, sessionId: string, role: string) => {
    if (!isOnline) return;
    try {
        if (role === 'student') {
            const [courses, enrollments, assignments, quizzes, materials, planner, liveClasses, discussions, completions] = await Promise.all([
                actions.getCourses(),
                actions.getEnrollments(userId),
                actions.getAssignments(),
                actions.getQuizzes(),
                actions.getMaterials(),
                actions.getPlannerItems(userId),
                actions.getLiveClasses(),
                actions.getDiscussions('global'), // Or relevant course id if context exists
                actions.getLessonCompletions(userId)
            ]);

            if (courses) await setCache('all_courses', courses);
            if (enrollments) await setCache('my_enrollments', enrollments);
            if (assignments) await setCache('all_assignments', assignments);
            if (quizzes) await setCache('all_quizzes', quizzes);
            if (materials) await setCache('all_materials', materials);
            if (planner) await setCache('planner_items', planner);
            if (liveClasses) await setCache('all_live_classes', liveClasses);
            if (discussions) await setCache('recent_discussions', discussions);
            if (completions) await setCache('lesson_completions', completions);
        } else if (role === 'teacher') {
             const [courses, assignments, quizzes, materials, submissions, liveClasses] = await Promise.all([
                actions.getCourses(userId),
                actions.getAssignments(userId),
                actions.getQuizzes(undefined, userId),
                actions.getMaterials(),
                actions.getSubmissions(),
                actions.getLiveClasses(undefined, userId)
            ]);

            if (courses) await setCache('teacher_courses', courses);
            if (assignments) await setCache('teacher_assignments', assignments);
            if (quizzes) await setCache('teacher_quizzes', quizzes);
            if (materials) await setCache('teacher_materials', materials);
            if (submissions) await setCache('teacher_submissions', submissions);
            if (liveClasses) await setCache('teacher_live_classes', liveClasses);
        } else if (role === 'admin') {
            const [users, courses, logs, settings] = await Promise.all([
                actions.getUsers(),
                actions.getCourses(),
                actions.getSystemLogs(100),
                actions.getSettings()
            ]);

            if (users) await setCache('admin_users', users);
            if (courses) await setCache('admin_courses', courses);
            if (logs) await setCache('admin_logs', logs);
            if (settings) await setCache('admin_settings', settings);
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
