"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { apiClient } from '@/lib/api-client';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { CourseCatalog } from "@/components/student/CourseCatalog";
import { CourseView } from "@/components/student/CourseView";
import { CourseDTO, LessonDTO } from '@/lib/dto/learning.dto';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/components/AppContext';

function CatalogContent() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const { getCourses, getEnrollments } = useSupabase();
  const { isOnline, addToQueue } = useIndexedDB();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [activeCourse, setActiveCourse] = useState<CourseDTO | null>(null);
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('id');

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [all, enrolled] = await Promise.all([
      getCourses(),
      getEnrollments(user.id!)
    ]);
    setCourses(all.filter(c => c.status === 'published'));
    setEnrolledIds(enrolled.map(item => item.course_id));
  }, [user, getCourses, getEnrollments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (courseIdParam && courses.length > 0) {
        const c = courses.find(item => item.id === courseIdParam);
        if (c) {
            setActiveCourse(c);
            apiClient.get<LessonDTO[]>(`/api/lessons?courseId=${c.id}`).then(data => setLessons(data || []));
        }
    } else {
        setActiveCourse(null);
    }
  }, [courseIdParam, courses]);

  const handleEnroll = async (courseId: string) => {
    if (!user) return;

    try {
      if (isOnline) {
          await apiClient.post(`/api/system/enroll?courseId=${courseId}`);
          addToast('Successfully enrolled in course!', 'success');
      } else {
          await addToQueue('ENROLL', { course_id: courseId, student_id: user.id }, user.sessionId);
          addToast('Offline: Enrollment queued for synchronization.', 'info');
      }
      router.push('/student/my-courses');
    } catch (err) {
      console.error('Enrollment failed:', err);
      addToast('Failed to enroll in course. Please try again.', 'error');
    }
  };

  if (activeCourse) {
      return (
          <CourseView
              course={activeCourse}
              lessons={lessons}
              onBack={() => router.push('/student/courses')}
          />
      );
  }

  return (
    <CourseCatalog
        courses={courses}
        enrolledCourseIds={enrolledIds}
        onEnroll={handleEnroll}
        onViewDetails={(id) => router.push(`/student/courses?id=${id}`)}
    />
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
