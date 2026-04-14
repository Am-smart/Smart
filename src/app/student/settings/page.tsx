"use client";

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { StudentSettings } from "@/components/student/StudentSettings";

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();

  if (!user) return null;

  return (
    <StudentSettings
        user={user}
        onUpdate={updateProfile}
    />
  );
}
