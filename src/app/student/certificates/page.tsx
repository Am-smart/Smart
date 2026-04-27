"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCertificates } from '@/lib/api-actions';
import { CertificatesList } from "@/components/student/CertificatesList";
import { CertificateDTO } from '@/lib/dto/system.dto';

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);

  useEffect(() => {
    if (user) {
        getCertificates(user.id).then(data => setCertificates(data || []));
    }
  }, [user]);

  return <CertificatesList studentName={user?.full_name || user?.email || ''} certificates={certificates} />;
}
