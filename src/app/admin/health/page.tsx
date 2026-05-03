"use client";

import React, { useState, useEffect } from 'react';
import { SystemHealth } from "@/components/system/SystemMisc";

export default function HealthPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) return <div className="animate-pulse">Loading system health...</div>;

  return <SystemHealth />;
}
