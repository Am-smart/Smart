"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getCourses, getMaintenance, updateSetting } from '@/lib/api-actions';
import { MaintenancePanel } from "@/components/admin/MaintenancePanel";
import { BroadcastManager } from "@/components/admin/BroadcastManager";
import { CourseDTO } from '@/lib/dto/learning.dto';
import { MaintenanceDTO } from '@/lib/dto/system.dto';

export default function MaintenancePage() {
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceDTO | null>(null);

  const fetchData = useCallback(async () => {
      const courseData = await getCourses();
      setCourses(courseData || []);
      const m = await getMaintenance();
      setMaintenance(m);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
        <MaintenancePanel
            maintenance={maintenance}
            onToggle={async () => {
                // updateSetting or similar can be used for maintenance toggle
                fetchData();
            }}
        />
        <BroadcastManager
            initialCourses={courses}
        />
    </div>
  );
}
