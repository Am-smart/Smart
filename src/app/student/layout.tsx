"use client";

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useAppContext } from '@/components/AppContext';
import { getEnrollments, getAssignments, getSubmissions } from '@/lib/api-actions';
import { StudentHeader } from "@/components/layout/StudentHeader";
import { BaseDashboardLayout } from '@/components/layout/BaseDashboardLayout';
import { UserDTO, EnrollmentDTO, AssignmentDTO, SubmissionDTO } from '@/lib/types';

function StudentLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { notifications } = useAppContext();
  const [stats, setStats] = useState({ courses: 0, dueSoon: 0, unreadNotifications: 0 });

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
    if (user) {
        fetchStats(user);
    }
  }, [user, fetchStats]);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      unreadNotifications: notifications.filter(n => !n.is_read).length
    }));
  }, [notifications]);

  return (
    <BaseDashboardLayout
        requiredRole="student"
        HeaderComponent={StudentHeader}
        headerProps={{ stats, notifications }}
    >
        {children}
    </BaseDashboardLayout>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div>Loading Layout...</div>}>
            <StudentLayoutContent>{children}</StudentLayoutContent>
        </Suspense>
    );
}
