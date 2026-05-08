"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getSubmissions, getLiveClasses } from '@/lib/api-actions';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookOpen, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CourseDTO, SubmissionDTO } from '@/lib/types';

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, pendingGrading: 0, liveClasses: 0 });
  const [recentCourses, setRecentCourses] = useState<CourseDTO[]>([]);
  const [pendingItems, setPendingItems] = useState<SubmissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
        const [myCourses, pendingSubmissions, myLiveClasses] = await Promise.all([
            getCourses(user.id),
            getSubmissions({ status: 'submitted' }),
            getLiveClasses(undefined, user.id)
        ]);

        setStats({
          courses: myCourses.length,
          pendingGrading: pendingSubmissions.length,
          liveClasses: myLiveClasses.length
        });
        setRecentCourses(myCourses.slice(0, 3));
        setPendingItems(pendingSubmissions.slice(0, 3));
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
        <StatCard label="Your Courses" value={stats.courses} color="blue" />
        <StatCard label="Pending Grading" value={stats.pendingGrading} color="amber" />
        <StatCard label="Active Live Classes" value={stats.liveClasses} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-6">Recent Courses</h3>
              {recentCourses.length > 0 ? (
                  <div className="space-y-4">
                      {recentCourses.map(course => (
                          <div key={course.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                      {course.thumbnail_url && course.thumbnail_url.length < 4 ? course.thumbnail_url : '📚'}
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-900">{course.title}</div>
                                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{course.category || 'General'}</div>
                                  </div>
                              </div>
                              <button
                                onClick={() => router.push(`/teacher/courses?id=${course.id}`)}
                                className="text-blue-600 text-xs font-bold uppercase hover:underline"
                              >
                                Manage
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No Courses Yet"
                    description="You haven't created any courses yet. Start by creating your first course."
                    action={{
                        label: "Create Course",
                        onClick: () => router.push('/teacher/courses')
                    }}
                  />
              )}
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-6">Grading Tasks</h3>
              {pendingItems.length > 0 ? (
                  <div className="space-y-4">
                      {pendingItems.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                  <div className="font-bold text-slate-900">{sub.student?.full_name || 'Student'}</div>
                                  <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
                                      {sub.assignment?.title || 'Assignment'}
                                  </div>
                              </div>
                              <button
                                onClick={() => router.push(`/teacher/grading?id=${sub.id}`)}
                                className="btn-primary py-1.5 px-4 text-[10px]"
                              >
                                Grade
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <EmptyState
                    icon={CheckSquare}
                    title="All Caught Up"
                    description="There are no submissions waiting for your review."
                  />
              )}
          </div>
      </div>
    </div>
  );
}
