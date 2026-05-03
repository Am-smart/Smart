"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getQuizzes, getQuizSubmissions } from '@/lib/api-actions';
import { QuizzesList } from "@/components/assessments/QuizzesList";
import { QuizDTO, QuizSubmissionDTO } from '@/lib/types';
import dynamic from 'next/dynamic';
import { QuizResultModal } from '@/components/assessments/QuizResultModal';

const QuizView = dynamic(() => import("@/components/assessments/QuizView").then(m => m.QuizView), { ssr: false });

export default function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizDTO[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizDTO | null>(null);
  const [viewingResult, setViewingResult] = useState<{ quiz: QuizDTO, submission: QuizSubmissionDTO } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [myEnrollments, allQuizzes, mySubmissions] = await Promise.all([
      getEnrollments(user.id),
      getQuizzes(),
      getQuizSubmissions(undefined, user.id)
    ]);

    const enrolledIds = myEnrollments.map(e => e.course_id);
    setQuizzes(allQuizzes.filter(q => enrolledIds.includes(q.course_id) && q.status === 'published'));
    setSubmissions(mySubmissions);
  }, [user]);

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
