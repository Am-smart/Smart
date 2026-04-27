"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { DiscussionBoard } from "@/components/student/DiscussionBoard";
import { CourseDTO } from '@/lib/dto/learning.dto';

export default function DiscussionsPage() {
  const { user } = useAuth();
  const { getCourses } = useSupabase();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  useEffect(() => {
    if (user) {
        getCourses(user.id!).then(c => {
            setCourses(c);
            if (c.length > 0) setSelectedCourseId(c[0].id);
        });
    }
  }, [user, getCourses]);

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
                {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
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
