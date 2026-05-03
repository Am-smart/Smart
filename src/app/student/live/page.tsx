"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getLiveClasses, recordAttendance } from '@/lib/api-actions';
import { LiveClassesList } from "@/components/communication/LiveClassesList";
import { LiveClassDTO } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';

export default function LiveClassesPage() {
    const { addToast } = useAppContext();
  const { user } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClassDTO[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.id!).then(enrollments => {
            const courseIds = enrollments.map(e => e.course_id);
            if (courseIds.length > 0) {
                getLiveClasses().then(data => {
                    setLiveClasses(data.filter(lc => courseIds.includes(lc.course_id)));
                });
            }
        });
    }
  }, [user]);

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
