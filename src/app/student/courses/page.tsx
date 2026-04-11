"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { CourseCatalog } from "@/components/student/CourseCatalog";
import { Course, Enrollment } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function CatalogPage() {
  const { user } = useAuth();
  const { client, getCourses, getEnrollments } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
        getCourses().then(all => setCourses(all.filter(c => c.status === 'published')));
        getEnrollments(user.email).then(e => setEnrolledIds(e.map(item => item.course_id)));
    }
  }, [user, getCourses, getEnrollments]);

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    const { error } = await client.from('enrollments').upsert({ course_id: courseId, student_email: user.email });
    if (!error) {
        router.push('/student/my-courses');
    }
  };

  return (
    <CourseCatalog
        courses={courses}
        enrolledCourseIds={enrolledIds}
        onEnroll={handleEnroll}
        onViewDetails={() => router.push('/student/my-courses')}
    />
  );
}
