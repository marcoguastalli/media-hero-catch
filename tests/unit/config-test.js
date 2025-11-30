/**
 * Unit tests for config.js
 */

import { CONFIG, getConfig, validateDelay } from '../../src/shared/config.js';

describe('Configuration', () => {
  describe('CONFIG object', () => {
    test('should have batch processing settings', () => {
      expect(CONFIG.batchProcessing).toBeDefined();
      expect(CONFIG.batchProcessing.defaultDelay).toBe(2);
      expect(CONFIG.batchProcessing.maxDelay).toBe(30);
      expect(CONFIG.batchProcessing.minDelay).toBe(0);
    });

    test('should have detection settings', () => {
      expect(CONFIG.detection).toBeDefined();
      expect(CONFIG.detection.minHeroSize).toBe(200);
      expect(CONFIG.detection.iconThreshold).toBe(100);
    });

    test('should have download settings', () => {
      expect(CONFIG.downloads).toBeDefined();
      expect(CONFIG.downloads.retryAttempts).toBe(3);
      expect(CONFIG.downloads.retryDelays).toEqual([2000, 4000, 8000]);
    });

    test('should have Instagram settings', () => {
      expect(CONFIG.instagram).toBeDefined();
      expect(CONFIG.instagram.domain).toBe('instagram.com');
    });
  });

  describe('getConfig()', () => {
    test('should retrieve nested config value by path', () => {
      expect(getConfig('batchProcessing.defaultDelay')).toBe(2);
      expect(getConfig('detection.minHeroSize')).toBe(200);
      expect(getConfig('instagram.domain')).toBe('instagram.com');
    });

    test('should return undefined for invalid path', () => {
      expect(getConfig('nonexistent.path')).toBeUndefined();
      expect(getConfig('batchProcessing.invalid')).toBeUndefined();
    });

    test('should handle single-level path', () => {
      expect(getConfig('batchProcessing')).toBeDefined();
      expect(getConfig('detection')).toBeDefined();
    });

    test('should handle deeply nested path', () => {
      expect(getConfig('downloads.retryDelays')).toEqual([2000, 4000, 8000]);
    });
  });

  describe('validateDelay()', () => {
    test('should return valid delay unchanged', () => {
      expect(validateDelay(5)).toBe(5);
      expect(validateDelay(10)).toBe(10);
      expect(validateDelay(0)).toBe(0);
    });

    test('should clamp delay to minimum value', () => {
      expect(validateDelay(-5)).toBe(0);
      expect(validateDelay(-1)).toBe(0);
    });

    test('should clamp delay to maximum value', () => {
      expect(validateDelay(50)).toBe(30);
      expect(validateDelay(100)).toBe(30);
    });

    test('should return default for invalid input', () => {
      expect(validateDelay('invalid')).toBe(2);
      expect(validateDelay(null)).toBe(2);
      expect(validateDelay(undefined)).toBe(2);
      expect(validateDelay(NaN)).toBe(2);
    });

    test('should handle edge cases', () => {
      expect(validateDelay(0)).toBe(0);
      expect(validateDelay(30)).toBe(30);
      expect(validateDelay(2.5)).toBe(2.5);
    });
  });
});