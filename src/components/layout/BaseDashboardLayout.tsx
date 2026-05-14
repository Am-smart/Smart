"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { UnifiedSidebar } from "@/components/common/UnifiedSidebar"
import { UserRole, User } from "@/lib/types";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '../AppContext';
import { MaintenanceOverlay } from './MaintenanceOverlay';

interface HeaderComponentProps {
  className?: string;
  user: User | null;
  onLogout: () => Promise<void>;
  onMenuClick: () => void;
  [key: string]: unknown;
}

interface BaseDashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  HeaderComponent: React.ComponentType<HeaderComponentProps>;
  headerProps?: Record<string, unknown>;
}

export const BaseDashboardLayout: React.FC<BaseDashboardLayoutProps> = ({
  children,
  requiredRole,
  HeaderComponent,
  headerProps = {}
}) => {
  const { user, role, logout, isAuthLoading, updateProfile } = useAuth();
  const { isSidebarOpen, toggleSidebar, maintenance } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || role !== requiredRole) {
        router.push('/');
      }
    }
  }, [isAuthLoading, user, role, router, requiredRole]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const activePage = pathname.split('/').pop() || 'dashboard';

  if (isAuthLoading || !user || role !== requiredRole) {
    return <div className="flex items-center justify-center min-h-screen font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading...</div>;
  }

  const resetStatus = (user.reset_request as Record<string, unknown> | null)?.status;
  const isResetApproved = resetStatus === 'approved' || resetStatus === 'approved_used';

  return (
    <div className={`${requiredRole}-dashboard`}>
      {maintenance.enabled && role !== 'admin' && (
          <MaintenanceOverlay
            message={maintenance.message}
            onLogout={handleLogout}
          />
      )}

      {isResetApproved && (
          <ForcePasswordChange onSuccess={() => updateProfile({ reset_request: null })} />
      )}

      <div className="flex">
        <UnifiedSidebar role={role as UserRole}
          activePage={activePage === requiredRole ? 'dashboard' : activePage}
          onNavigate={(page) => router.push(`/${requiredRole}/${page === 'dashboard' ? '' : page}`)}
          isOpen={isSidebarOpen}
          onClose={toggleSidebar}
        />
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[240px]' : 'lg:ml-0'} w-full overflow-x-hidden`}>
          <HeaderComponent
            className={`${isSidebarOpen ? 'lg:left-[240px]' : 'lg:left-0'}`}
            {...headerProps}
            user={user}
            onLogout={handleLogout}
            onMenuClick={toggleSidebar}
          />

          <div className="content-area p-3 sm:p-4 md:p-8 pt-[75px] md:pt-[90px] bg-[#f8fafc] min-h-screen overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
