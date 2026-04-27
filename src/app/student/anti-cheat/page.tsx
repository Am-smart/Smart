"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { AntiCheatRecord } from "@/components/student/AntiCheatRecord";
import { SubmissionDTO, QuizSubmissionDTO } from '@/lib/dto/assessment.dto';

export default function AntiCheatPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getSubmissions(undefined, user.id),
        getQuizSubmissions(undefined, user.id)
      ])
        .then(([subs, quizSubs]) => {
          setSubmissions(subs);
          setQuizSubmissions(quizSubs);
        })
        .catch(err => {
          console.error('Failed to load anti-cheat records:', err);
          setError('Failed to load anti-cheat records');
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <div className="animate-pulse">Loading records...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return <AntiCheatRecord submissions={submissions} quizSubmissions={quizSubmissions} />;
}
