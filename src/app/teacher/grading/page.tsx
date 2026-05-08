"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getSubmissions } from '@/lib/api-actions';
import { GradingQueue } from "@/components/assessments/GradingQueue";
import { GradingModal } from "@/components/assessments/GradingModal";
import { SubmissionDTO } from '@/lib/types';

export default function GradingPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDTO | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (user) {
        const data = await getSubmissions({ status: 'submitted' });
        setSubmissions(data);
    }
  }, [user]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    if (submissions.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const sub = submissions.find(s => s.id === id);
        if (sub) {
          setSelectedSubmission(sub);
        }
      }
    }
  }, [submissions]);

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
