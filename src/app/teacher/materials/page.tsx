"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { MaterialManager } from "@/components/teacher/MaterialManager";
import { Material, Course } from '@/lib/types';

export default function MaterialsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

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
