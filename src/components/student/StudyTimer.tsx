import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Course } from '@/lib/types';

interface StudyTimerProps {
  userEmail: string;
  courses: Course[];
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ userEmail, courses }) => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, seconds]);

  const toggleTimer = () => {
    if (!selectedCourseId) {
        alert('Please select a course to start focusing.');
        return;
    }

    if (isActive) {
      // Save session
      saveSession();
      setIsActive(false);
    } else {
      setStartTime(new Date());
      setSeconds(0);
      setIsActive(true);
    }
  };

  const saveSession = async () => {
    if (!startTime) return;
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    if (duration < 60) return; // Don't save sessions shorter than a minute

    const { error } = await supabase.from('study_sessions').insert([{
      user_email: userEmail,
      course_id: selectedCourseId,
      duration,
      started_at: startTime.toISOString(),
      ended_at: endTime.toISOString()
    }]);

    if (!error) {
        // Award XP?
        const xpEarned = Math.floor(duration / 60) * 2;
        if (xpEarned > 0) {
            const { data: user } = await supabase.from('users').select('xp').eq('email', userEmail).single();
            await supabase.from('users').update({ xp: (user?.xp || 0) + xpEarned }).eq('email', userEmail);
        }
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
          <h3 className="text-xl font-bold mb-2">Study Focus Timer</h3>
          <p className="text-slate-400 text-sm mb-6">Track your study time and earn XP for every minute you focus.</p>

          <div className="space-y-4">
            <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={isActive}
                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
                <option value="">Select Course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            <button
                onClick={toggleTimer}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${isActive ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
            >
                {isActive ? 'Stop Focusing' : 'Start Session'}
            </button>
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
