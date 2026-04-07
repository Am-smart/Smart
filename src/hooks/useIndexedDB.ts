import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Enrollment, Submission, QuizSubmission } from '@/lib/types';

const DB_NAME = 'smartlms-offline';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

export interface QueueItem {
  id?: number;
  type: string;
  payload: unknown;
  timestamp: number;
}

export const useIndexedDB = () => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
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

  const addToQueue = useCallback(async (type: string, payload: unknown) => {
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({ type, payload, timestamp: Date.now() });
  }, [db]);

  const getQueue = useCallback(async (): Promise<QueueItem[]> => {
    if (!db) return [];
    return new Promise<QueueItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as QueueItem[]);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  const removeFromQueue = useCallback(async (id: number) => {
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  }, [db]);

  const processSync = useCallback(async () => {
    if (!isOnline || !db) return;
    const queue = await getQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} items...`);

    for (const item of queue) {
      try {
        let success = false;
        switch (item.type) {
          case 'ENROLL':
            const { error: enrollError } = await supabase.from('enrollments').upsert(item.payload as Partial<Enrollment>, { onConflict: 'course_id,student_email' });
            if (!enrollError) success = true;
            break;
          case 'SUBMISSION':
            const { error: subError } = await supabase.from('submissions').upsert(item.payload as Partial<Submission>, { onConflict: 'assignment_id,student_email' });
            if (!subError) success = true;
            break;
          case 'QUIZ_SUBMISSION':
            const { error: quizError } = await supabase.from('quiz_submissions').upsert(item.payload as Partial<QuizSubmission>, { onConflict: 'quiz_id,student_email' });
            if (!quizError) success = true;
            break;
          default:
            console.warn('Unknown sync item type:', item.type);
            success = true; // Mark as processed to remove from queue
        }

        if (success && item.id) {
          await removeFromQueue(item.id);
        }
      } catch (err) {
        console.error('Sync failed for item:', item, err);
      }
    }
  }, [isOnline, db, getQueue, removeFromQueue]);

  useEffect(() => {
    if (isOnline) {
      processSync();
    }
  }, [isOnline, processSync]);

  return { addToQueue, getQueue, removeFromQueue, processSync, isOnline };
};
