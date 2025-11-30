/**
 * Popup UI Script
 * 
 * Handles user interaction and communicates with background script
 */

import { browserAPI } from '../shared/browser-api.js';
import {
  PROCESS_URLS,
  PROGRESS_UPDATE,
  BATCH_COMPLETE,
  URL_PROCESSED,
  createMessage,
  STATUS_TYPES,
} from '../shared/message-types.js';
import { CONFIG } from '../shared/config.js';

// DOM elements
const urlsTextarea = document.getElementById('urls');
const delayInput = document.getElementById('delay');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const statusSection = document.getElementById('statusSection');
const resultsSection = document.getElementById('resultsSection');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const urlList = document.getElementById('urlList');
const successCount = document.getElementById('successCount');
const failedCount = document.getElementById('failedCount');
const newBatchBtn = document.getElementById('newBatchBtn');

// State
let isProcessing = false;
let currentBatch = null;

/**
 * Initialize popup
 */
function init() {
  console.log('Popup initialized');

  // Event listeners
  processBtn.addEventListener('click', handleProcess);
  clearBtn.addEventListener('click', handleClear);
  newBatchBtn.addEventListener('click', handleNewBatch);

  // Listen for messages from background script
  browserAPI.runtime.onMessage.addListener(handleMessage);

  // Load saved delay value if any
  loadSettings();
}

/**
 * Load saved settings
 */
function loadSettings() {
  const savedDelay = localStorage.getItem('batch-delay');
  if (savedDelay) {
    delayInput.value = savedDelay;
  }
}

/**
 * Handle Process button click
 */
async function handleProcess() {
  const urlsText = urlsTextarea.value.trim();
  
  if (!urlsText) {
    alert('Please paste at least one URL');
    return;
  }

  // Parse URLs (one per line)
  const urls = urlsText
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);

  if (urls.length === 0) {
    alert('No valid URLs found');
    return;
  }

  const delay = parseInt(delayInput.value, 10) || CONFIG.batchProcessing.defaultDelay;

  // Save delay setting
  localStorage.setItem('batch-delay', delay.toString());

  // Send to background script
  const message = createMessage(PROCESS_URLS, { urls, delay });

  try {
    const response = await browserAPI.runtime.sendMessage(message);

    if (response.success) {
      startProcessing(response.total, delay);
    } else {
      alert(`Error: ${response.error}`);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to start batch processing');
  }
}

/**
 * Handle Clear button click
 */
function handleClear() {
  urlsTextarea.value = '';
  urlsTextarea.focus();
}

/**
 * Handle New Batch button click
 */
function handleNewBatch() {
  // Reset UI
  resultsSection.style.display = 'none';
  statusSection.style.display = 'none';
  urlsTextarea.value = '';
  urlsTextarea.focus();
  isProcessing = false;
  currentBatch = null;
}

/**
 * Start processing UI
 * @param {number} total - Total URLs to process
 * @param {number} delay - Delay between URLs
 */
function startProcessing(total, delay) {
  isProcessing = true;
  currentBatch = {
    total,
    current: 0,
    urlItems: new Map(),
  };

  // Hide input section, show status section
  statusSection.style.display = 'block';
  resultsSection.style.display = 'none';

  // Disable process button
  processBtn.disabled = true;

  // Reset progress
  progressText.textContent = `0/${total}`;
  progressFill.style.width = '0%';
  urlList.innerHTML = '';
}

/**
 * Handle messages from background script
 * @param {Object} message - Message object
 */
function handleMessage(message) {
  console.log('Popup received message:', message.type);

  switch (message.type) {
    case PROGRESS_UPDATE:
      handleProgressUpdate(message.data);
      break;

    case URL_PROCESSED:
      handleUrlProcessed(message.data);
      break;

    case BATCH_COMPLETE:
      handleBatchComplete(message.data);
      break;
  }
}

/**
 * Handle progress update
 * @param {Object} data - Progress data
 */
function handleProgressUpdate(data) {
  const { current, total, status, url } = data;

  // Update progress bar
  const percentage = (current / total) * 100;
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `${current}/${total}`;

  // Add or update URL item
  let urlItem = currentBatch.urlItems.get(url);
  
  if (!urlItem) {
    urlItem = createUrlItem(url, status);
    currentBatch.urlItems.set(url, urlItem);
    urlList.appendChild(urlItem);
  } else {
    updateUrlItem(urlItem, status);
  }

  // Scroll to bottom
  urlList.scrollTop = urlList.scrollHeight;
}

/**
 * Handle URL processed
 * @param {Object} data - Processed URL data
 */
function handleUrlProcessed(data) {
  const { url, result } = data;
  
  const urlItem = currentBatch.urlItems.get(url);
  if (urlItem) {
    updateUrlItem(urlItem, result.status, result);
  }
}

/**
 * Handle batch complete
 * @param {Object} data - Completion data
 */
function handleBatchComplete(data) {
  const { successful, failed, totalDownloaded } = data;

  // Hide status section, show results section
  statusSection.style.display = 'none';
  resultsSection.style.display = 'block';

  // Update results
  successCount.textContent = successful;
  failedCount.textContent = failed;

  // Update results section to show files downloaded
  const resultsSection = document.getElementById('resultsSection');
  const existingMessage = resultsSection.querySelector('.download-summary');
  
  if (existingMessage) {
    existingMessage.remove();
  }

  if (totalDownloaded > 0) {
    const downloadMessage = document.createElement('p');
    downloadMessage.className = 'download-summary';
    downloadMessage.style.cssText = 'text-align: center; color: #666; margin: 10px 0;';
    downloadMessage.textContent = `${totalDownloaded} file${totalDownloaded !== 1 ? 's' : ''} downloaded`;
    resultsSection.querySelector('h3').after(downloadMessage);
  }

  // Re-enable process button
  processBtn.disabled = false;
  isProcessing = false;
}

/**
 * Create URL item element
 * @param {string} url - URL
 * @param {string} status - Status type
 * @returns {HTMLElement} URL item element
 */
function createUrlItem(url, status) {
  const item = document.createElement('div');
  item.className = `url-item ${status}`;
  
  const icon = document.createElement('span');
  icon.className = 'status-icon';
  icon.textContent = getStatusIcon(status);
  
  const text = document.createElement('span');
  text.className = 'url-text';
  text.textContent = url;
  text.title = url; // Show full URL on hover
  
  item.appendChild(icon);
  item.appendChild(text);
  
  return item;
}

/**
 * Update URL item status
 * @param {HTMLElement} item - URL item element
 * @param {string} status - New status
 * @param {Object} result - Optional result data
 */
function updateUrlItem(item, status, result) {
  item.className = `url-item ${status}`;
  const icon = item.querySelector('.status-icon');
  icon.textContent = getStatusIcon(status);
  
  // Add download count if available
  if (result && result.downloadedCount > 0) {
    const existingCount = item.querySelector('.download-count');
    if (existingCount) {
      existingCount.remove();
    }
    
    const countSpan = document.createElement('span');
    countSpan.className = 'download-count';
    countSpan.style.cssText = 'margin-left: 8px; font-size: 11px; color: #666;';
    countSpan.textContent = `(${result.downloadedCount} file${result.downloadedCount !== 1 ? 's' : ''})`;
    item.appendChild(countSpan);
  }
}

/**
 * Get status icon
 * @param {string} status - Status type
 * @returns {string} Icon emoji
 */
function getStatusIcon(status) {
  switch (status) {
    case STATUS_TYPES.PENDING:
      return '⏱';
    case STATUS_TYPES.PROCESSING:
      return '⏳';
    case STATUS_TYPES.SUCCESS:
      return '✓';
    case STATUS_TYPES.FAILED:
      return '✗';
    case STATUS_TYPES.SKIPPED:
      return '⊘';
    default:
      return '◯';
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);