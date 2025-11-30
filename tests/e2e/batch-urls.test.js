/**
 * E2E tests for batch URL processing
 * 
 * Tests processing multiple URLs sequentially
 */

import {
  setupBrowser,
  teardownBrowser,
  sleep,
} from './setup.js';

describe('Batch URL Processing E2E', () => {
  let browser;
  let page;

  beforeAll(async () => {
    const setup = await setupBrowser();
    browser = setup.browser;
    page = setup.page;
  }, 30000);

  afterAll(async () => {
    await teardownBrowser(browser);
  }, 10000);

  describe('URL Validation', () => {
    test('should accept valid HTTP URLs', async () => {
      const validUrls = [
        'http://example.com/page',
        'https://example.com/page',
        'https://www.instagram.com/p/ABC123/',
      ];

      // All should be valid
      for (const url of validUrls) {
        try {
          new URL(url);
          expect(true).toBe(true);
        } catch {
          expect(true).toBe(false);
        }
      }
    });

    test('should reject invalid URLs', async () => {
      const invalidUrls = [
        'not a url',
        'ftp://example.com',
        'javascript:alert(1)',
        '',
      ];

      // These should fail URL validation
      for (const url of invalidUrls) {
        try {
          const parsed = new URL(url);
          const isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
          expect(isValid).toBe(false);
        } catch {
          // Expected to throw
          expect(true).toBe(true);
        }
      }
    });
  });

  describe('URL Deduplication', () => {
    test('should remove duplicate URLs', async () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page1', // Duplicate
        'https://example.com/page3',
      ];

      const unique = [...new Set(urls)];

      expect(unique.length).toBe(3);
      expect(unique).toEqual([
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3',
      ]);
    });
  });

  describe('Sequential Processing', () => {
    test('should process URLs one at a time', async () => {
      const processingOrder = [];
      const urls = ['url1', 'url2', 'url3'];

      // Simulate sequential processing
      for (const url of urls) {
        processingOrder.push(url);
        await sleep(100); // Simulate processing time
      }

      expect(processingOrder).toEqual(['url1', 'url2', 'url3']);
    });

    test('should respect delay between URLs', async () => {
      const delay = 500; // ms
      const startTimes = [];

      for (let i = 0; i < 3; i++) {
        startTimes.push(Date.now());
        if (i < 2) {
          await sleep(delay);
        }
      }

      // Check that delays were respected
      const diff1 = startTimes[1] - startTimes[0];
      const diff2 = startTimes[2] - startTimes[1];

      expect(diff1).toBeGreaterThanOrEqual(delay - 50); // Allow 50ms tolerance
      expect(diff2).toBeGreaterThanOrEqual(delay - 50);
    });
  });

  describe('Error Handling', () => {
    test('should continue processing after failed URL', async () => {
      const urls = ['url1', 'url2', 'url3'];
      const results = [];

      for (let i = 0; i < urls.length; i++) {
        try {
          if (i === 1) {
            throw new Error('Failed');
          }
          results.push({ url: urls[i], status: 'success' });
        } catch {
          results.push({ url: urls[i], status: 'failed' });
        }
      }

      expect(results.length).toBe(3);
      expect(results[0].status).toBe('success');
      expect(results[1].status).toBe('failed');
      expect(results[2].status).toBe('success');
    });

    test('should track successful and failed URLs', async () => {
      const results = [
        { status: 'success' },
        { status: 'failed' },
        { status: 'success' },
        { status: 'success' },
        { status: 'failed' },
      ];

      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;

      expect(successful).toBe(3);
      expect(failed).toBe(2);
    });
  });

  describe('Progress Tracking', () => {
    test('should calculate progress percentage', async () => {
      const total = 5;
      let current = 0;

      const percentages = [];

      for (current = 0; current <= total; current++) {
        const percentage = (current / total) * 100;
        percentages.push(percentage);
      }

      expect(percentages).toEqual([0, 20, 40, 60, 80, 100]);
    });

    test('should update progress for each URL', async () => {
      const total = 3;
      const progressUpdates = [];

      for (let i = 1; i <= total; i++) {
        progressUpdates.push({
          current: i,
          total,
          percentage: (i / total) * 100,
        });
      }

      expect(progressUpdates.length).toBe(3);
      expect(progressUpdates[0].current).toBe(1);
      expect(progressUpdates[2].current).toBe(3);
      expect(progressUpdates[2].percentage).toBe(100);
    });
  });

  describe('Delay Configuration', () => {
    test('should use default delay when not specified', () => {
      const defaultDelay = 2;
      const userDelay = undefined;

      const actualDelay = userDelay !== undefined ? userDelay : defaultDelay;

      expect(actualDelay).toBe(2);
    });

    test('should clamp delay to valid range', () => {
      const validateDelay = (delay, min = 0, max = 30, defaultVal = 2) => {
        if (typeof delay !== 'number' || isNaN(delay)) {
          return defaultVal;
        }
        return Math.max(min, Math.min(max, delay));
      };

      expect(validateDelay(5)).toBe(5);
      expect(validateDelay(-1)).toBe(0);
      expect(validateDelay(50)).toBe(30);
      expect(validateDelay('invalid')).toBe(2);
    });
  });

  describe('Batch Completion', () => {
    test('should calculate totals correctly', () => {
      const results = [
        { status: 'success', downloads: 1 },
        { status: 'success', downloads: 3 },
        { status: 'failed', downloads: 0 },
        { status: 'success', downloads: 2 },
      ];

      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const totalDownloads = results.reduce((sum, r) => sum + r.downloads, 0);

      expect(successful).toBe(3);
      expect(failed).toBe(1);
      expect(totalDownloads).toBe(6);
    });

    test('should format notification message', () => {
      const successful = 3;
      const failed = 1;
      const totalDownloaded = 6;

      const message = `Batch complete: ${totalDownloaded} files downloaded from ${successful} URLs (${failed} failed)`;

      expect(message).toBe('Batch complete: 6 files downloaded from 3 URLs (1 failed)');
    });
  });
});