import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { logAntiCheatViolation } from '@/lib/api-actions';

/**
 * Advanced Anti-Cheat Hook - Production Ready
 * Integrated with server-side logging and browser event blocking.
 */
export const useAntiCheat = (enabled: boolean = false, assessmentTitle: string = 'Assessment') => {
  const [violationCount, setViolationCount] = useState(0);
  const { user } = useAuth();
  const lastViolationTime = useRef<Record<string, number>>({});
  const MIN_VIOLATION_INTERVAL = 2000; // 2 seconds rate limiting
  const wasFocused = useRef(true);
  const focusLossTimer = useRef<NodeJS.Timeout | null>(null);
  const tabChannel = useRef<BroadcastChannel | null>(null);
  const visibilityHiddenAt = useRef<number | null>(null);

  const reportViolation = useCallback(async (type: string, metadata: Record<string, unknown> = {}) => {
    const now = Date.now();
    if (now - (lastViolationTime.current[type] || 0) < MIN_VIOLATION_INTERVAL) return;

    lastViolationTime.current[type] = now;
    setViolationCount(prev => prev + 1);

    console.warn(`[Anti-Cheat] Violation: ${type}`, metadata);

    // Local event for UI feedback
    window.dispatchEvent(new CustomEvent('anti-cheat-violation', { detail: { type, metadata } }));

    if (user && enabled) {
        try {
            await logAntiCheatViolation({
                type,
                assessmentTitle,
                metadata: { ...metadata, timestamp: new Date().toISOString() }
            });
        } catch (err) {
            console.error('Failed to log anti-cheat violation to server:', err);
        }
    }
  }, [user, enabled, assessmentTitle]);

  useEffect(() => {
    if (!enabled) return;

    // 1. Tab Switching & Multi-tab Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibilityHiddenAt.current = Date.now();
        focusLossTimer.current = setTimeout(() => {
          reportViolation('TAB_SWITCH', { duration: 'threshold_exceeded' });
        }, 3000);
      } else if (focusLossTimer.current) {
        clearTimeout(focusLossTimer.current);
        if (visibilityHiddenAt.current) {
          const duration = Date.now() - visibilityHiddenAt.current;
          if (duration > 1000) {
            reportViolation('TAB_SWITCH', { duration });
          }
          visibilityHiddenAt.current = null;
        }
      }
    };

    const handleBlur = () => {
      if (!wasFocused.current) return;
      wasFocused.current = false;
      focusLossTimer.current = setTimeout(() => {
        reportViolation('WINDOW_BLUR');
      }, 3000);
    };

    const handleFocus = () => {
      wasFocused.current = true;
      if (focusLossTimer.current) clearTimeout(focusLossTimer.current);
    };

    // Multi-tab lock via BroadcastChannel
    try {
      tabChannel.current = new BroadcastChannel('anticheat_tab');
      const tabId = Date.now().toString();
      tabChannel.current.onmessage = (e) => {
        if (e.data === 'PING') tabChannel.current?.postMessage(`PONG_${tabId}`);
        else if (e.data.startsWith('PONG_') && e.data !== `PONG_${tabId}`) {
          reportViolation('MULTIPLE_TABS_DETECTED');
        }
      };
      const pingInterval = setInterval(() => tabChannel.current?.postMessage('PING'), 5000);

      // 2. Event Blocking (Clipboard, Context Menu, Drag)
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        reportViolation('RIGHT_CLICK', {
            x: e.clientX,
            y: e.clientY,
            target: (e.target as HTMLElement).tagName
        });
      };

      const handleCopyPaste = (e: ClipboardEvent | Event) => {
        e.preventDefault();
        reportViolation(`${e.type.toUpperCase()}_ATTEMPT`, {
            target: (e.target as HTMLElement).tagName
        });
      };

      const preventDefault = (e: Event) => {
        e.preventDefault();
        reportViolation(`${e.type.toUpperCase()}_ATTEMPT`);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const alt = e.altKey;

        // DevTools
        if (e.key === 'F12' || (ctrl && shift && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || (ctrl && alt && e.key.toUpperCase() === 'U')) {
          e.preventDefault();
          const shortcut = e.key === 'F12' ? 'F12' : `${ctrl ? 'Ctrl+' : ''}${shift ? 'Shift+' : ''}${e.key.toUpperCase()}`;
          reportViolation('DEVTOOLS_ATTEMPT', { shortcut });
        }
        // Clipboard
        if (ctrl && ['C', 'V', 'X'].includes(e.key.toUpperCase())) {
          e.preventDefault();
          reportViolation('CLIPBOARD_SHORTCUT');
        }
        // Print Screen
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          reportViolation('SCREENSHOT_ATTEMPT');
        }
      };

      // 3. DevTools Heuristics (Window resizing)
      const threshold = 160;
      const checkDevTools = () => {
        const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
        const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
        if (widthDiff > threshold || heightDiff > threshold) {
          reportViolation('DEVTOOLS_OPENED_RESIZE');
        }
      };
      const resizeInterval = setInterval(checkDevTools, 2000);

      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('copy', handleCopyPaste);
      window.addEventListener('paste', handleCopyPaste);
      window.addEventListener('cut', handleCopyPaste);
      window.addEventListener('dragstart', preventDefault);
      window.addEventListener('drop', preventDefault);
      window.addEventListener('keydown', handleKeyDown);

      // Block selection via CSS
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';

      return () => {
        clearInterval(pingInterval);
        clearInterval(resizeInterval);
        tabChannel.current?.close();
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('copy', handleCopyPaste);
        window.removeEventListener('paste', handleCopyPaste);
        window.removeEventListener('cut', handleCopyPaste);
        window.removeEventListener('dragstart', preventDefault);
        window.removeEventListener('drop', preventDefault);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.userSelect = 'auto';
        document.body.style.webkitUserSelect = 'auto';
      };
    } catch (err) {
      console.warn('Anti-Cheat: Initialization fallback mode', err);
    }
  }, [enabled, reportViolation]);

  return { violationCount, resetViolations: () => setViolationCount(0) };
};
