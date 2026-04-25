"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getSubmissions, getQuizSubmissions } from '@/lib/api-client';
import { AntiCheatRecord } from "@/components/student/AntiCheatRecord";
import { Submission, QuizSubmission } from '@/lib/types';

export default function AntiCheatPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);

  useEffect(() => {
    if (user) {
        getSubmissions(undefined, user.id).then(setSubmissions);
        getQuizSubmissions(undefined, user.id).then(setQuizSubmissions);
    }
  }, [user]);

  return <AntiCheatRecord submissions={submissions} quizSubmissions={quizSubmissions} />;
}
