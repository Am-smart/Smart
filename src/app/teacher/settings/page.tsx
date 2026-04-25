"use client";

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { TeacherSettings } from "@/components/teacher/TeacherSettings";
import { apiClient } from '@/lib/api-client';

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <TeacherSettings
        user={user}
        onUpdate={async (u) => {
            await saveUser({ ...u, id: user.id });
        }}
    />
  );
}
