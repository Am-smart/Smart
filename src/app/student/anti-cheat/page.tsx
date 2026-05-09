"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getSubmissions, getQuizSubmissions, getAntiCheatLogs } from '@/lib/api-actions';
import { AntiCheatRecord } from "@/components/system/AntiCheatRecord";
import { SubmissionDTO, QuizSubmissionDTO, AntiCheatLogDTO } from '@/lib/types';

export default function AntiCheatPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [antiCheatLogs, setAntiCheatLogs] = useState<AntiCheatLogDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getSubmissions({ studentId: user.id }),
        getQuizSubmissions(undefined, user.id),
        getAntiCheatLogs({ userId: user.id, limit: 200 })
      ])
        .then(([subs, quizSubs, logs]) => {
          setSubmissions(subs);
          setQuizSubmissions(quizSubs);
          setAntiCheatLogs(logs);
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

  return <AntiCheatRecord submissions={submissions} quizSubmissions={quizSubmissions} logs={antiCheatLogs} />;
}
