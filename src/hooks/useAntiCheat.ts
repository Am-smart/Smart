import { useState, useEffect, useCallback } from 'react';

export const useAntiCheat = (enabled: boolean = false) => {
  const [violationCount, setViolationCount] = useState(0);

  const reportViolation = useCallback((type: string) => {
    setViolationCount(prev => prev + 1);
    console.warn(`Anti-Cheat Violation: ${type}`);
    // Future: Integration with Supabase to log violations
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('tab-switch');
      }
    };

    const handleBlur = () => {
      reportViolation('window-blur');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('right-click');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        reportViolation('clipboard-shortcut');
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, reportViolation]);

  return { violationCount, resetViolations: () => setViolationCount(0) };
};
