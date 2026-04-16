"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { DiscussionBoard } from "@/components/student/DiscussionBoard";
import { Discussion, Enrollment } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '@/components/AppContext';

export default function DiscussionsPage() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const { client, getEnrollments, getDiscussions } = useSupabase();
  const { isOnline, addToQueue } = useIndexedDB();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.id!).then(e => {
            setEnrollments(e);
            if (e.length > 0) setSelectedCourseId(e[0].course_id);
        });
    }
  }, [user, getEnrollments]);

  useEffect(() => {
    if (selectedCourseId) {
        getDiscussions(selectedCourseId!).then(setDiscussions);
    }
  }, [selectedCourseId, getDiscussions]);

  const handlePost = async (content: string) => {
      if (!user || !selectedCourseId) return;

      const payload = {
          course_id: selectedCourseId,
          user_id: user.id,
          content,
          created_at: new Date().toISOString()
      };

      if (isOnline) {
          const { error } = await client.from('discussions').insert([payload]);
          if (!error) {
              getDiscussions(selectedCourseId!).then(setDiscussions);
              addToast('Message posted!', 'success');
          }
      } else {
          await addToQueue('DISCUSSION_POST', payload, user.sessionId);
          addToast('Post queued for synchronization.', 'info');
          // Optimistically update local state if possible, or just keep as is
          setDiscussions(prev => [{ ...payload, id: Math.random().toString(), users: { full_name: user.full_name } } as unknown as Discussion, ...prev]);
      }
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
                {enrollments.map(e => (
                    <option key={e.course_id} value={e.course_id}>{e.courses?.title}</option>
                ))}
            </select>
        </div>

        {selectedCourseId && (
            <DiscussionBoard
                discussions={discussions}
                userId={user?.id || ''}
                onPost={handlePost}
                onDelete={async (id) => {
                    if (!isOnline) {
                        addToast('Cannot delete posts while offline.', 'error');
                        return;
                    }
                    await client.from('discussions').delete().eq('id', id);
                    getDiscussions(selectedCourseId!).then(setDiscussions);
                }}
                isOnline={isOnline}
            />
        )}
    </div>
  );
}
