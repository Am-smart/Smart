"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { DiscussionBoard } from "@/components/student/DiscussionBoard";
import { Enrollment } from '@/lib/types';

export default function DiscussionsPage() {
  const { user } = useAuth();
  const { getEnrollments } = useSupabase();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  useEffect(() => {
    if (user) {
        getEnrollments(user.id!).then(e => {
            setEnrollments(e);
            if (e.length > 0) setSelectedCourseId(e[0].course_id);
        });
    }
  }, [user, getEnrollments]);

  if (!user) return null;

  return (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Select Course Discussion</label>
            <select
                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
            >
                <option value="">Global Discussion</option>
                {enrollments.map(e => (
                    <option key={e.course_id} value={e.course_id}>{e.courses?.title}</option>
                ))}
            </select>
        </div>

        <DiscussionBoard
            courseId={selectedCourseId || undefined}
            userId={user.id}
        />
    </div>
  );
}
