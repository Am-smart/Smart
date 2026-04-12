"use client";

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { PlannerView } from "@/components/student/PlannerView";

export default function PlannerPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <PlannerView userId={user.id} />;
}
