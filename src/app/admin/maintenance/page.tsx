"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { MaintenancePanel } from "@/components/admin/MaintenancePanel";
import { BroadcastManager } from "@/components/admin/BroadcastManager";
import { Course, Maintenance } from '@/lib/types';

export default function MaintenancePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);

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
            onToggle={async (enabled) => {
                if (maintenance?.id) {
                    await updateMaintenance({ id: maintenance.id, enabled });
                    fetchData();
                }
            }}
        />
        <BroadcastManager
            initialCourses={courses}
        />
    </div>
  );
}
