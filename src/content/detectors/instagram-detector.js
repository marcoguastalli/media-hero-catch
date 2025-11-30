/**
 * Instagram-Specific Hero Media Detector
 * 
 * Handles Instagram-specific content:
 * - Single image posts
 * - Single video posts
 * - Carousel posts (multiple images/videos)
 * - Reels
 */

import {
  extractImageUrl,
  extractVideoUrl,
  createMediaObject,
  isValidMediaUrl,
} from '../utils/media-extractor.js';
import { CONFIG } from '../../shared/config.js';

/**
 * Detect hero media on Instagram
 * @returns {Promise<Array>} Array of media objects
 */
export async function detectHeroMedia() {
  console.log('Instagram detector: Starting detection');

  // Determine post type
  const postType = detectPostType();
  console.log('Instagram detector: Post type:', postType);

  switch (postType) {
    case 'carousel':
      return await detectCarousel();
    case 'video':
      return await detectVideo();
    case 'reel':
      return await detectReel();
    case 'image':
      return await detectImage();
    default:
      console.warn('Instagram detector: Unknown post type');
      return [];
  }
}

/**
 * Detect the type of Instagram post
 * @returns {string} Post type: 'carousel', 'video', 'reel', 'image', or 'unknown'
 */
function detectPostType() {
  // Check URL for post type hints
  const url = window.location.href;
  
  if (url.includes('/reel/') || url.includes('/reels/')) {
    return 'reel';
  }

  // Check DOM for carousel indicators
  if (hasCarouselIndicators()) {
    return 'carousel';
  }

  // Check for video elements
  const videos = document.querySelectorAll('article video');
  if (videos.length > 0) {
    return 'video';
  }

  // Check for image elements
  const images = document.querySelectorAll('article img[srcset]');
  if (images.length > 0) {
    return 'image';
  }

  return 'unknown';
}

/**
 * Check if post has carousel indicators
 * @returns {boolean} True if carousel detected
 */
function hasCarouselIndicators() {
  // Instagram uses specific aria-labels for carousel navigation
  const nextButton = document.querySelector('button[aria-label*="Next"], button[aria-label*="next"]');
  const prevButton = document.querySelector('button[aria-label*="Previous"], button[aria-label*="previous"]');
  
  // Also check for carousel dots/indicators
  const carouselDots = document.querySelector('[role="tablist"]');
  
  return !!(nextButton || prevButton || carouselDots);
}

/**
 * Detect carousel media (multiple images/videos)
 * @returns {Promise<Array>} Array of media objects
 */
async function detectCarousel() {
  console.log('Instagram detector: Detecting carousel');

  const mediaList = [];
  
  // Find all media elements within the article/post container
  const article = document.querySelector('article');
  if (!article) {
    console.warn('Instagram detector: No article container found');
    return [];
  }

  // Strategy 1: Find all images with srcset (most reliable)
  const images = article.querySelectorAll('img[srcset]');
  const uniqueImageUrls = new Set();

  for (const img of images) {
    // Filter out profile pictures and UI icons
    if (isProfilePicture(img) || isUIElement(img)) {
      continue;
    }

    const url = extractImageUrl(img);
    if (url && isValidMediaUrl(url) && !uniqueImageUrls.has(url)) {
      uniqueImageUrls.add(url);
      const mediaObj = createMediaObject(url, 'image', img, 0);
      mediaList.push(mediaObj);
    }
  }

  // Strategy 2: Find all videos
  const videos = article.querySelectorAll('video');
  const uniqueVideoUrls = new Set();

  for (const video of videos) {
    const url = extractVideoUrl(video);
    if (url && isValidMediaUrl(url) && !uniqueVideoUrls.has(url)) {
      uniqueVideoUrls.add(url);
      const mediaObj = createMediaObject(url, 'video', video, 0);
      mediaList.push(mediaObj);
    }
  }

  // Limit to max carousel items (safety check)
  const limited = mediaList.slice(0, CONFIG.instagram.maxCarouselItems);

  console.log(`Instagram detector: Found ${limited.length} carousel items`);
  
  // Add position numbering to filenames
  return limited.map((media, index) => ({
    ...media,
    filename: addPositionToFilename(media.filename, index + 1, limited.length),
    position: index + 1,
    totalItems: limited.length,
  }));
}

/**
 * Detect single video post
 * @returns {Promise<Array>} Array with single video object
 */
async function detectVideo() {
  console.log('Instagram detector: Detecting video');

  const article = document.querySelector('article');
  if (!article) {
    return [];
  }

  const video = article.querySelector('video');
  if (!video) {
    console.warn('Instagram detector: No video found');
    return [];
  }

  const url = extractVideoUrl(video);
  if (!url || !isValidMediaUrl(url)) {
    console.warn('Instagram detector: Invalid video URL');
    return [];
  }

  const mediaObj = createMediaObject(url, 'video', video, 0);
  console.log('Instagram detector: Found video', mediaObj);
  
  return [mediaObj];
}

/**
 * Detect reel video
 * @returns {Promise<Array>} Array with single reel video object
 */
async function detectReel() {
  console.log('Instagram detector: Detecting reel');

  // Reels use similar structure to regular videos
  const video = document.querySelector('video[playsinline]');
  if (!video) {
    console.warn('Instagram detector: No reel video found');
    return [];
  }

  const url = extractVideoUrl(video);
  if (!url || !isValidMediaUrl(url)) {
    console.warn('Instagram detector: Invalid reel URL');
    return [];
  }

  const mediaObj = createMediaObject(url, 'video', video, 0);
  console.log('Instagram detector: Found reel', mediaObj);
  
  return [mediaObj];
}

/**
 * Detect single image post
 * @returns {Promise<Array>} Array with single image object
 */
async function detectImage() {
  console.log('Instagram detector: Detecting image');

  const article = document.querySelector('article');
  if (!article) {
    return [];
  }

  // Find the main image (usually has srcset and is not a profile picture)
  const images = article.querySelectorAll('img[srcset]');
  
  for (const img of images) {
    // Skip profile pictures and UI elements
    if (isProfilePicture(img) || isUIElement(img)) {
      continue;
    }

    const url = extractImageUrl(img);
    if (url && isValidMediaUrl(url)) {
      const mediaObj = createMediaObject(url, 'image', img, 0);
      console.log('Instagram detector: Found image', mediaObj);
      return [mediaObj];
    }
  }

  console.warn('Instagram detector: No valid image found');
  return [];
}

/**
 * Check if image is a profile picture
 * @param {HTMLImageElement} img - Image element
 * @returns {boolean} True if profile picture
 */
function isProfilePicture(img) {
  // Profile pictures are typically circular and small
  const alt = (img.alt || '').toLowerCase();
  const className = (img.className || '').toLowerCase();
  
  // Check alt text
  if (alt.includes('profile picture') || alt.includes("'s profile picture")) {
    return true;
  }
  
  // Check parent elements for profile-related classes/attributes
  let parent = img.parentElement;
  let depth = 0;
  
  while (parent && depth < 5) {
    const parentClass = (parent.className || '').toLowerCase();
    const parentRole = (parent.getAttribute('role') || '').toLowerCase();
    
    if (parentClass.includes('profile') || parentRole.includes('profile')) {
      return true;
    }
    
    // Check for circular styling (border-radius: 50%)
    const style = window.getComputedStyle(parent);
    if (style.borderRadius === '50%') {
      return true;
    }
    
    parent = parent.parentElement;
    depth++;
  }
  
  // Check size - profile pictures are typically small
  const rect = img.getBoundingClientRect();
  if (rect.width < 150 && rect.height < 150 && Math.abs(rect.width - rect.height) < 10) {
    // Likely a circular profile picture
    return true;
  }
  
  return false;
}

/**
 * Check if image is a UI element (icon, button, etc.)
 * @param {HTMLImageElement} img - Image element
 * @returns {boolean} True if UI element
 */
function isUIElement(img) {
  const alt = (img.alt || '').toLowerCase();
  const className = (img.className || '').toLowerCase();
  
  // Check for UI-related keywords
  const uiKeywords = ['icon', 'logo', 'emoji', 'sticker', 'badge', 'verified'];
  
  for (const keyword of uiKeywords) {
    if (alt.includes(keyword) || className.includes(keyword)) {
      return true;
    }
  }
  
  // Check size - UI elements are typically very small
  const rect = img.getBoundingClientRect();
  if (rect.width < 50 || rect.height < 50) {
    return true;
  }
  
  return false;
}

/**
 * Add position number to filename for carousel items
 * @param {string} filename - Original filename
 * @param {number} position - Position in carousel (1-indexed)
 * @param {number} total - Total items in carousel
 * @returns {string} Modified filename
 */
function addPositionToFilename(filename, position, total) {
  // If only one item, don't add numbering
  if (total === 1) {
    return filename;
  }

  // Split filename into name and extension
  const lastDotIndex = filename.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    // No extension
    return `${filename}_${position}`;
  }
  
  const name = filename.substring(0, lastDotIndex);
  const extension = filename.substring(lastDotIndex);
  
  return `${name}_${position}${extension}`;
}

/**
 * Check if this detector should be used for the current page
 * @returns {boolean} True if on Instagram
 */
export function shouldUseInstagramDetector() {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.includes('instagram.com');
}