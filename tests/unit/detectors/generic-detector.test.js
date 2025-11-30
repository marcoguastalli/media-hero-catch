/**
 * Unit tests for generic-detector.js
 */

import { detectHeroMedia } from '../../../src/content/detectors/generic-detector.js';

describe('Generic Detector', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
    
    // Mock window dimensions
    global.innerWidth = 1920;
    global.innerHeight = 1080;
    
    // Mock window.location
    delete window.location;
    window.location = {
      href: 'https://example.com/article.html',
      origin: 'https://example.com',
      protocol: 'https:',
      hostname: 'example.com',
    };
  });

  describe('Video Detection', () => {
    test('should detect hero video', async () => {
      // Create a large video element
      const video = document.createElement('video');
      video.src = 'https://example.com/video.mp4';
      Object.defineProperty(video, 'videoWidth', { value: 1920 });
      Object.defineProperty(video, 'videoHeight', { value: 1080 });
      Object.defineProperty(video, 'offsetParent', { value: document.body });
      jest.spyOn(video, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 500,
        right: 1000,
        width: 900,
        height: 400,
      });
      
      document.body.appendChild(video);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('video');
      expect(results[0].url).toBe('https://example.com/video.mp4');
    });

    test('should prioritize video over images', async () => {
      // Add a video
      const video = document.createElement('video');
      video.src = 'https://example.com/video.mp4';
      Object.defineProperty(video, 'videoWidth', { value: 800 });
      Object.defineProperty(video, 'videoHeight', { value: 600 });
      Object.defineProperty(video, 'offsetParent', { value: document.body });
      jest.spyOn(video, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 400,
        right: 600,
        width: 500,
        height: 300,
      });
      document.body.appendChild(video);
      
      // Add a larger image
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      Object.defineProperty(img, 'naturalWidth', { value: 1920 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      Object.defineProperty(img, 'offsetParent', { value: document.body });
      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 800,
        right: 1400,
        width: 1300,
        height: 700,
      });
      document.body.appendChild(img);
      
      const results = await detectHeroMedia();
      
      // Should return video, not image
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('video');
    });

    test('should filter out small videos', async () => {
      const video = document.createElement('video');
      video.src = 'https://example.com/video.mp4';
      Object.defineProperty(video, 'videoWidth', { value: 100 });
      Object.defineProperty(video, 'videoHeight', { value: 100 });
      Object.defineProperty(video, 'offsetParent', { value: document.body });
      jest.spyOn(video, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 200,
        right: 200,
        width: 100,
        height: 100,
      });
      document.body.appendChild(video);
      
      const results = await detectHeroMedia();
      
      // Should find nothing (video too small)
      expect(results).toHaveLength(0);
    });
  });

  describe('Image Detection', () => {
    test('should detect hero image', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/hero.jpg';
      Object.defineProperty(img, 'naturalWidth', { value: 1920 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      Object.defineProperty(img, 'offsetParent', { value: document.body });
      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 800,
        right: 1400,
        width: 1300,
        height: 700,
      });
      
      document.body.appendChild(img);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('image');
      expect(results[0].url).toBe('https://example.com/hero.jpg');
    });

    test('should select largest image by area', async () => {
      // Add smaller image
      const small = document.createElement('img');
      small.src = 'https://example.com/small.jpg';
      Object.defineProperty(small, 'naturalWidth', { value: 400 });
      Object.defineProperty(small, 'naturalHeight', { value: 300 });
      Object.defineProperty(small, 'offsetParent', { value: document.body });
      jest.spyOn(small, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 400,
        right: 500,
        width: 400,
        height: 300,
      });
      document.body.appendChild(small);
      
      // Add larger image
      const large = document.createElement('img');
      large.src = 'https://example.com/large.jpg';
      Object.defineProperty(large, 'naturalWidth', { value: 1920 });
      Object.defineProperty(large, 'naturalHeight', { value: 1080 });
      Object.defineProperty(large, 'offsetParent', { value: document.body });
      jest.spyOn(large, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 800,
        right: 1400,
        width: 1300,
        height: 700,
      });
      document.body.appendChild(large);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].url).toBe('https://example.com/large.jpg');
    });

    test('should filter out icons', async () => {
      const icon = document.createElement('img');
      icon.src = 'https://example.com/icon.png';
      Object.defineProperty(icon, 'naturalWidth', { value: 32 });
      Object.defineProperty(icon, 'naturalHeight', { value: 32 });
      Object.defineProperty(icon, 'offsetParent', { value: document.body });
      jest.spyOn(icon, 'getBoundingClientRect').mockReturnValue({
        top: 10,
        left: 10,
        bottom: 42,
        right: 42,
        width: 32,
        height: 32,
      });
      document.body.appendChild(icon);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(0);
    });

    test('should filter out images with ad class', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/ad.jpg';
      img.className = 'advertisement banner';
      Object.defineProperty(img, 'naturalWidth', { value: 1920 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      Object.defineProperty(img, 'offsetParent', { value: document.body });
      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 800,
        right: 1400,
        width: 1300,
        height: 700,
      });
      document.body.appendChild(img);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(0);
    });

    test('should prefer images from srcset', async () => {
      const img = document.createElement('img');
      img.srcset = 'small.jpg 320w, medium.jpg 640w, large.jpg 1920w';
      img.src = 'small.jpg';
      Object.defineProperty(img, 'naturalWidth', { value: 1920 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      Object.defineProperty(img, 'offsetParent', { value: document.body });
      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 800,
        right: 1400,
        width: 1300,
        height: 700,
      });
      document.body.appendChild(img);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].url).toContain('large.jpg');
    });
  });

  describe('Background Image Detection', () => {
    test('should detect hero background image as fallback', async () => {
      const div = document.createElement('div');
      div.style.backgroundImage = 'url(https://example.com/bg.jpg)';
      Object.defineProperty(div, 'offsetParent', { value: document.body });
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        left: 0,
        bottom: 1000,
        right: 1800,
        width: 1800,
        height: 1000,
      });
      document.body.appendChild(div);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('image');
      expect(results[0].url).toBe('https://example.com/bg.jpg');
    });

    test('should prefer regular images over background images', async () => {
      // Add background image
      const divBg = document.createElement('div');
      divBg.style.backgroundImage = 'url(https://example.com/bg.jpg)';
      Object.defineProperty(divBg, 'offsetParent', { value: document.body });
      jest.spyOn(divBg, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        left: 0,
        bottom: 1000,
        right: 1800,
        width: 1800,
        height: 1000,
      });
      document.body.appendChild(divBg);
      
      // Add regular image (smaller)
      const img = document.createElement('img');
      img.src = 'https://example.com/hero.jpg';
      Object.defineProperty(img, 'naturalWidth', { value: 800 });
      Object.defineProperty(img, 'naturalHeight', { value: 600 });
      Object.defineProperty(img, 'offsetParent', { value: document.body });
      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 500,
        right: 700,
        width: 600,
        height: 400,
      });
      document.body.appendChild(img);
      
      const results = await detectHeroMedia();
      
      // Should prefer <img> over background-image
      expect(results).toHaveLength(1);
      expect(results[0].url).toBe('https://example.com/hero.jpg');
    });
  });

  describe('Scoring System', () => {
    test('should boost score for visible elements', async () => {
      // This test verifies that viewport visibility affects selection
      const visible = document.createElement('img');
      visible.src = 'https://example.com/visible.jpg';
      Object.defineProperty(visible, 'naturalWidth', { value: 1000 });
      Object.defineProperty(visible, 'naturalHeight', { value: 600 });
      Object.defineProperty(visible, 'offsetParent', { value: document.body });
      jest.spyOn(visible, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 700,
        right: 1100,
        width: 1000,
        height: 600,
      });
      document.body.appendChild(visible);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].score).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should return empty array when no media found', async () => {
      // Empty document
      const results = await detectHeroMedia();
      expect(results).toHaveLength(0);
    });

    test('should handle page with only hidden elements', async () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/hidden.jpg';
      Object.defineProperty(img, 'naturalWidth', { value: 1920 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      Object.defineProperty(img, 'offsetParent', { value: null }); // Hidden
      document.body.appendChild(img);
      
      const results = await detectHeroMedia();
      expect(results).toHaveLength(0);
    });
  });
});