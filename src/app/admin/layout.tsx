"use client";

import React from 'react';
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BaseDashboardLayout } from '@/components/layout/BaseDashboardLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseDashboardLayout
        requiredRole="admin"
        HeaderComponent={DashboardHeader}
    >
        {children}
    </BaseDashboardLayout>
  );
}
