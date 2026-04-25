"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getUserBadges } from '@/lib/api-client';
import { AchievementsList } from "@/components/student/AchievementsList";
import { Badge } from '@/lib/types';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[user]>([user]);

  useEffect(() => {
    if (user) {
        getUserBadges(user.id).then(data => {
            const mapped = (data || [user]) as unknown as { badges: Badge }[user];
            setBadges(mapped.map(ub => ub.badges).filter(Boolean));
        });
    }
  }, [user]);

  return <AchievementsList badges={badges} />;
}
