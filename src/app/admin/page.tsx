"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getUsers, getCourses } from '@/lib/api-actions';
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
    </div>
  );
}
