"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { LiveClassManager } from "@/components/teacher/LiveClassManager";
import { LiveClass, Course } from '@/lib/types';

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);

  const fetchData = useCallback(async () => {
      if (!user) return;
      const myCourses = await getCourses(user.id);
      setCourses(myCourses);
      const data = await getLiveClasses(undefined, user.id);
      setLiveClasses(data || []);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <LiveClassManager
        teacherId={user!.id}
        liveClasses={liveClasses}
        courses={courses}
        onRefresh={fetchData}
    />
  );
}
