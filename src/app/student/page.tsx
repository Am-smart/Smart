"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Enrollment, Course, Assignment } from '@/lib/types';
import dynamic from 'next/dynamic';

const StudyTimer = dynamic(() => import("@/components/student/StudyTimer").then(m => m.StudyTimer), { ssr: false });

export default function StudentDashboard() {
  const { user } = useAuth();
  const { client } = useSupabase();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState({ courses: 0, dueSoon: 0, xp: 0 });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [myEnrollments, allAssignments, mySubmissions] = await Promise.all([
      client.from('enrollments').select('*, courses(*)').eq('student_id', user.id).then(r => r.data || []),
      client.from('assignments').select('*').eq('status', 'published').then(r => r.data || []),
      client.from('submissions').select('*').eq('student_id', user.id).then(r => r.data || [])
    ]);

    const enrolledIds = myEnrollments.map((e: Enrollment) => e.course_id);
    const pendingAssignments = allAssignments.filter((a: Assignment) =>
        enrolledIds.includes(a.course_id) &&
        new Date(a.due_date as string) > new Date() &&
        !mySubmissions.some((s: { assignment_id: string }) => s.assignment_id === a.id)
    );

    setEnrollments(myEnrollments);
    setAssignments(pendingAssignments);
    setStats({
      courses: myEnrollments.length,
      dueSoon: pendingAssignments.length,
      xp: user.xp || 0
    });
  }, [user, client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {enrollments.length > 0 && (
        <StudyTimer userId={user.id} courses={enrollments.map(e => e.courses).filter(Boolean) as Course[]} />
      )}

      <h2 className="text-2xl font-bold mb-6">Welcome Back, {user.full_name}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Enrolled Courses</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.courses}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Upcoming Assignments</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.dueSoon}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">XP Points</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.xp}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-6">Continue Learning</h3>
              {enrollments.length > 0 ? (
                  <div className="space-y-4">
                      {enrollments.slice(0, 3).map(e => (
                          <div key={e.course_id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl">📖</div>
                              <div className="flex-1">
                                  <div className="font-bold text-slate-900">{e.courses?.title}</div>
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                      <div className="bg-blue-500 h-full" style={{ width: `${e.progress}%` }}></div>
                                  </div>
                              </div>
                              <button className="text-blue-600 font-bold text-xs uppercase">Open</button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-slate-500 text-sm italic">No courses enrolled yet.</p>
              )}
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-6">Upcoming Deadlines</h3>
              {assignments.length > 0 ? (
                  <div className="space-y-4">
                      {assignments.slice(0, 3).map(a => (
                          <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                  <div className="font-bold text-slate-900">{a.title}</div>
                                  <div className="text-xs text-slate-500 mt-1">Due: {new Date(a.due_date).toLocaleDateString()}</div>
                              </div>
                              <button className="btn-primary py-1.5 px-4 text-[10px]">Submit</button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-slate-500 text-sm italic">All caught up! No pending assignments.</p>
              )}
          </div>
      </div>
    </div>
  );
}
