"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getAssignments, getQuizzes, getSubmissions, getQuizSubmissions, getSystemLogs } from '@/lib/data-actions';
import { AntiCheatRecord } from "@/components/student/AntiCheatRecord";
import { Submission, QuizSubmission, SystemLog } from '@/lib/types';

export default function AntiCheatPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [antiCheatLogs, setAntiCheatLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    if (user) {
        // Teachers see all anti-cheat logs for students in their courses
        getCourses(user.id).then(async myCourses => {
            const courseIds = myCourses.map(c => c.id);
            if (courseIds.length > 0) {
                const [allAsgns, allQuizzes, logs] = await Promise.all([
                    getAssignments(user.id),
                    getQuizzes(undefined, user.id),
                    getSystemLogs(200)
                ]);

                // Filter logs for anti-cheat category
                const acLogs = (logs as SystemLog[]).filter(l => l.category === 'anti-cheat');
                setAntiCheatLogs(acLogs);

                const asgnIds = allAsgns.map(a => a.id);
                const quizIds = allQuizzes.map(q => q.id);

                if (asgnIds.length > 0) {
                    getSubmissions().then(data => {
                        setSubmissions(data.filter(s => asgnIds.includes(s.assignment_id)));
                    });
                }
                if (quizIds.length > 0) {
                    getQuizSubmissions().then(data => {
                        setQuizSubmissions(data.filter(s => quizIds.includes(s.quiz_id)));
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
