"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import * as actions from '@/lib/api-actions';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { CourseView } from "@/components/courses/CourseView";
import { CourseDTO, LessonDTO } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/components/AppContext';
import { CourseList } from '@/components/common/CourseList';

function CatalogContent() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
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
    try {
        const [all, enrolled] = await Promise.all([
          actions.getCourses(),
          actions.getEnrollments(user.id!)
        ]);
        setCourses(all.filter(c => c.status === 'published'));
        setEnrolledIds(enrolled.map(item => item.course_id));
    } catch (err) {
        console.error('Failed to fetch catalog data:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (courseIdParam && courses.length > 0) {
        const c = courses.find(item => item.id === courseIdParam);
        if (c) {
            setActiveCourse(c);
            actions.getLessons(c.id).then(data => setLessons(data || []));
        }
    } else {
        setActiveCourse(null);
    }
  }, [courseIdParam, courses]);

  const handleEnroll = async (course: CourseDTO) => {
    if (!user) return;

    try {
      if (isOnline) {
          const res = await actions.enrollInCourse(course.id);
          if (res.success) {
            addToast('Successfully enrolled in course!', 'success');
          } else {
            throw new Error(res.error);
          }
      } else {
          await addToQueue('ENROLL', { course_id: course.id, student_id: user.id }, user.sessionId);
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
    <div className="p-6">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
            <p className="text-gray-600 mt-2">Explore and enroll in available courses.</p>
        </div>

        <CourseList
            courses={courses}
            onAction={(course) => {
                if (enrolledIds.includes(course.id)) {
                    router.push(`/student/courses?id=${course.id}`);
                } else {
                    handleEnroll(course);
                }
            }}
            actionLabel="View Details"
        />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
