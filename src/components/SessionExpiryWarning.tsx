'use client';

import React, { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { sessionManager } from '@/lib/session-manager';

export const SessionExpiryWarning: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const checkSession = setInterval(() => {
      const timeLeft = sessionManager.getTimeUntilExpiry();
      
      // Show warning if less than 5 minutes remaining
      if (timeLeft > 0 && timeLeft < 5 * 60 * 1000) {
        setIsVisible(true);
        
        // Format time remaining
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else if (timeLeft === 0) {
        setIsVisible(false);
      } else {
        setIsVisible(false);
      }
    }, 1000);

    return () => clearInterval(checkSession);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-lg max-w-sm z-40">
      <div className="flex items-start gap-3">
        <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-bold text-amber-900">Session Expiring Soon</h4>
          <p className="text-sm text-amber-800 mt-1">
            Your session will expire in {timeRemaining}. Stay active or you&apos;ll be logged out.
          </p>
          <button
            onClick={() => sessionManager.resetSessionTimeout()}
            className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-700 uppercase"
          >
            Stay Logged In
          </button>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-amber-400 hover:text-amber-600 shrink-0"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
