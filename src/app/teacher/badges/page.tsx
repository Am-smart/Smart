"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getUserBadges } from '@/lib/api-actions';
import { BadgeManager } from "@/components/teacher/BadgeManager";

export default function BadgesPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        getCourses(user.id),
        getUserBadges(user.id)
      ]);
    } catch (err) {
      console.error('Failed to load badges:', err);
      setError('Failed to load badges');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="animate-pulse">Loading badges...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return <BadgeManager />;
}
