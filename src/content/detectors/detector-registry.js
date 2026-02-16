/**
 * Detector Registry
 * 
 * Manages different media detectors (Instagram, Generic, etc.)
 * and selects the appropriate one based on the current page.
 */

import { detectHeroMedia as detectGeneric } from './generic-detector.js';
import { 
  detectHeroMedia as detectInstagram,
  shouldUseInstagramDetector 
} from './instagram-detector.js';

/**
 * Get appropriate detector for current page
 * @returns {Function} Detector function
 */
export function getDetector() {
  const hostname = window.location.hostname.toLowerCase();

  // Check for Instagram
  if (shouldUseInstagramDetector()) {
    console.log('Using Instagram detector for', hostname);
    return detectInstagram;
  }

  // Default to generic detector
  console.log('Using generic detector for', hostname);
  return detectGeneric;
}

/**
 * Detect hero media using appropriate detector
 * @returns {Promise<Array>} Array of media objects
 */
export async function detectHeroMedia() {
  const detector = getDetector();
  return await detector();
}