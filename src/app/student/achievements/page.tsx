"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { AchievementsList } from "@/components/student/AchievementsList";
import { Badge } from '@/lib/types';

export default function AchievementsPage() {
  const { user } = useAuth();
  const { client } = useSupabase();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (user) {
        client.from('user_badges').select('*, badges(*)').eq('user_id', user.id).then(r => {
            const data = (r.data || []) as unknown as { badges: Badge }[];
            setBadges(data.map(ub => ub.badges).filter(Boolean));
        });
    }
  }, [user, client]);

  return <AchievementsList badges={badges} />;
}
