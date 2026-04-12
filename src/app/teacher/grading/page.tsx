"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { GradingQueue } from "@/components/teacher/GradingQueue";
import { GradingModal } from "@/components/teacher/GradingModal";
import { Submission } from '@/lib/types';

export default function GradingPage() {
  const { user } = useAuth();
  const { client } = useSupabase();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (user) {
        const { data: myCourses } = await client.from('courses').select('id').eq('teacher_id', user.id);
        const courseIds = (myCourses || []).map(c => c.id);
        if (courseIds.length > 0) {
            const { data: myAssignments } = await client.from('assignments').select('id').in('course_id', courseIds);
            const assignmentIds = (myAssignments || []).map(a => a.id);
            if (assignmentIds.length > 0) {
                const { data } = await client.from('submissions').select('*, assignments(*), users(full_name, email)').in('assignment_id', assignmentIds).eq('status', 'submitted');
                setSubmissions(data || []);
            }
        }
    }
  }, [user, client]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return (
    <>
      <GradingQueue
          submissions={submissions}
          onGrade={setSelectedSubmission}
      />
      {selectedSubmission && (
          <GradingModal
              submission={selectedSubmission}
              onCancel={() => setSelectedSubmission(null)}
              onSave={async () => {
                  setSelectedSubmission(null);
                  fetchSubmissions();
              }}
          />
      )}
    </>
  );
}
