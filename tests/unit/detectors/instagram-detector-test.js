/**
 * Unit tests for instagram-detector.js
 */

import { 
  detectHeroMedia,
  shouldUseInstagramDetector 
} from '../../../src/content/detectors/instagram-detector.js';

describe('Instagram Detector', () => {
  beforeEach(() => {
    // Clear document
    document.body.innerHTML = '';
    
    // Mock Instagram URL
    delete window.location;
    window.location = {
      href: 'https://www.instagram.com/p/ABC123/',
      origin: 'https://www.instagram.com',
      protocol: 'https:',
      hostname: 'www.instagram.com',
    };
  });

  describe('shouldUseInstagramDetector()', () => {
    test('should return true for instagram.com', () => {
      window.location.hostname = 'www.instagram.com';
      expect(shouldUseInstagramDetector()).toBe(true);
    });

    test('should return true for instagram.com without www', () => {
      window.location.hostname = 'instagram.com';
      expect(shouldUseInstagramDetector()).toBe(true);
    });

    test('should return false for other domains', () => {
      window.location.hostname = 'example.com';
      expect(shouldUseInstagramDetector()).toBe(false);
    });
  });

  describe('Single Image Post', () => {
    test('should detect single image post', async () => {
      // Create Instagram post structure
      const article = document.createElement('article');
      
      const img = document.createElement('img');
      img.src = 'https://instagram.com/p/ABC123/media?size=l';
      img.srcset = 'https://instagram.com/p/ABC123/media?size=s 320w, https://instagram.com/p/ABC123/media?size=l 1080w';
      img.alt = 'Photo by user';
      Object.defineProperty(img, 'naturalWidth', { value: 1080 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      
      article.appendChild(img);
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('image');
      expect(results[0].url).toContain('media?size=l');
    });

    test('should filter out profile picture', async () => {
      const article = document.createElement('article');
      
      // Profile picture
      const profilePic = document.createElement('img');
      profilePic.src = 'https://instagram.com/profile.jpg';
      profilePic.alt = "User's profile picture";
      Object.defineProperty(profilePic, 'naturalWidth', { value: 150 });
      Object.defineProperty(profilePic, 'naturalHeight', { value: 150 });
      jest.spyOn(profilePic, 'getBoundingClientRect').mockReturnValue({
        width: 40,
        height: 40,
      });
      
      // Main image
      const mainImg = document.createElement('img');
      mainImg.src = 'https://instagram.com/p/ABC123/media?size=l';
      mainImg.srcset = 'https://instagram.com/p/ABC123/media?size=l 1080w';
      mainImg.alt = 'Photo by user';
      Object.defineProperty(mainImg, 'naturalWidth', { value: 1080 });
      Object.defineProperty(mainImg, 'naturalHeight', { value: 1080 });
      
      article.appendChild(profilePic);
      article.appendChild(mainImg);
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].url).not.toContain('profile.jpg');
      expect(results[0].url).toContain('media?size=l');
    });

    test('should filter out UI icons', async () => {
      const article = document.createElement('article');
      
      // UI icon
      const icon = document.createElement('img');
      icon.src = 'https://instagram.com/icon.png';
      icon.alt = 'Like icon';
      jest.spyOn(icon, 'getBoundingClientRect').mockReturnValue({
        width: 24,
        height: 24,
      });
      
      // Main image
      const mainImg = document.createElement('img');
      mainImg.src = 'https://instagram.com/p/ABC123/media?size=l';
      mainImg.srcset = 'https://instagram.com/p/ABC123/media?size=l 1080w';
      mainImg.alt = 'Photo';
      Object.defineProperty(mainImg, 'naturalWidth', { value: 1080 });
      Object.defineProperty(mainImg, 'naturalHeight', { value: 1080 });
      
      article.appendChild(icon);
      article.appendChild(mainImg);
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].url).toContain('media?size=l');
    });
  });

  describe('Single Video Post', () => {
    test('should detect single video post', async () => {
      const article = document.createElement('article');
      
      const video = document.createElement('video');
      video.src = 'https://instagram.com/p/ABC123/video.mp4';
      Object.defineProperty(video, 'videoWidth', { value: 1080 });
      Object.defineProperty(video, 'videoHeight', { value: 1920 });
      
      article.appendChild(video);
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('video');
      expect(results[0].url).toContain('video.mp4');
    });

    test('should detect video with source element', async () => {
      const article = document.createElement('article');
      
      const video = document.createElement('video');
      const source = document.createElement('source');
      source.src = 'https://instagram.com/p/ABC123/video.mp4';
      source.type = 'video/mp4';
      video.appendChild(source);
      
      article.appendChild(video);
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('video');
    });
  });

  describe('Reel Detection', () => {
    test('should detect reel video', async () => {
      // Update URL to reel
      window.location.href = 'https://www.instagram.com/reel/XYZ789/';
      
      const video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.src = 'https://instagram.com/reel/XYZ789/video.mp4';
      
      document.body.appendChild(video);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('video');
      expect(results[0].url).toContain('video.mp4');
    });
  });

  describe('Carousel Detection', () => {
    test('should detect carousel with multiple images', async () => {
      const article = document.createElement('article');
      
      // Add carousel navigation button
      const nextBtn = document.createElement('button');
      nextBtn.setAttribute('aria-label', 'Next');
      article.appendChild(nextBtn);
      
      // Add multiple images
      for (let i = 1; i <= 3; i++) {
        const img = document.createElement('img');
        img.src = `https://instagram.com/p/ABC123/media${i}.jpg`;
        img.srcset = `https://instagram.com/p/ABC123/media${i}.jpg 1080w`;
        img.alt = `Photo ${i}`;
        Object.defineProperty(img, 'naturalWidth', { value: 1080 });
        Object.defineProperty(img, 'naturalHeight', { value: 1080 });
        article.appendChild(img);
      }
      
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(3);
      expect(results[0].type).toBe('image');
      expect(results[1].type).toBe('image');
      expect(results[2].type).toBe('image');
    });

    test('should add position numbering to carousel items', async () => {
      const article = document.createElement('article');
      
      // Add carousel indicator
      const nextBtn = document.createElement('button');
      nextBtn.setAttribute('aria-label', 'Next');
      article.appendChild(nextBtn);
      
      // Add 2 images
      const img1 = document.createElement('img');
      img1.src = 'https://instagram.com/p/ABC123/photo.jpg';
      img1.srcset = 'https://instagram.com/p/ABC123/photo.jpg 1080w';
      img1.alt = 'Photo 1';
      Object.defineProperty(img1, 'naturalWidth', { value: 1080 });
      Object.defineProperty(img1, 'naturalHeight', { value: 1080 });
      
      const img2 = document.createElement('img');
      img2.src = 'https://instagram.com/p/ABC123/photo2.jpg';
      img2.srcset = 'https://instagram.com/p/ABC123/photo2.jpg 1080w';
      img2.alt = 'Photo 2';
      Object.defineProperty(img2, 'naturalWidth', { value: 1080 });
      Object.defineProperty(img2, 'naturalHeight', { value: 1080 });
      
      article.appendChild(img1);
      article.appendChild(img2);
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(2);
      expect(results[0].filename).toMatch(/_1\./);
      expect(results[1].filename).toMatch(/_2\./);
      expect(results[0].position).toBe(1);
      expect(results[1].position).toBe(2);
      expect(results[0].totalItems).toBe(2);
    });

    test('should detect carousel with mixed images and videos', async () => {
      const article = document.createElement('article');
      
      // Add carousel indicator
      const nextBtn = document.createElement('button');
      nextBtn.setAttribute('aria-label', 'Next');
      article.appendChild(nextBtn);
      
      // Add image
      const img = document.createElement('img');
      img.src = 'https://instagram.com/p/ABC123/photo.jpg';
      img.srcset = 'https://instagram.com/p/ABC123/photo.jpg 1080w';
      img.alt = 'Photo';
      Object.defineProperty(img, 'naturalWidth', { value: 1080 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      article.appendChild(img);
      
      // Add video
      const video = document.createElement('video');
      video.src = 'https://instagram.com/p/ABC123/video.mp4';
      article.appendChild(video);
      
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(2);
      expect(results.some(r => r.type === 'image')).toBe(true);
      expect(results.some(r => r.type === 'video')).toBe(true);
    });

    test('should limit carousel to max items', async () => {
      const article = document.createElement('article');
      
      // Add carousel indicator
      const nextBtn = document.createElement('button');
      nextBtn.setAttribute('aria-label', 'Next');
      article.appendChild(nextBtn);
      
      // Add 15 images (more than max)
      for (let i = 1; i <= 15; i++) {
        const img = document.createElement('img');
        img.src = `https://instagram.com/p/ABC123/media${i}.jpg`;
        img.srcset = `https://instagram.com/p/ABC123/media${i}.jpg 1080w`;
        img.alt = `Photo ${i}`;
        Object.defineProperty(img, 'naturalWidth', { value: 1080 });
        Object.defineProperty(img, 'naturalHeight', { value: 1080 });
        article.appendChild(img);
      }
      
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      // Should be limited to CONFIG.instagram.maxCarouselItems (10)
      expect(results.length).toBeLessThanOrEqual(10);
    });

    test('should not add numbering for single item', async () => {
      const article = document.createElement('article');
      
      // Add carousel indicator (but only one item)
      const nextBtn = document.createElement('button');
      nextBtn.setAttribute('aria-label', 'Next');
      article.appendChild(nextBtn);
      
      const img = document.createElement('img');
      img.src = 'https://instagram.com/p/ABC123/photo.jpg';
      img.srcset = 'https://instagram.com/p/ABC123/photo.jpg 1080w';
      img.alt = 'Photo';
      Object.defineProperty(img, 'naturalWidth', { value: 1080 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      article.appendChild(img);
      
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
      // Should not have _1 suffix
      expect(results[0].filename).not.toMatch(/_1\./);
    });

    test('should deduplicate carousel items', async () => {
      const article = document.createElement('article');
      
      // Add carousel indicator
      const nextBtn = document.createElement('button');
      nextBtn.setAttribute('aria-label', 'Next');
      article.appendChild(nextBtn);
      
      // Add same image twice (Instagram sometimes duplicates in DOM)
      const img1 = document.createElement('img');
      img1.src = 'https://instagram.com/p/ABC123/photo.jpg';
      img1.srcset = 'https://instagram.com/p/ABC123/photo.jpg 1080w';
      img1.alt = 'Photo';
      Object.defineProperty(img1, 'naturalWidth', { value: 1080 });
      Object.defineProperty(img1, 'naturalHeight', { value: 1080 });
      
      const img2 = document.createElement('img');
      img2.src = 'https://instagram.com/p/ABC123/photo.jpg'; // Same URL
      img2.srcset = 'https://instagram.com/p/ABC123/photo.jpg 1080w';
      img2.alt = 'Photo';
      Object.defineProperty(img2, 'naturalWidth', { value: 1080 });
      Object.defineProperty(img2, 'naturalHeight', { value: 1080 });
      
      article.appendChild(img1);
      article.appendChild(img2);
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      // Should only return 1 item (deduplicated)
      expect(results).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    test('should return empty array when no article found', async () => {
      // No article element
      const results = await detectHeroMedia();
      expect(results).toHaveLength(0);
    });

    test('should return empty array when no valid media found', async () => {
      const article = document.createElement('article');
      
      // Only profile picture
      const profilePic = document.createElement('img');
      profilePic.alt = "User's profile picture";
      profilePic.src = 'https://instagram.com/profile.jpg';
      jest.spyOn(profilePic, 'getBoundingClientRect').mockReturnValue({
        width: 40,
        height: 40,
      });
      
      article.appendChild(profilePic);
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      expect(results).toHaveLength(0);
    });

    test('should handle carousel with previous button instead of next', async () => {
      const article = document.createElement('article');
      
      // Add previous button (alternative carousel indicator)
      const prevBtn = document.createElement('button');
      prevBtn.setAttribute('aria-label', 'Previous');
      article.appendChild(prevBtn);
      
      const img = document.createElement('img');
      img.src = 'https://instagram.com/p/ABC123/photo.jpg';
      img.srcset = 'https://instagram.com/p/ABC123/photo.jpg 1080w';
      img.alt = 'Photo';
      Object.defineProperty(img, 'naturalWidth', { value: 1080 });
      Object.defineProperty(img, 'naturalHeight', { value: 1080 });
      article.appendChild(img);
      
      document.body.appendChild(article);
      
      const results = await detectHeroMedia();
      
      expect(results).toHaveLength(1);
    });
  });
});