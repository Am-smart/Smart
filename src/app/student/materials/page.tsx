"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getMaterials } from '@/lib/api-client';
import { MaterialsList } from "@/components/student/MaterialsList";
import { Material } from '@/lib/types';

export default function MaterialsPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.id).then(e => {
            const enrolledIds = e.map(item => item.course_id);
            if (enrolledIds.length > 0) {
                getMaterials().then(allMaterials => {
                    setMaterials(allMaterials.filter(m => enrolledIds.includes(m.course_id)));
                });
            } else {
                setMaterials([]);
            }
        });
    }
  }, [user]);

  return <MaterialsList materials={materials} />;
}
