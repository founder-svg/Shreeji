/**
 * ============================================================================
 * SHREEJI CLIENT SECURITY SHIELD & ANTI-REVERSE ENGINEERING ARMOR
 * Protects 3D spatial models, administrative logic, and client telemetry
 * Production-hardened defense against tampering, scraping, and inspection
 * ============================================================================
 */

(function () {
  'use strict';

  // 1. Anti-Clickjacking / Frame Buster Protection
  try {
    if (window.top !== window.self) {
      // If embedded in unauthorized third-party iframe, break out immediately
      window.top.location = window.self.location;
    }
  } catch (err) {
    // Cross-origin iframe boundary detected; neutralize viewport
    document.documentElement.style.display = 'none';
  }

  // 2. Production Console Output Suppression (Prevent token & state leakage)
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
  if (!isLocal) {
    const noop = function () {};
    ['log', 'debug', 'info', 'dir', 'table'].forEach((method) => {
      if (window.console && window.console[method]) {
        window.console[method] = noop;
      }
    });
  }

  // 3. Anti-Inspection Keyboard & Context Protections
  // Disables Ctrl+U (view source), F12 (devtools), Ctrl+Shift+I/J/C (inspector)
  document.addEventListener('keydown', function (e) {
    // Allow typing inside form inputs
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

    // F12 DevTools
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools inspect)
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
      e.preventDefault();
      return false;
    }

    // Ctrl+U (View Source) and Ctrl+S (Save Page Source)
    if (e.ctrlKey && !isInput && ['U', 'u', 'S', 's'].includes(e.key)) {
      e.preventDefault();
      return false;
    }
  }, { passive: false });

  // 4. Context Menu Protection (Prevent Right Click -> Inspect Element on 3D canvas and site assets)
  document.addEventListener('contextmenu', function (e) {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      return true; // Allow standard copy/paste inside lead and inquiry forms
    }
    e.preventDefault();
    return false;
  }, { passive: false });

  // 5. Active DevTools Detection Trap (Production Anti-Debugging Loop)
  if (!isLocal) {
    setInterval(function () {
      const startTime = performance.now();
      // Debugger statement causes timing delay if DevTools panel is attached
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        // DevTools breakpoint hit: clear sensitive memory buffers
        if (window.sessionStorage) sessionStorage.removeItem('shreeji_admin_token');
      }
    }, 2000);
  }

  // 6. Security Header Verification Stamp
  window.__SHREEJI_SECURITY_ACTIVE__ = true;
})();

