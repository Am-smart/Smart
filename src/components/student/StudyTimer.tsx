import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CourseDTO } from '@/lib/dto/learning.dto';
import { useAppContext } from '../AppContext';
import { saveStudySession } from '@/lib/api-actions';

interface StudyTimerProps {
  userId: string;
  courses: CourseDTO[];
  activeCourseId?: string; // Optional course context for auto-tracking
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ courses, activeCourseId }) => {
  const { addToast } = useAppContext();
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedCourseId, setSelectedCourseId] = useState(activeCourseId || '');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync selected course when activeCourseId changes (for auto-mode)
  useEffect(() => {
    if (activeCourseId) {
      setSelectedCourseId(activeCourseId);
      // Auto-start if not already active and we have a course
      if (!isActive) {
        setStartTime(new Date());
        setSeconds(0);
        setIsActive(true);
      }
    }
  }, [activeCourseId, isActive]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const saveSession = useCallback(async (cId: string, start: Date) => {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000);

    if (duration < 30) return; // Save sessions longer than 30s in auto-mode

    try {
        const xpEarned = Math.floor(duration / 60) * 2;
        await saveStudySession({
            course_id: cId,
            duration,
            started_at: start.toISOString(),
            ended_at: endTime.toISOString()
        }, xpEarned);

        if (xpEarned > 0) {
            addToast(`Study Session Saved! You earned ${xpEarned} XP.`, 'success');
        }
    } catch (err) {
        console.error('Failed to save study session:', err);
        addToast('Failed to save study session.', 'error');
    }
  }, [addToast]);

  // Handle saving when component unmounts or status changes
  useEffect(() => {
      const sTime = startTime;
      const cId = selectedCourseId;
      return () => {
          if (isActive && sTime && cId) {
              saveSession(cId, sTime);
          }
      };
  }, [isActive, startTime, selectedCourseId, saveSession]);

  const toggleTimer = () => {
    if (!selectedCourseId) {
        addToast('Please select a course to start focusing.', 'error');
        return;
    }

    if (isActive) {
      saveSession(selectedCourseId, startTime!);
      setIsActive(false);
    } else {
      setStartTime(new Date());
      setSeconds(0);
      setIsActive(true);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold">Study Focus Timer</h3>
            {activeCourseId && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full border border-blue-500/30">Auto Tracking</span>
            )}
          </div>
          <p className="text-slate-400 text-sm mb-6">Track your study time and earn XP for every minute you focus.</p>

          <div className="space-y-4">
            <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={isActive || !!activeCourseId}
                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
                <option value="">Select Course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            {!activeCourseId && (
                <button
                    onClick={toggleTimer}
                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${isActive ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
                >
                    {isActive ? 'Stop Focusing' : 'Start Session'}
                </button>
            )}

            {activeCourseId && (
                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-medium italic">
                    Currently tracking session for {courses.find(c => c.id === selectedCourseId)?.title}
                </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-slate-800/50 p-8 rounded-full aspect-square w-48 border-4 border-slate-700">
            <div className="text-3xl font-mono font-bold">{formatTime(seconds)}</div>
            <div className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${isActive ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`}>
                {isActive ? 'Live' : 'Ready'}
            </div>
        </div>
      </div>
    </div>
  );
};
