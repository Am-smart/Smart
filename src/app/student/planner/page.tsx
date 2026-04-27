"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments } from '@/lib/api-actions';
import { PlannerView } from "@/components/student/PlannerView";

export default function PlannerPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      getEnrollments(user.id)
        .then(() => setIsLoading(false))
        .catch(err => {
          console.error('Failed to load planner:', err);
          setError('Failed to load planner');
          setIsLoading(false);
        });
    }
  }, [user]);

  if (!user) return null;
  if (isLoading) return <div className="animate-pulse">Loading planner...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return <PlannerView userId={user.id} />;
}
