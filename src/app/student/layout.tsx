"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useAppContext } from '@/components/AppContext';
import { getEnrollments, getAssignments, getSubmissions } from '@/lib/api-actions';
import { UnifiedSidebar } from "@/components/common/UnifiedSidebar"
import { UserRole } from "@/lib/types";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";
import { useRouter, usePathname } from 'next/navigation';
import { UserDTO } from '@/lib/types';
import { EnrollmentDTO } from '@/lib/types';
import { AssignmentDTO, SubmissionDTO } from '@/lib/types';

function StudentLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, logout, isLoading: authLoading, updateProfile } = useAuth();
  const { notifications } = useAppContext();
  const [stats, setStats] = useState({ courses: 0, dueSoon: 0, unreadNotifications: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchStats = useCallback(async (u: UserDTO) => {
    try {
      const [myEnrollments, allAssignments, mySubmissions] = await Promise.all([
        getEnrollments(u.id),
        getAssignments(),
        getSubmissions(undefined, u.id)
      ]);

      const enrolledIds = myEnrollments.map((e: EnrollmentDTO) => e.course_id);
      setStats(prev => ({
        ...prev,
        courses: myEnrollments.length,
        dueSoon: allAssignments.filter((a: AssignmentDTO) => enrolledIds.includes(a.course_id) && new Date(a.due_date as string) > new Date() && !mySubmissions.some((s: SubmissionDTO) => s.assignment_id === a.id)).length
      }));
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'student') {
        router.push('/');
      } else {
        fetchStats(user);
      }
    }
  }, [authLoading, user, role, router, fetchStats]);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      unreadNotifications: notifications.filter(n => !n.is_read).length
    }));
  }, [notifications]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const activePage = pathname.split('/').pop() || 'dashboard';

  if (authLoading || !user || role !== 'student') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const resetStatus = (user.reset_request as Record<string, unknown> | null)?.status;
  const isResetApproved = resetStatus === 'approved' || resetStatus === 'approved_used';

  return (
    <div className="student-dashboard">
      {isResetApproved && (
          <ForcePasswordChange onSuccess={() => updateProfile({ reset_request: null })} />
      )}

      <div className="flex">
        <UnifiedSidebar role={role as UserRole}
          activePage={activePage === 'student' ? 'dashboard' : activePage}
          onNavigate={(page) => router.push(`/student/${page === 'dashboard' ? '' : page}`)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 transition-all duration-300 ml-0 md:ml-[240px]">
          <StudentHeader user={user} stats={stats} notifications={notifications} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />

          <div className="content-area p-4 md:p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)] overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div>Loading Layout...</div>}>
            <StudentLayoutContent>{children}</StudentLayoutContent>
        </Suspense>
    );
}
