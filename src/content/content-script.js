/**
 * Content Script
 * 
 * Injected into web pages to analyze DOM and detect hero media.
 * Communicates findings back to background script.
 */

import { browserAPI } from '../shared/browser-api.js';
import {
  ANALYZE_PAGE,
  PING_CONTENT_SCRIPT,
  PONG,
  MEDIA_DETECTED,
  ANALYSIS_FAILED,
  CONTENT_SCRIPT_READY,
  createMessage,
  isValidMessage,
  ERROR_TYPES,
} from '../shared/message-types.js';
import { CONFIG } from '../shared/config.js';
import { detectHeroMedia } from './detectors/detector-registry.js';

/**
 * Initialize content script
 */
function init() {
  console.log('Media Hero Catch: Content script loaded on', window.location.href);
  
  // Notify background script that content script is ready
  notifyReady();
  
  // Listen for messages from background script
  browserAPI.runtime.onMessage.addListener(handleMessage);
}

/**
 * Notify background script that content script is ready
 */
function notifyReady() {
  const message = createMessage(CONTENT_SCRIPT_READY, {
    url: window.location.href,
  });
  
  browserAPI.runtime.sendMessage(message).catch(error => {
    console.error('Failed to notify ready:', error);
  });
}

/**
 * Handle messages from background script
 * @param {Object} message - Message object
 * @returns {Promise<Object>} Response
 */
async function handleMessage(message) {
  if (!isValidMessage(message)) {
    console.error('Invalid message received:', message);
    return { success: false, error: 'Invalid message format' };
  }

  console.log('Content script received message:', message.type);

  try {
    switch (message.type) {
      case PING_CONTENT_SCRIPT:
        return { success: true, type: PONG };

      case ANALYZE_PAGE:
        return await handleAnalyzePage();

      default:
        console.warn('Unknown message type:', message.type);
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle ANALYZE_PAGE request
 * Detects hero media on current page
 * @returns {Promise<Object>} Analysis result
 */
async function handleAnalyzePage() {
  console.log('Analyzing page for hero media...');

  try {
    // Wait for page to be fully loaded if needed
    await waitForPageReady();

    // Detect hero media, retrying while the SPA renders
    const mediaResults = await detectWithRetry();

    if (mediaResults.length === 0) {
      throwNoMediaError();
    }

    // Send detected media back to background script
    const message = createMessage(MEDIA_DETECTED, {
      url: window.location.href,
      media: mediaResults,
      timestamp: Date.now(),
    });

    await browserAPI.runtime.sendMessage(message);

    return {
      success: true,
      mediaCount: mediaResults.length,
    };
  } catch (error) {
    console.error('Analysis failed:', error);

    // Send failure notification
    const message = createMessage(ANALYSIS_FAILED, {
      url: window.location.href,
      error: error.message,
      errorType: classifyError(error),
    });

    await browserAPI.runtime.sendMessage(message);

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run detection with retries — SPA pages (e.g. Instagram) render media
 * after the load event, so a single immediate pass can miss it
 * @returns {Promise<Array>} Detected media (may be empty)
 */
async function detectWithRetry() {
  const deadline = Date.now() + CONFIG.detection.mutationObserverTimeout;

  let results = await detectHeroMedia();

  while (results.length === 0 && Date.now() < deadline) {
    await sleep(500);
    results = await detectHeroMedia();
  }

  return results;
}

/**
 * Throw the most descriptive error for a zero-result detection —
 * on Instagram the usual cause is a login wall, which deserves a
 * clearer message than "no media found"
 */
function throwNoMediaError() {
  const onInstagram = window.location.hostname.includes('instagram.com');
  const hasLoginForm = !!document.querySelector(
    'input[name="username"], input[name="password"]'
  );

  if (onInstagram && hasLoginForm) {
    throw new Error(
      'Login required — Instagram is showing a login wall on this page'
    );
  }

  throw new Error('No hero media found');
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for page to be ready for analysis
 * @returns {Promise<void>}
 */
async function waitForPageReady() {
  // If document is already loaded, return immediately
  if (document.readyState === 'complete') {
    return;
  }

  // Wait for load event
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Page load timeout'));
    }, CONFIG.detection.pageTimeout);

    window.addEventListener('load', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

/**
 * Classify error type
 * @param {Error} error - Error object
 * @returns {string} Error type constant
 */
function classifyError(error) {
  const message = error.message.toLowerCase();
  
  if (message.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT;
  }
  
  if (message.includes('login') || message.includes('unauthorized')) {
    return ERROR_TYPES.LOGIN_REQUIRED;
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_TYPES.NETWORK_ERROR;
  }
  
  if (message.includes('no hero media') || message.includes('not found')) {
    return ERROR_TYPES.NO_MEDIA_FOUND;
  }
  
  return ERROR_TYPES.UNKNOWN;
}

// Initialize on script load
init();