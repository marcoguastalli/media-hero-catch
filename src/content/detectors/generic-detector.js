/**
 * Generic Hero Media Detector
 * 
 * Implements a universal algorithm to detect hero media (largest/most prominent)
 * on any webpage. Uses a multi-stage approach:
 * 1. Video detection (prioritized)
 * 2. Image detection with scoring
 * 3. Background image detection (fallback)
 */

import {
  calculateElementSize,
  calculateViewportBonus,
  calculateQualityBonus,
  getAllImages,
  getAllVideos,
  getElementsWithBackgroundImages,
  extractBackgroundImageUrl,
  filterElements,
} from '../utils/dom-analyzer.js';
import {
  extractImageUrl,
  extractVideoUrl,
  createMediaObject,
  isValidMediaUrl,
} from '../utils/media-extractor.js';
import { CONFIG } from '../../shared/config.js';

/**
 * Detect hero media on the current page
 * @returns {Promise<Array>} Array of media objects
 */
export async function detectHeroMedia() {
  console.log('Generic detector: Starting hero media detection');

  const results = [];

  // Stage 1: Check for videos (highest priority)
  if (CONFIG.generic.prioritizeVideos) {
    const heroVideo = await detectHeroVideo();
    if (heroVideo) {
      results.push(heroVideo);
      console.log('Generic detector: Found hero video', heroVideo);
      return results; // Return immediately if video found
    }
  }

  // Stage 2: Check for images
  const heroImage = await detectHeroImage();
  if (heroImage) {
    results.push(heroImage);
    console.log('Generic detector: Found hero image', heroImage);
    return results;
  }

  // Stage 3: Check for background images (fallback)
  const heroBackgroundImage = await detectHeroBackgroundImage();
  if (heroBackgroundImage) {
    results.push(heroBackgroundImage);
    console.log('Generic detector: Found hero background image', heroBackgroundImage);
    return results;
  }

  console.log('Generic detector: No hero media found');
  return results;
}

/**
 * Detect hero video
 * @returns {Promise<Object|null>} Video media object or null
 */
async function detectHeroVideo() {
  const videos = getAllVideos();
  
  if (videos.length === 0) {
    return null;
  }

  // Filter videos
  const validVideos = filterElements(videos);
  
  if (validVideos.length === 0) {
    return null;
  }

  // Score each video
  const scoredVideos = validVideos.map(video => {
    const size = calculateElementSize(video);
    const viewportBonus = calculateViewportBonus(video);
    const qualityBonus = calculateQualityBonus(size.width);
    
    const score = size.area * viewportBonus * qualityBonus;
    
    return { video, size, score };
  });

  // Sort by score descending
  scoredVideos.sort((a, b) => b.score - a.score);

  // Get highest scoring video
  const winner = scoredVideos[0];
  const videoUrl = extractVideoUrl(winner.video);

  if (!videoUrl || !isValidMediaUrl(videoUrl)) {
    return null;
  }

  return createMediaObject(videoUrl, 'video', winner.video, winner.score);
}

/**
 * Detect hero image
 * @returns {Promise<Object|null>} Image media object or null
 */
async function detectHeroImage() {
  const images = getAllImages();
  
  if (images.length === 0) {
    return null;
  }

  // Filter images
  const validImages = filterElements(images);
  
  if (validImages.length === 0) {
    return null;
  }

  // Score each image
  const scoredImages = validImages.map(img => {
    const size = calculateElementSize(img);
    const viewportBonus = calculateViewportBonus(img);
    const qualityBonus = calculateQualityBonus(size.width);
    
    const score = size.area * viewportBonus * qualityBonus;
    
    return { img, size, score };
  });

  // Sort by score descending
  scoredImages.sort((a, b) => b.score - a.score);

  // Get highest scoring image
  const winner = scoredImages[0];
  const imageUrl = extractImageUrl(winner.img);

  if (!imageUrl || !isValidMediaUrl(imageUrl)) {
    return null;
  }

  return createMediaObject(imageUrl, 'image', winner.img, winner.score);
}

/**
 * Detect hero background image
 * @returns {Promise<Object|null>} Background image media object or null
 */
async function detectHeroBackgroundImage() {
  const elements = getElementsWithBackgroundImages();
  
  if (elements.length === 0) {
    return null;
  }

  // Filter elements
  const validElements = filterElements(elements);
  
  if (validElements.length === 0) {
    return null;
  }

  // Score each element
  const scoredElements = validElements.map(element => {
    const size = calculateElementSize(element);
    const viewportBonus = calculateViewportBonus(element);
    const qualityBonus = calculateQualityBonus(size.width);
    
    const score = size.area * viewportBonus * qualityBonus;
    
    return { element, size, score };
  });

  // Sort by score descending
  scoredElements.sort((a, b) => b.score - a.score);

  // Get highest scoring element
  const winner = scoredElements[0];
  const bgImageUrl = extractBackgroundImageUrl(winner.element);

  if (!bgImageUrl || !isValidMediaUrl(bgImageUrl)) {
    return null;
  }

  return createMediaObject(bgImageUrl, 'image', winner.element, winner.score);
}

/**
 * Check if this detector should be used for the current page
 * @returns {boolean} True if generic detector should be used
 */
export function shouldUseGenericDetector() {
  // Generic detector is the fallback for all sites
  // It will be used unless a specific detector (e.g., Instagram) matches
  return true;
}