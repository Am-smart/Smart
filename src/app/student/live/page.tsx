"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { LiveClassesList } from "@/components/student/LiveClassesList";
import { LiveClass } from '@/lib/types';
import { recordAttendance } from '@/lib/data-actions';
import { useAppContext } from '@/components/AppContext';

export default function LiveClassesPage() {
    const { addToast } = useAppContext();
  const { user } = useAuth();
  const { client, getEnrollments } = useSupabase();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.id!).then(enrollments => {
            const courseIds = enrollments.map(e => e.course_id);
            if (courseIds.length > 0) {
                client.from('live_classes').select('*').in('course_id', courseIds).then(r => setLiveClasses(r.data || []));
            }
        });
    }
  }, [user, client, getEnrollments]);

  return <LiveClassesList liveClasses={liveClasses} onJoin={async (lc) => {
      try {
          await recordAttendance(lc.id);
          if (lc.meeting_url) window.open(lc.meeting_url, '_blank');
      } catch (err) {
          console.error('Failed to record attendance:', err);
          addToast('Could not record attendance, but joining class...', 'info');
          if (lc.meeting_url) window.open(lc.meeting_url, '_blank');
      }
  }} />;
}
