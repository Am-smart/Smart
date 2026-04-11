"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { client } = useSupabase();
  const [stats, setStats] = useState({ totalUsers: 0, activeCourses: 0, pendingReports: 0 });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [users, courses] = await Promise.all([
      client.from('users').select('id', { count: 'exact' }),
      client.from('courses').select('id', { count: 'exact' }).eq('status', 'published')
    ]);

    setStats({
      totalUsers: users.count || 0,
      activeCourses: courses.count || 0,
      pendingReports: 0
    });
  }, [user, client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Admin Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Total Users</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.totalUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Active Courses</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.activeCourses}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">System Health</h4>
          <div className="text-3xl font-bold text-green-600">Optimal</div>
        </div>
      </div>
    </div>
  );
}
