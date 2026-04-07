/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import { UserManagement } from "@/components/admin/UserManagement";
import { UserEditor } from "@/components/admin/UserEditor";
import { PasswordReset } from "@/components/admin/PasswordReset";
import { MaintenancePanel } from "@/components/admin/MaintenancePanel";
import { BroadcastManager } from "@/components/admin/BroadcastManager";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Maintenance } from '@/lib/types';
import { useSupabase } from '@/hooks/useSupabase';

export default function AdminDashboard() {
  const { user, role, logout, isLoading: authLoading } = useAuth();
  const { getMaintenance } = useSupabase();
  const [activePage, setActivePage] = useState('dashboard');
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, maintRes] = await Promise.all([
        supabase.from('users').select('*').then(r => r.data || []),
        getMaintenance()
      ]);

      setUsers(usersRes);
      setMaintenance(maintRes);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'admin') {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [authLoading, user, role]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleToggleMaintenance = async (enabled: boolean) => {
    try {
        const { error } = await supabase
            .from('maintenance')
            .upsert({ id: maintenance?.enabled !== undefined ? 1 : undefined, enabled }, { onConflict: 'id' });
        if (error) throw error;
        fetchData();
    } catch (err) {
        console.error('Failed to toggle maintenance:', err);
    }
  };

  const showLoader = useMemo(() => authLoading || (isDataLoading && !user), [authLoading, isDataLoading, user]);

  if (showLoader || !user || role !== 'admin') return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const renderContent = () => {
    switch (activePage) {
      case 'users':
        return (
            <UserManagement
                users={users}
                onAdd={() => setIsAddingUser(true)}
                onEdit={(u) => setActiveUser(u)}
                onDelete={async (email) => { await supabase.from('users').delete().eq('email', email); fetchData(); }}
            />
        );
      case 'maintenance':
        return (
            <div className="space-y-8">
                <MaintenancePanel maintenance={maintenance} onToggle={handleToggleMaintenance} />
                <BroadcastManager />
            </div>
        );
      case 'resets':
        return <PasswordReset users={users} />;
      case 'dashboard':
      default:
        return (
          <>
            <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Total Users</h4>
                <div className="text-3xl font-bold text-slate-900">{users.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Active Maintenance</h4>
                <div className="text-3xl font-bold text-slate-900">{maintenance?.enabled ? 'ON' : 'OFF'}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">System Health</h4>
                <div className="text-3xl font-bold text-slate-900 text-green-500">100%</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Requests</h4>
                <div className="text-3xl font-bold text-slate-900">0</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6">System Management</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setActivePage('users')} className="p-6 bg-blue-50 text-blue-700 rounded-2xl text-left hover:bg-blue-100 transition-all">
                            <div className="text-2xl mb-2">👥</div>
                            <div className="font-bold">Users</div>
                            <div className="text-xs opacity-75">Manage accounts</div>
                        </button>
                        <button onClick={() => setActivePage('maintenance')} className="p-6 bg-red-50 text-red-700 rounded-2xl text-left hover:bg-red-100 transition-all">
                            <div className="text-2xl mb-2">🛡️</div>
                            <div className="font-bold">Control</div>
                            <div className="text-xs opacity-75">System status</div>
                        </button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6">Health Overview</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                            <span className="text-sm font-medium text-slate-600">Database Latency</span>
                            <span className="text-sm font-bold text-green-600">12ms</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                            <span className="text-sm font-medium text-slate-600">Storage Usage</span>
                            <span className="text-sm font-bold text-blue-600">0.4 GB</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                            <span className="text-sm font-medium text-slate-600">Active Sessions</span>
                            <span className="text-sm font-bold text-purple-600">{users.length > 0 ? 1 : 0}</span>
                        </div>
                    </div>
                </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      {(isAddingUser || activeUser) && (
        <UserEditor
            user={activeUser || undefined}
            onSave={() => { setIsAddingUser(false); setActiveUser(null); fetchData(); }}
            onCancel={() => { setIsAddingUser(false); setActiveUser(null); }}
        />
      )}
      <div className="app">
        <AdminSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="main ml-0 md:ml-[240px]">
          <AdminHeader onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="content-area p-4 md:p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)]">
            <div id="pageContent">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      <div id="modalBackdrop" className="fixed inset-0 bg-black/50 z-[2000] hidden flex items-center justify-center p-4">
        <div id="modal" className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative"></div>
      </div>
    </div>
  );
}
