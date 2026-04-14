"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { MyCourses } from "@/components/student/MyCourses";
import { Enrollment } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function MyCoursesPage() {
  const { user } = useAuth();
  const { getEnrollments } = useSupabase();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
        getEnrollments(user.id).then(setEnrollments);
    }
  }, [user, getEnrollments]);

  return (
    <MyCourses
        enrollments={enrollments}
        onOpenCourse={(id) => router.push(`/student/courses?id=${id}`)}
    />
  );
}
