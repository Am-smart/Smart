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
        // Teachers see all anti-cheat logs for students in their courses
        client.from('courses').select('id').eq('teacher_id', user.id).then(async ({ data: myCourses }) => {
            const courseIds = (myCourses || []).map(c => c.id);
            if (courseIds.length > 0) {
                const [asgnRes, quizRes] = await Promise.all([
                    client.from('assignments').select('id').in('course_id', courseIds),
                    client.from('quizzes').select('id').in('course_id', courseIds)
                ]);
                const asgnIds = (asgnRes.data || []).map(a => a.id);
                const quizIds = (quizRes.data || []).map(q => q.id);

                if (asgnIds.length > 0) {
                    client.from('submissions').select('*, assignments(*), users(full_name)').in('assignment_id', asgnIds).then(r => setSubmissions(r.data || []));
                }
                if (quizIds.length > 0) {
                    client.from('quiz_submissions').select('*, quizzes(*), users(full_name)').in('quiz_id', quizIds).then(r => setQuizSubmissions(r.data || []));
                }
            }
        });
    }
  }, [user, client]);

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold">Anti-Cheat Monitoring</h2>
        <AntiCheatRecord submissions={submissions} quizSubmissions={quizSubmissions} />
    </div>
  );
}
