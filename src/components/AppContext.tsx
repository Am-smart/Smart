"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Maintenance, Notification } from '@/lib/types';
import { useAuth } from './auth/AuthContext';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { Toast, ToastMessage, ToastType } from './ui/Toast';
import * as actions from '@/lib/api-actions';

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
  const { user } = useAuth();
  const { setCache, getCache, isOnline, pullData } = useIndexedDB();
  const [maintenance, setMaintenance] = useState<Maintenance>({ id: "system-config", enabled: false, schedules: [] });
  const [isCurrentlyInMaintenance, setIsCurrentlyInMaintenance] = useState(false);
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
        const m = await actions.getMaintenance();
        const maintData = m as unknown as Maintenance;
        setMaintenance(maintData);

        // Auto-check schedule
        const now = new Date();
        const isInSchedule = maintData.schedules?.some(s => {
            const start = new Date(s.start_at);
            const end = new Date(s.end_at);
            return now >= start && now <= end;
        });

        setIsCurrentlyInMaintenance(maintData.enabled || !!isInSchedule);
        await setCache('maintenance', maintData);
      }
    } catch (err) {
      console.error('Failed to init app context:', err);
    }
  }, [getCache, setCache, isOnline]);

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
          const n = await actions.getNotifications(userId);
          if (n && Array.isArray(n)) {
            setNotifications(n);
            await setCache('notifications', n);
          }
        } catch (fetchErr) {
          console.error('Failed to fetch notifications from server:', fetchErr);
        }
      }
    } catch (err) {
      console.error('Failed to initialize notifications:', err);
    }
  }, [getCache, setCache, isOnline]);

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

  // Realtime functionality is disabled for now to enforce backend-only access.
  // In a future step, this should be replaced with a WebSocket or Server-Sent Events implementation
  // that is managed by the backend, rather than direct Supabase client exposure in the frontend.

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const value = useMemo(() => ({
    maintenance: { ...maintenance, enabled: isCurrentlyInMaintenance },
    notifications,
    isSidebarOpen,
    toggleSidebar,
    fetchNotifications,
    isOnline,
    addToast
  }), [maintenance, notifications, isSidebarOpen, toggleSidebar, fetchNotifications, isOnline, addToast, isCurrentlyInMaintenance]);

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
