/**
 * Application Configuration
 * 
 * Central configuration for all detection thresholds, delays, and settings.
 */

export const CONFIG = {
  // Batch Processing Settings
  batchProcessing: {
    defaultDelay: 2, // seconds between processing URLs
    maxDelay: 30, // maximum delay allowed
    minDelay: 0, // minimum delay allowed
    tabCloseDelay: 1000, // ms to wait before closing tab after download
  },

  // Media Detection Settings
  detection: {
    minHeroSize: 200, // minimum width/height in pixels for hero media
    iconThreshold: 100, // images smaller than this are considered icons
    pageTimeout: 10000, // ms to wait for page analysis
    mutationObserverTimeout: 5000, // ms to observe DOM changes
    
    // Scoring bonuses
    viewportBonusVisible: 1.5, // bonus for fully visible elements
    viewportBonusPartial: 1.2, // bonus for partially visible elements
    qualityBonusHD: 1.3, // bonus for HD images (>1920px)
    qualityBonusSD: 1.1, // bonus for SD images (>1280px)
  },

  // Download Settings
  downloads: {
    retryAttempts: 3, // number of retry attempts for failed downloads
    retryDelays: [2000, 4000, 8000], // ms delays for each retry attempt (exponential backoff)
    conflictAction: 'uniquify', // browser behavior on filename conflicts
  },

  // Instagram Specific Settings
  instagram: {
    domain: 'instagram.com',
    carouselWaitDelay: 500, // ms to wait for carousel items to load
    maxCarouselItems: 10, // maximum items to extract from a carousel
  },

  // Generic Detection Settings
  generic: {
    excludeClassNames: [
      'ad',
      'advertisement',
      'sponsor',
      'banner',
      'icon',
      'avatar',
      'thumbnail-small',
      'logo',
    ],
    excludeBySize: true, // exclude elements below iconThreshold
    prioritizeVideos: true, // videos are prioritized over images
  },

  // UI Settings
  ui: {
    maxUrlsDisplay: 50, // maximum URLs to display in progress list
    progressUpdateInterval: 500, // ms between progress updates
  },
};

/**
 * Get configuration value by path
 * @param {string} path - Dot-separated path (e.g., 'detection.minHeroSize')
 * @returns {*} Configuration value
 */
export const getConfig = path => {
  const keys = path.split('.');
  let value = CONFIG;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
};

/**
 * Validate delay value is within acceptable range
 * @param {number} delay - Delay in seconds
 * @returns {number} Valid delay value
 */
export const validateDelay = delay => {
  const { minDelay, maxDelay, defaultDelay } = CONFIG.batchProcessing;
  
  if (typeof delay !== 'number' || isNaN(delay)) {
    return defaultDelay;
  }
  
  return Math.max(minDelay, Math.min(maxDelay, delay));
};