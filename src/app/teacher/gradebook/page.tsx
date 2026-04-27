"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getEnrollments, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { EnrollmentDTO } from '@/lib/dto/learning.dto';
import { SubmissionDTO, QuizSubmissionDTO } from '@/lib/dto/assessment.dto';

export default function GradeBookPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionDTO[]>([]);
  const [allQuizSubmissions, setAllQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
        setIsLoading(true);
        getCourses(user.id!).then(async myCourses => {
            const courseIds = myCourses.map(c => c.id);
            if (courseIds.length > 0) {
                const [enrols, subs, qSubs] = await Promise.all([
                    getEnrollments(),
                    getSubmissions(),
                    getQuizSubmissions()
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

      const asgnScores = courseSubmissions.map(s => s.final_grade || 0);
      const quizScores = courseQuizSubmissions.map(s => s.score || 0);

      const allScores = [...asgnScores, ...quizScores];
      if (allScores.length === 0) return null;

      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      return Math.round(avg);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Grade Book</h2>
                <p className="text-slate-500 text-sm font-medium">Detailed academic performance tracking for all enrolled students.</p>
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
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}
