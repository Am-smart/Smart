import React from 'react';
import { Quiz, QuizSubmission } from '@/lib/types';

interface QuizzesListProps {
  quizzes: Quiz[];
  submissions: QuizSubmission[];
  onStart: (quizId: string) => void;
  onViewResults: (quizId: string, submissionId: string) => void;
}

export const QuizzesList: React.FC<QuizzesListProps> = ({ quizzes, submissions, onStart, onViewResults }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">My Quizzes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map(quiz => {
          const mySubs = submissions
            .filter(s => s.quiz_id === quiz.id && s.status === 'submitted')
            .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

          const bestScore = mySubs.length ? Math.max(...mySubs.map(s => s.score)) : null;
          const attemptsUsed = mySubs.length;
          const canAttempt = attemptsUsed < quiz.attempts_allowed;

          const now = new Date();
          const startAt = quiz.start_at ? new Date(quiz.start_at) : null;
          const endAt = quiz.end_at ? new Date(quiz.end_at) : null;
          const isNotStarted = startAt && now < startAt;
          const isEnded = endAt && now > endAt;

          return (
            <div key={quiz.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{quiz.title}</h3>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{quiz.courses?.title || 'Course'}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="text-center border-r border-slate-200">
                  <div className="text-sm font-bold text-slate-900">{attemptsUsed} / {quiz.attempts_allowed}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-purple-600">{bestScore !== null ? `${bestScore}%` : '-'}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Best Score</div>
                </div>
              </div>

              {mySubs.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Attempts</div>
                  {mySubs.slice(0, 2).map((sub, i) => (
                    <div key={sub.id} className="flex justify-between items-center text-xs p-2 bg-white border border-slate-100 rounded-lg">
                      <span className="text-slate-600 font-medium">#{attemptsUsed - i}: {sub.score}%</span>
                      <button onClick={() => onViewResults(quiz.id, sub.id)} className="text-purple-600 hover:text-purple-800 font-bold uppercase text-[9px]">Details</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-4">
                {!canAttempt ? (
                  <div className="w-full text-center bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-xs uppercase">All Attempts Used</div>
                ) : isNotStarted ? (
                  <div className="w-full text-center bg-amber-50 text-amber-600 py-3 rounded-xl font-bold text-xs uppercase">Available {startAt?.toLocaleDateString()}</div>
                ) : isEnded ? (
                  <div className="w-full text-center bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-xs uppercase">Quiz Closed</div>
                ) : (
                  <button onClick={() => onStart(quiz.id)} className="btn-primary w-full py-3">Start New Attempt</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
