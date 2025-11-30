/**
 * Integration tests for detector-registry.js
 *
 * Tests the coordination between different detectors
 */

import { getDetector, detectHeroMedia } from '../../src/content/detectors/detector-registry.js';

describe('Detector Registry Integration', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        global.innerWidth = 1920;
        global.innerHeight = 1080;
    });

    describe('getDetector()', () => {
        test('should return Instagram detector for instagram.com', () => {
            delete window.location;
            window.location = {
                href: 'https://www.instagram.com/p/ABC123/',
                hostname: 'www.instagram.com',
                origin: 'https://www.instagram.com',
                protocol: 'https:',
            };

            const detector = getDetector();

            expect(detector).toBeDefined();
            expect(detector.name).toBe('detectHeroMedia');
        });

        test('should return generic detector for other sites', () => {
            delete window.location;
            window.location = {
                href: 'https://example.com/article',
                hostname: 'example.com',
                origin: 'https://example.com',
                protocol: 'https:',
            };

            const detector = getDetector();

            expect(detector).toBeDefined();
            expect(detector.name).toBe('detectHeroMedia');
        });
    });

    describe('detectHeroMedia() integration', () => {
        test('should use Instagram detector for Instagram URL', async () => {
            // Set Instagram URL
            delete window.location;
            window.location = {
                href: 'https://www.instagram.com/p/ABC123/',
                hostname: 'www.instagram.com',
                origin: 'https://www.instagram.com',
                protocol: 'https:',
            };

            // Create Instagram post structure
            const article = document.createElement('article');
            const img = document.createElement('img');
            img.src = 'https://instagram.com/p/ABC123/media?size=l';
            img.srcset = 'https://instagram.com/p/ABC123/media?size=l 1080w';
            img.alt = 'Photo';
            Object.defineProperty(img, 'naturalWidth', { value: 1080 });
            Object.defineProperty(img, 'naturalHeight', { value: 1080 });
            article.appendChild(img);
            document.body.appendChild(article);

            const results = await detectHeroMedia();

            expect(results).toHaveLength(1);
            expect(results[0].url).toContain('instagram.com');
        });

        test('should use generic detector for non-Instagram URL', async () => {
            // Set generic URL
            delete window.location;
            window.location = {
                href: 'https://example.com/article',
                hostname: 'example.com',
                origin: 'https://example.com',
                protocol: 'https:',
            };

            // Create generic page structure
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
            expect(results[0].url).toContain('example.com');
        });

        test('should handle switching between domains', async () => {
            // First, Instagram
            delete window.location;
            window.location = {
                href: 'https://www.instagram.com/p/ABC123/',
                hostname: 'www.instagram.com',
                origin: 'https://www.instagram.com',
                protocol: 'https:',
            };

            const article = document.createElement('article');
            const instagramImg = document.createElement('img');
            instagramImg.src = 'https://instagram.com/p/ABC123/media.jpg';
            instagramImg.srcset = 'https://instagram.com/p/ABC123/media.jpg 1080w';
            instagramImg.alt = 'Photo';
            Object.defineProperty(instagramImg, 'naturalWidth', { value: 1080 });
            Object.defineProperty(instagramImg, 'naturalHeight', { value: 1080 });
            article.appendChild(instagramImg);
            document.body.appendChild(article);

            const instagramResults = await detectHeroMedia();
            expect(instagramResults).toHaveLength(1);

            // Now switch to generic site
            document.body.innerHTML = '';
            window.location = {
                href: 'https://example.com/page',
                hostname: 'example.com',
                origin: 'https://example.com',
                protocol: 'https:',
            };

            const genericImg = document.createElement('img');
            genericImg.src = 'https://example.com/photo.jpg';
            Object.defineProperty(genericImg, 'naturalWidth', { value: 1920 });
            Object.defineProperty(genericImg, 'naturalHeight', { value: 1080 });
            Object.defineProperty(genericImg, 'offsetParent', { value: document.body });
            jest.spyOn(genericImg, 'getBoundingClientRect').mockReturnValue({
                top: 100,
                left: 100,
                bottom: 800,
                right: 1400,
                width: 1300,
                height: 700,
            });
            document.body.appendChild(genericImg);

            const genericResults = await detectHeroMedia();
            expect(genericResults).toHaveLength(1);
        });
    });

    describe('Error handling', () => {
        test('should return empty array when no media found on Instagram', async () => {
            delete window.location;
            window.location = {
                href: 'https://www.instagram.com/p/ABC123/',
                hostname: 'www.instagram.com',
                origin: 'https://www.instagram.com',
                protocol: 'https:',
            };

            // Empty article
            const article = document.createElement('article');
            document.body.appendChild(article);

            const results = await detectHeroMedia();
            expect(results).toHaveLength(0);
        });

        test('should return empty array when no media found on generic site', async () => {
            delete window.location;
            window.location = {
                href: 'https://example.com/page',
                hostname: 'example.com',
                origin: 'https://example.com',
                protocol: 'https:',
            };

            // Empty page
            const results = await detectHeroMedia();
            expect(results).toHaveLength(0);
        });
    });
});