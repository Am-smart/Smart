import React from 'react';
import { AssignmentDTO, SubmissionDTO } from '@/lib/types';
import { Countdown } from '@/components/ui/Countdown';

interface AssignmentsListProps {
  assignments: AssignmentDTO[];
  submissions: SubmissionDTO[];
  onSubmit: (assignment: AssignmentDTO) => void;
  onViewFeedback: (assignment: AssignmentDTO) => void;
  onRegradeRequest: (assignment: AssignmentDTO, reason: string) => void;
}

export const AssignmentsList: React.FC<AssignmentsListProps> = ({ assignments, submissions, onSubmit, onViewFeedback, onRegradeRequest }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Assignments</h2>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                const isPastDue = new Date(assignment.due_date) < new Date();
                const submission = submissions.find(s => s.assignment_id === assignment.id);
                const isOverdue = isPastDue && !submission;

                return (
                  <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{assignment.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{assignment.description}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{assignment.course?.title || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-600'}`}>
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                      {isOverdue ? (
                        <div className="text-[10px] text-red-500 uppercase font-bold tracking-tight">Overdue</div>
                      ) : (
                        !submission && <Countdown targetDate={assignment.due_date} compact className="mt-1" />
                      )}
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
                        <button
                            onClick={() => onSubmit(assignment)}
                            disabled={isPastDue && !assignment.allow_late_submissions}
                            className={`btn-primary text-[10px] py-1.5 px-4 ${isOverdue ? 'bg-red-500 hover:bg-red-600' : ''} disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed`}
                        >
                          {isPastDue && !assignment.allow_late_submissions ? 'Closed' : (submission ? 'Edit Submission' : isOverdue ? 'Submit Late' : 'Submit')}
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {assignments.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
            No assignments found.
          </div>
        ) : (
          assignments.map(assignment => {
            const isPastDue = new Date(assignment.due_date) < new Date();
            const submission = submissions.find(s => s.assignment_id === assignment.id);
            const isOverdue = isPastDue && !submission;

            return (
              <div key={assignment.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-slate-900 line-clamp-1">{assignment.title}</div>
                    <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">{assignment.course?.title || 'Unknown Course'}</div>
                  </div>
                  {submission ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${submission.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {submission.status}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500 shrink-0">Pending</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</div>
                    <div className={`text-xs font-medium ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-700'}`}>
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grade</div>
                    <div className="text-xs font-bold text-slate-900">
                      {submission?.final_grade !== undefined ? `${submission.final_grade}%` : 'Not Graded'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {submission?.status === 'graded' ? (
                    <>
                      <button onClick={() => onViewFeedback(assignment)} className="btn-secondary flex-1 py-2.5 text-xs font-bold uppercase">Feedback</button>
                      {assignment.regrade_requests_enabled !== false && !submission.regrade_request && (
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for regrade request:');
                            if (reason) onRegradeRequest(assignment, reason);
                          }}
                          className="btn-outline flex-1 py-2.5 text-[10px] font-bold uppercase text-amber-600 border-amber-200"
                        >
                          Regrade
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                        onClick={() => onSubmit(assignment)}
                        disabled={isPastDue && !assignment.allow_late_submissions}
                        className={`btn-primary w-full py-3 text-xs font-bold uppercase tracking-widest ${isOverdue ? 'bg-red-500 hover:bg-red-600' : ''} disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed`}
                    >
                      {isPastDue && !assignment.allow_late_submissions ? 'Closed' : (submission ? 'Edit Submission' : isOverdue ? 'Submit Late' : 'Submit Assignment')}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
