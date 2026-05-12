"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  User, Maintenance, Notification, CourseDTO, EnrollmentDTO, AssignmentDTO, SubmissionDTO, SignupRequestDTO
} from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { Toast, ToastMessage, ToastType } from './ui/Toast';
import * as actions from '@/lib/api-actions';
import { sessionManager } from '@/lib/session-manager';
import { useRouter } from 'next/navigation';

export interface DashboardStats {
  courses: number;
  dueSoon: number;
  pendingGrading?: number;
  liveClasses?: number;
  totalUsers?: number;
  activeCourses?: number;
  flaggedUsers?: number;
  teachers?: number;
  students?: number;
  pendingResets?: number;
}

interface AppState {
  user: User | null;
  isLoading: boolean;
  isAuthLoading: boolean;
  isDataLoading: boolean;
  maintenance: Maintenance;
  notifications: Notification[];
  isSidebarOpen: boolean;
  isOnline: boolean;
  isBackendConnected: boolean;
  stats: DashboardStats;
  enrollments: EnrollmentDTO[];
  courses: CourseDTO[];
  assignments: AssignmentDTO[];
  submissions: SubmissionDTO[];
}

interface AppContextType extends AppState {
  role: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (userData: SignupRequestDTO) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  toggleSidebar: () => void;
  fetchNotifications: (userId: string, force?: boolean) => Promise<void>;
  addToast: (message: string, type: ToastType, duration?: number) => void;
  refreshDashboardData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App State
  const { setCache, getCache, addToQueue, isOnline, isBackendConnected, checkBackend, pullData } = useIndexedDB();
  const [maintenance, setMaintenance] = useState<Maintenance>({ id: "system-config", enabled: false, schedules: [] });
  const [isCurrentlyInMaintenance, setIsCurrentlyInMaintenance] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ courses: 0, dueSoon: 0 });
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const router = useRouter();
  const initialized = useRef(false);

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Auth Actions
  const login = useCallback(async (email: string, pass: string) => {
    const result = await actions.login({ email, password: pass });
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = result.data!.user as User;
    await setCache('current_user', u);
    setUser(u);
  }, [setCache]);

  const signup = useCallback(async (userData: SignupRequestDTO) => {
    const result = await actions.signup(userData);
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = result.data!.user as User;
    await setCache('current_user', u);
    setUser(u);
  }, [setCache]);

  const logout = useCallback(async () => {
    try {
        const res = await actions.logout();
        if (!res.success) {
            console.error('Logout backend failure:', res.error);
        }
    } catch (err) {
        console.error('Logout network/server error:', err);
    }

    // 1. Trigger full client-side data purge (Storage + IndexedDB)
    sessionManager.cleanupSession();

    // 2. Clear application state
    setUser(null);
    setNotifications([]);
    setStats({ courses: 0, dueSoon: 0 });
    setEnrollments([]);
    setCourses([]);
    setAssignments([]);
    setSubmissions([]);

    // 3. SPA-friendly redirect
    router.push('/');
  }, [router]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };

    await setCache('current_user', updatedUser);
    setUser(updatedUser);

    if (isOnline) {
        const res = await actions.updateProfile(updates);
        if (!res.success) {
            throw new Error(res.error);
        }
    } else {
        await addToQueue('PROFILE_UPDATE', { id: user.id, ...updates });
    }
  }, [user, isOnline, setCache, addToQueue]);

  // App Initialization
  const initApp = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      // Auth init
      const userDTO = await actions.getMe();
      if (userDTO) {
          const u = userDTO as User;
          await setCache('current_user', u);
          setUser(u);
          pullData(u.id, u.role);
      } else {
          const cachedUser = await getCache<User>('current_user');
          if (cachedUser) setUser(cachedUser);
      }
      setIsAuthLoading(false);

      // Maintenance init
      const cachedMaint = await getCache<Maintenance>('maintenance', 5 * 60 * 1000);
      if (cachedMaint) {
        setMaintenance(cachedMaint);
      }

      if (isOnline && (!cachedMaint || isBackendConnected)) {
        const isConnected = await checkBackend();
        if (isConnected) {
            const m = await actions.getMaintenance();
            setMaintenance(m as unknown as Maintenance);
            await setCache('maintenance', m);
        }
      }
    } catch (err) {
      console.error('App initialization error:', err);
      setIsAuthLoading(false);
    }
  }, [getCache, setCache, isOnline, isBackendConnected, checkBackend, pullData]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Notifications logic
  const fetchNotifications = useCallback(async (userId: string, force = false) => {
    if (!userId || userId === 'undefined' || userId === 'null') return;
    try {
      const cachedNotes = await getCache<Notification[]>('notifications', force ? 0 : 60000);
      if (cachedNotes) {
        setNotifications(cachedNotes);
        if (!force) return;
      }

      if (isOnline) {
        const isConnected = await checkBackend();
        if (!isConnected) return;

        try {
          const n = await actions.getNotifications(userId);
          if (n && Array.isArray(n)) {
            setNotifications(n);
            await setCache('notifications', n);
          }
        } catch (fetchErr) {
          console.error('Failed to fetch notifications:', fetchErr);
        }
      }
    } catch (err) {
      console.error('Notification init error:', err);
    }
  }, [getCache, setCache, isOnline, checkBackend]);

  useEffect(() => {
    if (user) {
        fetchNotifications(user.id);
        const interval = setInterval(() => {
            if (isOnline) fetchNotifications(user.id);
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }
  }, [user, isOnline, fetchNotifications]);

  // Dashboard Data
  const refreshDashboardData = useCallback(async () => {
    if (!user) return;

    if (!isOnline) {
        if (user.role === 'student') {
            const cachedEnrollments = await getCache<EnrollmentDTO[]>('my_enrollments');
            const cachedAssignments = await getCache<AssignmentDTO[]>('all_assignments');
            const cachedSubmissions = await getCache<SubmissionDTO[]>('my_submissions');
            if (cachedEnrollments) setEnrollments(cachedEnrollments);
            if (cachedAssignments) setAssignments(cachedAssignments);
            if (cachedSubmissions) setSubmissions(cachedSubmissions);
        } else if (user.role === 'teacher') {
            const cachedCourses = await getCache<CourseDTO[]>('teacher_courses');
            const cachedSubmissions = await getCache<SubmissionDTO[]>('teacher_submissions');
            if (cachedCourses) setCourses(cachedCourses);
            if (cachedSubmissions) setSubmissions(cachedSubmissions);
        }
        return;
    }

    const isConnected = await checkBackend();
    if (!isConnected) return;

    setIsDataLoading(true);
    try {
      if (user.role === 'student') {
          const [myEnrollments, allAssignments, mySubmissions] = await Promise.all([
            actions.getEnrollments(user.id),
            actions.getAssignments(),
            actions.getSubmissions({ studentId: user.id })
          ]);

          setEnrollments(myEnrollments);
          setSubmissions(mySubmissions);

          const enrolledIds = myEnrollments.map((e: EnrollmentDTO) => e.course_id);
          const pending = allAssignments.filter((a: AssignmentDTO) =>
            enrolledIds.includes(a.course_id) &&
            new Date(a.due_date) > new Date() &&
            !mySubmissions.some((s: SubmissionDTO) => s.assignment_id === a.id)
          );

          setAssignments(pending);
          setStats({
            courses: myEnrollments.length,
            dueSoon: pending.length
          });

          await setCache('my_enrollments', myEnrollments);
          await setCache('all_assignments', allAssignments);
          await setCache('my_submissions', mySubmissions);
      } else if (user.role === 'teacher') {
          const [myCourses, pendingSubmissions, myLiveClasses] = await Promise.all([
              actions.getCourses(user.id),
              actions.getSubmissions({ status: 'submitted' }),
              actions.getLiveClasses(undefined, user.id)
          ]);

          setCourses(myCourses);
          setSubmissions(pendingSubmissions);
          setStats({
            courses: myCourses.length,
            pendingGrading: pendingSubmissions.length,
            liveClasses: myLiveClasses.length,
            dueSoon: 0 // Not applicable but matching interface
          });

          await setCache('teacher_courses', myCourses);
          await setCache('teacher_submissions', pendingSubmissions);
      } else if (user.role === 'admin') {
          const [allUsers, systemStats] = await Promise.all([
              actions.getUsers(),
              actions.getSystemStats()
          ]);

          setStats({
            courses: systemStats.courses ?? 0,
            dueSoon: 0,
            totalUsers: systemStats.users ?? allUsers.length,
            activeCourses: systemStats.courses ?? 0,
            flaggedUsers: allUsers.filter(u => u.flagged).length,
            teachers: allUsers.filter(u => u.role === 'teacher').length,
            students: allUsers.filter(u => u.role === 'student').length,
            pendingResets: allUsers.filter(u => !!u.reset_request).length
          });
      }
    } catch (err) {
      console.error('Dashboard refresh error:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [user, isOnline, getCache, setCache, checkBackend]);

  useEffect(() => {
    if (user) {
        refreshDashboardData();
    }
  }, [user, refreshDashboardData]);

  // Maintenance sync
  useEffect(() => {
    const checkMaint = () => {
        const now = new Date();
        const isInSchedule = maintenance.schedules?.some(s => {
            const start = new Date(s.start_at);
            const end = new Date(s.end_at);
            return now >= start && now <= end;
        });
        setIsCurrentlyInMaintenance(maintenance.enabled || !!isInSchedule);
    };
    checkMaint();
    const interval = setInterval(checkMaint, 60000);
    return () => clearInterval(interval);
  }, [maintenance]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const value = useMemo(() => ({
    user,
    isLoading: isAuthLoading || isDataLoading,
    isAuthLoading,
    isDataLoading,
    role: user?.role || null,
    maintenance: { ...maintenance, enabled: isCurrentlyInMaintenance },
    notifications,
    isSidebarOpen,
    isOnline,
    isBackendConnected,
    stats,
    enrollments,
    courses,
    assignments,
    submissions,
    login,
    signup,
    logout,
    updateProfile,
    toggleSidebar,
    fetchNotifications,
    addToast,
    refreshDashboardData
  }), [user, isAuthLoading, isDataLoading, maintenance, isCurrentlyInMaintenance, notifications, isSidebarOpen, isOnline, isBackendConnected, stats, enrollments, assignments, submissions, login, signup, logout, updateProfile, toggleSidebar, fetchNotifications, addToast, refreshDashboardData]);

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

// Unified hooks and providers to avoid breaking existing imports
export const useAuth = useAppContext;
export const AuthProvider = AppProvider;
