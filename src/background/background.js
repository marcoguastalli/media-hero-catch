/**
 * Background Script
 * 
 * Handles:
 * - Message routing between popup and content scripts
 * - Tab management for batch processing
 * - Download orchestration
 * - Progress tracking and notifications
 */

import { browserAPI } from '../shared/browser-api.js';
import {
  PROCESS_URLS,
  ANALYZE_PAGE,
  MEDIA_DETECTED,
  ANALYSIS_FAILED,
  PROGRESS_UPDATE,
  BATCH_COMPLETE,
  URL_PROCESSED,
  ERROR_OCCURRED,
  createMessage,
  isValidMessage,
  ERROR_TYPES,
  STATUS_TYPES,
} from '../shared/message-types.js';
import { CONFIG, validateDelay } from '../shared/config.js';
import { createDownloadQueue } from './download-queue.js';

// State management
let currentBatch = null;
let isProcessing = false;
let downloadQueue = null;

/**
 * Initialize background script
 */
function init() {
  console.log('Media Hero Catch: Background script initialized');
  
  // Listen for messages from popup and content scripts
  browserAPI.runtime.onMessage.addListener(handleMessage);
}

/**
 * Handle incoming messages
 * @param {Object} message - Message object
 * @param {Object} sender - Sender information
 * @returns {Promise<Object>} Response
 */
async function handleMessage(message, sender) {
  if (!isValidMessage(message)) {
    console.error('Invalid message received:', message);
    return { success: false, error: 'Invalid message format' };
  }

  console.log('Background received message:', message.type, message.data);

  try {
    switch (message.type) {
      case PROCESS_URLS:
        return await handleProcessUrls(message.data);
      
      case MEDIA_DETECTED:
        return await handleMediaDetected(message.data, sender);
      
      case ANALYSIS_FAILED:
        return await handleAnalysisFailed(message.data, sender);
      
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
 * Handle PROCESS_URLS request from popup
 * @param {Object} data - Contains urls array and delay
 * @returns {Promise<Object>} Response
 */
async function handleProcessUrls(data) {
  const { urls, delay = CONFIG.batchProcessing.defaultDelay } = data;

  if (!Array.isArray(urls) || urls.length === 0) {
    return { success: false, error: 'No URLs provided' };
  }

  if (isProcessing) {
    return { success: false, error: 'Batch already in progress' };
  }

  // Validate and deduplicate URLs
  const validatedDelay = validateDelay(delay);
  const uniqueUrls = [...new Set(urls.filter(url => isValidUrl(url)))];

  if (uniqueUrls.length === 0) {
    return { success: false, error: 'No valid URLs provided' };
  }

  // Initialize batch processing
  currentBatch = {
    urls: uniqueUrls,
    delay: validatedDelay,
    total: uniqueUrls.length,
    current: 0,
    results: [],
  };

  isProcessing = true;

  // Start processing in background (don't await)
  processBatch().catch(error => {
    console.error('Batch processing error:', error);
    isProcessing = false;
  });

  return {
    success: true,
    total: uniqueUrls.length,
    delay: validatedDelay,
  };
}

/**
 * Process batch of URLs sequentially
 */
async function processBatch() {
  console.log('Starting batch processing:', currentBatch);

  for (let i = 0; i < currentBatch.urls.length; i++) {
    const url = currentBatch.urls[i];
    currentBatch.current = i + 1;

    // Send progress update
    sendProgressUpdate(STATUS_TYPES.PROCESSING, url);

    try {
      // Process single URL
      const result = await processUrl(url);
      currentBatch.results.push(result);

      // Send completion for this URL
      sendUrlProcessed(url, result);

      // Wait before processing next URL (except for last one)
      if (i < currentBatch.urls.length - 1) {
        await sleep(currentBatch.delay * 1000);
      }
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);
      
      const errorResult = {
        url,
        status: STATUS_TYPES.FAILED,
        error: error.message,
      };
      
      currentBatch.results.push(errorResult);
      sendUrlProcessed(url, errorResult);
    }
  }

  // Batch complete
  finalizeBatch();
}

/**
 * Process a single URL
 * @param {string} url - URL to process
 * @returns {Promise<Object>} Processing result
 */
async function processUrl(url) {
  console.log('Processing URL:', url);

  let tabId = null;

  try {
    // Open URL in new background tab
    const tab = await browserAPI.tabs.create({
      url,
      active: false,
    });
    tabId = tab.id;

    // Wait a bit for content script to load
    await sleep(1000);

    // Send analyze message to content script
    const analyzeMessage = createMessage(ANALYZE_PAGE, { url });
    
    await browserAPI.tabs.sendMessage(tabId, analyzeMessage);

    // Wait for analysis to complete (handled via MEDIA_DETECTED message)
    // This will be resolved in handleMediaDetected
    const result = await waitForAnalysisResult(url, 30000); // 30 second timeout

    return result;
  } catch (error) {
    throw new Error(`Failed to process URL: ${error.message}`);
  } finally {
    // Close tab after processing
    if (tabId) {
      await sleep(CONFIG.batchProcessing.tabCloseDelay);
      try {
        await browserAPI.tabs.remove(tabId);
      } catch (error) {
        console.error('Failed to close tab:', error);
      }
    }
  }
}

/**
 * Wait for analysis result from content script
 * @param {string} url - URL being analyzed
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Object>} Analysis result
 */
function waitForAnalysisResult(url, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Analysis timeout'));
    }, timeout);

    // Store resolver for this URL
    if (!waitForAnalysisResult.resolvers) {
      waitForAnalysisResult.resolvers = new Map();
    }
    
    waitForAnalysisResult.resolvers.set(url, { resolve, reject, timeoutId });
  });
}

/**
 * Handle MEDIA_DETECTED message from content script
 * @param {Object} data - Detected media data
 * @param {Object} sender - Sender information
 * @returns {Promise<Object>} Response
 */
async function handleMediaDetected(data, sender) {
  console.log('Media detected:', data);

  const { url, media } = data;

  try {
    // Create download queue for this URL's media
    downloadQueue = createDownloadQueue();
    downloadQueue.add(media, url);

    // Process downloads
    const downloadResults = await downloadQueue.process();

    const successCount = downloadResults.filter(r => r.status === 'completed').length;
    const failedCount = downloadResults.filter(r => r.status === 'failed').length;

    console.log(`Downloads complete: ${successCount} successful, ${failedCount} failed`);

    const result = {
      url,
      status: failedCount === 0 ? STATUS_TYPES.SUCCESS : STATUS_TYPES.FAILED,
      mediaCount: media.length,
      downloadedCount: successCount,
      failedCount,
      downloads: downloadResults,
    };

    // Resolve the waiting promise
    resolveAnalysis(url, result);

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('Download error:', error);
    
    const result = {
      url,
      status: STATUS_TYPES.FAILED,
      error: error.message,
    };

    resolveAnalysis(url, result);

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle ANALYSIS_FAILED message from content script
 * @param {Object} data - Failure data
 * @param {Object} sender - Sender information
 * @returns {Promise<Object>} Response
 */
async function handleAnalysisFailed(data, sender) {
  console.log('Analysis failed:', data);

  const { url, error, errorType } = data;

  const result = {
    url,
    status: STATUS_TYPES.FAILED,
    error,
    errorType,
  };

  resolveAnalysis(url, result);

  return { success: true };
}

/**
 * Resolve analysis promise
 * @param {string} url - URL
 * @param {Object} result - Result object
 */
function resolveAnalysis(url, result) {
  if (waitForAnalysisResult.resolvers) {
    const resolver = waitForAnalysisResult.resolvers.get(url);
    if (resolver) {
      clearTimeout(resolver.timeoutId);
      resolver.resolve(result);
      waitForAnalysisResult.resolvers.delete(url);
    }
  }
}

/**
 * Send progress update to popup
 * @param {string} status - Current status
 * @param {string} currentUrl - URL being processed
 */
function sendProgressUpdate(status, currentUrl) {
  const message = createMessage(PROGRESS_UPDATE, {
    current: currentBatch.current,
    total: currentBatch.total,
    status,
    url: currentUrl,
  });

  browserAPI.runtime.sendMessage(message).catch(() => {
    // Popup might be closed, ignore error
  });
}

/**
 * Send URL processed notification
 * @param {string} url - Processed URL
 * @param {Object} result - Processing result
 */
function sendUrlProcessed(url, result) {
  const message = createMessage(URL_PROCESSED, {
    url,
    result,
  });

  browserAPI.runtime.sendMessage(message).catch(() => {
    // Popup might be closed, ignore error
  });
}

/**
 * Finalize batch processing
 */
function finalizeBatch() {
  const successful = currentBatch.results.filter(
    r => r.status === STATUS_TYPES.SUCCESS
  ).length;
  
  const failed = currentBatch.results.filter(
    r => r.status === STATUS_TYPES.FAILED
  ).length;

  // Calculate total files downloaded
  const totalDownloaded = currentBatch.results.reduce((sum, r) => {
    return sum + (r.downloadedCount || 0);
  }, 0);

  // Send completion message
  const message = createMessage(BATCH_COMPLETE, {
    total: currentBatch.total,
    successful,
    failed,
    totalDownloaded,
    results: currentBatch.results,
  });

  browserAPI.runtime.sendMessage(message).catch(() => {
    // Popup might be closed, ignore error
  });

  // Show browser notification
  browserAPI.notifications.create({
    type: 'basic',
    iconUrl: '/icons/icon-48.png',
    title: 'Media Hero Catch',
    message: `Batch complete: ${totalDownloaded} files downloaded from ${successful} URLs (${failed} failed)`,
  });

  // Reset state
  currentBatch = null;
  isProcessing = false;
  downloadQueue = null;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize on script load
init();