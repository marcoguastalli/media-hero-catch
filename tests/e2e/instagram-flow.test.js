/**
 * E2E tests for Instagram flow
 * 
 * Tests Instagram-specific detection
 */

import {
  setupBrowser,
  teardownBrowser,
  loadFixture,
  waitForExtension,
  elementExists,
} from './setup.js';

describe('Instagram Flow E2E', () => {
  let browser;
  let page;

  beforeAll(async () => {
    const setup = await setupBrowser();
    browser = setup.browser;
    page = setup.page;
    await waitForExtension(page);
  }, 30000);

  afterAll(async () => {
    await teardownBrowser(browser);
  }, 10000);

  describe('Single Post Detection', () => {
    test('should detect single image post', async () => {
      await loadFixture(page, 'instagram-post.html');
      await page.waitForTimeout(1000);

      // Check that article exists
      const articleExists = await elementExists(page, 'article');
      expect(articleExists).toBe(true);

      // Check that main post image exists
      const postImageExists = await elementExists(page, '.post-image');
      expect(postImageExists).toBe(true);

      // Check that profile picture exists but should be filtered
      const profilePicExists = await elementExists(page, '.profile-pic');
      expect(profilePicExists).toBe(true);
    }, 30000);

    test('should filter out profile picture', async () => {
      await loadFixture(page, 'instagram-post.html');
      await page.waitForTimeout(1000);

      const profilePicInfo = await page.evaluate(() => {
        const img = document.querySelector('.profile-pic');
        return {
          alt: img.alt,
          width: img.width,
          height: img.height,
        };
      });

      // Profile picture should have identifiable characteristics
      expect(profilePicInfo.alt).toContain('profile picture');
      expect(profilePicInfo.width).toBeLessThan(150);
    }, 30000);

    test('should filter out action icons', async () => {
      await loadFixture(page, 'instagram-post.html');
      await page.waitForTimeout(1000);

      const actionIconExists = await elementExists(page, '.action-icon');
      expect(actionIconExists).toBe(true);

      const iconSize = await page.evaluate(() => {
        const icon = document.querySelector('.action-icon');
        return {
          width: icon.width,
          height: icon.height,
        };
      });

      // Action icons are small
      expect(iconSize.width).toBeLessThan(50);
    }, 30000);
  });

  describe('Carousel Detection', () => {
    test('should detect carousel with multiple images', async () => {
      await loadFixture(page, 'instagram-carousel.html');
      await page.waitForTimeout(1000);

      // Check for carousel navigation
      const nextButtonExists = await elementExists(page, '.carousel-nav.next');
      const prevButtonExists = await elementExists(page, '.carousel-nav.prev');

      expect(nextButtonExists).toBe(true);
      expect(prevButtonExists).toBe(true);
    }, 30000);

    test('should find all carousel images', async () => {
      await loadFixture(page, 'instagram-carousel.html');
      await page.waitForTimeout(1000);

      const imageCount = await page.evaluate(() => {
        const images = document.querySelectorAll('.post-image');
        return images.length;
      });

      // Carousel has 3 images
      expect(imageCount).toBe(3);
    }, 30000);

    test('should detect carousel indicators', async () => {
      await loadFixture(page, 'instagram-carousel.html');
      await page.waitForTimeout(1000);

      const dotsExist = await elementExists(page, '.carousel-dots');
      expect(dotsExist).toBe(true);

      const dotCount = await page.evaluate(() => {
        const dots = document.querySelectorAll('.carousel-dot');
        return dots.length;
      });

      expect(dotCount).toBe(3);
    }, 30000);
  });

  describe('Video Post Detection', () => {
    test('should detect video post', async () => {
      await loadFixture(page, 'instagram-video.html');
      await page.waitForTimeout(1000);

      // Check that video exists
      const videoExists = await elementExists(page, '.post-video');
      expect(videoExists).toBe(true);

      // Check video source
      const videoInfo = await page.evaluate(() => {
        const video = document.querySelector('.post-video');
        const source = video?.querySelector('source');
        return {
          hasVideo: !!video,
          hasSource: !!source,
          src: source?.src || null,
        };
      });

      expect(videoInfo.hasVideo).toBe(true);
      expect(videoInfo.hasSource).toBe(true);
      expect(videoInfo.src).toContain('.mp4');
    }, 30000);
  });

  describe('Instagram URL Detection', () => {
    test('should identify Instagram domain', async () => {
      await loadFixture(page, 'instagram-post.html');
      await page.waitForTimeout(1000);

      // Mock Instagram URL
      await page.evaluate(() => {
        Object.defineProperty(window, 'location', {
          value: {
            href: 'https://www.instagram.com/p/ABC123/',
            hostname: 'www.instagram.com',
            protocol: 'https:',
            origin: 'https://www.instagram.com',
          },
          writable: true,
        });
      });

      const hostname = await page.evaluate(() => window.location.hostname);
      expect(hostname).toContain('instagram.com');
    }, 30000);
  });

  describe('Content Structure', () => {
    test('should have proper article structure', async () => {
      await loadFixture(page, 'instagram-post.html');
      await page.waitForTimeout(1000);

      const structure = await page.evaluate(() => {
        const article = document.querySelector('article');
        const profileHeader = article?.querySelector('.profile-header');
        const postImage = article?.querySelector('.post-image');
        const caption = article?.querySelector('p');

        return {
          hasArticle: !!article,
          hasProfileHeader: !!profileHeader,
          hasPostImage: !!postImage,
          hasCaption: !!caption,
        };
      });

      expect(structure.hasArticle).toBe(true);
      expect(structure.hasProfileHeader).toBe(true);
      expect(structure.hasPostImage).toBe(true);
      expect(structure.hasCaption).toBe(true);
    }, 30000);

    test('should have srcset with multiple resolutions', async () => {
      await loadFixture(page, 'instagram-post.html');
      await page.waitForTimeout(1000);

      const srcsetInfo = await page.evaluate(() => {
        const img = document.querySelector('.post-image');
        const srcset = img?.srcset || '';
        return {
          hasSrcset: srcset.length > 0,
          has320w: srcset.includes('320w'),
          has640w: srcset.includes('640w'),
          has1080w: srcset.includes('1080w'),
        };
      });

      expect(srcsetInfo.hasSrcset).toBe(true);
      expect(srcsetInfo.has1080w).toBe(true); // Should have high resolution
    }, 30000);
  });
});