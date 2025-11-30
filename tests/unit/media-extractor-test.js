/**
 * Unit tests for media-extractor.js
 */

import {
  extractImageUrl,
  getHighestResolutionFromSrcset,
  extractVideoUrl,
  makeAbsoluteUrl,
  extractFilenameFromUrl,
  generateFilename,
  guessExtensionFromUrl,
  createMediaObject,
  isValidMediaUrl,
} from '../../src/content/utils/media-extractor.js';

describe('Media Extractor', () => {
  beforeEach(() => {
    // Mock window.location
    delete window.location;
    window.location = {
      href: 'https://example.com/page/article.html',
      origin: 'https://example.com',
      protocol: 'https:',
      hostname: 'example.com',
    };
  });

  describe('extractImageUrl()', () => {
    test('should extract URL from srcset if available', () => {
      const img = document.createElement('img');
      img.srcset = 'image-320.jpg 320w, image-640.jpg 640w, image-1280.jpg 1280w';
      img.src = 'image-320.jpg';
      
      const url = extractImageUrl(img);
      expect(url).toBe('https://example.com/page/image-1280.jpg');
    });

    test('should fall back to src if no srcset', () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      
      const url = extractImageUrl(img);
      expect(url).toBe('https://example.com/image.jpg');
    });

    test('should return null if no src or srcset', () => {
      const img = document.createElement('img');
      
      const url = extractImageUrl(img);
      expect(url).toBeNull();
    });
  });

  describe('getHighestResolutionFromSrcset()', () => {
    test('should parse srcset and return highest resolution', () => {
      const srcset = 'img-320.jpg 320w, img-640.jpg 640w, img-1920.jpg 1920w';
      
      const url = getHighestResolutionFromSrcset(srcset);
      expect(url).toBe('img-1920.jpg');
    });

    test('should handle srcset with mixed descriptors', () => {
      const srcset = 'small.jpg 320w, medium.jpg 640w, large.jpg 1280w, xlarge.jpg 2560w';
      
      const url = getHighestResolutionFromSrcset(srcset);
      expect(url).toBe('xlarge.jpg');
    });

    test('should handle srcset with single entry', () => {
      const srcset = 'image.jpg 1920w';
      
      const url = getHighestResolutionFromSrcset(srcset);
      expect(url).toBe('image.jpg');
    });

    test('should return null for empty srcset', () => {
      const url = getHighestResolutionFromSrcset('');
      expect(url).toBeNull();
    });

    test('should handle srcset without width descriptors', () => {
      const srcset = 'image1.jpg, image2.jpg';
      
      const url = getHighestResolutionFromSrcset(srcset);
      expect(url).toBe('image1.jpg');
    });
  });

  describe('extractVideoUrl()', () => {
    test('should extract URL from video src attribute', () => {
      const video = document.createElement('video');
      video.src = 'https://example.com/video.mp4';
      
      const url = extractVideoUrl(video);
      expect(url).toBe('https://example.com/video.mp4');
    });

    test('should extract URL from source element', () => {
      const video = document.createElement('video');
      const source = document.createElement('source');
      source.src = 'https://example.com/video.webm';
      video.appendChild(source);
      
      const url = extractVideoUrl(video);
      expect(url).toBe('https://example.com/video.webm');
    });

    test('should return null if no src found', () => {
      const video = document.createElement('video');
      
      const url = extractVideoUrl(video);
      expect(url).toBeNull();
    });
  });

  describe('makeAbsoluteUrl()', () => {
    test('should leave absolute URLs unchanged', () => {
      const url = 'https://cdn.example.com/image.jpg';
      expect(makeAbsoluteUrl(url)).toBe(url);
    });

    test('should convert protocol-relative URLs', () => {
      const url = '//cdn.example.com/image.jpg';
      expect(makeAbsoluteUrl(url)).toBe('https://cdn.example.com/image.jpg');
    });

    test('should convert absolute paths', () => {
      const url = '/images/photo.jpg';
      expect(makeAbsoluteUrl(url)).toBe('https://example.com/images/photo.jpg');
    });

    test('should convert relative paths', () => {
      const url = 'images/photo.jpg';
      expect(makeAbsoluteUrl(url)).toBe('https://example.com/page/images/photo.jpg');
    });

    test('should handle empty URL', () => {
      expect(makeAbsoluteUrl('')).toBe('');
      expect(makeAbsoluteUrl(null)).toBeNull();
    });
  });

  describe('extractFilenameFromUrl()', () => {
    test('should extract filename from URL', () => {
      const url = 'https://example.com/images/photo.jpg';
      expect(extractFilenameFromUrl(url)).toBe('photo.jpg');
    });

    test('should extract filename with query parameters', () => {
      const url = 'https://example.com/photo.jpg?size=large';
      expect(extractFilenameFromUrl(url)).toBe('photo.jpg');
    });

    test('should generate filename if none found', () => {
      const url = 'https://example.com/images/';
      const filename = extractFilenameFromUrl(url);
      expect(filename).toMatch(/^media_\d+_[a-z0-9]+\./);
    });

    test('should handle empty URL', () => {
      expect(extractFilenameFromUrl('')).toBe('media');
    });
  });

  describe('generateFilename()', () => {
    test('should generate filename with timestamp and random string', () => {
      const filename = generateFilename('https://example.com/image.jpg');
      expect(filename).toMatch(/^media_\d+_[a-z0-9]+\.jpg$/);
    });

    test('should guess extension from URL', () => {
      expect(generateFilename('test.png')).toMatch(/\.png$/);
      expect(generateFilename('test.mp4')).toMatch(/\.mp4$/);
    });
  });

  describe('guessExtensionFromUrl()', () => {
    test('should detect common image extensions', () => {
      expect(guessExtensionFromUrl('photo.png')).toBe('png');
      expect(guessExtensionFromUrl('photo.gif')).toBe('gif');
      expect(guessExtensionFromUrl('photo.webp')).toBe('webp');
    });

    test('should detect common video extensions', () => {
      expect(guessExtensionFromUrl('video.mp4')).toBe('mp4');
      expect(guessExtensionFromUrl('video.webm')).toBe('webm');
      expect(guessExtensionFromUrl('video.mov')).toBe('mov');
    });

    test('should default to jpg for unknown', () => {
      expect(guessExtensionFromUrl('photo')).toBe('jpg');
      expect(guessExtensionFromUrl('')).toBe('jpg');
    });

    test('should be case insensitive', () => {
      expect(guessExtensionFromUrl('PHOTO.PNG')).toBe('png');
      expect(guessExtensionFromUrl('VIDEO.MP4')).toBe('mp4');
    });
  });

  describe('createMediaObject()', () => {
    test('should create media object with all properties', () => {
      const img = document.createElement('img');
      const media = createMediaObject(
        'https://example.com/photo.jpg',
        'image',
        img,
        1500
      );
      
      expect(media).toMatchObject({
        url: 'https://example.com/photo.jpg',
        filename: 'photo.jpg',
        type: 'image',
        score: 1500,
        element: 'img',
      });
      expect(media.timestamp).toBeDefined();
    });

    test('should make URL absolute', () => {
      const img = document.createElement('img');
      const media = createMediaObject('/photo.jpg', 'image', img);
      
      expect(media.url).toBe('https://example.com/photo.jpg');
    });

    test('should handle video elements', () => {
      const video = document.createElement('video');
      const media = createMediaObject(
        'https://example.com/video.mp4',
        'video',
        video,
        2000
      );
      
      expect(media.type).toBe('video');
      expect(media.element).toBe('video');
    });
  });

  describe('isValidMediaUrl()', () => {
    test('should accept valid HTTP URLs', () => {
      expect(isValidMediaUrl('http://example.com/image.jpg')).toBe(true);
      expect(isValidMediaUrl('https://example.com/image.jpg')).toBe(true);
    });

    test('should reject data URLs', () => {
      expect(isValidMediaUrl('data:image/png;base64,abc123')).toBe(false);
    });

    test('should reject non-HTTP protocols', () => {
      expect(isValidMediaUrl('ftp://example.com/image.jpg')).toBe(false);
      expect(isValidMediaUrl('file:///path/to/image.jpg')).toBe(false);
    });

    test('should reject empty or invalid URLs', () => {
      expect(isValidMediaUrl('')).toBe(false);
      expect(isValidMediaUrl(null)).toBe(false);
      expect(isValidMediaUrl(undefined)).toBe(false);
    });

    test('should reject excessively long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      expect(isValidMediaUrl(longUrl)).toBe(false);
    });
  });
});