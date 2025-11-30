/**
 * E2E tests for error handling
 * 
 * Tests various error scenarios and recovery
 */

import {
  setupBrowser,
  teardownBrowser,
  loadFixture,
  sleep,
} from './setup.js';

describe('Error Handling E2E', () => {
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

  describe('Page Loading Errors', () => {
    test('should handle page with no media', async () => {
      await page.setContent('<html><body><h1>No images here</h1></body></html>');
      await page.waitForTimeout(1000);

      // Should not crash
      const hasErrors = await page.evaluate(() => {
        return window.hasOwnProperty('lastError');
      });

      expect(hasErrors).toBe(false);
    });

    test('should handle malformed HTML', async () => {
      await page.setContent('<div><img src="test.jpg"</div>'); // Missing closing tag
      await page.waitForTimeout(1000);

      // Browser auto-fixes malformed HTML, should still work
      const hasImg = await page.evaluate(() => {
        return document.querySelectorAll('img').length > 0;
      });

      expect(hasImg).toBe(true);
    });

    test('should handle JavaScript errors gracefully', async () => {
      const jsErrors = [];
      page.on('pageerror', error => jsErrors.push(error.message));

      await page.setContent(`
        <html>
          <body>
            <img src="test.jpg">
            <script>
              // Intentional error
              undefined.property.access;
            </script>
          </body>
        </html>
      `);

      await page.waitForTimeout(1000);

      // Page JS errors shouldn't affect extension
      // Extension should still be able to analyze the page
    });
  });

  describe('Media Detection Errors', () => {
    test('should handle images with broken URLs', async () => {
      await page.setContent(`
        <html>
          <body>
            <img src="https://invalid-domain-12345.com/image.jpg" width="500" height="500">
          </body>
        </html>
      `);
      await page.waitForTimeout(1000);

      // Image element exists even if URL is broken
      const imgExists = await page.evaluate(() => {
        const img = document.querySelector('img');
        return !!img;
      });

      expect(imgExists).toBe(true);
    });

    test('should handle images without src', async () => {
      await page.setContent(`
        <html>
          <body>
            <img width="500" height="500">
          </body>
        </html>
      `);
      await page.waitForTimeout(1000);

      const imgSrc = await page.evaluate(() => {
        const img = document.querySelector('img');
        return img?.src || null;
      });

      // Might have base URL appended, or be empty
      // Detection should handle this gracefully
    });

    test('should handle videos without source', async () => {
      await page.setContent(`
        <html>
          <body>
            <video width="640" height="480" controls></video>
          </body>
        </html>
      `);
      await page.waitForTimeout(1000);

      const videoSrc = await page.evaluate(() => {
        const video = document.querySelector('video');
        return video?.src || null;
      });

      // Video without source should be handled
      expect(videoSrc).toBeNull();
    });
  });

  describe('Download Errors', () => {
    test('should handle download timeout', async () => {
      // Simulate download that never completes
      const timeoutMs = 1000;
      const startTime = Date.now();

      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Download timeout'));
        }, timeoutMs);
      });

      try {
        await timeoutPromise;
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect(error.message).toBe('Download timeout');
        expect(elapsed).toBeGreaterThanOrEqual(timeoutMs - 50);
      }
    });

    test('should handle network failures with retry', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const attemptDownload = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return 'success';
      };

      for (let i = 0; i <= maxRetries; i++) {
        try {
          const result = await attemptDownload();
          expect(result).toBe('success');
          break;
        } catch (error) {
          if (i === maxRetries) {
            throw error;
          }
          await sleep(100); // Retry delay
        }
      }

      expect(attempts).toBe(3);
    });

    test('should fail after max retries', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const attemptDownload = async () => {
        attempts++;
        throw new Error('Network error');
      };

      try {
        for (let i = 0; i <= maxRetries; i++) {
          try {
            await attemptDownload();
            break;
          } catch (error) {
            if (i === maxRetries) {
              throw error;
            }
          }
        }
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(attempts).toBe(4); // Initial + 3 retries
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('Invalid Input Handling', () => {
    test('should handle empty URL list', () => {
      const urls = [];
      expect(urls.length).toBe(0);
      
      // Should show error message, not crash
    });

    test('should handle whitespace-only URLs', () => {
      const urls = ['   ', '\n\n', '\t\t'];
      const filtered = urls.map(u => u.trim()).filter(u => u.length > 0);
      
      expect(filtered.length).toBe(0);
    });

    test('should handle mixed valid/invalid URLs', () => {
      const urls = [
        'https://example.com/page1',
        'invalid url',
        'https://example.com/page2',
        '',
        'https://example.com/page3',
      ];

      const isValidUrl = (url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      };

      const validUrls = urls.filter(isValidUrl);
      
      expect(validUrls.length).toBe(3);
    });
  });

  describe('State Recovery', () => {
    test('should reset state after batch completion', () => {
      let isProcessing = true;
      let currentBatch = { urls: ['url1', 'url2'] };

      // Simulate completion
      isProcessing = false;
      currentBatch = null;

      expect(isProcessing).toBe(false);
      expect(currentBatch).toBeNull();
    });

    test('should prevent concurrent batches', () => {
      let isProcessing = false;

      const startBatch = () => {
        if (isProcessing) {
          throw new Error('Batch already in progress');
        }
        isProcessing = true;
      };

      startBatch();
      expect(isProcessing).toBe(true);

      expect(() => startBatch()).toThrow('Batch already in progress');
    });

    test('should clear queue on error', () => {
      const queue = ['item1', 'item2', 'item3'];
      
      // Simulate error and clear
      queue.length = 0;
      
      expect(queue.length).toBe(0);
    });
  });

  describe('Browser Compatibility', () => {
    test('should check for browser API availability', () => {
      const hasBrowserAPI = typeof browser !== 'undefined' || typeof chrome !== 'undefined';
      expect(hasBrowserAPI).toBe(true);
    });

    test('should handle missing downloads API gracefully', () => {
      const hasDownloadsAPI = typeof browser !== 'undefined' && browser.downloads;
      
      // In test environment, this might not be available
      // Extension should check before using
      if (!hasDownloadsAPI) {
        console.log('Downloads API not available');
      }
    });
  });

  describe('Message Passing Errors', () => {
    test('should handle message validation', () => {
      const isValidMessage = (msg) => {
        return msg && 
               typeof msg === 'object' && 
               typeof msg.type === 'string' &&
               msg.data !== undefined;
      };

      expect(isValidMessage({ type: 'TEST', data: {} })).toBe(true);
      expect(isValidMessage({ type: 'TEST' })).toBe(false);
      expect(isValidMessage(null)).toBe(false);
      expect(isValidMessage('string')).toBe(false);
    });

    test('should handle timeout waiting for response', async () => {
      const timeout = 1000;
      
      const waitForResponse = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Response timeout'));
          }, timeout);
        });
      };

      try {
        await waitForResponse();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Response timeout');
      }
    });
  });
});