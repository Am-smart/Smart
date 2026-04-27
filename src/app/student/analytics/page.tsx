"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { StudentAnalytics } from "@/components/student/StudentAnalytics";
import { EnrollmentDTO } from '@/lib/dto/learning.dto';
import { SubmissionDTO, QuizSubmissionDTO } from '@/lib/dto/assessment.dto';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.id).then(setEnrollments);
        getSubmissions(undefined, user.id).then(setSubmissions);
        getQuizSubmissions(undefined, user.id).then(setQuizSubmissions);
    }
  }, [user]);

  return <StudentAnalytics submissions={submissions} quizSubmissions={quizSubmissions} enrollments={enrollments} />;
}
