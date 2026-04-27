"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getAssignments, getQuizzes, getSystemLogs, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { AntiCheatRecord } from "@/components/student/AntiCheatRecord";
import { SubmissionDTO, QuizSubmissionDTO } from '@/lib/dto/assessment.dto';
import { SystemLogDTO } from '@/lib/dto/system.dto';

export default function AntiCheatPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [antiCheatLogs, setAntiCheatLogs] = useState<SystemLogDTO[]>([]);

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
                const acLogs = (logs as SystemLogDTO[]).filter(l => l.category === 'anti-cheat');
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
