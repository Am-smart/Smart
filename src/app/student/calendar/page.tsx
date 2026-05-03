"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getAssignments, getQuizzes, getLiveClasses, getEnrollments } from '@/lib/api-actions';
import { CalendarView } from "@/components/ui/CalendarView";
import { AssignmentDTO, QuizDTO } from '@/lib/types';
import { LiveClassDTO } from '@/lib/types';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: 'assignment' | 'quiz' | 'live';
    color: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.id!).then(async enrollments => {
            const courseIds = enrollments.map(e => e.course_id);
            if (courseIds.length === 0) return;

            const [assignments, quizzes, liveClasses] = await Promise.all([
                getAssignments(undefined, undefined), // Need to filter by courseIds in action if needed, or filter here
                getQuizzes(undefined, undefined),
                getLiveClasses()
            ]);

            const mappedEvents: CalendarEvent[] = [
                ...assignments.filter(a => courseIds.includes(a.course_id)).map((a: AssignmentDTO) => ({
                    id: a.id,
                    title: `Due: ${a.title}`,
                    date: a.due_date.split('T')[0],
                    type: 'assignment' as const,
                    color: 'bg-blue-50 text-blue-600 border-blue-500'
                })),
                ...quizzes.filter(q => courseIds.includes(q.course_id)).map((q: QuizDTO) => ({
                    id: q.id,
                    title: `Quiz: ${q.title}`,
                    date: (q.start_at || q.end_at || '').split('T')[0],
                    type: 'quiz' as const,
                    color: 'bg-purple-50 text-purple-600 border-purple-500'
                })),
                ...liveClasses.filter(l => courseIds.includes(l.course_id)).map((l: LiveClassDTO) => ({
                    id: l.id,
                    title: `Class: ${l.title}`,
                    date: l.start_at.split('T')[0],
                    type: 'live' as const,
                    color: 'bg-green-50 text-green-600 border-green-500'
                }))
            ];

            setEvents(mappedEvents);
        });
    }
  }, [user]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6">Academic Calendar</h2>
        <CalendarView events={events} />
    </div>
  );
}
