"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { MaterialManager } from "@/components/teacher/MaterialManager";
import { Material, Course } from '@/lib/types';

export default function MaterialsPage() {
  const { user } = useAuth();
  const { client, getCourses } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const fetchData = useCallback(async () => {
      if (!user) return;
      const myCourses = await getCourses(user.id!);
      setCourses(myCourses);
      const { data } = await client.from('materials').select('*').in('course_id', myCourses.map(c => c.id));
      setMaterials(data || []);
  }, [user, client, getCourses]);

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
