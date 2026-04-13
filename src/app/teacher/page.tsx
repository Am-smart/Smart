"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Course } from '@/lib/types';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { client } = useSupabase();
  const [stats, setStats] = useState({ courses: 0, pendingGrading: 0, liveClasses: 0 });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [courses, pending, live] = await Promise.all([
      client.from('courses').select('id', { count: 'exact' }).eq('teacher_id', user.id),
      client.from('submissions').select('id', { count: 'exact' }).eq('status', 'pending'),
      client.from('live_classes').select('id', { count: 'exact' }).eq('teacher_id', user.id)
    ]);

    setStats({
      courses: courses.count || 0,
      pendingGrading: pending.count || 0,
      liveClasses: live.count || 0
    });
  }, [user, client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Teacher Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Your Courses</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.courses}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Pending Grading</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.pendingGrading}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Active Live Classes</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.liveClasses}</div>
        </div>
      </div>
    </div>
  );
}
