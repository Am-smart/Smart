import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Shield, CheckCircle, X, Clock } from 'lucide-react';
import { QuizDTO } from '@/lib/dto/assessment.dto';
import { UserDTO } from '@/lib/dto/auth.dto';
import { apiClient } from '@/lib/api-client';
import { calculateQuizScore } from '@/lib/scoring-util';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '@/components/AppContext';

interface QuizViewProps {
  quiz: QuizDTO;
  user: UserDTO;
  onComplete: (score: number) => void;
  onCancel: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ quiz, user, onComplete, onCancel }) => {
  const { addToast } = useAppContext();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState(quiz.questions || []);
  const [timeLeft, setTimeLeft] = useState<number | null>(quiz.time_limit ? quiz.time_limit * 60 : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; isTimeout?: boolean } | null>(null);
  const { addToQueue, setCache, getCache, isOnline } = useIndexedDB();
  const [startedAt] = useState(new Date().toISOString());

  const { violationCount } = useAntiCheat(quiz.anti_cheat_enabled, quiz.title);

  useEffect(() => {
    const handleViolation = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (quiz.anti_cheat_enabled && detail) {
            addToast(`Anti-Cheat Alert: ${detail.type} detected!`, 'error');
        }
    };
    window.addEventListener('anti-cheat-violation', handleViolation);
    return () => window.removeEventListener('anti-cheat-violation', handleViolation);
  }, [quiz.anti_cheat_enabled, addToast]);

  // Handle Shuffling
  useEffect(() => {
    if (quiz.shuffle_questions && quiz.questions) {
        const shuffled = [...quiz.questions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
    } else {
        setQuestions(quiz.questions || []);
    }
  }, [quiz.shuffle_questions, quiz.questions]);

  // Load saved progress from IndexedDB
  useEffect(() => {
    const loadProgress = async () => {
        const progress = await getCache<Record<string, string>>(`quiz_progress_${quiz.id}`);
        if (progress) setAnswers(progress);
    };
    loadProgress();
  }, [quiz.id, getCache]);

  // Save progress locally as user answers
  const handleAnswerChange = useCallback(async (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    await setCache(`quiz_progress_${quiz.id}`, newAnswers);
  }, [answers, quiz.id, setCache]);

  const handleSubmit = useCallback(async (isTimeout = false) => {
    if (isSubmitting || result) return;
    setIsSubmitting(true);

    try {
        const timeSpent = quiz.time_limit ? (quiz.time_limit * 60) - (timeLeft || 0) : 0;

        const payload = {
            answers,
            time_spent: timeSpent,
            started_at: startedAt
        };

        let score = 0;
        if (isOnline) {
            const res = await apiClient.post<any>(`/api/submissions?assignmentId=${quiz.id}&type=quiz`, { ...payload, violation_count: violationCount });
            score = res.score || 0;
        } else {
            // Offline estimation using unified logic
            const questions = (quiz.questions as unknown[]) || [];
            const result = calculateQuizScore(questions, answers);
            score = result.score;

            await addToQueue('QUIZ_SUBMISSION', {
                quiz_id: quiz.id,
                student_id: user.id,
                ...payload,
                score,
                violation_count: violationCount,
                status: 'submitted'
            });
        }

        const passed = score >= (quiz.passing_score || 60);

        // Clean up progress cache
        await setCache(`quiz_progress_${quiz.id}`, null);
        setResult({ score, passed, isTimeout });
        setIsSubmitting(false);
    } catch (err: unknown) {
        console.error('Failed to submit quiz:', err);
        const msg = err instanceof Error ? err.message : 'Failed to submit quiz. Please try again.';
        addToast(msg, 'error');
        setIsSubmitting(false);
    }
  }, [quiz, user, answers, isSubmitting, result, isOnline, addToQueue, setCache, timeLeft, startedAt, addToast, violationCount]);

  // Anti-cheat: Hard enforcement when enabled
  useEffect(() => {
    if (quiz.anti_cheat_enabled && violationCount > 0) {
        addToast(`Security Warning: Violation detected (${violationCount}). This assessment has been flagged for review.`, 'info');
    }

    // Use hard_enforcement flag from database (Step 1)
    if (quiz.anti_cheat_enabled && quiz.hard_enforcement && violationCount >= 5 && !isSubmitting && !result) {
        addToast('Security Threshold Reached: Assessment locked and auto-submitted due to multiple violations.', 'error', 10000);
        handleSubmit(false);
    }
  }, [violationCount, quiz, addToast, isSubmitting, result , violationCount, handleSubmit]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
        handleSubmit(true);
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

  if (result) {
    return (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
                <div className="flex justify-center mb-6">
                    {result.isTimeout ? (
                        <Clock size={64} className="text-red-500" />
                    ) : result.passed ? (
                        <CheckCircle size={64} className="text-green-500 animate-bounce" />
                    ) : (
                        <AlertTriangle size={64} className="text-amber-500" />
                    )}
                </div>
                {result.isTimeout && <div className="text-red-500 font-bold uppercase tracking-widest text-xs mb-2">Time&apos;s Up!</div>}
                <h2 className="text-3xl font-black mb-2">{result.passed ? 'PASSED!' : 'TRY AGAIN'}</h2>
                <p className="text-slate-500 font-medium mb-8">You scored {result.score}% in this attempt.</p>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Passing Score</div>
                    <div className="text-xl font-bold text-slate-700">{quiz.passing_score || 60}%</div>
                </div>

                <button
                    onClick={() => onComplete(result.score)}
                    className="btn-primary w-full py-4 rounded-xl text-lg font-bold shadow-xl shadow-blue-500/20"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto" aria-busy={isSubmitting}>
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-center md:text-left">{quiz.title}</h1>
            <p className="text-slate-500 text-sm text-center md:text-left">{quiz.questions?.length || 0} Questions</p>
          </div>
          <div className="text-center md:text-right">
            {timeLeft !== null && (
              <div className={`text-2xl font-mono font-bold flex items-center justify-center md:justify-end gap-2 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                <Clock size={24} />
                {formatTime(timeLeft)}
              </div>
            )}
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase mt-2 inline-flex items-center gap-1">
              <X size={16} />
              Cancel Quiz
            </button>
          </div>
        </header>

        {quiz.anti_cheat_enabled && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-xs md:text-sm font-medium border ${violationCount > 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                {violationCount > 0 ? (
                    <AlertTriangle size={20} className="shrink-0 text-red-600" />
                ) : (
                    <Shield size={20} className="shrink-0 text-amber-600" />
                )}
                {violationCount > 0
                    ? `SECURITY FLAG: ${violationCount} violation(s) detected. This attempt is marked for review.`
                    : 'Anti-cheat protection is active. Your actions are being monitored.'}
            </div>
        )}

        <div className="space-y-10 md:space-y-12">
          {questions.map((q, index: number) => (
            <div key={q.id} className="quiz-question">
              <h3 className="text-lg font-bold mb-4 flex items-start gap-2">
                <span className="text-blue-600 shrink-0">{index + 1}.</span>
                {q.question_text}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {q.type === 'short' ? (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                    onPaste={(e) => {
                        if (quiz.anti_cheat_enabled) {
                            e.preventDefault();
                            const event = new CustomEvent('anti-cheat-violation', { detail: { type: 'pasted-content' } });
                            window.dispatchEvent(event);
                        }
                    }}
                  />
                ) : (
                  (q.options || []).map((opt: string) => (
                    <label key={opt} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[q.id] === opt ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="font-medium text-slate-700 text-sm">{opt}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm font-medium">
                {Object.keys(answers).length} of {questions.length} answered
            </p>
            <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="btn-primary w-full md:w-auto px-10 py-4"
            >
                {isSubmitting ? 'Submitting...' : 'Complete & Submit Quiz'}
            </button>
        </div>
      </div>
    </div>
  );
};
