"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { enrollInCourse } from '@/lib/data-actions';
import { CourseCatalog } from "@/components/student/CourseCatalog";
import { Course } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function CatalogPage() {
  const { user } = useAuth();
  const { getCourses, getEnrollments } = useSupabase();
  const { isOnline, addToQueue } = useIndexedDB();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
        getCourses().then(all => setCourses(all.filter(c => c.status === 'published')));
        getEnrollments(user.id!).then(e => setEnrolledIds(e.map(item => item.course_id)));
    }
  }, [user, getCourses, getEnrollments]);

  const handleEnroll = async (courseId: string) => {
    if (!user) return;

    try {
      if (isOnline) {
          await enrollInCourse(courseId);
      } else {
          await addToQueue('ENROLL', { course_id: courseId, student_id: user.id }, user.sessionId);
          alert('Offline: Enrollment queued for sync.');
      }
      router.push('/student/my-courses');
    } catch (err) {
      console.error('Enrollment failed:', err);
      alert('Failed to enroll in course.');
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
