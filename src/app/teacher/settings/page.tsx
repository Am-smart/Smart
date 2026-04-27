"use client";

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { TeacherSettings } from "@/components/teacher/TeacherSettings";

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();

  if (!user) return null;

  return (
    <TeacherSettings
        user={user}
        onUpdate={updateProfile}
    />
  );
}
