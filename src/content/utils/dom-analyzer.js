/**
 * DOM Analyzer Utilities
 * 
 * Provides utilities for analyzing DOM elements, calculating sizes,
 * checking viewport visibility, and filtering elements.
 */

import { CONFIG } from '../../shared/config.js';

/**
 * Calculate the effective size of an element
 * @param {HTMLElement} element - Element to measure
 * @returns {Object} Size object with width, height, and area
 */
export function calculateElementSize(element) {
  // Try to use natural dimensions for images
  if (element instanceof HTMLImageElement) {
    const naturalWidth = element.naturalWidth || 0;
    const naturalHeight = element.naturalHeight || 0;
    
    if (naturalWidth > 0 && naturalHeight > 0) {
      return {
        width: naturalWidth,
        height: naturalHeight,
        area: naturalWidth * naturalHeight,
      };
    }
  }
  
  // Try to use video dimensions
  if (element instanceof HTMLVideoElement) {
    const videoWidth = element.videoWidth || 0;
    const videoHeight = element.videoHeight || 0;
    
    if (videoWidth > 0 && videoHeight > 0) {
      return {
        width: videoWidth,
        height: videoHeight,
        area: videoWidth * videoHeight,
      };
    }
  }
  
  // Fall back to rendered dimensions
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    area: rect.width * rect.height,
  };
}

/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {string} 'fully', 'partially', or 'none'
 */
export function getViewportVisibility(element) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  // Check if element is completely outside viewport
  if (
    rect.bottom < 0 ||
    rect.top > windowHeight ||
    rect.right < 0 ||
    rect.left > windowWidth
  ) {
    return 'none';
  }
  
  // Check if element is fully visible
  const fullyVisible =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth;
  
  if (fullyVisible) {
    return 'fully';
  }
  
  return 'partially';
}

/**
 * Calculate viewport visibility bonus
 * @param {HTMLElement} element - Element to check
 * @returns {number} Bonus multiplier
 */
export function calculateViewportBonus(element) {
  const visibility = getViewportVisibility(element);
  
  switch (visibility) {
    case 'fully':
      return CONFIG.detection.viewportBonusVisible;
    case 'partially':
      return CONFIG.detection.viewportBonusPartial;
    default:
      return 1.0;
  }
}

/**
 * Calculate quality bonus based on resolution
 * @param {number} width - Element width
 * @returns {number} Bonus multiplier
 */
export function calculateQualityBonus(width) {
  if (width > 1920) {
    return CONFIG.detection.qualityBonusHD;
  }
  if (width > 1280) {
    return CONFIG.detection.qualityBonusSD;
  }
  return 1.0;
}

/**
 * Check if element should be excluded based on class names
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if should be excluded
 */
export function shouldExcludeByClassName(element) {
  const className = element.className || '';
  const classStr = typeof className === 'string' ? className.toLowerCase() : '';
  
  return CONFIG.generic.excludeClassNames.some(excludeClass =>
    classStr.includes(excludeClass)
  );
}

/**
 * Check if element is too small to be hero media
 * @param {Object} size - Size object from calculateElementSize
 * @returns {boolean} True if too small
 */
export function isTooSmall(size) {
  return (
    size.width < CONFIG.detection.minHeroSize ||
    size.height < CONFIG.detection.minHeroSize
  );
}

/**
 * Check if element is an icon/avatar
 * @param {Object} size - Size object from calculateElementSize
 * @returns {boolean} True if likely an icon
 */
export function isIcon(size) {
  return (
    size.width < CONFIG.detection.iconThreshold ||
    size.height < CONFIG.detection.iconThreshold
  );
}

/**
 * Check if element is actually visible (not hidden by CSS)
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if visible
 */
export function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null
  );
}

/**
 * Get all images from document
 * @returns {HTMLImageElement[]} Array of image elements
 */
export function getAllImages() {
  return Array.from(document.querySelectorAll('img'));
}

/**
 * Get all videos from document
 * @returns {HTMLVideoElement[]} Array of video elements
 */
export function getAllVideos() {
  return Array.from(document.querySelectorAll('video'));
}

/**
 * Get elements with background images
 * @returns {HTMLElement[]} Array of elements with background images
 */
export function getElementsWithBackgroundImages() {
  const elements = [];
  const allElements = document.querySelectorAll('*');
  
  for (const element of allElements) {
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;
    
    if (backgroundImage && backgroundImage !== 'none') {
      elements.push(element);
    }
  }
  
  return elements;
}

/**
 * Extract URL from background-image CSS property
 * @param {HTMLElement} element - Element with background image
 * @returns {string|null} URL or null if not found
 */
export function extractBackgroundImageUrl(element) {
  const style = window.getComputedStyle(element);
  const backgroundImage = style.backgroundImage;
  
  if (!backgroundImage || backgroundImage === 'none') {
    return null;
  }
  
  // Extract URL from url("...") or url('...')
  const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
  return match ? match[1] : null;
}

/**
 * Filter elements by visibility and size
 * @param {HTMLElement[]} elements - Elements to filter
 * @returns {HTMLElement[]} Filtered elements
 */
export function filterElements(elements) {
  return elements.filter(element => {
    // Must be visible
    if (!isElementVisible(element)) {
      return false;
    }
    
    // Calculate size
    const size = calculateElementSize(element);
    
    // Must not be too small
    if (isTooSmall(size)) {
      return false;
    }
    
    // Must not be an icon (if configured)
    if (CONFIG.generic.excludeBySize && isIcon(size)) {
      return false;
    }
    
    // Must not have excluded class names
    if (shouldExcludeByClassName(element)) {
      return false;
    }
    
    return true;
  });
}