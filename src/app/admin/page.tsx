"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getUsers, getSystemStats } from '@/lib/api-actions';
import { StatCard } from '@/components/ui/StatCard';

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
    try {
        const [allUsers, systemStats] = await Promise.all([
            getUsers(),
            getSystemStats()
        ]);

        setStats({
          totalUsers: systemStats.users ?? allUsers.length,
          activeCourses: systemStats.courses ?? 0,
          flaggedUsers: allUsers.filter(u => u.flagged).length,
          teachers: allUsers.filter(u => u.role === 'teacher').length,
          students: allUsers.filter(u => u.role === 'student').length,
          pendingResets: allUsers.filter(u => !!u.reset_request).length
        });
    } catch (err) {
        console.error('Failed to fetch admin stats:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Admin Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          label="Total Users" 
          value={stats.totalUsers} 
          subtext={`Teachers: ${stats.teachers} | Students: ${stats.students}`}
          color="blue"
        />
        <StatCard 
          label="Active Courses" 
          value={stats.activeCourses} 
          subtext="Live & Published"
          color="green"
        />
        <StatCard 
          label="Security Alerts" 
          value={stats.flaggedUsers} 
          subtext={`Flagged: ${stats.flaggedUsers} | Pending Resets: ${stats.pendingResets}`}
          color={stats.flaggedUsers > 0 ? 'red' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6">System Health</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="font-medium">Database Connection</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Healthy</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="font-medium">Storage Service</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Healthy</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="font-medium">Auth Service</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Healthy</span>
                </div>
            </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6">Recent Activity Logs</h3>
            <div className="text-slate-500 text-sm italic">
                Logs are being recorded. Visit the System Logs page for detailed tracking.
            </div>
            <button
                onClick={() => window.location.href = '/admin/system'}
                className="mt-6 text-blue-600 font-bold text-sm hover:underline"
            >
                View All System Logs →
            </button>
        </div>
      </div>
    </div>
  );
}
