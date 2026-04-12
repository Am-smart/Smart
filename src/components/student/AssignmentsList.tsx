import React from 'react';
import { Assignment, Submission } from '@/lib/types';

interface AssignmentsListProps {
  assignments: Assignment[];
  submissions: Submission[];
  onSubmit: (assignment: Assignment) => void;
  onViewFeedback: (assignment: Assignment) => void;
  onRegradeRequest: (assignment: Assignment, reason: string) => void;
}

export const AssignmentsList: React.FC<AssignmentsListProps> = ({ assignments, submissions, onSubmit, onViewFeedback, onRegradeRequest }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Assignments</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">Assignment</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Grade</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No assignments found.</td>
              </tr>
            ) : (
              assignments.map(assignment => {
                const submission = submissions.find(s => s.assignment_id === assignment.id);
                const isOverdue = new Date(assignment.due_date) < new Date() && !submission;

                return (
                  <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{assignment.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{assignment.description}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{assignment.courses?.title || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-600'}`}>
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                      {isOverdue && <div className="text-[10px] text-red-500 uppercase font-bold tracking-tight">Overdue</div>}
                    </td>
                    <td className="px-6 py-4">
                      {submission ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${submission.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {submission.status}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {submission?.final_grade !== undefined ? (
                        <div>
                          <div className="text-sm font-bold text-slate-900">{submission.final_grade}%</div>
                          <div className="text-[10px] text-slate-500">{submission.grade} / {assignment.points_possible}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right flex flex-col gap-1 items-end">
                      {submission?.status === 'graded' ? (
                        <>
                          <button onClick={() => onViewFeedback(assignment)} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider transition-colors">Feedback</button>
                          {assignment.regrade_requests_enabled !== false && !submission.regrade_request && (
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for regrade request:');
                                if (reason) onRegradeRequest(assignment, reason);
                              }}
                              className="text-amber-600 hover:text-amber-800 font-bold text-[10px] uppercase tracking-wider"
                            >
                              Request Regrade
                            </button>
                          )}
                        </>
                      ) : (
                        <button onClick={() => onSubmit(assignment)} className={`btn-primary text-[10px] py-1.5 px-4 ${isOverdue ? 'bg-red-500 hover:bg-red-600' : ''}`}>
                          {submission ? 'Edit Submission' : isOverdue ? 'Submit Late' : 'Submit'}
                        </button>
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
};
