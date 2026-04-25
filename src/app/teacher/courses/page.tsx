"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { CourseManager } from "@/components/teacher/CourseManager";
import { CourseEditor } from "@/components/teacher/CourseEditor";
import { LessonEditor } from "@/components/teacher/LessonEditor";
import { Course } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

export default function CoursesPage() {
  const { user } = useAuth();
  const { getCourses } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeLessonCourse, setActiveLessonCourse] = useState<Course | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (user) {
        const data = await getCourses(user.id);
        setCourses(data);
    }
  }, [user, getCourses]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div className="relative">
      {(isAdding || editingCourse) && (
        <CourseEditor
            teacherId={user!.id}
            course={editingCourse || undefined}
            onSave={() => { setEditingCourse(null); setIsAdding(false); fetchCourses(); }}
            onCancel={() => { setEditingCourse(null); setIsAdding(false); }}
        />
      )}

      <CourseManager
          courses={courses}
          onEdit={setEditingCourse}
          onDelete={async (id) => {
              if (!confirm('Are you sure you want to delete this course and all its lessons?')) return;
              await apiClient.delete(`/api/courses?id=${id}`);
              fetchCourses();
          }}
          onCreate={() => setIsAdding(true)}
          onManageLessons={(course) => setActiveLessonCourse(course)}
      />

      {activeLessonCourse && (
          <LessonEditor
              course={activeLessonCourse}
              onClose={() => setActiveLessonCourse(null)}
          />
      )}
    </div>
  );
}
