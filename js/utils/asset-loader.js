/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Dynamic Asset Loader & Preloader
 * Eliminates initial render-blocking while guaranteeing instant game transitions
 */

const loadedStyles = new Set();
const preloadedLinks = new Set();

/**
 * Dynamically load a stylesheet on-demand
 * @param {string} href - URL of the CSS file
 * @returns {Promise<void>}
 */
export function loadStyle(href) {
  const baseName = href.split('?')[0];

  if (loadedStyles.has(baseName)) {
    return Promise.resolve();
  }

  // Check if link tag already exists in DOM
  const existing = document.querySelector(`link[href*="${baseName}"]`);
  if (existing) {
    loadedStyles.add(baseName);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;

    link.onload = () => {
      loadedStyles.add(baseName);
      resolve();
    };

    link.onerror = (err) => {
      console.warn(`[AssetLoader] Warning: could not load stylesheet: ${href}`, err);
      loadedStyles.add(baseName);
      resolve();
    };

    // Always insert before responsive stylesheet so responsive media queries take precedence
    const responsiveLink = document.getElementById('tc-responsive-css');
    if (responsiveLink && responsiveLink.parentNode) {
      responsiveLink.parentNode.insertBefore(link, responsiveLink);
    } else {
      document.head.appendChild(link);
    }
  });
}

/**
 * Idle-prefetch a stylesheet for subsequent games without blocking CPU or network
 * @param {string} href - URL of the CSS file
 */
export function preloadStyle(href) {
  const baseName = href.split('?')[0];
  if (preloadedLinks.has(baseName) || loadedStyles.has(baseName)) return;

  const existing = document.querySelector(`link[href*="${baseName}"]`);
  if (existing) {
    preloadedLinks.add(baseName);
    return;
  }

  preloadedLinks.add(baseName);

  const doPrefetch = () => {
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'style';
      link.href = href;
      document.head.appendChild(link);
    } catch (e) {}
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(doPrefetch, { timeout: 2500 });
  } else {
    setTimeout(doPrefetch, 800);
  }
}
