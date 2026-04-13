"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { TeacherHeader } from "@/components/TeacherHeader";
import { useRouter, usePathname } from 'next/navigation';
import { User, Notification } from '@/lib/types';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, logout, isLoading: authLoading } = useAuth();
  const { getNotifications, client } = useSupabase();
  const [stats, setStats] = useState({ courses: 0, pendingGrading: 0, students: 0, unreadNotifications: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchStats = useCallback(async (u: User) => {
    try {
      const [myCourses, pendingSubmissions, myNotifications] = await Promise.all([
        client.from('courses').select('id').eq('teacher_id', u.email).then(r => r.data || []),
        client.from('submissions').select('id').eq('status', 'pending').then(r => r.data || []),
        getNotifications(u.email) as Promise<Notification[]>
      ]);

      setStats({
        courses: myCourses.length,
        pendingGrading: pendingSubmissions.length,
        students: 0, // Simplified for now
        unreadNotifications: myNotifications.filter((n) => !n.is_read).length
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [client, getNotifications]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'teacher') {
        router.push('/');
      } else {
        fetchStats(user);
      }
    }
  }, [authLoading, user, role, router, fetchStats]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const activePage = pathname.split('/').pop() || 'dashboard';

  if (authLoading || !user || role !== 'teacher') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="teacher-dashboard">
      <div className="flex">
        <TeacherSidebar
          activePage={activePage === 'teacher' ? 'dashboard' : activePage}
          onNavigate={(page) => router.push(`/teacher/${page === 'dashboard' ? '' : page}`)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 transition-all duration-300 ml-0 md:ml-[240px]">
          <TeacherHeader onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="content-area p-4 md:p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)] overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
