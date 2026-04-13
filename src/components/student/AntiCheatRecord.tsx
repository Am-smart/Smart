import React from 'react';
import { Submission, QuizSubmission } from '@/lib/types';

interface AntiCheatRecordProps {
  submissions: Submission[];
  quizSubmissions: QuizSubmission[];
}

export const AntiCheatRecord: React.FC<AntiCheatRecordProps> = ({ submissions, quizSubmissions }) => {
  const allAssessments = [
    ...submissions.map(s => ({
        id: s.id,
        type: 'Assignment',
        title: s.assignments?.title || 'Unknown',
        violations: s.violation_count || 0,
        status: s.status,
        submittedAt: s.submitted_at
    })),
    ...quizSubmissions.map(s => ({
        id: s.id,
        type: 'Quiz',
        title: s.quizzes?.title || 'Unknown',
        violations: s.violation_count || 0,
        status: s.status,
        submittedAt: s.submitted_at
    }))
  ].filter(s => s.status === 'submitted' || s.status === 'graded');

  allAssessments.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return (
    <div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <h2 className="text-2xl font-bold mb-2">Security Record</h2>
        <p className="text-slate-500 text-sm">This page shows the violation counts recorded during your recent assessments. We use these metrics to ensure a fair environment for everyone.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">Assessment</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Violations</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allAssessments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No assessment submissions found.</td>
              </tr>
            ) : (
              allAssessments.map(record => (
                <tr key={`${record.type}-${record.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{record.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-100 rounded-md">{record.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${record.violations > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {record.violations}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase ${record.status === 'graded' ? 'text-green-600' : 'text-amber-600'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(record.submittedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
