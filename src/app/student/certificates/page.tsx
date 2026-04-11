"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { CertificatesList } from "@/components/student/CertificatesList";
import { Certificate } from '@/lib/types';

export default function CertificatesPage() {
  const { user } = useAuth();
  const { client } = useSupabase();
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    if (user) {
        client.from('certificates').select('*, courses(title)').eq('student_email', user.email).then(r => setCertificates(r.data || []));
    }
  }, [user, client]);

  return <CertificatesList studentEmail={user?.email || ''} certificates={certificates} />;
}
