"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getSubmissions, getQuizSubmissions } from '@/lib/data-actions';
import { StudentAnalytics } from "@/components/student/StudentAnalytics";
import { Enrollment, Submission, QuizSubmission } from '@/lib/types';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.id).then(setEnrollments);
        getSubmissions(undefined, user.id).then(setSubmissions);
        getQuizSubmissions(undefined, user.id).then(setQuizSubmissions);
    }
  }, [user]);

  return <StudentAnalytics submissions={submissions} quizSubmissions={quizSubmissions} enrollments={enrollments} />;
}
