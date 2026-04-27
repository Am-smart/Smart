"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getEnrollments } from '@/lib/api-actions';
import { StudentManagement } from "@/components/teacher/StudentManagement";
import { EnrollmentDTO, CourseDTO } from '@/lib/dto/learning.dto';

export default function StudentManagementPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const myCourses = await getCourses(user.id);
      setCourses(myCourses);
      const courseIds = myCourses.map(c => c.id);
      if (courseIds.length > 0) {
        const data = await getEnrollments(undefined, courseIds);
        setEnrollments(data || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      setError('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="animate-pulse">Loading students...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <StudentManagement
        initialEnrollments={enrollments}
        courses={courses}
        onRefresh={fetchData}
    />
  );
}
