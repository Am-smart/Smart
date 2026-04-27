"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getLiveClasses } from '@/lib/api-actions';
import { LiveClassManager } from "@/components/teacher/LiveClassManager";
import { LiveClassDTO } from '@/lib/dto/communication.dto';
import { CourseDTO } from '@/lib/dto/learning.dto';

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassDTO[]>([]);

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
