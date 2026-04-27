"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCertificates } from '@/lib/api-actions';
import { CertificatesList } from "@/components/student/CertificatesList";
import { CertificateDTO } from '@/lib/dto/system.dto';

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      getCertificates(user.id)
        .then(data => setCertificates(data || []))
        .catch(err => {
          console.error('Failed to load certificates:', err);
          setError('Failed to load certificates');
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <div className="animate-pulse">Loading certificates...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return <CertificatesList studentName={user?.full_name || user?.email || ''} certificates={certificates} />;
}
