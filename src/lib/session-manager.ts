// Session management with automatic re-authentication

const SESSION_TIMEOUT_MINUTES = 30;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
let sessionTimeout: NodeJS.Timeout | null = null;

export const sessionManager = {
  // Initialize session timeout tracking
  initSession: () => {
    if (typeof window === 'undefined') return;
    
    // Set initial session expiry time
    const expiryTime = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
    sessionStorage.setItem('session_expiry', expiryTime);
    
    // Set up timeout to trigger refresh before actual expiry
    sessionManager.resetSessionTimeout();
    
    // Track user activity to reset timeout
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, sessionManager.resetSessionTimeout, true);
    });
  },

  resetSessionTimeout: () => {
    if (typeof window === 'undefined') return;
    
    // Clear existing timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    // Set new expiry time
    const expiryTime = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
    sessionStorage.setItem('session_expiry', expiryTime);
    
    // Set new timeout (trigger 1 minute before actual expiry)
    sessionTimeout = setTimeout(() => {
      sessionManager.handleSessionExpiry();
    }, SESSION_TIMEOUT_MS - 60000);
  },

  handleSessionExpiry: async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Try to refresh session silently
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Session cannot be refreshed, redirect to login
        sessionManager.logout();
      } else {
        // Session refreshed, reset timeout
        sessionManager.resetSessionTimeout();
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      // On error, trigger logout after a short delay
      setTimeout(() => sessionManager.logout(), 5000);
    }
  },

  logout: () => {
    if (typeof window === 'undefined') return;
    
    // Clear session data
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('session_expiry');
    
    // Clear timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      sessionTimeout = null;
    }
    
    // Remove event listeners
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.removeEventListener(event, sessionManager.resetSessionTimeout, true);
    });
    
    // Redirect to login
    window.location.href = '/';
  },

  isSessionExpired: (): boolean => {
    if (typeof window === 'undefined') return true;
    
    const expiryStr = sessionStorage.getItem('session_expiry');
    if (!expiryStr) return true;
    
    const expiryTime = new Date(expiryStr).getTime();
    return Date.now() > expiryTime;
  },

  getSessionExpiryTime: (): Date | null => {
    if (typeof window === 'undefined') return null;
    
    const expiryStr = sessionStorage.getItem('session_expiry');
    return expiryStr ? new Date(expiryStr) : null;
  },

  getTimeUntilExpiry: (): number => {
    const expiryTime = sessionManager.getSessionExpiryTime();
    if (!expiryTime) return 0;
    
    const timeLeft = expiryTime.getTime() - Date.now();
    return Math.max(0, timeLeft);
  },

  cleanupSession: () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      sessionTimeout = null;
    }
    
    if (typeof window === 'undefined') return;
    
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.removeEventListener(event, sessionManager.resetSessionTimeout, true);
    });
  }
};
