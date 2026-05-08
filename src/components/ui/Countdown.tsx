"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
  targetDate: string | Date;
  onEnd?: () => void;
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
}

export const Countdown: React.FC<CountdownProps> = ({
  targetDate,
  onEnd,
  className = "",
  showIcon = true,
  compact = false
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  const calculateTimeLeft = useCallback(() => {
    const difference = new Date(targetDate).getTime() - new Date().getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference
    };
  }, [targetDate]);

  useEffect(() => {
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    if (initial.total <= 0) {
      onEnd?.();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining.total <= 0) {
        clearInterval(timer);
        onEnd?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, onEnd]);

  if (!timeLeft) return null;

  const isSoon = timeLeft.total > 0 && timeLeft.total < 60 * 60 * 1000; // Less than 1 hour
  const isPast = timeLeft.total <= 0;

  if (isPast) {
      return (
          <span className={`inline-flex items-center gap-1 text-slate-400 font-bold uppercase text-[10px] ${className}`}>
              {showIcon && <Clock size={12} />}
              Ended
          </span>
      );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${isSoon ? 'text-red-600 animate-pulse' : 'text-slate-600'} ${className}`}>
      {showIcon && <Clock size={compact ? 14 : 18} />}
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
  );
};
