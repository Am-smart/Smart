"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCertificates } from '@/lib/api-client';
import { CertificatesList } from "@/components/student/CertificatesList";
import { Certificate } from '@/lib/types';

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    if (user) {
        getCertificates(user.id).then(data => setCertificates(data || []));
    }
  }, [user]);

  return <CertificatesList studentName={user?.full_name || user?.email || ''} certificates={certificates} />;
}
