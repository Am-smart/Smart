/**
 * Anti-Cheat System - Focused on Local Prevention
 * Blocks: copy, paste, cut, context menu, keyboard shortcuts, long press, text selection, drag
 * Logs ONLY local violation counts, NOT remote logs
 */

(function() {
'use strict';

/* ================= CONFIGURATION ================= */

const CONFIG = {
  // Core settings
  DEBUG: false,

  // Feature flags
  FULLSCREEN_REQUIRED: false,
  MULTI_TAB_LOCK: true,
  BLOCK_COPY: true,
  BLOCK_PASTE: true,
  BLOCK_CUT: true,
  BLOCK_CONTEXT_MENU: true,
  BLOCK_KEYBOARD_SHORTCUTS: true,
  BLOCK_LONG_PRESS: true,
  BLOCK_TEXT_SELECTION: true,
  BLOCK_DRAG: true,
  BLOCK_DEVTOOLS: true,
  BLOCK_TAB_SWITCH: true,

  // Detection thresholds
  LONG_PRESS_THRESHOLD: 500, // ms
  DEVTOOLS_THRESHOLD: 160,
  BLUR_THRESHOLD: 2000, // Only log blur if > 2 seconds

  // Rate limiting
  MIN_VIOLATION_INTERVAL: 1000, // Minimum ms between same-type violations

  // Callbacks
  callbacks: {
    onViolation: null,
    onBlocked: null
  }
};

/* ================= STATE ================= */

let state = {
  isActive: false,
  count: 0,
  history: {},
  lastByType: {},
  lastGlobal: 0,
  startTime: Date.now()
};

let longPressTimers = new Map();
let lastViolationTime = {};
let focusLossTimer = null;
let wasFocused = false;

/* ================= VIOLATION LOGGING ================= */

function canLogViolation(type) {
  const now = Date.now();
  const lastTime = lastViolationTime[type] || 0;

  if (now - lastTime < CONFIG.MIN_VIOLATION_INTERVAL) {
    return false;
  }

  lastViolationTime[type] = now;
  return true;
}

function logViolation(type, details = {}) {
  if (!state.isActive) return;

  if (!canLogViolation(type)) return;

  const now = Date.now();

  // Update local state count
  state.count++;
  state.history[type] = (state.history[type] || 0) + 1;
  state.lastByType[type] = now;
  state.lastGlobal = now;

  // Callbacks
  if (CONFIG.callbacks.onViolation) {
    CONFIG.callbacks.onViolation({
      type,
      timestamp: now,
      details,
      elapsed: now - state.startTime
    });
  }

  if (CONFIG.DEBUG) {
    // console.log('Anti-Cheat Local Violation:', type, details);
  }
}

/* ================= EVENT BLOCKING ================= */

function initEventBlocking() {
  if (CONFIG.BLOCK_CONTEXT_MENU) {
    document.addEventListener('contextmenu', (e) => {
      if (!state.isActive) return;
      e.preventDefault();
      logViolation('RIGHT_CLICK', { target: e.target.tagName });
      if (CONFIG.callbacks.onBlocked) CONFIG.callbacks.onBlocked('contextmenu');
      return false;
    }, { passive: false });
  }

  if (CONFIG.BLOCK_KEYBOARD_SHORTCUTS) {
    document.addEventListener('keydown', handleKeydown, { passive: false });
  }

  if (CONFIG.BLOCK_COPY) {
    document.addEventListener('copy', (e) => {
      if (!state.isActive) return;
      e.preventDefault();
      logViolation('COPY_ATTEMPT');
      if (CONFIG.callbacks.onBlocked) CONFIG.callbacks.onBlocked('copy');
      return false;
    }, { passive: false });
  }

  if (CONFIG.BLOCK_PASTE) {
    document.addEventListener('paste', (e) => {
      if (!state.isActive) return;
      e.preventDefault();
      logViolation('PASTE_ATTEMPT');
      if (CONFIG.callbacks.onBlocked) CONFIG.callbacks.onBlocked('paste');
      return false;
    }, { passive: false });
  }

  if (CONFIG.BLOCK_CUT) {
    document.addEventListener('cut', (e) => {
      if (!state.isActive) return;
      e.preventDefault();
      logViolation('CUT_ATTEMPT');
      if (CONFIG.callbacks.onBlocked) CONFIG.callbacks.onBlocked('cut');
      return false;
    }, { passive: false });
  }

  if (CONFIG.BLOCK_DRAG) {
    document.addEventListener('dragstart', (e) => {
      if (!state.isActive) return;
      e.preventDefault();
      logViolation('DRAG_ATTEMPT');
      return false;
    }, { passive: false });

    document.addEventListener('drop', (e) => {
      if (!state.isActive) return;
      e.preventDefault();
      logViolation('DROP_ATTEMPT');
      return false;
    }, { passive: false });
  }
}

function handleKeydown(e) {
  if (!state.isActive) return;

  const ctrl = e.ctrlKey || e.metaKey;
  const shift = e.shiftKey;
  const alt = e.altKey;
  const key = e.key;

  if (key === 'F12' ||
      (ctrl && shift && ['I', 'J', 'C'].includes(key.toUpperCase())) ||
      (ctrl && alt && ['U', 'A'].includes(key.toUpperCase())) ||
      (ctrl && key.toUpperCase() === 'U')) {
    e.preventDefault();
    logViolation('DEVTOOLS_SHORTCUT', { key });
    return false;
  }

  if (key === 'PrintScreen') {
    e.preventDefault();
    logViolation('SCREENSHOT_ATTEMPT');
    return false;
  }
}

/* ================= LONG PRESS & TOUCH BLOCKING ================= */

function initTouchControl() {
  if (!CONFIG.BLOCK_LONG_PRESS) return;

  document.addEventListener('touchstart', (e) => {
    if (!state.isActive) return;
    const touch = e.touches[0];
    const timerId = setTimeout(() => {
      logViolation('LONG_PRESS_DETECTED', { target: e.target.tagName });
      if (CONFIG.callbacks.onBlocked) CONFIG.callbacks.onBlocked('longPress');
      window.getSelection()?.removeAllRanges();
    }, CONFIG.LONG_PRESS_THRESHOLD);

    longPressTimers.set(touch.identifier, timerId);
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    for (const touch of e.changedTouches) {
      const timerId = longPressTimers.get(touch.identifier);
      if (timerId) {
        clearTimeout(timerId);
        longPressTimers.delete(touch.identifier);
      }
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    for (const touch of e.changedTouches) {
      const timerId = longPressTimers.get(touch.identifier);
      if (timerId) {
        clearTimeout(timerId);
        longPressTimers.delete(touch.identifier);
      }
    }
  }, { passive: true });

  // Explicitly block text selection on mobile
  if (CONFIG.BLOCK_TEXT_SELECTION) {
    document.addEventListener('selectstart', (e) => {
      if (!state.isActive) return;
      e.preventDefault();
      return false;
    }, { passive: false });
  }
}

/* ================= VISIBILITY & DEVTOOLS ================= */

function initVisibilityDetection() {
  if (!CONFIG.BLOCK_TAB_SWITCH) return;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.isActive) {
      focusLossTimer = setTimeout(() => {
        logViolation('TAB_SWITCH');
      }, CONFIG.BLUR_THRESHOLD);
    } else if (!document.hidden && focusLossTimer) {
      clearTimeout(focusLossTimer);
      focusLossTimer = null;
    }
  });

  window.addEventListener('blur', () => {
    if (!state.isActive || wasFocused) return;
    wasFocused = true;
    focusLossTimer = setTimeout(() => {
      logViolation('WINDOW_BLUR');
    }, CONFIG.BLUR_THRESHOLD);
  });

  window.addEventListener('focus', () => {
    wasFocused = false;
    if (focusLossTimer) {
      clearTimeout(focusLossTimer);
      focusLossTimer = null;
    }
  });
}

function addGlobalCSS() {
  if (document.getElementById('anticheat-styles')) return;
  const style = document.createElement('style');
  style.id = 'anticheat-styles';
  style.textContent = `
    .anticheat-active {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    .anticheat-active input, .anticheat-active textarea {
      user-select: text !important; /* Allow typing but block copy/paste via events */
    }
  `;
  document.head.appendChild(style);
}

/* ================= PUBLIC API ================= */

window.AntiCheat = {
  enable: () => {
    state.isActive = true;
    state.count = 0;
    state.history = {};
    state.startTime = Date.now();
    document.body.classList.add('anticheat-active');
    // console.log('Anti-Cheat Enabled (Local Mode)');
  },

  disable: () => {
    state.isActive = false;
    document.body.classList.remove('anticheat-active');
    // console.log('Anti-Cheat Disabled');
  },

  getViolationCount: () => state.count,

  getStats: () => ({ ...state }),

  configure: (options) => Object.assign(CONFIG, options),

  on: (event, cb) => { if (CONFIG.callbacks[event] !== undefined) CONFIG.callbacks[event] = cb; }
};

/* ================= INIT ================= */

function init() {
  initEventBlocking();
  initTouchControl();
  initVisibilityDetection();
  addGlobalCSS();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
