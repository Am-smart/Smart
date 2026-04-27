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

  useEffect(() => {
    if (user) {
        getSubmissions(undefined, user.id).then(setSubmissions);
        getQuizSubmissions(undefined, user.id).then(setQuizSubmissions);
    }
  }, [user]);

  return <AntiCheatRecord submissions={submissions} quizSubmissions={quizSubmissions} />;
}
