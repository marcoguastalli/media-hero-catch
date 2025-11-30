/**
 * Unit tests for dom-analyzer.js
 */

import {
  calculateElementSize,
  getViewportVisibility,
  calculateViewportBonus,
  calculateQualityBonus,
  shouldExcludeByClassName,
  isTooSmall,
  isIcon,
  isElementVisible,
  extractBackgroundImageUrl,
  filterElements,
} from '../../src/content/utils/dom-analyzer.js';

describe('DOM Analyzer', () => {
  beforeEach(() => {
    // Set up viewport size
    global.innerWidth = 1920;
    global.innerHeight = 1080;
  });

  describe('calculateElementSize()', () => {
    test('should use natural dimensions for images', () => {
      const img = document.createElement('img');
      Object.defineProperty(img, 'naturalWidth', { value: 1920 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      
      const size = calculateElementSize(img);
      
      expect(size.width).toBe(1920);
      expect(size.height).toBe(1080);
      expect(size.area).toBe(1920 * 1080);
    });

    test('should use video dimensions for videos', () => {
      const video = document.createElement('video');
      Object.defineProperty(video, 'videoWidth', { value: 1280 });
      Object.defineProperty(video, 'videoHeight', { value: 720 });
      
      const size = calculateElementSize(video);
      
      expect(size.width).toBe(1280);
      expect(size.height).toBe(720);
      expect(size.area).toBe(1280 * 720);
    });

    test('should fall back to getBoundingClientRect for other elements', () => {
      const div = document.createElement('div');
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        width: 500,
        height: 300,
      });
      
      const size = calculateElementSize(div);
      
      expect(size.width).toBe(500);
      expect(size.height).toBe(300);
      expect(size.area).toBe(150000);
    });

    test('should handle images without natural dimensions', () => {
      const img = document.createElement('img');
      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 300,
      });
      
      const size = calculateElementSize(img);
      
      expect(size.width).toBe(400);
      expect(size.height).toBe(300);
    });
  });

  describe('getViewportVisibility()', () => {
    test('should return "fully" for fully visible element', () => {
      const div = document.createElement('div');
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 500,
        right: 500,
      });
      
      const visibility = getViewportVisibility(div);
      expect(visibility).toBe('fully');
    });

    test('should return "partially" for partially visible element', () => {
      const div = document.createElement('div');
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        top: -100,
        left: 100,
        bottom: 500,
        right: 500,
      });
      
      const visibility = getViewportVisibility(div);
      expect(visibility).toBe('partially');
    });

    test('should return "none" for element outside viewport', () => {
      const div = document.createElement('div');
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        top: 2000,
        left: 100,
        bottom: 2500,
        right: 500,
      });
      
      const visibility = getViewportVisibility(div);
      expect(visibility).toBe('none');
    });
  });

  describe('calculateViewportBonus()', () => {
    test('should return 1.5 for fully visible elements', () => {
      const div = document.createElement('div');
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 500,
        right: 500,
      });
      
      const bonus = calculateViewportBonus(div);
      expect(bonus).toBe(1.5);
    });

    test('should return 1.2 for partially visible elements', () => {
      const div = document.createElement('div');
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        top: -100,
        left: 100,
        bottom: 500,
        right: 500,
      });
      
      const bonus = calculateViewportBonus(div);
      expect(bonus).toBe(1.2);
    });

    test('should return 1.0 for non-visible elements', () => {
      const div = document.createElement('div');
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        top: 2000,
        left: 100,
        bottom: 2500,
        right: 500,
      });
      
      const bonus = calculateViewportBonus(div);
      expect(bonus).toBe(1.0);
    });
  });

  describe('calculateQualityBonus()', () => {
    test('should return 1.3 for HD images (>1920px)', () => {
      expect(calculateQualityBonus(2048)).toBe(1.3);
      expect(calculateQualityBonus(3840)).toBe(1.3);
    });

    test('should return 1.1 for SD images (>1280px)', () => {
      expect(calculateQualityBonus(1920)).toBe(1.1);
      expect(calculateQualityBonus(1600)).toBe(1.1);
    });

    test('should return 1.0 for smaller images', () => {
      expect(calculateQualityBonus(1280)).toBe(1.0);
      expect(calculateQualityBonus(640)).toBe(1.0);
    });
  });

  describe('shouldExcludeByClassName()', () => {
    test('should exclude elements with ad class', () => {
      const div = document.createElement('div');
      div.className = 'content-ad banner';
      
      expect(shouldExcludeByClassName(div)).toBe(true);
    });

    test('should exclude elements with icon class', () => {
      const img = document.createElement('img');
      img.className = 'user-icon';
      
      expect(shouldExcludeByClassName(img)).toBe(true);
    });

    test('should not exclude elements without excluded classes', () => {
      const img = document.createElement('img');
      img.className = 'hero-image main-photo';
      
      expect(shouldExcludeByClassName(img)).toBe(false);
    });

    test('should handle elements without className', () => {
      const div = document.createElement('div');
      
      expect(shouldExcludeByClassName(div)).toBe(false);
    });
  });

  describe('isTooSmall()', () => {
    test('should return true for elements smaller than minimum', () => {
      expect(isTooSmall({ width: 100, height: 100 })).toBe(true);
      expect(isTooSmall({ width: 150, height: 150 })).toBe(true);
    });

    test('should return false for elements meeting minimum size', () => {
      expect(isTooSmall({ width: 200, height: 200 })).toBe(false);
      expect(isTooSmall({ width: 500, height: 500 })).toBe(false);
    });

    test('should check both width and height', () => {
      expect(isTooSmall({ width: 300, height: 100 })).toBe(true);
      expect(isTooSmall({ width: 100, height: 300 })).toBe(true);
    });
  });

  describe('isIcon()', () => {
    test('should return true for icon-sized elements', () => {
      expect(isIcon({ width: 50, height: 50 })).toBe(true);
      expect(isIcon({ width: 32, height: 32 })).toBe(true);
    });

    test('should return false for larger elements', () => {
      expect(isIcon({ width: 100, height: 100 })).toBe(false);
      expect(isIcon({ width: 200, height: 200 })).toBe(false);
    });
  });

  describe('isElementVisible()', () => {
    test('should return true for visible elements', () => {
      const div = document.createElement('div');
      Object.defineProperty(div, 'offsetParent', { value: document.body });
      
      const isVisible = isElementVisible(div);
      expect(isVisible).toBe(true);
    });

    test('should return false for hidden elements', () => {
      const div = document.createElement('div');
      Object.defineProperty(div, 'offsetParent', { value: null });
      
      const isVisible = isElementVisible(div);
      expect(isVisible).toBe(false);
    });
  });

  describe('extractBackgroundImageUrl()', () => {
    test('should extract URL from background-image', () => {
      const div = document.createElement('div');
      div.style.backgroundImage = 'url("https://example.com/image.jpg")';
      
      const url = extractBackgroundImageUrl(div);
      expect(url).toBe('https://example.com/image.jpg');
    });

    test('should handle single quotes', () => {
      const div = document.createElement('div');
      div.style.backgroundImage = "url('https://example.com/image.jpg')";
      
      const url = extractBackgroundImageUrl(div);
      expect(url).toBe('https://example.com/image.jpg');
    });

    test('should handle URLs without quotes', () => {
      const div = document.createElement('div');
      div.style.backgroundImage = 'url(https://example.com/image.jpg)';
      
      const url = extractBackgroundImageUrl(div);
      expect(url).toBe('https://example.com/image.jpg');
    });

    test('should return null for elements without background image', () => {
      const div = document.createElement('div');
      
      const url = extractBackgroundImageUrl(div);
      expect(url).toBeNull();
    });
  });

  describe('filterElements()', () => {
    test('should filter out invisible elements', () => {
      const visible = document.createElement('div');
      Object.defineProperty(visible, 'offsetParent', { value: document.body });
      jest.spyOn(visible, 'getBoundingClientRect').mockReturnValue({
        width: 500,
        height: 500,
      });
      
      const hidden = document.createElement('div');
      Object.defineProperty(hidden, 'offsetParent', { value: null });
      
      const result = filterElements([visible, hidden]);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(visible);
    });

    test('should filter out too-small elements', () => {
      const large = document.createElement('div');
      Object.defineProperty(large, 'offsetParent', { value: document.body });
      jest.spyOn(large, 'getBoundingClientRect').mockReturnValue({
        width: 500,
        height: 500,
      });
      
      const small = document.createElement('div');
      Object.defineProperty(small, 'offsetParent', { value: document.body });
      jest.spyOn(small, 'getBoundingClientRect').mockReturnValue({
        width: 50,
        height: 50,
      });
      
      const result = filterElements([large, small]);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(large);
    });

    test('should filter out elements with excluded classes', () => {
      const normal = document.createElement('div');
      Object.defineProperty(normal, 'offsetParent', { value: document.body });
      jest.spyOn(normal, 'getBoundingClientRect').mockReturnValue({
        width: 500,
        height: 500,
      });
      
      const ad = document.createElement('div');
      ad.className = 'advertisement';
      Object.defineProperty(ad, 'offsetParent', { value: document.body });
      jest.spyOn(ad, 'getBoundingClientRect').mockReturnValue({
        width: 500,
        height: 500,
      });
      
      const result = filterElements([normal, ad]);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(normal);
    });
  });
});