"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { Maintenance, Notification } from '@/lib/types';
import { useAuth } from './auth/AuthContext';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { Toast, ToastMessage, ToastType } from './ui/Toast';

interface AppContextType {
  maintenance: Maintenance;
  notifications: Notification[];
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  fetchNotifications: (userId: string) => Promise<void>;
  isOnline: boolean;
  addToast: (message: string, type: ToastType, duration?: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getMaintenance, getNotifications } = useSupabase();
  const { user } = useAuth();
  const { setCache, getCache, isOnline, pullData } = useIndexedDB();
  const [maintenance, setMaintenance] = useState<Maintenance>({ id: "system-config", enabled: false, schedules: [] });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Guard to prevent multiple initializations
  const initialized = useRef(false);

  const init = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      // Try Cache
      const cachedMaint = await getCache<Maintenance>('maintenance');
      if (cachedMaint) setMaintenance(cachedMaint);

      if (isOnline) {
        const m = await getMaintenance();
        setMaintenance(m);
        await setCache('maintenance', m);
      }
    } catch (err) {
      console.error('Failed to init app context:', err);
    }
  }, [getMaintenance, getCache, setCache, isOnline]);

  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      // Always try cache first for offline support
      const cachedNotes = await getCache<Notification[]>('notifications');
      if (cachedNotes && cachedNotes.length > 0) {
        setNotifications(cachedNotes);
      }

      // Only fetch from server if online
      if (isOnline) {
        try {
          const n = await getNotifications(userId);
          if (n && Array.isArray(n)) {
            setNotifications(n);
            await setCache('notifications', n);
          }
        } catch (fetchErr) {
          console.error('Failed to fetch notifications from server:', fetchErr);
          // Keep cached notifications if server fetch fails
        }
      }
    } catch (err) {
      console.error('Failed to initialize notifications:', err);
    }
  }, [getNotifications, getCache, setCache, isOnline]);

  useEffect(() => {
    init();
  }, [init]);

  const wasOnline = useRef(isOnline);

  useEffect(() => {
    if (wasOnline.current !== isOnline) {
      if (isOnline) {
        addToast('Back online - Synchronizing your data...', 'online');
      } else {
        addToast('Working offline - Some features may be limited.', 'offline');
      }
      wasOnline.current = isOnline;
    }
  }, [isOnline, addToast]);

  useEffect(() => {
    if (user) {
        fetchNotifications(user.id);
        if (isOnline && user.sessionId) {
            pullData(user.id, user.sessionId, user.role);
        }
    }
  }, [user, isOnline, pullData, fetchNotifications]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!user || !isOnline || !user.sessionId) return;

    let debounceTimer: NodeJS.Timeout;
    let isMounted = true;

    const setupSubscriptions = async () => {
      try {
        const client = supabase;

        // 1. Subscribe to Notifications
        const notesChannel = client.channel(`user-notes-${user.id}`)
          .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
          }, () => {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                if (isMounted) {
                  fetchNotifications(user.id);
                }
              }, 500);
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED' && !isMounted) {
              // Channel is ready but component unmounted, unsubscribe
              client.removeChannel(notesChannel);
            }
          });

        // 3. Subscribe to Enrollments & Lessons (Progress)
        const progressChannel = client.channel(`user-progress-${user.id}`)
          .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'enrollments',
              filter: `student_id=eq.${user.id}`
          }, () => {
              if (isMounted) addToast('Your course progress has been updated!', 'info');
          })
          .subscribe();

        // 4. Subscribe to Broadcasts
        const broadcastsChannel = client.channel('global-broadcasts')
          .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'broadcasts'
          }, (payload) => {
              if (!isMounted) return;
              
              const newBroadcast = payload.new as { id: string; target_role: string | null; title: string; message: string; link: string | null; created_at: string };
              if (!newBroadcast.target_role || newBroadcast.target_role === user.role) {
                  setNotifications(prev => [{
                      id: newBroadcast.id,
                      user_id: user.id,
                      title: newBroadcast.title,
                      message: newBroadcast.message,
                      link: newBroadcast.link || undefined,
                      type: 'broadcast',
                      is_read: false,
                      created_at: newBroadcast.created_at
                  }, ...prev]);
              }
          })
          .subscribe();

        // Return cleanup function
        return () => {
          clearTimeout(debounceTimer);
          if (notesChannel) client.removeChannel(notesChannel);
          if (progressChannel) client.removeChannel(progressChannel);
          if (broadcastsChannel) client.removeChannel(broadcastsChannel);
        };
      } catch (err) {
        console.error('Failed to setup subscriptions:', err);
      }
    };

    let cleanup: (() => void) | undefined;
    setupSubscriptions().then(fn => {
      if (fn && isMounted) cleanup = fn;
    });

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
      clearTimeout(debounceTimer);
    };
  }, [user, isOnline, fetchNotifications]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const value = useMemo(() => ({
    maintenance,
    notifications,
    isSidebarOpen,
    toggleSidebar,
    fetchNotifications,
    isOnline,
    addToast
  }), [maintenance, notifications, isSidebarOpen, toggleSidebar, fetchNotifications, isOnline, addToast]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toast toasts={toasts} removeToast={removeToast} />
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
