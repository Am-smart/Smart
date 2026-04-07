"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { CourseCatalog } from "@/components/student/CourseCatalog";
import { MyCourses } from "@/components/student/MyCourses";
import { AssignmentsList } from "@/components/student/AssignmentsList";
import { QuizzesList } from "@/components/student/QuizzesList";
import { QuizView } from "@/components/student/QuizView";
import { AssignmentForm } from "@/components/student/AssignmentForm";
import { StudentAnalytics } from "@/components/student/StudentAnalytics";
import { CalendarView } from "@/components/ui/CalendarView";
import { LiveClassesList } from "@/components/student/LiveClassesList";
import { DiscussionBoard } from "@/components/student/DiscussionBoard";
import { AntiCheatRecord } from "@/components/student/AntiCheatRecord";
import { useRouter } from 'next/navigation';
import { Enrollment, Assignment, Notification, User, Course, Submission, Quiz, QuizSubmission, LiveClass, Discussion } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const { user, role, logout, isLoading: authLoading } = useAuth();
  const { getEnrollments, getAssignments, getNotifications, getCourses, getQuizzes, getDiscussions } = useSupabase();
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState({ courses: 0, dueSoon: 0, badges: 0, unreadNotifications: 0 });
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Page Data
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  const router = useRouter();

  const fetchData = useCallback(async (u: User) => {
    try {
      const [
        allCourses,
        myEnrollments,
        allAssignments,
        mySubmissions,
        allNotifications,
        allQuizzes,
        myQuizSubs,
        allLiveClasses
      ] = await Promise.all([
        getCourses() as Promise<Course[]>,
        getEnrollments(u.email) as Promise<Enrollment[]>,
        getAssignments() as Promise<Assignment[]>,
        supabase.from('submissions').select('*, assignments(*)').eq('student_email', u.email).then(r => r.data || []) as Promise<Submission[]>,
        getNotifications(u.email) as Promise<Notification[]>,
        getQuizzes() as Promise<Quiz[]>,
        supabase.from('quiz_submissions').select('*, quizzes(*)').eq('student_email', u.email).then(r => r.data || []) as Promise<QuizSubmission[]>,
        supabase.from('live_classes').select('*').then(r => r.data || []) as Promise<LiveClass[]>
      ]);

      setCourses(allCourses.filter(c => c.status === 'published'));
      setEnrollments(myEnrollments);

      const enrolledIds = myEnrollments.map(e => e.course_id);
      setAssignments(allAssignments.filter(a => enrolledIds.includes(a.course_id) && a.status === 'published'));
      setSubmissions(mySubmissions);
      setQuizzes(allQuizzes.filter(q => enrolledIds.includes(q.course_id) && q.status === 'published'));
      setQuizSubmissions(myQuizSubs);
      setLiveClasses(allLiveClasses.filter(lc => enrolledIds.includes(lc.course_id)));

      setStats({
        courses: myEnrollments.length,
        dueSoon: allAssignments.filter((a) => enrolledIds.includes(a.course_id) && a.status === 'published' && new Date(a.due_date) > new Date() && !mySubmissions.some(s => s.assignment_id === a.id)).length,
        badges: 0,
        unreadNotifications: allNotifications.filter((n) => !n.is_read).length
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [getCourses, getEnrollments, getAssignments, getNotifications, getQuizzes]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'student') {
        router.push('/');
      } else {
        fetchData(user);
      }
    }
  }, [authLoading, user, role, router, fetchData]);

  useEffect(() => {
    if (activePage === 'discussions' && enrollments.length > 0) {
        const firstCourseId = enrollments[0].course_id;
        setSelectedCourseId(firstCourseId);
        getDiscussions(firstCourseId).then(setDiscussions);
    }
  }, [activePage, enrollments, getDiscussions]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    try {
        const { error } = await supabase
            .from('enrollments')
            .upsert({ course_id: courseId, student_email: user.email }, { onConflict: 'course_id,student_email' });
        if (error) throw error;
        fetchData(user);
        setActivePage('my-courses');
    } catch (err) {
        console.error('Enrollment failed:', err);
    }
  };

  const handlePostDiscussion = async (content: string) => {
    if (!user || !selectedCourseId) return;
    try {
        const { error } = await supabase.from('discussions').insert([{
            course_id: selectedCourseId,
            user_email: user.email,
            content,
            created_at: new Date().toISOString()
        }]);
        if (error) throw error;
        getDiscussions(selectedCourseId).then(setDiscussions);
    } catch (err) {
        console.error('Post failed:', err);
    }
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

  if (showLoader || !user || role !== 'student') {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'analytics':
        return <StudentAnalytics submissions={submissions} quizSubmissions={quizSubmissions} enrollments={enrollments} />;
      case 'calendar':
        return <CalendarView events={calendarEvents} />;
      case 'courses':
        return (
            <CourseCatalog
                courses={courses}
                enrolledCourseIds={enrollments.map(e => e.course_id)}
                onEnroll={handleEnroll}
                onViewDetails={() => setActivePage('my-courses')}
            />
        );
      case 'my-courses':
        return <MyCourses enrollments={enrollments} onOpenCourse={() => setActivePage('dashboard')} />;
      case 'assignments':
        return (
            <AssignmentsList
                assignments={assignments}
                submissions={submissions}
                onSubmit={(a) => setActiveAssignment(a)}
                onViewFeedback={() => {}}
            />
        );
      case 'quizzes':
        return (
            <QuizzesList
                quizzes={quizzes}
                submissions={quizSubmissions}
                onStart={(quizId) => {
                    const q = quizzes.find(item => item.id === quizId);
                    if (q) setActiveQuiz(q);
                }}
                onViewResults={() => {}}
            />
        );
      case 'live':
        return <LiveClassesList liveClasses={liveClasses} onJoin={(lc) => { if(lc.meeting_url) window.open(lc.meeting_url, '_blank'); }} />;
      case 'discussions':
        return (
            <div>
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    {enrollments.map(e => (
                        <button
                            key={e.course_id}
                            onClick={() => { setSelectedCourseId(e.course_id); getDiscussions(e.course_id).then(setDiscussions); }}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCourseId === e.course_id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            {e.courses?.title}
                        </button>
                    ))}
                </div>
                {selectedCourseId && (
                    <DiscussionBoard
                        discussions={discussions}
                        userEmail={user.email}
                        onPost={handlePostDiscussion}
                        onDelete={async (id) => { await supabase.from('discussions').delete().eq('id', id); getDiscussions(selectedCourseId).then(setDiscussions); }}
                    />
                )}
            </div>
        );
      case 'anti-cheat':
        return <AntiCheatRecord submissions={submissions} quizSubmissions={quizSubmissions} />;
      case 'dashboard':
      default:
        return (
          <>
            <h2 className="text-2xl font-bold mb-6">Welcome Back, {user.full_name}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <div className="text-3xl font-bold text-slate-900">{user.xp || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6">Continue Learning</h3>
                    {enrollments.length > 0 ? (
                        <div className="space-y-4">
                            {enrollments.slice(0, 3).map(e => (
                                <div key={e.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl">📖</div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-900">{e.courses?.title}</div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-blue-500 h-full" style={{ width: `${e.progress}%` }}></div>
                                        </div>
                                    </div>
                                    <button onClick={() => setActivePage('my-courses')} className="text-blue-600 font-bold text-xs uppercase">Open</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm italic">No courses enrolled yet.</p>
                    )}
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6">Upcoming Deadlines</h3>
                    {assignments.filter(a => !submissions.some(s => s.assignment_id === a.id)).length > 0 ? (
                        <div className="space-y-4">
                            {assignments
                                .filter(a => !submissions.some(s => s.assignment_id === a.id))
                                .slice(0, 3)
                                .map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                        <div>
                                            <div className="font-bold text-slate-900">{a.title}</div>
                                            <div className="text-xs text-slate-500 mt-1">Due: {new Date(a.due_date).toLocaleDateString()}</div>
                                        </div>
                                        <button onClick={() => setActivePage('assignments')} className="btn-primary py-1.5 px-4 text-[10px]">Submit</button>
                                    </div>
                                ))
                            }
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm italic">All caught up! No pending assignments.</p>
                    )}
                </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="student-dashboard">
      {activeQuiz && (
        <QuizView
            quiz={activeQuiz}
            user={user}
            onComplete={() => { setActiveQuiz(null); fetchData(user); }}
            onCancel={() => setActiveQuiz(null)}
        />
      )}
      {activeAssignment && (
        <AssignmentForm
            assignment={activeAssignment}
            user={user}
            onComplete={() => { setActiveAssignment(null); fetchData(user); }}
            onCancel={() => setActiveAssignment(null)}
        />
      )}
      <div className="app">
        <StudentSidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="main ml-0 md:ml-[240px]">
          <StudentHeader user={user} stats={stats} onLogout={handleLogout} />
          <div className="content-area p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)]">
            <div id="pageContent">
              {renderContent()}
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import Script from "next/script";

export default function StudentDashboard() {
  return (
    <div className="student-dashboard">
      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" strategy="beforeInteractive" />
      <Script src="/js/supabase-config.js" strategy="afterInteractive" />
      <Script src="/js/core.js" strategy="afterInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="afterInteractive" />
      <Script src="https://meet.jit.si/external_api.js" strategy="afterInteractive" />
      <Script src="/calendar_logic.js" strategy="afterInteractive" />
      <Script src="/js/anti-cheat.js" strategy="afterInteractive" />
      <Script src="/js/student.js" strategy="afterInteractive" />

      <div className="app">
        <StudentSidebar />
        <main className="main ml-0 md:ml-[240px]">
          <StudentHeader />
          <div className="content-area p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)]">
            <div id="maintBanner" className="hidden bg-amber-50 text-amber-700 border border-amber-100 rounded-lg p-3 mb-6 text-center text-sm"></div>
            <div id="pageContent">
              {/* Content will be injected by student.js */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
