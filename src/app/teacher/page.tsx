"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { TeacherHeader } from "@/components/TeacherHeader";
import { CourseManager } from "@/components/teacher/CourseManager";
import { GradingQueue } from "@/components/teacher/GradingQueue";
import { useRouter } from 'next/navigation';
import { Course, User, Assignment, Quiz, Submission, LiveClass, Discussion, Material, Enrollment } from '@/lib/types';

// Lazy Loaded Components
const CourseEditor = dynamic(() => import("@/components/teacher/CourseEditor").then(m => m.CourseEditor), { ssr: false });
const AssignmentEditor = dynamic(() => import("@/components/teacher/AssignmentEditor").then(m => m.AssignmentEditor), { ssr: false });
const QuizEditor = dynamic(() => import("@/components/teacher/QuizEditor").then(m => m.QuizEditor), { ssr: false });
const StudentManagement = dynamic(() => import("@/components/teacher/StudentManagement").then(m => m.StudentManagement), { ssr: false });
const MaterialManager = dynamic(() => import("@/components/teacher/MaterialManager").then(m => m.MaterialManager), { ssr: false });
const GradingModal = dynamic(() => import("@/components/teacher/GradingModal").then(m => m.GradingModal), { ssr: false });
const CalendarView = dynamic(() => import("@/components/ui/CalendarView").then(m => m.CalendarView), { ssr: false });
const DiscussionBoard = dynamic(() => import("@/components/student/DiscussionBoard").then(m => m.DiscussionBoard), { ssr: false });

export default function TeacherDashboard() {
  const { user, role, logout, isLoading: authLoading } = useAuth();
  const { client, getCourses, getAssignments, getQuizzes } = useSupabase();
  const { getCache, isOnline } = useIndexedDB();
  const [activePage, setActivePage] = useState('dashboard');
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const router = useRouter();

  const fetchData = useCallback(async (u: User) => {
    try {
      setIsDataLoading(true);

      // Try Cache
      const cachedCourses = await getCache<Course[]>('teacher_courses');
      const cachedAssignments = await getCache<Assignment[]>('teacher_assignments');
      const cachedQuizzes = await getCache<Quiz[]>('teacher_quizzes');

      if (cachedCourses) setCourses(cachedCourses);
      if (cachedAssignments) setAssignments(cachedAssignments);
      if (cachedQuizzes) setQuizzes(cachedQuizzes);

      if (isOnline) {
          const [allCourses, allAssignments, allQuizzes, allSubs, allLiveClasses] = await Promise.all([
            getCourses(u.email) as Promise<Course[]>,
            getAssignments(u.email) as Promise<Assignment[]>,
            getQuizzes(undefined, u.email) as Promise<Quiz[]>,
            client.from('submissions').select('*, assignments(*)').then(r => r.data || []) as Promise<Submission[]>,
            client.from('live_classes').select('*').eq('teacher_email', u.email).then(r => r.data || []) as Promise<LiveClass[]>
          ]);

          setCourses(allCourses);
          setAssignments(allAssignments);
          setQuizzes(allQuizzes);
          setLiveClasses(allLiveClasses);

          const teacherAssignments = allAssignments.map(a => a.id);
          setSubmissions(allSubs.filter(s => teacherAssignments.includes(s.assignment_id)));

          const courseIds = allCourses.map(c => c.id);
          // Fetch Enrollments and Materials centrally
          const [matsRes, enrRes] = await Promise.all([
            client.from('materials').select('*').in('course_id', courseIds).then(r => r.data || []) as Promise<Material[]>,
            client.from('enrollments').select('*, courses(*), student:users!student_email(*)').in('course_id', courseIds).then(r => r.data || []) as Promise<Enrollment[]>
          ]);

          setMaterials(matsRes);
          setEnrollments(enrRes);

          const uniqueStudents = new Set(enrRes.map(e => e.student_email));
          setStudentsCount(uniqueStudents.size);
      }
    } catch (err) {
      console.error('Failed to fetch teacher data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [client, getCourses, getAssignments, getQuizzes, getCache, isOnline]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'teacher') {
        router.push('/');
      } else {
        fetchData(user);
      }
    }
  }, [authLoading, user, role, fetchData, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const showLoader = useMemo(() => authLoading || (isDataLoading && !user), [authLoading, isDataLoading, user]);

  const calendarEvents = useMemo(() => {
    const events: { id: string; title: string; date: string; type: 'assignment' | 'quiz' | 'live'; color: string }[] = [];
    assignments.forEach(a => events.push({ id: a.id, title: `Due: ${a.title}`, date: (a.due_date as string).split('T')[0], type: 'assignment', color: 'bg-purple-100 border-purple-500 text-purple-700' }));
    quizzes.forEach(q => {
        if (q.start_at) events.push({ id: q.id, title: `Starts: ${q.title}`, date: (q.start_at as string).split('T')[0], type: 'quiz', color: 'bg-amber-100 border-amber-500 text-amber-700' });
        if (q.end_at) events.push({ id: q.id, title: `Closes: ${q.title}`, date: (q.end_at as string).split('T')[0], type: 'quiz', color: 'bg-red-100 border-red-500 text-red-700' });
    });
    liveClasses.forEach(lc => events.push({ id: lc.id, title: `Live: ${lc.title}`, date: (lc.start_at as string).split('T')[0], type: 'live', color: 'bg-blue-100 border-blue-500 text-blue-700' }));
    return events;
  }, [assignments, quizzes, liveClasses]);

  if (showLoader || !user || role !== 'teacher') return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const renderContent = () => {
    switch (activePage) {
      case 'courses':
        return (
            <CourseManager
                courses={courses}
                onCreate={() => setIsCreatingCourse(true)}
                onEdit={(c) => setActiveCourse(c)}
                onDelete={async (id) => { await client.from('courses').delete().eq('id', id); fetchData(user); }}
            />
        );
      case 'grading':
        return <GradingQueue submissions={submissions} onGrade={(s) => setActiveSubmission(s)} />;
      case 'students':
        return <StudentManagement initialEnrollments={enrollments} onRefresh={() => fetchData(user)} />;
      case 'materials':
        return <MaterialManager initialMaterials={materials} courses={courses} onRefresh={() => fetchData(user)} />;
      case 'calendar':
        return <CalendarView events={calendarEvents} />;
      case 'discussions':
        return (
            <div>
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    {courses.map(c => (
                        <button
                            key={c.id}
                            onClick={async () => {
                                setSelectedCourseId(c.id);
                                const { data } = await client.from('discussions').select('*').eq('course_id', c.id);
                                setDiscussions((data as Discussion[]) || []);
                            }}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCourseId === c.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            {c.title}
                        </button>
                    ))}
                </div>
                {selectedCourseId && (
                    <DiscussionBoard
                        discussions={discussions}
                        userEmail={user.email}
                        onPost={async (content) => {
                            await client.from('discussions').insert([{ course_id: selectedCourseId, user_email: user.email, content, created_at: new Date().toISOString() }]);
                            const { data } = await client.from('discussions').select('*').eq('course_id', selectedCourseId);
                            setDiscussions((data as Discussion[]) || []);
                        }}
                        onDelete={async (id) => {
                            await client.from('discussions').delete().eq('id', id);
                            const { data } = await client.from('discussions').select('*').eq('course_id', selectedCourseId);
                            setDiscussions((data as Discussion[]) || []);
                        }}
                        isOnline={isOnline}
                    />
                )}
            </div>
        );
      case 'assignments':
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">Assignments</h2>
                    <button onClick={() => setIsCreatingAssignment(true)} className="btn-primary py-2 px-6">New Assignment</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map(a => (
                        <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-slate-900">{a.title}</h3>
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                                <span className={`uppercase font-bold tracking-widest ${a.status === 'published' ? 'text-green-600' : 'text-slate-400'}`}>{a.status}</span>
                            </div>
                            <div className="mt-auto flex gap-2">
                                <button onClick={() => setActiveAssignment(a)} className="btn-secondary py-2 flex-1 text-[10px] uppercase font-bold tracking-widest">Edit</button>
                                <button onClick={async () => { await client.from('assignments').delete().eq('id', a.id); fetchData(user); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
      case 'quizzes':
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">Quizzes</h2>
                    <button onClick={() => setIsCreatingQuiz(true)} className="btn-primary py-2 px-6">New Quiz</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(q => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-slate-900">{q.title}</h3>
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                <span>{q.time_limit} mins</span>
                                <span className={`uppercase font-bold tracking-widest ${q.status === 'published' ? 'text-green-600' : 'text-slate-400'}`}>{q.status}</span>
                            </div>
                            <div className="mt-auto flex gap-2">
                                <button onClick={() => setActiveQuiz(q)} className="btn-secondary py-2 flex-1 text-[10px] uppercase font-bold tracking-widest">Edit</button>
                                <button onClick={async () => { await client.from('quizzes').delete().eq('id', q.id); fetchData(user); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
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
      {(isCreatingAssignment || activeAssignment) && (
        <AssignmentEditor
            assignment={activeAssignment || undefined}
            courses={courses}
            onSave={() => { setIsCreatingAssignment(false); setActiveAssignment(null); fetchData(user); }}
            onCancel={() => { setIsCreatingAssignment(false); setActiveAssignment(null); }}
        />
      )}
      {(isCreatingQuiz || activeQuiz) && (
        <QuizEditor
            quiz={activeQuiz || undefined}
            courses={courses}
            onSave={() => { setIsCreatingQuiz(false); setActiveQuiz(null); fetchData(user); }}
            onCancel={() => { setIsCreatingQuiz(false); setActiveQuiz(null); }}
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
        <TeacherSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="main ml-0 md:ml-[240px]">
          <TeacherHeader onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="content-area p-4 md:p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)]">
            <div id="pageContent">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
