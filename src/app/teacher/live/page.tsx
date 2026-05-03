"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getLiveClasses } from '@/lib/api-actions';
import { LiveClassManager } from "@/components/communication/LiveClassManager";
import { LiveClassDTO } from '@/lib/types';
import { CourseDTO } from '@/lib/types';

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const myCourses = await getCourses(user.id);
      setCourses(myCourses);
      const data = await getLiveClasses(undefined, user.id);
      setLiveClasses(data || []);
    } catch (err) {
      console.error('Failed to load live classes:', err);
      setError('Failed to load live classes');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="animate-pulse">Loading live classes...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <LiveClassManager
        teacherId={user!.id}
        liveClasses={liveClasses}
        courses={courses}
        onRefresh={fetchData}
    />
  );
}
