"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getUserBadges } from '@/lib/api-actions';
import { AchievementsList } from "@/components/student/AchievementsList";
import { BadgeDTO } from '@/lib/dto/system.dto';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeDTO[]>([]);

  useEffect(() => {
    if (user) {
        getUserBadges(user.id).then(data => {
            const mapped = data as any[];
            setBadges(mapped.map(ub => ub.badges).filter(Boolean));
        });
    }
  }, [user]);

  return <AchievementsList badges={badges} />;
}
