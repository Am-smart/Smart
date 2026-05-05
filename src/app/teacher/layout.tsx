"use client";

import React from 'react';
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BaseDashboardLayout } from '@/components/layout/BaseDashboardLayout';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseDashboardLayout
        requiredRole="teacher"
        HeaderComponent={DashboardHeader}
    >
        {children}
    </BaseDashboardLayout>
  );
}
