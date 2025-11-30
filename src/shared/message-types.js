/**
 * Message Types for Extension Communication
 * 
 * Defines all message types used for communication between:
 * - Popup UI ↔ Background Script
 * - Background Script ↔ Content Script
 */

// Popup → Background
export const PROCESS_URLS = 'PROCESS_URLS';
export const GET_SETTINGS = 'GET_SETTINGS';
export const UPDATE_SETTINGS = 'UPDATE_SETTINGS';
export const CANCEL_BATCH = 'CANCEL_BATCH';

// Background → Content
export const ANALYZE_PAGE = 'ANALYZE_PAGE';
export const PING_CONTENT_SCRIPT = 'PING_CONTENT_SCRIPT';

// Content → Background
export const MEDIA_DETECTED = 'MEDIA_DETECTED';
export const ANALYSIS_FAILED = 'ANALYSIS_FAILED';
export const CONTENT_SCRIPT_READY = 'CONTENT_SCRIPT_READY';

// Background → Popup
export const PROGRESS_UPDATE = 'PROGRESS_UPDATE';
export const BATCH_COMPLETE = 'BATCH_COMPLETE';
export const BATCH_STARTED = 'BATCH_STARTED';
export const URL_PROCESSED = 'URL_PROCESSED';
export const ERROR_OCCURRED = 'ERROR_OCCURRED';

// Bidirectional
export const PING = 'PING';
export const PONG = 'PONG';

/**
 * Create a message object with consistent structure
 * @param {string} type - Message type constant
 * @param {Object} data - Message payload
 * @returns {Object} Formatted message
 */
export const createMessage = (type, data = {}) => ({
  type,
  data,
  timestamp: Date.now(),
});

/**
 * Validate message structure
 * @param {Object} message - Message to validate
 * @returns {boolean} True if valid message structure
 */
export const isValidMessage = message =>
  message &&
  typeof message === 'object' &&
  typeof message.type === 'string' &&
  message.data !== undefined;

/**
 * Error types for ERROR_OCCURRED messages
 */
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  NO_MEDIA_FOUND: 'NO_MEDIA_FOUND',
  LOGIN_REQUIRED: 'LOGIN_REQUIRED',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Status types for progress updates
 */
export const STATUS_TYPES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};