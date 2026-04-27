"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getCourses, getMaintenance } from '@/lib/api-actions';
import { MaintenancePanel } from "@/components/admin/MaintenancePanel";
import { BroadcastManager } from "@/components/admin/BroadcastManager";
import { CourseDTO } from '@/lib/dto/learning.dto';
import { MaintenanceDTO } from '@/lib/dto/system.dto';

export default function MaintenancePage() {
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const courseData = await getCourses();
      setCourses(courseData || []);
      const m = await getMaintenance();
      setMaintenance(m);
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
      setError('Failed to load maintenance data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="animate-pulse">Loading maintenance settings...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <div className="space-y-8">
      <MaintenancePanel
        maintenance={maintenance}
        onToggle={fetchData}
      />
      <BroadcastManager
        initialCourses={courses}
      />
    </div>
  );
}
