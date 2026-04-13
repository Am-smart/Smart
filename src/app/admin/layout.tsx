"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, logout, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'admin') {
        router.push('/');
      } else {
      }
    }
  }, [authLoading, user, role, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const activePage = pathname.split('/').pop() || 'dashboard';

  if (authLoading || !user || role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="flex">
        <AdminSidebar
          activePage={activePage === 'admin' ? 'dashboard' : activePage}
          onNavigate={(page) => router.push(`/admin/${page === 'dashboard' ? '' : page}`)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 transition-all duration-300 ml-0 md:ml-[240px]">
          <AdminHeader onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="content-area p-4 md:p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)] overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
