"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getUserBadges } from '@/lib/api-actions';
import { AchievementsList } from "@/components/student/AchievementsList";
import { BadgeDTO } from '@/lib/dto/system.dto';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      getUserBadges(user.id)
        .then(data => {
          const mapped = data as Array<{ badges?: BadgeDTO }>;
          setBadges(mapped.map(ub => ub.badges).filter(Boolean) as BadgeDTO[]);
        })
        .catch(err => {
          console.error('Failed to load badges:', err);
          setError('Failed to load achievements');
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <div className="animate-pulse">Loading achievements...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return <AchievementsList badges={badges} />;
}
