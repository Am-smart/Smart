"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { StudentManagement } from "@/components/teacher/StudentManagement";
import { Enrollment, Course } from '@/lib/types';

export default function StudentManagementPage() {
  const { user } = useAuth();
  const { client, getCourses } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const myCourses = await getCourses(user.id);
    setCourses(myCourses);
    const courseIds = myCourses.map(c => c.id);
    if (courseIds.length > 0) {
        const { data } = await client.from('enrollments').select('*, courses(*), users:users(*)').in('course_id', courseIds);
        setEnrollments(data || []);
    }
  }, [user, client, getCourses]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <StudentManagement
        initialEnrollments={enrollments}
        courses={courses}
        onRefresh={fetchData}
    />
  );
}
