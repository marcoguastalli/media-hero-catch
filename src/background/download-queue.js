/**
 * Download Queue Manager
 * 
 * Manages downloading multiple files sequentially with:
 * - Queue management
 * - Retry logic with exponential backoff
 * - Progress tracking
 * - Error handling
 */

import { browserAPI } from '../shared/browser-api.js';
import { CONFIG } from '../shared/config.js';

/**
 * Download queue class
 */
export class DownloadQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.currentDownload = null;
    this.results = [];
  }

  /**
   * Add media items to download queue
   * @param {Array} mediaItems - Array of media objects
   * @param {string} sourceUrl - Original page URL
   */
  add(mediaItems, sourceUrl) {
    for (const media of mediaItems) {
      this.queue.push({
        media,
        sourceUrl,
        retryCount: 0,
        status: 'pending',
      });
    }
  }

  /**
   * Start processing the queue
   * @returns {Promise<Array>} Array of download results
   */
  async process() {
    if (this.isProcessing) {
      throw new Error('Queue is already being processed');
    }

    this.isProcessing = true;
    this.results = [];

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      this.currentDownload = item;

      try {
        const result = await this.downloadWithRetry(item);
        this.results.push(result);
      } catch (error) {
        console.error('Download failed after retries:', error);
        this.results.push({
          media: item.media,
          status: 'failed',
          error: error.message,
        });
      }

      this.currentDownload = null;
    }

    this.isProcessing = false;
    return this.results;
  }

  /**
   * Download a single item with retry logic
   * @param {Object} item - Queue item
   * @returns {Promise<Object>} Download result
   */
  async downloadWithRetry(item) {
    const { media } = item;
    const maxRetries = CONFIG.downloads.retryAttempts;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        item.retryCount = attempt;
        item.status = 'downloading';

        const downloadId = await this.downloadFile(media.url, media.filename);

        // Wait for download to complete
        const success = await this.waitForDownload(downloadId);

        if (success) {
          item.status = 'completed';
          return {
            media,
            status: 'completed',
            downloadId,
          };
        } else {
          throw new Error('Download did not complete successfully');
        }
      } catch (error) {
        console.error(`Download attempt ${attempt + 1} failed:`, error);

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = CONFIG.downloads.retryDelays[attempt] || 2000;
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        } else {
          // Last attempt failed
          throw error;
        }
      }
    }
  }

  /**
   * Download a file using browser.downloads API
   * @param {string} url - File URL
   * @param {string} filename - Desired filename
   * @returns {Promise<number>} Download ID
   */
  async downloadFile(url, filename) {
    console.log('Downloading:', url, 'as', filename);

    try {
      const downloadId = await browserAPI.downloads.download({
        url,
        filename, // Relative to Downloads folder
        conflictAction: CONFIG.downloads.conflictAction,
        saveAs: false, // Don't prompt user
      });

      console.log('Download started with ID:', downloadId);
      return downloadId;
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error(`Failed to start download: ${error.message}`);
    }
  }

  /**
   * Wait for a download to complete
   * @param {number} downloadId - Download ID
   * @returns {Promise<boolean>} True if successful
   */
  async waitForDownload(downloadId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Download timeout'));
      }, 60000); // 60 second timeout

      // Listen for download state changes
      const listener = delta => {
        if (delta.id === downloadId) {
          if (delta.state && delta.state.current === 'complete') {
            clearTimeout(timeout);
            browserAPI.downloads.onChanged.removeListener(listener);
            resolve(true);
          } else if (delta.error) {
            clearTimeout(timeout);
            browserAPI.downloads.onChanged.removeListener(listener);
            reject(new Error(delta.error.current));
          }
        }
      };

      browserAPI.downloads.onChanged.addListener(listener);
    });
  }

  /**
   * Get current queue status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.queue.length,
      currentDownload: this.currentDownload,
      completedCount: this.results.filter(r => r.status === 'completed').length,
      failedCount: this.results.filter(r => r.status === 'failed').length,
    };
  }

  /**
   * Clear the queue and results
   */
  clear() {
    this.queue = [];
    this.results = [];
    this.currentDownload = null;
    this.isProcessing = false;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a new download queue instance
 * @returns {DownloadQueue} New queue instance
 */
export function createDownloadQueue() {
  return new DownloadQueue();
}