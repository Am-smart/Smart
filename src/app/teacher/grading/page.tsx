"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getSubmissions } from '@/lib/api-actions';
import dynamic from 'next/dynamic';
import { GradingQueue } from "@/components/assessments/GradingQueue";
import { SubmissionDTO } from '@/lib/types';

const GradingModal = dynamic(() => import("@/components/assessments/GradingModal").then(mod => mod.GradingModal), {
    loading: () => <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Grading View...</div>
});

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
