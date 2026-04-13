"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { LiveClassManager } from "@/components/teacher/LiveClassManager";
import { LiveClass, Course } from '@/lib/types';

export default function LiveClassesPage() {
  const { user } = useAuth();
  const { client, getCourses } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);

  const fetchData = useCallback(async () => {
      if (!user) return;
      const myCourses = await getCourses(user.id);
      setCourses(myCourses);
      const { data } = await client.from('live_classes').select('*').eq('teacher_id', user.id);
      setLiveClasses(data || []);
  }, [user, client, getCourses]);

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
