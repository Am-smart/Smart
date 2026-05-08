"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getEnrollments, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { EnrollmentDTO } from '@/lib/types';
import { SubmissionDTO, QuizSubmissionDTO } from '@/lib/types';
import { exportToCSV, exportToPDF } from '@/lib/report-utils';
import { FileSpreadsheet, FileText, ExternalLink, X } from 'lucide-react';

export default function GradeBookPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionDTO[]>([]);
  const [allQuizSubmissions, setAllQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetails, setSelectedDetails] = useState<{ student: string, course: string, studentId: string, courseId: string } | null>(null);

  useEffect(() => {
    if (user && user.id) {
        setIsLoading(true);
        getCourses(user.id).then(async myCourses => {
            const courseIds = myCourses.map(c => c.id);
            if (courseIds.length > 0) {
                const [enrols, subs, qSubs] = await Promise.all([
                    getEnrollments(undefined, courseIds),
                    getSubmissions(), // Service layer automatically filters by teacher's ownership
                    getQuizSubmissions() // Service layer automatically filters by teacher's ownership
                ]);
                setEnrollments(enrols || []);
                setAllSubmissions(subs || []);
                setAllQuizSubmissions(qSubs || []);
            }
            setIsLoading(false);
        });
    }
  }, [user]);

  const calculateGrade = (studentId: string, courseId: string) => {
      const courseSubmissions = allSubmissions.filter(s => s.student_id === studentId && s.assignment?.course_id === courseId && s.status === 'graded');
      const courseQuizSubmissions = allQuizSubmissions.filter(s => s.student_id === studentId && s.quiz?.course_id === courseId && s.status === 'submitted');

      // Group quiz submissions by quiz_id and take the highest score for each
      const highestQuizScores = new Map<string, number>();
      courseQuizSubmissions.forEach(qs => {
          const current = highestQuizScores.get(qs.quiz_id) || 0;
          if (qs.score > current) highestQuizScores.set(qs.quiz_id, qs.score);
      });

      const asgnScores = courseSubmissions.map(s => s.final_grade || 0);
      const quizScores = Array.from(highestQuizScores.values());

      const allScores = [...asgnScores, ...quizScores];
      if (allScores.length === 0) return null;

      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      return Math.round(avg);
  };

  const handleExportCSV = () => {
    const data = enrollments.map(e => ({
        Student: e.student?.full_name || 'Anonymous',
        Email: e.student?.email || 'N/A',
        Course: e.course?.title || 'N/A',
        Progress: `${e.progress}%`,
        Grade: calculateGrade(e.student_id, e.course_id)?.toString() || 'N/A'
    }));
    exportToCSV(data, 'Gradebook_Report');
  };

  const handleExportPDF = () => {
    const headers = ['Student', 'Course', 'Progress', 'Grade'];
    const rows = enrollments.map(e => [
        e.student?.full_name || 'Anonymous',
        e.course?.title || 'N/A',
        `${e.progress}%`,
        calculateGrade(e.student_id, e.course_id)?.toString() || 'N/A'
    ]);
    exportToPDF('Teacher Grade Book Report', headers, rows, 'Gradebook_Report');
  };

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Grade Book</h2>
                <p className="text-slate-500 text-sm font-medium">Detailed academic performance tracking for all enrolled students.</p>
                <div className="flex gap-4 mt-4">
                    <button onClick={handleExportCSV} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-green-600 transition-colors">
                        <FileSpreadsheet size={14} /> Export CSV
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 transition-colors">
                        <FileText size={14} /> Export PDF
                    </button>
                </div>
            </div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                {enrollments.length} Students
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                        <th className="px-8 py-5">Student</th>
                        <th className="px-8 py-5">Course</th>
                        <th className="px-8 py-5">Progress</th>
                        <th className="px-8 py-5 text-center">Avg. Grade</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                        [1,2,3].map(i => (
                            <tr key={i} className="animate-pulse">
                                <td colSpan={4} className="px-8 py-6 bg-slate-50/20"></td>
                            </tr>
                        ))
                    ) : enrollments.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic font-medium">No student data available.</td>
                        </tr>
                    ) : (
                        enrollments.map(e => {
                            const grade = calculateGrade(e.student_id, e.course_id);
                            return (
                                <tr key={`${e.course_id}-${e.student_id}`} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-slate-900">{e.student?.full_name || 'Anonymous Student'}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{e.student?.email}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-bold text-slate-600">{e.course?.title}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 max-w-[100px] bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${e.progress}%` }}></div>
                                            </div>
                                            <span className="text-xs font-black text-slate-900">{e.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {grade !== null ? (
                                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg ${grade >= 80 ? 'bg-green-100 text-green-600' : grade >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                                {grade}%
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-300 italic uppercase">No Grades</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => setSelectedDetails({ student: e.student?.full_name || 'Student', course: e.course?.title || 'Course', studentId: e.student_id, courseId: e.course_id })}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title="View Details"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    </div>

    {selectedDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedDetails.student}</h3>
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">{selectedDetails.course}</p>
                    </div>
                    <button onClick={() => setSelectedDetails(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assignments</h4>
                        <div className="space-y-3">
                            {allSubmissions.filter(s => s.student_id === selectedDetails.studentId && s.assignment?.course_id === selectedDetails.courseId).length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No assignments found.</p>
                            ) : (
                                allSubmissions.filter(s => s.student_id === selectedDetails.studentId && s.assignment?.course_id === selectedDetails.courseId).map(s => (
                                    <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                        <span className="font-bold text-slate-700">{s.assignment?.title}</span>
                                        <span className={`text-sm font-black ${s.status === 'graded' ? 'text-green-600' : 'text-amber-500'}`}>
                                            {s.status === 'graded' ? `${s.final_grade}%` : s.status.toUpperCase()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quizzes (Highest Scores)</h4>
                        <div className="space-y-3">
                            {(() => {
                                const quizSubs = allQuizSubmissions.filter(s => s.student_id === selectedDetails.studentId && s.quiz?.course_id === selectedDetails.courseId);
                                if (quizSubs.length === 0) return <p className="text-sm text-slate-400 italic">No quizzes found.</p>;

                                const highest = new Map<string, { title: string, score: number }>();
                                quizSubs.forEach(qs => {
                                    const current = highest.get(qs.quiz_id);
                                    if (!current || qs.score > current.score) {
                                        highest.set(qs.quiz_id, { title: qs.quiz?.title || 'Quiz', score: qs.score });
                                    }
                                });

                                return Array.from(highest.values()).map((q, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                        <span className="font-bold text-slate-700">{q.title}</span>
                                        <span className="text-sm font-black text-green-600">{q.score}%</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Average Performance</span>
                    <div className="text-2xl font-black text-blue-600">{calculateGrade(selectedDetails.studentId, selectedDetails.courseId)}%</div>
                </div>
            </div>
        </div>
    )}
    </>
  );
}
