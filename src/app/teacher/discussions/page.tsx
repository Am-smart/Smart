"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { DiscussionBoard } from "@/components/student/DiscussionBoard";
import { Discussion, Course } from '@/lib/types';

export default function DiscussionsPage() {
  const { user } = useAuth();
  const { client, getCourses, getDiscussions } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  useEffect(() => {
    if (user) {
        getCourses(user.id!).then(c => {
            setCourses(c);
            if (c.length > 0) setSelectedCourseId(c[0].id);
        });
    }
  }, [user, getCourses]);

  useEffect(() => {
    if (selectedCourseId) {
        getDiscussions(selectedCourseId!).then(setDiscussions);
    }
  }, [selectedCourseId, getDiscussions]);

  const handlePost = async (content: string) => {
      if (!user || !selectedCourseId) return;
      const { error } = await client.from('discussions').insert([{
          course_id: selectedCourseId,
          user_id: user.id,
          content
      }]);
      if (!error) getDiscussions(selectedCourseId!).then(setDiscussions);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Course</label>
            <select
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
            >
                {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                ))}
            </select>
        </div>

        {selectedCourseId && (
            <DiscussionBoard
                discussions={discussions}
                userId={user?.id || ''}
                onPost={handlePost}
                onDelete={async (id) => {
                    await client.from('discussions').delete().eq('id', id);
                    getDiscussions(selectedCourseId!).then(setDiscussions);
                }}
                isOnline={true}
            />
        )}
    </div>
  );
}
