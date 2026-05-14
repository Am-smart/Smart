"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useTimer } from '@/context/TimerContext';

interface CountdownProps {
  targetDate?: string | Date;    // For backward compatibility (behaves as endDate)
  startDate?: string | Date;
  endDate?: string | Date;
  onEnd?: () => void;
  onStart?: () => void;
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
  endLabel?: string | null;
  startLabel?: string;
  activeLabel?: string;
}

type CountdownState = 'NOT_STARTED' | 'IN_PROGRESS' | 'ENDED';

const CountdownComponent: React.FC<CountdownProps> = ({
  targetDate,
  startDate,
  endDate,
  onEnd,
  onStart,
  className = "",
  showIcon = true,
  compact = false,
  endLabel = "Ended",
  startLabel = "Starts in",
  activeLabel = ""
}) => {
  const { currentTime, isReady } = useTimer();
  const [mounted, setMounted] = useState(false);
  const hasEndedCalled = useRef(false);
  const hasStartedCalled = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Normalize target dates
  const dates = useMemo(() => {
    const parse = (d?: string | Date) => {
      if (!d) return null;
      const ts = new Date(d).getTime();
      return isNaN(ts) ? null : ts;
    };

    // targetDate is treated as endDate if endDate is not provided
    const end = parse(endDate || targetDate);
    const start = parse(startDate);

    return { start, end };
  }, [targetDate, startDate, endDate]);

  // Determine current state and time difference
  const { state, difference } = useMemo(() => {
    if (!isReady || !dates.end) return { state: 'ENDED' as CountdownState, difference: 0 };

    if (dates.start && currentTime < dates.start) {
      return { state: 'NOT_STARTED' as CountdownState, difference: dates.start - currentTime };
    }

    if (currentTime < dates.end) {
      return { state: 'IN_PROGRESS' as CountdownState, difference: dates.end - currentTime };
    }

    return { state: 'ENDED' as CountdownState, difference: 0 };
  }, [dates, currentTime, isReady]);

  const timeLeft = useMemo(() => {
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference
    };
  }, [difference]);

  // Handle Event Triggers
  useEffect(() => {
    if (!mounted || !isReady) return;

    if (state === 'IN_PROGRESS' && !hasStartedCalled.current) {
        hasStartedCalled.current = true;
        onStart?.();
    }

    if (state === 'ENDED' && !hasEndedCalled.current) {
        hasEndedCalled.current = true;
        onEnd?.();
    }
  }, [state, onStart, onEnd, mounted, isReady]);

  // Reset event flags if dates change
  useEffect(() => {
    hasEndedCalled.current = false;
    hasStartedCalled.current = false;
  }, [dates.start, dates.end]);

  // Block rendering until mounted AND timer is ready to prevent hydration race/flicker
  if (!mounted || !isReady || !dates.end) return null;

  if (state === 'ENDED') {
    if (endLabel === null) return null;
    return (
      <span className={`inline-flex items-center gap-1 text-slate-400 font-bold uppercase text-[10px] ${className}`}>
        {showIcon && <Clock size={12} />}
        {endLabel}
      </span>
    );
  }

  const isSoon = state === 'IN_PROGRESS' && timeLeft.total < 60 * 60 * 1000;

  return (
    <div className={`inline-flex items-center gap-2 ${isSoon ? 'text-red-600 animate-pulse' : 'text-slate-600'} ${className}`}>
      {showIcon && <Clock size={compact ? 14 : 18} />}
      <div className="flex items-center gap-1.5">
        {state === 'NOT_STARTED' && startLabel && (
            <span className="text-[10px] font-bold uppercase opacity-70 whitespace-nowrap">{startLabel}</span>
        )}
        {state === 'IN_PROGRESS' && activeLabel && (
            <span className="text-[10px] font-bold uppercase opacity-70 whitespace-nowrap">{activeLabel}</span>
        )}
        <div className="flex gap-1 font-mono font-bold text-sm md:text-base">
            {timeLeft.days > 0 && (
            <div className="flex flex-col items-center">
                <span>{timeLeft.days}d</span>
                {!compact && <span className="text-[8px] uppercase tracking-tighter -mt-1 opacity-60">Days</span>}
            </div>
            )}
            {(timeLeft.days > 0 || timeLeft.hours > 0) && (
            <div className="flex flex-col items-center">
                <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
                {!compact && <span className="text-[8px] uppercase tracking-tighter -mt-1 opacity-60">Hrs</span>}
            </div>
            )}
            <div className="flex flex-col items-center">
            <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
            {!compact && <span className="text-[8px] uppercase tracking-tighter -mt-1 opacity-60">Min</span>}
            </div>
            <div className="flex flex-col items-center">
            <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
            {!compact && <span className="text-[8px] uppercase tracking-tighter -mt-1 opacity-60">Sec</span>}
            </div>
        </div>
      </div>
    </div>
  );
};

export const Countdown = React.memo(CountdownComponent);
