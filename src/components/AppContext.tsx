/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Maintenance, Notification } from '@/lib/types';
import { useAuth } from './auth/AuthContext';

interface AppContextType {
  maintenance: Maintenance;
  notifications: Notification[];
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  fetchNotifications: (email: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getMaintenance, getNotifications } = useSupabase();
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState<Maintenance>({ enabled: false, schedules: [] });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const init = useCallback(async () => {
    try {
      const m = await getMaintenance();
      setMaintenance(m);
    } catch (err) {
      console.error('Failed to init app context:', err);
    }
  }, [getMaintenance]);

  const fetchNotifications = useCallback(async (email: string) => {
    try {
      const n = await getNotifications(email);
      setNotifications(n);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [getNotifications]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (user) {
        fetchNotifications(user.email);
    }
  }, [user]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const value = useMemo(() => ({
    maintenance,
    notifications,
    isSidebarOpen,
    toggleSidebar,
    fetchNotifications
  }), [maintenance, notifications, isSidebarOpen, toggleSidebar, fetchNotifications]);

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
