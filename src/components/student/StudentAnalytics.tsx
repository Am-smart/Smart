import React, { useMemo } from 'react';
import { Submission, QuizSubmission, Enrollment } from '@/lib/types';

interface StudentAnalyticsProps {
  submissions: Submission[];
  quizSubmissions: QuizSubmission[];
  enrollments: Enrollment[];
}

export const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ submissions, quizSubmissions, enrollments }) => {
  const stats = useMemo(() => {
    const totalAssignments = submissions.length;
    const gradedAssignments = submissions.filter(s => s.status === 'graded');
    const avgAssignmentScore = gradedAssignments.length
        ? Math.round(gradedAssignments.reduce((acc, s) => acc + (s.final_grade || 0), 0) / gradedAssignments.length)
        : 0;

    const totalQuizzes = quizSubmissions.length;
    const avgQuizScore = totalQuizzes
        ? Math.round(quizSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / totalQuizzes)
        : 0;

    const completionRate = enrollments.length
        ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / enrollments.length)
        : 0;

    return { totalAssignments, avgAssignmentScore, totalQuizzes, avgQuizScore, completionRate };
  }, [submissions, quizSubmissions, enrollments]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Learning Progress Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-4">📚</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalAssignments}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Assignments</div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-4">📝</div>
            <div className="text-3xl font-bold text-slate-900">{stats.avgAssignmentScore}%</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Avg Grade</div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-4">⚡</div>
            <div className="text-3xl font-bold text-slate-900">{stats.avgQuizScore}%</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Quiz Average</div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-2xl mb-4">🏆</div>
            <div className="text-3xl font-bold text-slate-900">{stats.completionRate}%</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Completion</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Course Engagement</h3>
            <div className="space-y-6">
                {enrollments.map(e => (
                    <div key={e.course_id + e.student_id}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-slate-700">{e.courses?.title}</span>
                            <span className="text-sm font-bold text-blue-600">{e.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${e.progress}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <h3 className="text-lg font-bold text-slate-900 mb-6 w-full text-left">Overall Performance</h3>
            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="96" cy="96" r="80"
                        stroke="currentColor" stroke-width="12" fill="transparent"
                        className="text-slate-100"
                    />
                    <circle
                        cx="96" cy="96" r="80"
                        stroke="currentColor" stroke-width="12" fill="transparent"
                        strokeDasharray={502.4}
                        strokeDashoffset={502.4 - (502.4 * stats.completionRate / 100)}
                        strokeLinecap="round"
                        className="text-blue-600 transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-black text-slate-900">{stats.completionRate}%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Complete</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
