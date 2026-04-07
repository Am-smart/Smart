/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { TeacherHeader } from "@/components/TeacherHeader";
import { CourseManager } from "@/components/teacher/CourseManager";
import { CourseEditor } from "@/components/teacher/CourseEditor";
import { GradingQueue } from "@/components/teacher/GradingQueue";
import { GradingModal } from "@/components/teacher/GradingModal";
import { useRouter } from 'next/navigation';
import { Course, User, Assignment, Quiz, Submission } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function TeacherDashboard() {
  const { user, role, logout, isLoading: authLoading } = useAuth();
  const { getCourses, getAssignments, getQuizzes } = useSupabase();
  const [activePage, setActivePage] = useState('dashboard');
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentsCount, setStudentsCount] = useState(0);

  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);

  const router = useRouter();

  const fetchData = useCallback(async (u: User) => {
    try {
      const [allCourses, allAssignments, allQuizzes, allSubs] = await Promise.all([
        getCourses(u.email) as Promise<Course[]>,
        getAssignments(u.email) as Promise<Assignment[]>,
        getQuizzes(undefined, u.email) as Promise<Quiz[]>,
        supabase.from('submissions').select('*, assignments(*)').then(r => r.data || []) as Promise<Submission[]>
      ]);

      setCourses(allCourses);
      setAssignments(allAssignments);
      setQuizzes(allQuizzes);

      const teacherAssignments = allAssignments.map(a => a.id);
      setSubmissions(allSubs.filter(s => teacherAssignments.includes(s.assignment_id)));

      // Calculate total students across all courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_email')
        .in('course_id', allCourses.map(c => c.id));

      const uniqueStudents = new Set(enrollments?.map(e => e.student_email));
      setStudentsCount(uniqueStudents.size);
    } catch (err) {
      console.error('Failed to fetch teacher data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'teacher') {
        router.push('/');
      } else {
        fetchData(user);
      }
    }
  }, [authLoading, user, role]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const showLoader = useMemo(() => authLoading || (isDataLoading && !user), [authLoading, isDataLoading, user]);

  if (showLoader || !user || role !== 'teacher') return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const renderContent = () => {
    switch (activePage) {
      case 'courses':
        return (
            <CourseManager
                courses={courses}
                onCreate={() => setIsCreatingCourse(true)}
                onEdit={(c) => setActiveCourse(c)}
                onDelete={async (id) => { await supabase.from('courses').delete().eq('id', id); fetchData(user); }}
            />
        );
      case 'grading':
        return <GradingQueue submissions={submissions} onGrade={(s) => setActiveSubmission(s)} />;
      case 'dashboard':
      default:
        return (
          <>
            <h2 className="text-2xl font-bold mb-6">Teacher Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Total Courses</h4>
                <div className="text-3xl font-bold text-slate-900">{courses.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Total Students</h4>
                <div className="text-3xl font-bold text-slate-900">{studentsCount}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Active Assignments</h4>
                <div className="text-3xl font-bold text-slate-900">{assignments.filter(a => a.status === 'published').length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Active Quizzes</h4>
                <div className="text-3xl font-bold text-slate-900">{quizzes.filter(q => q.status === 'published').length}</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => setActivePage('courses')} className="p-6 bg-blue-50 text-blue-700 rounded-2xl text-left hover:bg-blue-100 transition-colors">
                        <div className="text-2xl mb-2">📚</div>
                        <div className="font-bold">New Course</div>
                        <div className="text-xs opacity-75">Create a new learning track</div>
                    </button>
                    <button onClick={() => setActivePage('grading')} className="p-6 bg-purple-50 text-purple-700 rounded-2xl text-left hover:bg-purple-100 transition-colors relative">
                        <div className="text-2xl mb-2">📝</div>
                        <div className="font-bold">Grading Queue</div>
                        <div className="text-xs opacity-75">Check student submissions</div>
                        {submissions.filter(s => s.status === 'submitted').length > 0 && (
                            <span className="absolute top-4 right-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                {submissions.filter(s => s.status === 'submitted').length}
                            </span>
                        )}
                    </button>
                    <button className="p-6 bg-amber-50 text-amber-700 rounded-2xl text-left hover:bg-amber-100 transition-colors">
                        <div className="text-2xl mb-2">❓</div>
                        <div className="font-bold">New Quiz</div>
                        <div className="text-xs opacity-75">Assess student knowledge</div>
                    </button>
                </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="teacher-dashboard">
      {(isCreatingCourse || activeCourse) && (
        <CourseEditor
            course={activeCourse || undefined}
            teacherEmail={user.email}
            onSave={() => { setIsCreatingCourse(false); setActiveCourse(null); fetchData(user); }}
            onCancel={() => { setIsCreatingCourse(false); setActiveCourse(null); }}
        />
      )}
      {activeSubmission && (
        <GradingModal
            submission={activeSubmission}
            onSave={() => { setActiveSubmission(null); fetchData(user); }}
            onCancel={() => setActiveSubmission(null)}
        />
      )}
      <div className="app">
        <TeacherSidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="main ml-0 md:ml-[240px]">
          <TeacherHeader onLogout={handleLogout} />
          <div className="content-area p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)]">
            <div id="pageContent">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
