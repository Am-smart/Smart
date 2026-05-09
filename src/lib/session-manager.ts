// Session management (Simplified to remove architecture drift)

export const sessionManager = {
  // Driven by server-side cookie now
  isSessionExpired: (): boolean => {
    return false;
  },

  getSessionExpiryTime: (): Date | null => {
    return null;
  },

  getTimeUntilExpiry: (): number => {
    return 0;
  },

  cleanupSession: () => {
    // No-op
  },

  initSession: () => {
    // No-op
  },

  resetSessionTimeout: () => {
    // No-op
  },

  handleSessionExpiry: async () => {
    // No-op
  },

  logout: () => {
    if (typeof window === 'undefined') return;
    window.location.href = '/';
  }
};
