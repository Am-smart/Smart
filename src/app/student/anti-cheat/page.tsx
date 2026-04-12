"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { AntiCheatRecord } from "@/components/student/AntiCheatRecord";
import { Submission, QuizSubmission } from '@/lib/types';

export default function AntiCheatPage() {
  const { user } = useAuth();
  const { client } = useSupabase();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);

  useEffect(() => {
    if (user) {
        client.from('submissions').select('*, assignments(*)').eq('student_id', user.id).then(r => setSubmissions(r.data || []));
        client.from('quiz_submissions').select('*, quizzes(*)').eq('student_id', user.id).then(r => setQuizSubmissions(r.data || []));
    }
  }, [user, client]);

  return <AntiCheatRecord submissions={submissions} quizSubmissions={quizSubmissions} />;
}
