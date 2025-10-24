/**
 * Mobile detection utilities for enhanced mobile experience
 * Adapted from anbhe-docs-ui for agamvani-ui
 */

export const isMobileDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

export const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
};

export const isAndroidDevice = () => {
  return /Android/i.test(navigator.userAgent);
};

export const isMobileAPK = () => {
  // Check if running in a mobile app context
  return (
    window.navigator.standalone ||
    window.matchMedia('(display-mode: standalone)').matches ||
    // Check for mobile app user agents
    /wv\)|(WebView)/.test(navigator.userAgent) ||
    // Check for specific mobile app indicators
    (window.location.protocol === 'file:' && isMobileDevice())
  );
};

export const getScrollThreshold = () => {
  if (isMobileAPK()) return 20; // Lower threshold for APK
  if (isMobileDevice()) return 30; // Medium threshold for mobile web
  return 50; // Standard threshold for desktop
};

export const shouldUseAcceleration = () => {
  // Use hardware acceleration on mobile for better performance
  return isMobileDevice();
};
