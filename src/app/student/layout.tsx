"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { useRouter, usePathname } from 'next/navigation';
import { User, Notification, Enrollment, Assignment, Submission } from '@/lib/types';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, logout, isLoading: authLoading } = useAuth();
  const { getNotifications, client } = useSupabase();
  const [stats, setStats] = useState({ courses: 0, dueSoon: 0, badges: 0, unreadNotifications: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchStats = useCallback(async (u: User) => {
    try {
      const [myEnrollments, allAssignments, mySubmissions, allNotifications, myBadges] = await Promise.all([
        client.from('enrollments').select('*').eq('student_id', u.email).then(r => r.data || []),
        client.from('assignments').select('*').eq('status', 'published').then(r => r.data || []),
        client.from('submissions').select('*').eq('student_id', u.email).then(r => r.data || []),
        getNotifications(u.email) as Promise<Notification[]>,
        client.from('user_badges').select('*').eq('user_id', u.email).then(r => r.data || [])
      ]);

      const enrolledIds = myEnrollments.map((e: Enrollment) => e.course_id);
      setStats({
        courses: myEnrollments.length,
        dueSoon: allAssignments.filter((a: Assignment) => enrolledIds.includes(a.course_id) && new Date(a.due_date as string) > new Date() && !mySubmissions.some((s: Submission) => s.assignment_id === a.id)).length,
        badges: myBadges.length,
        unreadNotifications: allNotifications.filter((n) => !n.is_read).length
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [client, getNotifications]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'student') {
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

  if (authLoading || !user || role !== 'student') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="student-dashboard">
      <div className="flex">
        <StudentSidebar
          activePage={activePage === 'student' ? 'dashboard' : activePage}
          onNavigate={(page) => router.push(`/student/${page === 'dashboard' ? '' : page}`)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 transition-all duration-300 ml-0 md:ml-[240px]">
          <StudentHeader user={user} stats={stats} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="content-area p-4 md:p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)] overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
