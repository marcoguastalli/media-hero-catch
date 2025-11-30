/**
 * Browser API Compatibility Layer
 * 
 * Provides a unified API interface for both Firefox and Chrome.
 * Firefox uses 'browser' namespace, Chrome uses 'chrome' namespace.
 * This module exports the appropriate API based on the environment.
 */

/**
 * Unified browser API that works in both Firefox and Chrome
 * @type {typeof browser | typeof chrome}
 */
export const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Check if running in Firefox
 * @returns {boolean} True if Firefox, false otherwise
 */
export const isFirefox = () => typeof browser !== 'undefined';

/**
 * Check if running in Chrome
 * @returns {boolean} True if Chrome, false otherwise
 */
export const isChrome = () => typeof chrome !== 'undefined' && typeof browser === 'undefined';

/**
 * Get browser name
 * @returns {string} 'firefox' or 'chrome'
 */
export const getBrowserName = () => (isFirefox() ? 'firefox' : 'chrome');