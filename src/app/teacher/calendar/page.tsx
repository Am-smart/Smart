"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { CalendarView } from "@/components/ui/CalendarView";
import { Assignment, Quiz, LiveClass } from '@/lib/types';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: 'assignment' | 'quiz' | 'live';
    color: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { client, getCourses } = useSupabase();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (user) {
        getCourses(user.id!).then(async myCourses => {
            const courseIds = myCourses.map(c => c.id);
            if (courseIds.length === 0) return;

            const [assignments, quizzes, liveClasses] = await Promise.all([
                client.from('assignments').select('*').in('course_id', courseIds),
                client.from('quizzes').select('*').in('course_id', courseIds),
                client.from('live_classes').select('*').in('course_id', courseIds)
            ]);

            const mappedEvents: CalendarEvent[] = [
                ...(assignments.data || []).map((a: Assignment) => ({
                    id: a.id,
                    title: `Due: ${a.title}`,
                    date: a.due_date.split('T')[0],
                    type: 'assignment' as const,
                    color: 'bg-blue-50 text-blue-600 border-blue-500'
                })),
                ...(quizzes.data || []).map((q: Quiz) => ({
                    id: q.id,
                    title: `Quiz: ${q.title}`,
                    date: (q.start_at || q.end_at || '').split('T')[0],
                    type: 'quiz' as const,
                    color: 'bg-purple-50 text-purple-600 border-purple-500'
                })),
                ...(liveClasses.data || []).map((l: LiveClass) => ({
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
  }, [user, client, getCourses]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6">Academic Calendar</h2>
        <CalendarView events={events} />
    </div>
  );
}
