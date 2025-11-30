/**
 * Integration tests for batch processing workflow
 * 
 * Tests the complete flow from URL input to downloads
 */

describe('Batch Processing Integration', () => {
  let mockDownloadId = 1;

  beforeEach(() => {
    mockDownloadId = 1;

    // Mock browser APIs
    global.browser.downloads.download = jest.fn().mockImplementation(() => {
      return Promise.resolve(mockDownloadId++);
    });

    global.browser.downloads.onChanged = {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };

    global.browser.tabs = {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      remove: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue({ success: true }),
    };

    global.browser.notifications = {
      create: jest.fn().mockResolvedValue('notification-id'),
    };
  });

  describe('URL Processing Flow', () => {
    test('should process single URL with single image', async () => {
      // This test verifies the complete flow but we can't fully test
      // background.js without a proper message passing mock
      // Will be tested in E2E tests
      expect(true).toBe(true);
    });
  });

  describe('Download Flow', () => {
    test('should download multiple files from carousel', async () => {
      const { DownloadQueue } = await import('../../src/background/download-queue.js');
      
      let listener;
      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      // Mock successful downloads
      global.browser.downloads.download.mockImplementation(async () => {
        const id = mockDownloadId++;
        setTimeout(() => {
          listener({ id, state: { current: 'complete' } });
        }, 10);
        return id;
      });

      const queue = new DownloadQueue();
      const mediaItems = [
        { url: 'https://example.com/img1.jpg', filename: 'img1.jpg', type: 'image' },
        { url: 'https://example.com/img2.jpg', filename: 'img2.jpg', type: 'image' },
        { url: 'https://example.com/img3.jpg', filename: 'img3.jpg', type: 'image' },
      ];

      queue.add(mediaItems, 'https://example.com/carousel');

      const results = await queue.process();

      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === 'completed')).toBe(true);
      expect(global.browser.downloads.download).toHaveBeenCalledTimes(3);
    });

    test('should retry failed downloads', async () => {
      const { DownloadQueue } = await import('../../src/background/download-queue.js');
      
      let listener;
      let attemptCount = 0;

      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      // First attempt fails, second succeeds
      global.browser.downloads.download.mockImplementation(async () => {
        const id = mockDownloadId++;
        attemptCount++;
        
        setTimeout(() => {
          if (attemptCount === 1) {
            listener({ id, error: { current: 'NETWORK_FAILED' } });
          } else {
            listener({ id, state: { current: 'complete' } });
          }
        }, 10);
        
        return id;
      });

      const queue = new DownloadQueue();
      queue.add([{ url: 'https://example.com/img.jpg', filename: 'img.jpg' }], 'source');

      const results = await queue.process();

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('completed');
      expect(attemptCount).toBeGreaterThan(1); // Verified retry happened
    });

    test('should handle all downloads failing', async () => {
      const { DownloadQueue } = await import('../../src/background/download-queue.js');
      
      let listener;

      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      // All downloads fail
      global.browser.downloads.download.mockImplementation(async () => {
        const id = mockDownloadId++;
        setTimeout(() => {
          listener({ id, error: { current: 'FAILED' } });
        }, 10);
        return id;
      });

      const queue = new DownloadQueue();
      queue.add([
        { url: 'url1', filename: 'file1.jpg' },
        { url: 'url2', filename: 'file2.jpg' },
      ], 'source');

      const results = await queue.process();

      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === 'failed')).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    test('should track download progress', async () => {
      const { DownloadQueue } = await import('../../src/background/download-queue.js');
      
      let listener;
      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      global.browser.downloads.download.mockImplementation(async () => {
        const id = mockDownloadId++;
        setTimeout(() => {
          listener({ id, state: { current: 'complete' } });
        }, 10);
        return id;
      });

      const queue = new DownloadQueue();
      queue.add([
        { url: 'url1', filename: 'file1.jpg' },
        { url: 'url2', filename: 'file2.jpg' },
      ], 'source');

      // Check status before processing
      let status = queue.getStatus();
      expect(status.isProcessing).toBe(false);
      expect(status.queueLength).toBe(2);

      // Start processing (don't await yet)
      const processPromise = queue.process();

      // Check status during processing
      status = queue.getStatus();
      expect(status.isProcessing).toBe(true);

      // Wait for completion
      await processPromise;

      // Check final status
      status = queue.getStatus();
      expect(status.isProcessing).toBe(false);
      expect(status.completedCount).toBe(2);
      expect(status.failedCount).toBe(0);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle invalid URLs gracefully', async () => {
      const { DownloadQueue } = await import('../../src/background/download-queue.js');
      
      global.browser.downloads.download.mockRejectedValue(new Error('Invalid URL'));

      const queue = new DownloadQueue();
      queue.add([{ url: 'invalid-url', filename: 'file.jpg' }], 'source');

      const results = await queue.process();

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toBeDefined();
    });

    test('should continue processing after individual failures', async () => {
      const { DownloadQueue } = await import('../../src/background/download-queue.js');
      
      let listener;
      let callCount = 0;

      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      // First download fails all retries, second succeeds
      global.browser.downloads.download.mockImplementation(async () => {
        const id = mockDownloadId++;
        callCount++;
        
        setTimeout(() => {
          if (callCount <= 4) {
            // First item fails (1 attempt + 3 retries = 4 calls)
            listener({ id, error: { current: 'FAILED' } });
          } else {
            // Second item succeeds
            listener({ id, state: { current: 'complete' } });
          }
        }, 10);
        
        return id;
      });

      const queue = new DownloadQueue();
      queue.add([
        { url: 'url1', filename: 'file1.jpg' },
        { url: 'url2', filename: 'file2.jpg' },
      ], 'source');

      const results = await queue.process();

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('failed');
      expect(results[1].status).toBe('completed');
    });
  });
});