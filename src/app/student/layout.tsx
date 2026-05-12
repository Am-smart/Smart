"use client";

import React, { useEffect, Suspense } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useAppContext } from '@/components/AppContext';
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BaseDashboardLayout } from '@/components/layout/BaseDashboardLayout';

function StudentLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { stats } = useAppContext();

  return (
    <BaseDashboardLayout
        requiredRole="student"
        HeaderComponent={DashboardHeader}
        headerProps={{ stats }}
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
