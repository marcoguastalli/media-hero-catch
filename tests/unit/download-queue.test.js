/**
 * Unit tests for download-queue.js
 */

import { DownloadQueue, createDownloadQueue } from '../../src/background/download-queue.js';

describe('Download Queue', () => {
  let queue;
  let mockDownloadId = 1;

  beforeEach(() => {
    queue = new DownloadQueue();
    mockDownloadId = 1;

    // Mock browser.downloads API
    global.browser.downloads.download = jest.fn().mockImplementation(() => {
      return Promise.resolve(mockDownloadId++);
    });

    global.browser.downloads.onChanged = {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  });

  describe('Constructor', () => {
    test('should initialize with empty queue', () => {
      expect(queue.queue).toEqual([]);
      expect(queue.isProcessing).toBe(false);
      expect(queue.currentDownload).toBeNull();
      expect(queue.results).toEqual([]);
    });
  });

  describe('add()', () => {
    test('should add media items to queue', () => {
      const mediaItems = [
        { url: 'https://example.com/image1.jpg', filename: 'image1.jpg', type: 'image' },
        { url: 'https://example.com/image2.jpg', filename: 'image2.jpg', type: 'image' },
      ];

      queue.add(mediaItems, 'https://example.com/page');

      expect(queue.queue).toHaveLength(2);
      expect(queue.queue[0].media.url).toBe('https://example.com/image1.jpg');
      expect(queue.queue[0].sourceUrl).toBe('https://example.com/page');
      expect(queue.queue[0].status).toBe('pending');
      expect(queue.queue[0].retryCount).toBe(0);
    });

    test('should add multiple batches to queue', () => {
      queue.add([{ url: 'url1', filename: 'file1' }], 'source1');
      queue.add([{ url: 'url2', filename: 'file2' }], 'source2');

      expect(queue.queue).toHaveLength(2);
    });
  });

  describe('downloadFile()', () => {
    test('should call browser.downloads.download with correct params', async () => {
      const url = 'https://example.com/image.jpg';
      const filename = 'image.jpg';

      const downloadId = await queue.downloadFile(url, filename);

      expect(global.browser.downloads.download).toHaveBeenCalledWith({
        url,
        filename,
        conflictAction: 'uniquify',
        saveAs: false,
      });
      expect(downloadId).toBe(1);
    });

    test('should throw error if download fails', async () => {
      global.browser.downloads.download.mockRejectedValue(new Error('Download failed'));

      await expect(
        queue.downloadFile('https://example.com/image.jpg', 'image.jpg')
      ).rejects.toThrow('Failed to start download');
    });
  });

  describe('waitForDownload()', () => {
    test('should resolve when download completes', async () => {
      const downloadId = 123;
      let listener;

      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      const waitPromise = queue.waitForDownload(downloadId);

      // Simulate download completion
      setTimeout(() => {
        listener({
          id: downloadId,
          state: { current: 'complete' },
        });
      }, 10);

      const result = await waitPromise;
      expect(result).toBe(true);
    });

    test('should reject on download error', async () => {
      const downloadId = 123;
      let listener;

      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      const waitPromise = queue.waitForDownload(downloadId);

      // Simulate download error
      setTimeout(() => {
        listener({
          id: downloadId,
          error: { current: 'NETWORK_FAILED' },
        });
      }, 10);

      await expect(waitPromise).rejects.toThrow('NETWORK_FAILED');
    });

    test('should reject on timeout', async () => {
      jest.useFakeTimers();

      const waitPromise = queue.waitForDownload(123);

      // Fast-forward time
      jest.advanceTimersByTime(61000);

      await expect(waitPromise).rejects.toThrow('Download timeout');

      jest.useRealTimers();
    });

    test('should ignore events for other downloads', async () => {
      const downloadId = 123;
      let listener;

      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      const waitPromise = queue.waitForDownload(downloadId);

      // Simulate event for different download
      setTimeout(() => {
        listener({
          id: 999, // Different ID
          state: { current: 'complete' },
        });
      }, 10);

      // Then send correct completion
      setTimeout(() => {
        listener({
          id: downloadId,
          state: { current: 'complete' },
        });
      }, 20);

      const result = await waitPromise;
      expect(result).toBe(true);
    });
  });

  describe('downloadWithRetry()', () => {
    test('should succeed on first attempt', async () => {
      let listener;
      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      const item = {
        media: { url: 'https://example.com/image.jpg', filename: 'image.jpg' },
        sourceUrl: 'https://example.com/page',
        retryCount: 0,
        status: 'pending',
      };

      const downloadPromise = queue.downloadWithRetry(item);

      // Simulate successful download
      setTimeout(() => {
        listener({ id: 1, state: { current: 'complete' } });
      }, 10);

      const result = await downloadPromise;

      expect(result.status).toBe('completed');
      expect(result.downloadId).toBe(1);
      expect(item.retryCount).toBe(0);
      expect(item.status).toBe('completed');
    });

    test('should retry on failure', async () => {
      let listener;
      let callCount = 0;

      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      global.browser.downloads.download.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First attempt fails
          setTimeout(() => {
            listener({ id: callCount, error: { current: 'NETWORK_FAILED' } });
          }, 10);
        } else {
          // Second attempt succeeds
          setTimeout(() => {
            listener({ id: callCount, state: { current: 'complete' } });
          }, 10);
        }
        return Promise.resolve(callCount);
      });

      const item = {
        media: { url: 'https://example.com/image.jpg', filename: 'image.jpg' },
        sourceUrl: 'https://example.com/page',
        retryCount: 0,
        status: 'pending',
      };

      const result = await queue.downloadWithRetry(item);

      expect(result.status).toBe('completed');
      expect(callCount).toBe(2); // First attempt + 1 retry
    });

    test('should fail after max retries', async () => {
      let listener;

      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      global.browser.downloads.download.mockImplementation(async () => {
        const id = mockDownloadId++;
        setTimeout(() => {
          listener({ id, error: { current: 'NETWORK_FAILED' } });
        }, 10);
        return id;
      });

      const item = {
        media: { url: 'https://example.com/image.jpg', filename: 'image.jpg' },
        sourceUrl: 'https://example.com/page',
        retryCount: 0,
        status: 'pending',
      };

      await expect(queue.downloadWithRetry(item)).rejects.toThrow();

      // Should have tried: initial + 3 retries = 4 total
      expect(global.browser.downloads.download).toHaveBeenCalledTimes(4);
    });
  });

  describe('process()', () => {
    test('should process all items in queue', async () => {
      let listener;
      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      // Mock all downloads succeed
      global.browser.downloads.download.mockImplementation(async () => {
        const id = mockDownloadId++;
        setTimeout(() => {
          listener({ id, state: { current: 'complete' } });
        }, 10);
        return id;
      });

      const mediaItems = [
        { url: 'url1', filename: 'file1.jpg' },
        { url: 'url2', filename: 'file2.jpg' },
        { url: 'url3', filename: 'file3.jpg' },
      ];

      queue.add(mediaItems, 'source');

      const results = await queue.process();

      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === 'completed')).toBe(true);
      expect(queue.queue).toHaveLength(0);
      expect(queue.isProcessing).toBe(false);
    });

    test('should handle mixed success and failure', async () => {
      let listener;
      let callCount = 0;

      global.browser.downloads.onChanged.addListener.mockImplementation(fn => {
        listener = fn;
      });

      global.browser.downloads.download.mockImplementation(async () => {
        const id = mockDownloadId++;
        callCount++;
        
        setTimeout(() => {
          if (callCount % 2 === 0) {
            // Even calls fail
            listener({ id, error: { current: 'FAILED' } });
          } else {
            // Odd calls succeed
            listener({ id, state: { current: 'complete' } });
          }
        }, 10);
        
        return id;
      });

      const mediaItems = [
        { url: 'url1', filename: 'file1.jpg' },
        { url: 'url2', filename: 'file2.jpg' },
        { url: 'url3', filename: 'file3.jpg' },
      ];

      queue.add(mediaItems, 'source');

      const results = await queue.process();

      expect(results).toHaveLength(3);
      
      const completed = results.filter(r => r.status === 'completed');
      const failed = results.filter(r => r.status === 'failed');
      
      // With retries, results may vary, but we should have some results
      expect(completed.length + failed.length).toBe(3);
    });

    test('should throw error if already processing', async () => {
      queue.isProcessing = true;

      await expect(queue.process()).rejects.toThrow('already being processed');
    });
  });

  describe('getStatus()', () => {
    test('should return current status', () => {
      queue.queue = [{ media: {} }, { media: {} }];
      queue.isProcessing = true;
      queue.currentDownload = { media: { url: 'test' } };
      queue.results = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'failed' },
      ];

      const status = queue.getStatus();

      expect(status.isProcessing).toBe(true);
      expect(status.queueLength).toBe(2);
      expect(status.currentDownload).toBeDefined();
      expect(status.completedCount).toBe(2);
      expect(status.failedCount).toBe(1);
    });
  });

  describe('clear()', () => {
    test('should reset all state', () => {
      queue.queue = [{ media: {} }];
      queue.results = [{ status: 'completed' }];
      queue.currentDownload = { media: {} };
      queue.isProcessing = true;

      queue.clear();

      expect(queue.queue).toEqual([]);
      expect(queue.results).toEqual([]);
      expect(queue.currentDownload).toBeNull();
      expect(queue.isProcessing).toBe(false);
    });
  });

  describe('createDownloadQueue()', () => {
    test('should create new queue instance', () => {
      const newQueue = createDownloadQueue();

      expect(newQueue).toBeInstanceOf(DownloadQueue);
      expect(newQueue.queue).toEqual([]);
    });
  });
});