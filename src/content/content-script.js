/**
 * Content Script
 * 
 * Injected into web pages to analyze DOM and detect hero media.
 * Communicates findings back to background script.
 */

import { browserAPI } from '../shared/browser-api.js';
import {
  ANALYZE_PAGE,
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

    // Detect hero media using appropriate detector
    const mediaResults = await detectHeroMedia();

    if (mediaResults.length === 0) {
      throw new Error('No hero media found');
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