"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getAssignments, getQuizzes, getAntiCheatLogs, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { AntiCheatRecord } from "@/components/system/AntiCheatRecord";
import { SubmissionDTO, QuizSubmissionDTO, AntiCheatLogDTO } from '@/lib/types';

export default function AntiCheatPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [antiCheatLogs, setAntiCheatLogs] = useState<AntiCheatLogDTO[]>([]);

  useEffect(() => {
    if (user) {
        // Teachers see all anti-cheat logs for students in their courses
        getCourses(user.id).then(async myCourses => {
            const courseIds = myCourses.map(c => c.id);
            if (courseIds.length > 0) {
                const [allAsgns, allQuizzes, logs] = await Promise.all([
                    getAssignments(user.id),
                    getQuizzes(undefined, user.id),
                    getAntiCheatLogs({ limit: 200 })
                ]);

                setAntiCheatLogs(logs);

                const asgnIds = allAsgns.map(a => a.id);
                const quizIds = allQuizzes.map(q => q.id);

                if (asgnIds.length > 0) {
                    getSubmissions().then(data => {
                        setSubmissions(data); // Backend already filters for teacher's own assignments
                    });
                }
                if (quizIds.length > 0) {
                    getQuizSubmissions().then(data => {
                        setQuizSubmissions(data); // Backend already filters for teacher's own quizzes
                    });
                }
            }
        });
    }
  }, [user]);

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold">Anti-Cheat Monitoring</h2>
        <AntiCheatRecord
            submissions={submissions}
            quizSubmissions={quizSubmissions}
            logs={antiCheatLogs}
            isTeacher={true}
        />
    </div>
  );
}
