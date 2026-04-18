"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { MaterialsList } from "@/components/student/MaterialsList";
import { Material } from '@/lib/types';

export default function MaterialsPage() {
  const { user } = useAuth();
  const { client, getEnrollments } = useSupabase();
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.id).then(e => {
            const enrolledIds = e.map(item => item.course_id);
            if (enrolledIds.length > 0) {
                client.from('materials').select('*').in('course_id', enrolledIds).then(r => setMaterials(r.data || []));
            } else {
                setMaterials([]);
            }
        });
    }
  }, [user, client, getEnrollments]);

  return <MaterialsList materials={materials} />;
}
