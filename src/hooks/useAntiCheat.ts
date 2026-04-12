import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useAuth } from '@/components/auth/AuthContext';

export const useAntiCheat = (enabled: boolean = false, assessmentTitle: string = 'Assessment') => {
  const [violationCount, setViolationCount] = useState(0);
  const { client } = useSupabase();
  const { user } = useAuth();

  const reportViolation = useCallback(async (type: string) => {
    setViolationCount(prev => prev + 1);
    console.warn(`Anti-Cheat Violation: ${type}`);

    if (user && enabled) {
        await client.from('system_logs').insert([{
            category: 'anti-cheat',
            level: 'warning',
            message: `User ${user.email} attempted ${type} during ${assessmentTitle}`,
            user_id: user.id,
            metadata: { type, assessmentTitle, timestamp: new Date().toISOString() }
        }]);
    }
  }, [user, client, enabled, assessmentTitle]);

  useEffect(() => {
    if (!enabled) return;

    // 1. Tab Switching & Visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('tab-switch');
      }
    };

    const handleBlur = () => {
      reportViolation('window-blur');
    };

    // 2. Right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('right-click');
    };

    // 3. Keyboard Shortcuts (DevTools, View Source, Clipboard)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Clipboard
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        reportViolation('clipboard-shortcut');
      }
      // F12
      if (e.key === 'F12') {
          e.preventDefault();
          reportViolation('devtools-shortcut-f12');
      }
      // DevTools (Ctrl+Shift+I/J/C)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
          e.preventDefault();
          reportViolation('devtools-shortcut-combo');
      }
      // View Source (Ctrl+U)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
          e.preventDefault();
          reportViolation('view-source-shortcut');
      }
    };

    // 4. Copy/Paste/Cut Events
    const handleClipboard = (e: Event) => {
        e.preventDefault();
        reportViolation(`clipboard-${e.type}`);
    };

    // 5. Drag & Drop
    const handleDrag = (e: DragEvent) => {
        e.preventDefault();
        reportViolation('drag-drop-attempt');
    };

    // 6. Text Selection (CSS + JS fallback)
    const handleSelectStart = (e: Event) => {
        e.preventDefault();
        reportViolation('text-selection-attempt');
    };

    // 7. Long Press (Mobile)
    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 1) {
            reportViolation('multi-touch-gesture');
        }
    };

    // 8. DevTools Detection (Heuristic)
    let devtoolsOpen = false;
    const threshold = 160;
    const checkDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
            devtoolsOpen = true;
            reportViolation('devtools-detected');
        }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('copy', handleClipboard);
    window.addEventListener('paste', handleClipboard);
    window.addEventListener('cut', handleClipboard);
    window.addEventListener('dragstart', handleDrag);
    window.addEventListener('drop', handleDrag);
    window.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('touchstart', handleTouchStart);
    const interval = setInterval(checkDevTools, 1000);

    // Block text selection via CSS
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    // Allow text selection in inputs and textareas
    const style = document.createElement('style');
    style.innerHTML = 'input, textarea { user-select: text !important; -webkit-user-select: text !important; }';
    document.head.appendChild(style);

    return () => {
        document.head.removeChild(style);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('copy', handleClipboard);
      window.removeEventListener('paste', handleClipboard);
      window.removeEventListener('cut', handleClipboard);
      window.removeEventListener('dragstart', handleDrag);
      window.removeEventListener('drop', handleDrag);
      window.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('touchstart', handleTouchStart);
      clearInterval(interval);
      document.body.style.userSelect = 'auto';
      document.body.style.webkitUserSelect = 'auto';
    };
  }, [enabled, reportViolation]);

  return { violationCount, resetViolations: () => setViolationCount(0) };
};
