/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Device Detection Utilities
 * Identifies Desktop vs Mobile (Android / iPhone / iPad / Tablet)
 */

/**
 * Detect whether the current client is a mobile device (Android, iPhone, iPad, etc.)
 * @returns {boolean}
 */
export function isMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();

  // 1. Direct User-Agent matching for Android, iPhone, iPod, mobile devices
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|silk|fennec|tablet/i;
  if (mobileRegex.test(ua)) {
    return true;
  }

  // 2. Detect iPadOS 13+ (reports as Macintosh Intel but has touch capability)
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return true;
  }

  // 3. Fallback: touch-enabled device with mobile/tablet viewport width
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isSmallScreen = window.innerWidth <= 1024;
  if (isTouch && isSmallScreen) {
    return true;
  }

  return false;
}

/**
 * Detect whether the client is a Desktop / Laptop
 * @returns {boolean}
 */
export function isDesktopDevice() {
  return !isMobileDevice();
}
