"use client";

import React from 'react';
import { AdminHeader } from "@/components/layout/AdminHeader";
import { BaseDashboardLayout } from '@/components/layout/BaseDashboardLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseDashboardLayout
        requiredRole="admin"
        HeaderComponent={AdminHeader}
    >
        {children}
    </BaseDashboardLayout>
  );
}
