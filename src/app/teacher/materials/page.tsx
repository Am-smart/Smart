"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getMaterials } from '@/lib/api-actions';
import { MaterialManager } from "@/components/teacher/MaterialManager";
import { MaterialDTO, CourseDTO } from '@/lib/dto/learning.dto';

export default function MaterialsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [materials, setMaterials] = useState<MaterialDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const myCourses = await getCourses(user.id);
      setCourses(myCourses);
      const allMaterials = await getMaterials();
      const courseIds = myCourses.map(c => c.id);
      setMaterials(allMaterials.filter(m => courseIds.includes(m.course_id)));
    } catch (err) {
      console.error('Failed to load materials:', err);
      setError('Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="animate-pulse">Loading materials...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <MaterialManager
        initialMaterials={materials}
        courses={courses}
        onRefresh={fetchData}
    />
  );
}
