import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, User } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { useIndexedDB } from '@/hooks/useIndexedDB';

interface QuizViewProps {
  quiz: Quiz;
  user: User;
  onComplete: (score: number) => void;
  onCancel: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ quiz, user, onComplete, onCancel }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(quiz.time_limit ? quiz.time_limit * 60 : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToQueue, isOnline } = useIndexedDB();

  const { violationCount } = useAntiCheat(quiz.anti_cheat_enabled);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
        let score = 0;
        const questions = quiz.questions || [];
        if (questions.length > 0) {
            let correct = 0;
            questions.forEach((q) => {
                if (answers[q.id] === q.correct_answer) {
                    correct++;
                }
            });
            score = Math.round((correct / questions.length) * 100);
        }

        const payload = {
            quiz_id: quiz.id,
            student_email: user.email,
            answers,
            score,
            status: 'submitted',
            submitted_at: new Date().toISOString()
        };

        if (isOnline) {
            const { error } = await supabase.from('quiz_submissions').insert([payload]);
            if (error) throw error;
        } else {
            await addToQueue('QUIZ_SUBMISSION', payload);
            alert('Offline: Submission queued for sync.');
        }

        onComplete(score);
    } catch (err) {
        console.error('Failed to submit quiz:', err);
        alert('Failed to submit quiz. Please try again.');
        setIsSubmitting(false);
    }
  }, [quiz, user, answers, isSubmitting, onComplete, isOnline, addToQueue]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
        handleSubmit();
        return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev! - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        <header className="flex justify-between items-center mb-8 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-slate-500 text-sm">{quiz.questions?.length || 0} Questions</p>
          </div>
          <div className="text-right">
            {timeLeft !== null && (
              <div className={`text-2xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                {formatTime(timeLeft)}
              </div>
            )}
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm font-bold uppercase mt-2">Cancel Quiz</button>
          </div>
        </header>

        {quiz.anti_cheat_enabled && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm font-medium">
                <span className="text-xl">🛡️</span>
                Anti-cheat protection is active. Your actions are being monitored.
                {violationCount > 0 && <span className="ml-auto text-red-600 font-bold">Violations: {violationCount}</span>}
            </div>
        )}

        <div className="space-y-12">
          {(quiz.questions || []).map((q, index: number) => (
            <div key={q.id} className="quiz-question">
              <h3 className="text-lg font-bold mb-4">
                <span className="text-blue-600 mr-2">{index + 1}.</span>
                {q.question_text}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {(q.options || []).map((opt: string) => (
                  <label key={opt} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[q.id] === opt ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="font-medium text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t flex justify-between items-center">
            <p className="text-slate-500 text-sm">
                {Object.keys(answers).length} of {quiz.questions?.length || 0} answered
            </p>
            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary px-8 py-3"
            >
                {isSubmitting ? 'Submitting...' : 'Complete & Submit'}
            </button>
        </div>
      </div>
    </div>
  );
};
