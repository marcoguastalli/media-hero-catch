/**
 * E2E Test Setup
 * 
 * Configuration for end-to-end tests using Puppeteer with Firefox
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extension path (root of project)
const EXTENSION_PATH = path.resolve(__dirname, '../../');

// Test page server URL (if needed)
const TEST_SERVER_URL = 'http://localhost:8080';

/**
 * Launch Firefox with extension loaded
 * @returns {Promise<Object>} Browser and page instances
 */
export async function setupBrowser() {
  console.log('Launching Firefox with extension...');

  const browser = await puppeteer.launch({
    product: 'firefox',
    headless: false, // Can't load extensions in headless mode
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
    defaultViewport: {
      width: 1280,
      height: 720,
    },
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  return { browser, page };
}

/**
 * Close browser
 * @param {Object} browser - Puppeteer browser instance
 */
export async function teardownBrowser(browser) {
  if (browser) {
    await browser.close();
  }
}

/**
 * Load test fixture page
 * @param {Object} page - Puppeteer page instance
 * @param {string} fixtureName - Name of fixture file (e.g., 'instagram-post.html')
 * @returns {Promise<void>}
 */
export async function loadFixture(page, fixtureName) {
  const fixturePath = path.resolve(
    __dirname,
    '../../test-fixtures/mock-pages',
    fixtureName
  );
  
  await page.goto(`file://${fixturePath}`, {
    waitUntil: 'networkidle0',
  });
}

/**
 * Wait for extension to be ready
 * @param {Object} page - Puppeteer page instance
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<void>}
 */
export async function waitForExtension(page, timeout = 5000) {
  await page.waitForTimeout(2000); // Give extension time to load
}

/**
 * Get extension popup page
 * @param {Object} browser - Puppeteer browser instance
 * @returns {Promise<Object>} Popup page instance
 */
export async function getExtensionPopup(browser) {
  // Get extension ID (might vary)
  // This is a simplified version - in real tests, you'd need to find the actual extension page
  const targets = await browser.targets();
  const extensionTarget = targets.find(
    target => target.type() === 'page' && target.url().includes('moz-extension://')
  );

  if (extensionTarget) {
    return await extensionTarget.page();
  }

  throw new Error('Could not find extension popup');
}

/**
 * Mock browser.downloads.download
 * @param {Object} page - Puppeteer page instance
 * @returns {Promise<void>}
 */
export async function mockDownloads(page) {
  await page.evaluateOnNewDocument(() => {
    // Mock downloads to prevent actual file downloads during tests
    if (typeof browser !== 'undefined' && browser.downloads) {
      browser.downloads.download = async (options) => {
        console.log('[MOCK] Download:', options);
        return Math.floor(Math.random() * 10000);
      };

      browser.downloads.onChanged = {
        addListener: (callback) => {
          console.log('[MOCK] Download listener added');
        },
        removeListener: () => {
          console.log('[MOCK] Download listener removed');
        },
      };
    }
  });
}

/**
 * Wait for console message
 * @param {Object} page - Puppeteer page instance
 * @param {string} messageText - Text to wait for
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<void>}
 */
export async function waitForConsoleMessage(page, messageText, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for console message: ${messageText}`));
    }, timeout);

    const handler = (msg) => {
      if (msg.text().includes(messageText)) {
        clearTimeout(timeoutId);
        page.off('console', handler);
        resolve();
      }
    };

    page.on('console', handler);
  });
}

/**
 * Check if element exists
 * @param {Object} page - Puppeteer page instance
 * @param {string} selector - CSS selector
 * @returns {Promise<boolean>}
 */
export async function elementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get text content of element
 * @param {Object} page - Puppeteer page instance
 * @param {string} selector - CSS selector
 * @returns {Promise<string>}
 */
export async function getTextContent(page, selector) {
  return await page.$eval(selector, el => el.textContent);
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}