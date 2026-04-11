import React from 'react';
import { Submission } from '@/lib/types';

interface GradingQueueProps {
  submissions: Submission[];
  onGrade: (submission: Submission) => void;
}

export const GradingQueue: React.FC<GradingQueueProps> = ({ submissions, onGrade }) => {
  const pending = submissions.filter(s => s.status === 'submitted');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Grading Queue</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Assignment</th>
              <th className="px-6 py-4">Submitted At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pending.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No pending submissions to grade.</td>
              </tr>
            ) : (
              pending.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{sub.users?.full_name || sub.student_id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{sub.assignments?.title || 'Unknown'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(sub.submitted_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onGrade(sub)} className="btn-primary text-[10px] py-1.5 px-4">Grade Now</button>
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
