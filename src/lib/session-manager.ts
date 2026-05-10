// Session management (Simplified to remove architecture drift)

export const sessionManager = {
  cleanupSession: () => {
    // No-op - managed by server-side cookie
  },

  redirectToLanding: () => {
    if (typeof window === 'undefined') return;
    window.location.href = '/';
  },

  logout: () => {
    sessionManager.redirectToLanding();
  }
};
