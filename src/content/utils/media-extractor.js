/**
 * Media Extractor Utilities
 * 
 * Extracts media URLs from various sources including:
 * - <img> src and srcset
 * - <video> src
 * - <source> elements
 * - background-image CSS
 */

/**
 * Extract the highest resolution URL from an image element
 * @param {HTMLImageElement} img - Image element
 * @returns {string|null} Highest resolution URL
 */
export function extractImageUrl(img) {
  // First, check if there's a srcset with multiple resolutions
  if (img.srcset) {
    const highestResUrl = getHighestResolutionFromSrcset(img.srcset);
    if (highestResUrl) {
      return makeAbsoluteUrl(highestResUrl);
    }
  }
  
  // Fall back to src attribute
  if (img.src) {
    return makeAbsoluteUrl(img.src);
  }
  
  return null;
}

/**
 * Parse srcset and return highest resolution URL
 * @param {string} srcset - srcset attribute value
 * @returns {string|null} Highest resolution URL
 */
export function getHighestResolutionFromSrcset(srcset) {
  if (!srcset) return null;
  
  // Parse srcset: "url1 320w, url2 640w, url3 1280w"
  const sources = srcset.split(',').map(source => {
    const parts = source.trim().split(/\s+/);
    const url = parts[0];
    const descriptor = parts[1] || '';
    
    // Extract width (e.g., "640w" -> 640)
    const widthMatch = descriptor.match(/^(\d+)w$/);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : 0;
    
    return { url, width };
  });
  
  // Sort by width descending
  sources.sort((a, b) => b.width - a.width);
  
  // Return highest resolution URL
  return sources[0]?.url || null;
}

/**
 * Extract video URL from video element
 * @param {HTMLVideoElement} video - Video element
 * @returns {string|null} Video URL
 */
export function extractVideoUrl(video) {
  // Check direct src attribute
  if (video.src) {
    return makeAbsoluteUrl(video.src);
  }
  
  // Check <source> child elements
  const sources = video.querySelectorAll('source');
  if (sources.length > 0) {
    // Get first source (usually highest quality)
    const firstSource = sources[0];
    if (firstSource.src) {
      return makeAbsoluteUrl(firstSource.src);
    }
  }
  
  return null;
}

/**
 * Make URL absolute if it's relative
 * @param {string} url - URL to convert
 * @returns {string} Absolute URL
 */
export function makeAbsoluteUrl(url) {
  if (!url) return url;
  
  try {
    // If already absolute, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If protocol-relative (//example.com/image.jpg)
    if (url.startsWith('//')) {
      return `${window.location.protocol}${url}`;
    }
    
    // If absolute path (/images/photo.jpg)
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    
    // Relative path (images/photo.jpg)
    const base = window.location.href.substring(
      0,
      window.location.href.lastIndexOf('/') + 1
    );
    return `${base}${url}`;
  } catch (error) {
    console.error('Error making URL absolute:', error);
    return url;
  }
}

/**
 * Extract filename from URL
 * @param {string} url - URL
 * @returns {string} Filename
 */
export function extractFilenameFromUrl(url) {
  if (!url) return 'media';
  
  try {
    const urlObj = new URL(url, window.location.href);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    
    // If filename exists and has extension, return it
    if (filename && filename.includes('.')) {
      return filename;
    }
    
    // Otherwise generate a filename
    return generateFilename(url);
  } catch (error) {
    console.error('Error extracting filename:', error);
    return generateFilename(url);
  }
}

/**
 * Generate filename from URL or timestamp
 * @param {string} url - URL
 * @returns {string} Generated filename
 */
export function generateFilename(url) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  const extension = guessExtensionFromUrl(url);
  
  return `media_${timestamp}_${random}.${extension}`;
}

/**
 * Guess file extension from URL
 * @param {string} url - URL
 * @returns {string} Extension (default: jpg)
 */
export function guessExtensionFromUrl(url) {
  if (!url) return 'jpg';
  
  const lowercaseUrl = url.toLowerCase();
  
  // Check for common image extensions
  if (lowercaseUrl.includes('.png')) return 'png';
  if (lowercaseUrl.includes('.gif')) return 'gif';
  if (lowercaseUrl.includes('.webp')) return 'webp';
  if (lowercaseUrl.includes('.svg')) return 'svg';
  if (lowercaseUrl.includes('.bmp')) return 'bmp';
  
  // Check for common video extensions
  if (lowercaseUrl.includes('.mp4')) return 'mp4';
  if (lowercaseUrl.includes('.webm')) return 'webm';
  if (lowercaseUrl.includes('.mov')) return 'mov';
  if (lowercaseUrl.includes('.avi')) return 'avi';
  
  // Default to jpg for images
  return 'jpg';
}

/**
 * Create media object with metadata
 * @param {string} url - Media URL
 * @param {string} type - Media type ('image' or 'video')
 * @param {HTMLElement} element - Source element
 * @param {number} score - Detection score
 * @returns {Object} Media object
 */
export function createMediaObject(url, type, element, score = 0) {
  return {
    url: makeAbsoluteUrl(url),
    filename: extractFilenameFromUrl(url),
    type,
    score,
    element: element.tagName.toLowerCase(),
    timestamp: Date.now(),
  };
}

/**
 * Validate media URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export function isValidMediaUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Must be HTTP(S)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }
  
  // Must not be a data URL (too large)
  if (url.startsWith('data:')) {
    return false;
  }
  
  // Must have reasonable length
  if (url.length > 2048) {
    return false;
  }
  
  return true;
}