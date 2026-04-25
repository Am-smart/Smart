"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { apiClient } from '@/lib/api-client';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
      totalUsers: 0,
      activeCourses: 0,
      flaggedUsers: 0,
      teachers: 0,
      students: 0,
      pendingResets: 0
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [allUsers, allCourses] = await Promise.all([
        getUsers(),
        getCourses()
    ]);

    setStats({
      totalUsers: allUsers.length,
      activeCourses: allCourses.filter(c => c.status === 'published').length,
      flaggedUsers: allUsers.filter(u => u.flagged).length,
      teachers: allUsers.filter(u => u.role === 'teacher').length,
      students: allUsers.filter(u => u.role === 'student').length,
      pendingResets: allUsers.filter(u => u.reset_request).length
    });
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Admin Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Users</h4>
          <div className="text-4xl font-black text-slate-900">{stats.totalUsers}</div>
          <div className="flex gap-4 mt-4">
              <div className="text-[10px] font-bold text-slate-400">Teachers: <span className="text-blue-600">{stats.teachers}</span></div>
              <div className="text-[10px] font-bold text-slate-400">Students: <span className="text-slate-900">{stats.students}</span></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Active Courses</h4>
          <div className="text-4xl font-black text-slate-900">{stats.activeCourses}</div>
          <div className="text-[10px] font-bold text-green-600 mt-4 uppercase tracking-tighter">Live & Published</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Security Alerts</h4>
          <div className={`text-4xl font-black ${stats.flaggedUsers > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.flaggedUsers}</div>
          <div className="flex gap-4 mt-4">
              <div className="text-[10px] font-bold text-slate-400">Flagged: <span className="text-red-600">{stats.flaggedUsers}</span></div>
              <div className="text-[10px] font-bold text-slate-400">Pending Resets: <span className="text-amber-600">{stats.pendingResets}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
