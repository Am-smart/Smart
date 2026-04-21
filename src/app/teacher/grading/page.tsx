"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getSubmissions } from '@/lib/data-actions';
import { GradingQueue } from "@/components/teacher/GradingQueue";
import { GradingModal } from "@/components/teacher/GradingModal";
import { Submission } from '@/lib/types';

export default function GradingPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (user) {
        const data = await getSubmissions();
        // Assuming getSubmissions already respects RLS or we filter by submitted status
        setSubmissions(data.filter(s => s.status === 'submitted'));
    }
  }, [user]);

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
