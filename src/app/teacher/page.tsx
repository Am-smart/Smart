"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, pendingGrading: 0, liveClasses: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
        const [myCourses, allSubmissions, myLiveClasses] = await Promise.all([
            getCourses(user.id),
            getSubmissions(),
            getLiveClasses(undefined, user.id)
        ]);

        const pendingSubmissions = allSubmissions.filter(s => s.status === 'submitted');

        setStats({
          courses: myCourses.length,
          pendingGrading: pendingSubmissions.length,
          liveClasses: myLiveClasses.length
        });
    } catch (err) {
        console.error('Failed to fetch teacher data:', err);
        setError('Failed to load teacher dashboard data.');
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-8 w-64 bg-slate-100 rounded-xl mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl"></div>)}
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="py-20 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-xl font-bold text-slate-900">{error}</h3>
            <button onClick={fetchData} className="btn-primary px-8">Try Again</button>
        </div>
    );
  }

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
