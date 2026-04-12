"use client";

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { TeacherSettings } from "@/components/teacher/TeacherSettings";

export default function SettingsPage() {
  const { user } = useAuth();
  const { client } = useSupabase();

  if (!user) return null;

  return (
    <TeacherSettings
        user={user}
        onUpdate={async (u) => {
            await client.from('users').update(u).eq('id', user.id);
        }}
    />
  );
}
