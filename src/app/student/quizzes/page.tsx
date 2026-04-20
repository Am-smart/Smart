"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { QuizzesList } from "@/components/student/QuizzesList";
import { Quiz, QuizSubmission } from '@/lib/types';
import dynamic from 'next/dynamic';
import { QuizResultModal } from '@/components/student/QuizResultModal';

const QuizView = dynamic(() => import("@/components/student/QuizView").then(m => m.QuizView), { ssr: false });

export default function QuizzesPage() {
  const { user } = useAuth();
  const { client, getQuizzes, getEnrollments } = useSupabase();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [viewingResult, setViewingResult] = useState<{ quiz: Quiz, submission: QuizSubmission } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [myEnrollments, allQuizzes, mySubmissions] = await Promise.all([
      getEnrollments(user.id),
      getQuizzes(),
      client.from('quiz_submissions').select('*, quizzes(*)').eq('student_id', user.id).then(r => r.data || [])
    ]);

    const enrolledIds = myEnrollments.map(e => e.course_id);
    setQuizzes(allQuizzes.filter(q => enrolledIds.includes(q.course_id) && q.status === 'published'));
    setSubmissions(mySubmissions);
  }, [user, client, getQuizzes, getEnrollments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewResults = (quizId: string, submissionId: string) => {
      const quiz = quizzes.find(q => q.id === quizId);
      const sub = submissions.find(s => s.id === submissionId);
      if (quiz && sub) {
          setViewingResult({ quiz, submission: sub });
      }
  };

  return (
    <>
      {activeQuiz && (
        <QuizView
            quiz={activeQuiz}
            user={user!}
            onComplete={() => { setActiveQuiz(null); fetchData(); }}
            onCancel={() => setActiveQuiz(null)}
        />
      )}
      {viewingResult && (
          <QuizResultModal
              quiz={viewingResult.quiz}
              submission={viewingResult.submission}
              onClose={() => setViewingResult(null)}
          />
      )}
      <QuizzesList
          quizzes={quizzes}
          submissions={submissions}
          onStart={(quizId) => {
              const q = quizzes.find(item => item.id === quizId);
              if (q) setActiveQuiz(q);
          }}
          onViewResults={handleViewResults}
      />
    </>
  );
}
