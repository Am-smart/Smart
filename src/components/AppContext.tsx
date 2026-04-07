/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Maintenance, Notification } from '@/lib/types';
import { useAuth } from './auth/AuthContext';
import { useIndexedDB } from '@/hooks/useIndexedDB';

interface AppContextType {
  maintenance: Maintenance;
  notifications: Notification[];
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  fetchNotifications: (email: string) => Promise<void>;
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getMaintenance, getNotifications } = useSupabase();
  const { user } = useAuth();
  const { setCache, getCache, isOnline, pullData } = useIndexedDB();
  const [maintenance, setMaintenance] = useState<Maintenance>({ enabled: false, schedules: [] });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const init = useCallback(async () => {
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

  const fetchNotifications = useCallback(async (email: string) => {
    try {
      const cachedNotes = await getCache<Notification[]>('notifications');
      if (cachedNotes) setNotifications(cachedNotes);

      if (isOnline) {
        const n = await getNotifications(email);
        setNotifications(n);
        await setCache('notifications', n);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [getNotifications, getCache, setCache, isOnline]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) {
        fetchNotifications(user.email);
        if (isOnline) {
            pullData(user.email, user.role);
        }
    }
  }, [user, isOnline, pullData, fetchNotifications]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const value = useMemo(() => ({
    maintenance,
    notifications,
    isSidebarOpen,
    toggleSidebar,
    fetchNotifications,
    isOnline
  }), [maintenance, notifications, isSidebarOpen, toggleSidebar, fetchNotifications, isOnline]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
