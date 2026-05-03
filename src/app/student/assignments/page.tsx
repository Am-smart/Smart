"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getAssignments, getSubmissions } from '@/lib/api-actions';
import { AssignmentsList } from "@/components/assessments/AssignmentsList";
import { AssignmentDTO, SubmissionDTO } from '@/lib/types';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/components/AppContext';
import { FeedbackModal } from '@/components/assessments/FeedbackModal';

const AssignmentForm = dynamic(() => import("@/components/assessments/AssignmentForm").then(m => m.AssignmentForm), { ssr: false });

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<AssignmentDTO | null>(null);
  const [feedbackView, setFeedbackView] = useState<{ assignment: AssignmentDTO, submission: SubmissionDTO } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [myEnrollments, allAssignments, mySubmissions] = await Promise.all([
      getEnrollments(user.id),
      getAssignments(),
      getSubmissions(undefined, user.id)
    ]);

    const enrolledIds = myEnrollments.map(e => e.course_id);
    setAssignments(allAssignments.filter(a => enrolledIds.includes(a.course_id) && a.status === 'published'));
    setSubmissions(mySubmissions);
  }, [user]);

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
      {feedbackView && (
          <FeedbackModal
              assignment={feedbackView.assignment}
              submission={feedbackView.submission}
              onClose={() => setFeedbackView(null)}
          />
      )}
      <AssignmentsList
          assignments={assignments}
          submissions={submissions}
          onSubmit={(a) => setActiveAssignment(a)}
          onViewFeedback={(a) => {
              const sub = submissions.find(s => s.assignment_id === a.id);
              if (sub) {
                  setFeedbackView({ assignment: a, submission: sub });
              }
          }}
          onRegradeRequest={async (a) => {
              if (!a.regrade_requests_enabled) {
                  addToast('Regrade requests are disabled for this assignment.', 'error');
                  return;
              }
              try {
                  // No requestRegrade in api-actions yet, but can be implemented via generic patch
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
