"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getUserBadges } from '@/lib/data-actions';
import { AchievementsList } from "@/components/student/AchievementsList";
import { Badge } from '@/lib/types';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (user) {
        getUserBadges(user.id).then(data => {
            const mapped = (data || []) as unknown as { badges: Badge }[];
            setBadges(mapped.map(ub => ub.badges).filter(Boolean));
        });
    }
  }, [user]);

  return <AchievementsList badges={badges} />;
}
