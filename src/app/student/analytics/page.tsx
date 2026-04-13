"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { StudentAnalytics } from "@/components/student/StudentAnalytics";
import { Enrollment, Submission, QuizSubmission } from '@/lib/types';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { client, getEnrollments } = useSupabase();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.email).then(setEnrollments);
        client.from('submissions').select('*, assignments(*)').eq('student_id', user.id).then(r => setSubmissions(r.data || []));
        client.from('quiz_submissions').select('*, quizzes(*)').eq('student_id', user.id).then(r => setQuizSubmissions(r.data || []));
    }
  }, [user, client, getEnrollments]);

  return <StudentAnalytics submissions={submissions} quizSubmissions={quizSubmissions} enrollments={enrollments} />;
}
