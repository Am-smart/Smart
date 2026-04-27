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

  const fetchData = useCallback(async () => {
      if (!user) return;
      const myCourses = await getCourses(user.id!);
      setCourses(myCourses);
      const allMaterials = await getMaterials();
      const courseIds = myCourses.map(c => c.id);
      setMaterials(allMaterials.filter(m => courseIds.includes(m.course_id)));
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <MaterialManager
        initialMaterials={materials}
        courses={courses}
        onRefresh={fetchData}
    />
  );
}
