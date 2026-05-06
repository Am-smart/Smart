"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Maintenance, Notification, EnrollmentDTO, AssignmentDTO, SubmissionDTO } from '@/lib/types';
import { useAuth } from './auth/AuthContext';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { Toast, ToastMessage, ToastType } from './ui/Toast';
import * as actions from '@/lib/api-actions';

export interface DashboardStats {
  courses: number;
  dueSoon: number;
}

interface AppContextType {
  maintenance: Maintenance;
  notifications: Notification[];
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  fetchNotifications: (userId: string, force?: boolean) => Promise<void>;
  isOnline: boolean;
  isBackendConnected: boolean;
  addToast: (message: string, type: ToastType, duration?: number) => void;
  stats: DashboardStats;
  enrollments: EnrollmentDTO[];
  assignments: AssignmentDTO[];
  submissions: SubmissionDTO[];
  refreshDashboardData: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { setCache, getCache, isOnline, pullData } = useIndexedDB();
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [maintenance, setMaintenance] = useState<Maintenance>({ id: "system-config", enabled: false, schedules: [] });
  const [isCurrentlyInMaintenance, setIsCurrentlyInMaintenance] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ courses: 0, dueSoon: 0 });
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      // Try Cache (5 min fresh)
      const cachedMaint = await getCache<Maintenance>('maintenance', 5 * 60 * 1000);
      if (cachedMaint) {
        setMaintenance(cachedMaint);
        const now = new Date();
        const isInSchedule = cachedMaint.schedules?.some(s => {
            const start = new Date(s.start_at);
            const end = new Date(s.end_at);
            return now >= start && now <= end;
        });
        setIsCurrentlyInMaintenance(cachedMaint.enabled || !!isInSchedule);
      }

      if (isOnline && (!cachedMaint || isBackendConnected)) {
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
  }, [getCache, setCache, isOnline, isBackendConnected]);

  const fetchNotifications = useCallback(async (userId: string, force = false) => {
    try {
      // Try fresh cache first (1 min fresh)
      const cachedNotes = await getCache<Notification[]>('notifications', force ? 0 : 60000);
      if (cachedNotes) {
        setNotifications(cachedNotes);
        if (!force) return; // If we found fresh enough cache and not forcing, we are done
      } else {
        // Fallback to stale cache if no fresh cache found
        const staleNotes = await getCache<Notification[]>('notifications');
        if (staleNotes) setNotifications(staleNotes);
      }

      // Only fetch from server if online and backend reachable
      if (isOnline && isBackendConnected) {
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
  }, [getCache, setCache, isOnline, isBackendConnected]);

  useEffect(() => {
    init();
  }, [init]);

  const wasOnline = useRef(isOnline);
  const wasBackendConnected = useRef(isBackendConnected);

  useEffect(() => {
    if (wasOnline.current !== isOnline || wasBackendConnected.current !== isBackendConnected) {
      if (isOnline && isBackendConnected) {
        addToast('Connected to server - Synchronizing your data...', 'online');
      } else if (!isOnline) {
        addToast('Internet connection lost - Working offline.', 'offline');
      } else if (!isBackendConnected) {
        addToast('Server is currently unreachable - Working offline.', 'offline');
      }
      wasOnline.current = isOnline;
      wasBackendConnected.current = isBackendConnected;
    }
  }, [isOnline, isBackendConnected, addToast]);

  useEffect(() => {
    const checkConnectivity = async () => {
      if (isOnline) {
        const reachable = await actions.apiClient.checkHealth();
        setIsBackendConnected(reachable);
      } else {
        setIsBackendConnected(false);
      }
    };

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [isOnline]);

  useEffect(() => {
    if (user) {
        fetchNotifications(user.id);
        if (isOnline && isBackendConnected && user.sessionId) {
            pullData(user.id, user.sessionId, user.role);
        }

        // Periodic refresh for notifications (every 5 minutes)
        const interval = setInterval(() => {
            if (isOnline && isBackendConnected) {
                fetchNotifications(user.id);
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }
  }, [user, isOnline, isBackendConnected, pullData, fetchNotifications]);

  // Realtime functionality is disabled for now to enforce backend-only access.
  // In a future step, this should be replaced with a WebSocket or Server-Sent Events implementation
  // that is managed by the backend, rather than direct Supabase client exposure in the frontend.

  const refreshDashboardData = useCallback(async () => {
    if (!user || user.role !== 'student') return;

    // Try cache first (5 min fresh)
    const cachedEnrollments = await getCache<EnrollmentDTO[]>('my_enrollments', 5 * 60 * 1000);
    const cachedAssignments = await getCache<AssignmentDTO[]>('all_assignments', 5 * 60 * 1000);
    const cachedSubmissions = await getCache<SubmissionDTO[]>('my_submissions', 5 * 60 * 1000);

    if (cachedEnrollments && cachedAssignments && cachedSubmissions) {
      setEnrollments(cachedEnrollments);
      const enrolledIds = cachedEnrollments.map((e) => e.course_id);
      const pending = cachedAssignments.filter((a) =>
        enrolledIds.includes(a.course_id) &&
        new Date(a.due_date as string) > new Date() &&
        !cachedSubmissions.some((s) => s.assignment_id === a.id)
      );
      setAssignments(pending);
      setSubmissions(cachedSubmissions);
      setStats({ courses: cachedEnrollments.length, dueSoon: pending.length });
    }

    if (!isOnline || !isBackendConnected) return;

    setIsLoading(true);
    try {
      const [myEnrollments, allAssignments, mySubmissions] = await Promise.all([
        actions.getEnrollments(user.id),
        actions.getAssignments(),
        actions.getSubmissions(undefined, user.id)
      ]);

      const enrolledIds = myEnrollments.map((e: EnrollmentDTO) => e.course_id);
      const pendingAssignments = allAssignments.filter((a: AssignmentDTO) =>
        enrolledIds.includes(a.course_id) &&
        new Date(a.due_date as string) > new Date() &&
        !mySubmissions.some((s: SubmissionDTO) => s.assignment_id === a.id)
      );

      setEnrollments(myEnrollments);
      setAssignments(pendingAssignments);
      setSubmissions(mySubmissions);
      setStats({
        courses: myEnrollments.length,
        dueSoon: pendingAssignments.length
      });

      // Update cache
      await setCache('my_enrollments', myEnrollments);
      await setCache('all_assignments', allAssignments);
      // We should probably have a consistent key for submissions
      await setCache('my_submissions', mySubmissions);
    } catch (err) {
      console.error('Failed to refresh dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isOnline, isBackendConnected, getCache, setCache]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const value = useMemo(() => ({
    maintenance: { ...maintenance, enabled: isCurrentlyInMaintenance },
    notifications,
    isSidebarOpen,
    toggleSidebar,
    fetchNotifications,
    isOnline,
    isBackendConnected,
    addToast,
    stats,
    enrollments,
    assignments,
    submissions,
    refreshDashboardData,
    isLoading
  }), [maintenance, notifications, isSidebarOpen, toggleSidebar, fetchNotifications, isOnline, isBackendConnected, addToast, isCurrentlyInMaintenance, stats, enrollments, assignments, submissions, refreshDashboardData, isLoading]);

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
