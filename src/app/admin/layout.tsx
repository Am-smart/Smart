"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import { useRouter, usePathname } from 'next/navigation';
import { User, Notification } from '@/lib/types';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, logout, isLoading: authLoading } = useAuth();
  const { getNotifications, client } = useSupabase();
  const [stats, setStats] = useState({ users: 0, reports: 0, health: 100, unreadNotifications: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchStats = useCallback(async (u: User) => {
    try {
      const [allUsers, myNotifications] = await Promise.all([
        client.from('users').select('id', { count: 'exact' }),
        getNotifications(u.email) as Promise<Notification[]>
      ]);

      setStats({
        users: allUsers.count || 0,
        reports: 0,
        health: 100,
        unreadNotifications: myNotifications.filter((n) => !n.is_read).length
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [client, getNotifications]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'admin') {
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
