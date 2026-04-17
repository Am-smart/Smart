"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { AssignmentsList } from "@/components/student/AssignmentsList";
import { Assignment, Submission } from '@/lib/types';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/components/AppContext';
import { requestRegrade } from '@/lib/data-actions';

const AssignmentForm = dynamic(() => import("@/components/student/AssignmentForm").then(m => m.AssignmentForm), { ssr: false });

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const { client, getAssignments, getEnrollments } = useSupabase();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [myEnrollments, allAssignments, mySubmissions] = await Promise.all([
      getEnrollments(user.id),
      getAssignments(),
      client.from('submissions').select('*, assignments(*)').eq('student_id', user.id).then(r => r.data || [])
    ]);

    const enrolledIds = myEnrollments.map(e => e.course_id);
    setAssignments(allAssignments.filter(a => enrolledIds.includes(a.course_id) && a.status === 'published'));
    setSubmissions(mySubmissions);
  }, [user, client, getAssignments, getEnrollments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      {activeAssignment && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
            <AssignmentForm
                assignment={activeAssignment}
                user={user!}
                onComplete={() => { setActiveAssignment(null); fetchData(); }}
                onCancel={() => setActiveAssignment(null)}
            />
        </div>
      )}
      <AssignmentsList
          assignments={assignments}
          submissions={submissions}
          onSubmit={(a) => setActiveAssignment(a)}
          onViewFeedback={(a) => {
              const sub = submissions.find(s => s.assignment_id === a.id);
              if (sub) {
                  addToast(`GRADE: ${sub.final_grade}% | Feedback: ${sub.feedback || 'No feedback yet.'}`, 'info', 5000);
              }
          }}
          onRegradeRequest={async (a, reason) => {
              if (!a.regrade_requests_enabled) {
                  addToast('Regrade requests are disabled for this assignment.', 'error');
                  return;
              }
              try {
                  await requestRegrade(a.id, reason);
                  addToast('Regrade request sent successfully!', 'success');
                  fetchData();
              } catch (err) {
                  console.error('Failed to send regrade request:', err);
                  addToast('Failed to send regrade request.', 'error');
              }
          }}
      />
    </>
  );
}
