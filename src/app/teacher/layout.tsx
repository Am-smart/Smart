"use client";

import React from 'react';
import { TeacherHeader } from "@/components/layout/TeacherHeader";
import { BaseDashboardLayout } from '@/components/layout/BaseDashboardLayout';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseDashboardLayout
        requiredRole="teacher"
        HeaderComponent={TeacherHeader}
    >
        {children}
    </BaseDashboardLayout>
  );
}
