/**
 * F.11.2: Suppress cosmetic manifest CORS errors in Lovable preview
 * 
 * These errors are caused by Lovable's auth-bridge proxy interfering with manifest.json
 * They're purely cosmetic and don't affect functionality
 */

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const SUPPRESSED_PATTERNS = [
  /manifest\.json.*CORS/i,
  /manifest\.json.*503/i,
  /auth-bridge.*CORS/i,
  /Access-Control-Allow-Origin.*manifest\.json/i,
];

const shouldSuppress = (args: any[]): boolean => {
  const message = args.join(' ');
  return SUPPRESSED_PATTERNS.some(pattern => pattern.test(message));
};

console.error = (...args: any[]) => {
  if (shouldSuppress(args)) {
    // Suppress - this is a known Lovable preview issue
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (shouldSuppress(args)) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Also suppress unhandled fetch errors for manifest
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type: string, listener: any, options?: any) {
  if (type === 'error' || type === 'unhandledrejection') {
    const wrappedListener = (event: any) => {
      const message = event.message || event.reason?.message || '';
      if (shouldSuppress([message])) {
        event.preventDefault?.();
        return;
      }
      if (typeof listener === 'function') {
        listener(event);
      } else if (listener?.handleEvent) {
        listener.handleEvent(event);
      }
    };
    return originalAddEventListener.call(window, type, wrappedListener, options);
  }
  return originalAddEventListener.call(window, type, listener, options);
};

console.log('[Manifest Suppressor] ✅ CORS error suppression active');

export {};
