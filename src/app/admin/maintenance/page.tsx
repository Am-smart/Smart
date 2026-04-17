"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { MaintenancePanel } from "@/components/admin/MaintenancePanel";
import { BroadcastManager } from "@/components/admin/BroadcastManager";
import { Course, Maintenance } from '@/lib/types';
import { updateMaintenance } from '@/lib/data-actions';

export default function MaintenancePage() {
  const { client, getMaintenance } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);

  const fetchData = useCallback(async () => {
      const { data: courseData } = await client.from('courses').select('*');
      setCourses(courseData || []);
      const m = await getMaintenance();
      setMaintenance(m);
  }, [client, getMaintenance]);

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
