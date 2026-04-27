import React from 'react';
import { SubmissionDTO, QuizSubmissionDTO } from '@/lib/dto/assessment.dto';
import { SystemLogDTO } from '@/lib/dto/system.dto';

interface AntiCheatRecordProps {
  submissions: SubmissionDTO[];
  quizSubmissions: QuizSubmissionDTO[];
  logs?: SystemLogDTO[];
  isTeacher?: boolean;
}

export const AntiCheatRecord: React.FC<AntiCheatRecordProps> = ({ submissions, quizSubmissions, logs, isTeacher }) => {
  const allAssessments = [
    ...submissions.map(s => ({
        id: s.id,
        type: 'Assignment',
        title: s.assignment?.title || 'Unknown',
        violations: (s as any).violation_count || 0,
        status: s.status,
        submittedAt: s.submitted_at,
        student: s.student?.full_name
    })),
    ...quizSubmissions.map(s => ({
        id: s.id,
        type: 'Quiz',
        title: s.quiz?.title || 'Unknown',
        violations: (s as any).violation_count || 0,
        status: (s as any).status,
        submittedAt: s.submitted_at,
        student: s.student?.full_name
    }))
  ].filter(s => s.status === 'submitted' || s.status === 'graded');

  allAssessments.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold mb-2">{isTeacher ? 'Security Dashboard' : 'Security Record'}</h2>
        <p className="text-slate-500 text-sm">
          {isTeacher
            ? 'Monitor student assessment integrity and violation counts across your courses.'
            : 'This page shows the violation counts recorded during your recent assessments. We use these metrics to ensure a fair environment for everyone.'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="font-bold text-slate-900">Assessment Violations Summary</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Assessment</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Violation Count</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allAssessments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">No assessment submissions found.</td>
                </tr>
              ) : (
                allAssessments.map(record => (
                  <tr key={`${record.type}-${record.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{record.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{record.student || 'N/A'}</div>
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

        {isTeacher && logs && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-bold text-slate-900">Real-time Violation Logs</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Assessment</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No detailed security logs found.</td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-700">{log.user?.full_name || 'System'}</div>
                          <div className="text-[10px] text-slate-400">{log.user?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black uppercase text-red-600 bg-red-50 px-2 py-1 rounded">
                            {String(log.metadata?.type || 'Violation').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {String(log.metadata?.assessmentTitle || 'Unknown')}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-mono italic">
                          {log.message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
