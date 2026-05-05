"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { UnifiedSidebar } from "@/components/common/UnifiedSidebar"
import { UserRole } from "@/lib/types";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";
import { useRouter, usePathname } from 'next/navigation';

interface BaseDashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HeaderComponent: React.ComponentType<any>;
  headerProps?: Record<string, unknown>;
}

export const BaseDashboardLayout: React.FC<BaseDashboardLayoutProps> = ({
  children,
  requiredRole,
  HeaderComponent,
  headerProps = {}
}) => {
  const { user, role, logout, isLoading: authLoading, updateProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== requiredRole) {
        router.push('/');
      }
    }
  }, [authLoading, user, role, router, requiredRole]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const activePage = pathname.split('/').pop() || 'dashboard';

  if (authLoading || !user || role !== requiredRole) {
    return <div className="flex items-center justify-center min-h-screen font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading...</div>;
  }

  const resetStatus = (user.reset_request as Record<string, unknown> | null)?.status;
  const isResetApproved = resetStatus === 'approved' || resetStatus === 'approved_used';

  return (
    <div className={`${requiredRole}-dashboard`}>
      {isResetApproved && (
          <ForcePasswordChange onSuccess={() => updateProfile({ reset_request: null })} />
      )}

      <div className="flex">
        <UnifiedSidebar role={role as UserRole}
          activePage={activePage === requiredRole ? 'dashboard' : activePage}
          onNavigate={(page) => router.push(`/${requiredRole}/${page === 'dashboard' ? '' : page}`)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 transition-all duration-300 ml-0 md:ml-[240px]">
          <HeaderComponent
            {...headerProps}
            user={user}
            onLogout={handleLogout}
            onMenuClick={() => setIsSidebarOpen(true)}
          />

          <div className="content-area p-4 md:p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)] overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
