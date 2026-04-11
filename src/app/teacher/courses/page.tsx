"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { CourseManager } from "@/components/teacher/CourseManager";
import { CourseEditor } from "@/components/teacher/CourseEditor";
import { Course } from '@/lib/types';

export default function CoursesPage() {
  const { user } = useAuth();
  const { client, getCourses } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
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

  if (isAdding || editingCourse) {
      return (
          <CourseEditor
              teacherId={user!.id}
              course={editingCourse || undefined}
              onSave={() => { setEditingCourse(null); setIsAdding(false); fetchCourses(); }}
              onCancel={() => { setEditingCourse(null); setIsAdding(false); }}
          />
      );
  }

  return (
    <CourseManager
        courses={courses}
        onEdit={setEditingCourse}
        onDelete={async (id) => {
            await client.from('courses').delete().eq('id', id);
            fetchCourses();
        }}
        onCreate={() => setIsAdding(true)}
        onManageLessons={() => {}}
    />
  );
}
