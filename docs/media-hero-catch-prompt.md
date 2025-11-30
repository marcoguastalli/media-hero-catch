# Media Hero Catch - Firefox Extension

## Context/Role
- I need a Firefox browser extension that automatically detects and downloads hero media (images or videos) from webpages
- By hero media I mean the biggest picture or video on the page
- For example, if I provide an Instagram URL, the hero image/video is immediately apparent
  - In Instagram, apart from the hero image, there is an arrow control that allows moving right (or left) to the next image/video in the carousel
- The format is maintained - no conversions are applied
- Images and videos are downloaded to the ~/Downloads folder with their original filenames

## Task
- The extension is JavaScript-based and runs as a Firefox WebExtension
- The DOM is analyzed and the hero media (image/video) or carousel is detected
- All detected media files are downloaded to disk automatically
- Batch processing: multiple URLs can be processed sequentially

## Project Structure
```
media-hero-catch/
├── manifest.json (Firefox WebExtension Manifest v2)
├── src/
│   ├── background/
│   │   ├── background.js (download manager, message handler)
│   │   └── download-queue.js (batch download orchestration)
│   ├── content/
│   │   ├── content-script.js (page injection handler)
│   │   ├── detectors/
│   │   │   ├── generic-detector.js (universal algorithm)
│   │   │   ├── instagram-detector.js (Instagram-specific)
│   │   │   └── detector-registry.js (detector selection)
│   │   └── utils/
│   │       ├── dom-analyzer.js (DOM traversal utilities)
│   │       └── media-extractor.js (URL extraction)
│   ├── popup/
│   │   ├── popup.html (UI for batch URLs)
│   │   ├── popup.js (handles user input)
│   │   └── popup.css
│   └── shared/
│       ├── browser-api.js (browser compatibility layer)
│       ├── config.js (thresholds, patterns, delays)
│       └── message-types.js (communication constants)
├── tests/
│   ├── unit/
│   │   ├── detectors/
│   │   │   ├── generic-detector.test.js
│   │   │   └── instagram-detector.test.js
│   │   ├── dom-analyzer.test.js
│   │   ├── media-extractor.test.js
│   │   └── download-queue.test.js
│   ├── integration/
│   │   ├── batch-processing.test.js
│   │   ├── download-queue.test.js
│   │   └── content-background-communication.test.js
│   └── e2e/
│       ├── instagram-flow.test.js
│       ├── generic-sites.test.js
│       └── batch-urls.test.js
├── test-fixtures/
│   ├── mock-pages/
│   │   ├── instagram-post.html
│   │   ├── instagram-carousel.html
│   │   ├── instagram-video.html
│   │   ├── generic-article.html
│   │   ├── generic-with-video.html
│   │   └── no-hero-media.html
│   └── expected-results/
│       └── detection-results.json
├── .github/
│   └── workflows/
│       ├── test.yml (CI: run all tests on push)
│       └── lint.yml (CI: code quality checks)
├── docs/
│   ├── INSTALLATION.md
│   ├── ARCHITECTURE.md
│   ├── TESTING.md
│   ├── MANUAL_TESTING.md (real Instagram testing guide)
│   └── CONTRIBUTING.md
├── package.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
├── LICENSE (MIT)
└── README.md
```

## Specifications

### Every link to a webpage with an image, video or carousel is defined as: **target path**

### User Interface Options
- **Primary Mode**: Popup with textarea
  - User opens extension popup
  - Pastes one or multiple target paths (one per line)
  - Clicks "Process All" button
  - Extension processes each URL sequentially
  - Real-time progress shown in popup
  - Browser notification when batch completes

### Batch Processing
- Multiple URLs can be pasted in the popup textarea (one per line)
- URLs are automatically deduplicated before processing
- Each URL is opened in a background tab, analyzed, media downloaded, then tab closed
- Configurable delay between processing URLs (default: 2 seconds)
- Progress indicator shows: X/Y URLs processed
- Failed URLs (login required, unreachable, no media found) are skipped automatically
- Processing continues with next URL after failure
- Popup stays open during processing and shows live updates
- Browser notification sent when all URLs complete

### Media Detection Priority
1. **Instagram-specific detection** (when domain matches)
   - Single image posts
   - Single video posts
   - Carousel posts (multiple images/videos)
   - Reels (video content)
   - All carousel items downloaded automatically
2. **Generic detection algorithm** (fallback for all other sites)
   - Multi-stage detection: videos first, then images, then background images
   - Size-based scoring with viewport visibility bonus
   - Filters out icons, avatars, UI elements (<100x100px)
   - Always selects highest resolution available from srcset

### File Naming
- Original filename is preserved from the source URL
- Downloaded files saved directly to ~/Downloads folder
- Carousel items: append _1, _2, _3, etc. to filename
  - Example: `FvXa8c6dVGH_1.jpg`, `FvXa8c6dVGH_2.mp4`
- If original filename unavailable: `media_{timestamp}_{random}.{ext}`
- Browser handles filename conflicts automatically (adds (1), (2), etc.)

### Carousel Handling
- All carousel items are detected and downloaded automatically
- No user prompt or selection required
- Items downloaded sequentially to preserve order
- File naming includes position indicator (_1, _2, etc.)

### Video Format
- Original quality downloaded as-is
- No transcoding or conversion
- Direct video files only (MP4, WebM, etc.)
- Streaming videos (HLS/DASH) not supported in MVP

### Media Quality
- Always download highest resolution available
- Parse srcset attributes to find largest image
- For Instagram: extract highest quality source URLs

### Error Handling
- **Login required**: Skip URL, log error, continue to next
- **URL unreachable**: Skip URL, log error, continue to next
- **No media found**: Skip URL, log warning, continue to next
- **Session expired**: Detect login wall, skip URL, continue to next
- **Download failure**: Retry 3 times with exponential backoff (2s, 4s, 8s), then fail and continue
- **Network errors**: Retry with backoff, then skip

### Content Script Injection Timing
- Generic sites: Use MutationObserver to detect when images finish loading
- Instagram: Site-specific timing (wait for known content structure)
- Configurable timeout for page analysis (default: 10 seconds)

## Quality Criteria

### Technology Stack (All Open Source)
- **Firefox WebExtensions API** (Mozilla Public License)
- **JavaScript ES6+** (ECMAScript standard)
- **Jest** (MIT) - Unit & Integration testing
- **jsdom** (MIT) - DOM simulation for unit tests
- **Puppeteer** (Apache 2.0) - E2E browser automation with Firefox
- **ESLint** (MIT) - Code quality
- **Prettier** (MIT) - Code formatting
- **web-ext** (Mozilla) - Firefox extension testing/building
- **GitHub Actions** - CI/CD automation

### Test Coverage Requirements
All code must be covered by:

#### Unit Tests
- Generic detector algorithm with mock DOM
- Instagram detector with fixture HTML
- DOM analyzer utilities
- Media URL extraction logic
- Download queue management
- File naming utilities
- URL parsing and validation
- Duplicate URL detection
- All tests use mock HTML fixtures from test-fixtures/
- **No internet access required for any tests**
- **Tests are fully isolated and deterministic**

#### Integration Tests
- Extension component communication (popup ↔ background ↔ content)
- Batch processing workflow
- Download flow with queue
- Settings persistence
- Error handling and retry logic
- Progress tracking and updates

#### E2E Tests
- Load extension in automated Firefox browser (Puppeteer)
- Visit mock HTML pages from test-fixtures/
- Verify correct media detection on various page types
- Confirm download API calls made correctly
- Test batch URL processing flow
- Verify duplicate URL handling
- Test error scenarios with unreachable pages
- **All E2E tests use local mock HTML files**
- **No real Instagram or external sites accessed during automated tests**

### Manual Testing Documentation
- Separate guide (MANUAL_TESTING.md) for testing with real Instagram URLs
- Explains how to verify extension works on live sites
- Not part of automated test suite
- Used for validation before releases

### Code Quality
- ESLint configured for ES6+ with Firefox WebExtensions rules
- Prettier for consistent code formatting
- All functions documented with JSDoc comments
- Clear variable naming conventions
- No unused variables or imports
- Maximum function complexity: 10 (cyclomatic complexity)

### GitHub Actions CI/CD
- **Automated on every push and pull request:**
  - Run full test suite (unit + integration + e2e)
  - Run ESLint for code quality
  - Run Prettier check for formatting
  - Build extension package
  - Report test coverage
- **Configuration files:**
  - `.github/workflows/test.yml` - Main test workflow
  - `.github/workflows/lint.yml` - Code quality workflow
- **Test environment:** Ubuntu latest with Node.js LTS
- **Status badges:** Display test status in README.md

## Generic Detection Algorithm

### Multi-Stage Detection Process

**Stage 1: Video Detection**
- Find all `<video>` elements in DOM
- Calculate visible area (width × height)
- Filter out small videos (< 200x200px)
- Return video with largest area

**Stage 2: Image Detection** (if no video found)
- Find all `<img>` elements in DOM
- Filter out:
  - Icons (< 100x100px)
  - Avatar images (circular, small)
  - UI elements (toolbar, navigation icons)
  - Advertisement images (by common class names: 'ad', 'sponsor', etc.)
- Calculate effective size using naturalWidth/naturalHeight (preferred) or rendered dimensions
- Extract highest resolution from srcset if available
- Check viewport intersection (prefer visible images)
- Apply scoring system (see below)
- Return image with highest score

**Stage 3: Background Images** (if no img elements found)
- Find all elements with background-image CSS property
- Extract URL from computed style
- Apply same size filtering as images
- Return largest background image

### Scoring System
```
score = (width × height) × viewportBonus × qualityBonus

viewportBonus:
  - Fully visible in viewport: 1.5
  - Partially visible: 1.2
  - Not visible: 1.0

qualityBonus:
  - naturalWidth > 1920px: 1.3
  - naturalWidth > 1280px: 1.1
  - else: 1.0
```

### Size Thresholds
- Minimum hero image size: 200x200px
- Icon/avatar filter: < 100x100px excluded
- Video minimum size: 200x200px

## Instagram-Specific Detection

### Post Types Supported
- Single image post
- Single video post
- Carousel (multiple images/videos mixed)
- Reels (video content)

### Detection Selectors (Examples - adjust based on actual Instagram DOM)
```javascript
{
  carousel: 'article div[role="button"] img, article video',
  singleImage: 'article img[style*="object-fit"]',
  singleVideo: 'article video',
  reels: 'video[playsinline]',
  carouselNavigation: 'button[aria-label*="Next"]'
}
```

### Carousel Processing
1. Detect carousel container element
2. Find all media elements (not just currently visible)
3. Extract all src/srcset URLs for images, src for videos
4. Parse srcset to get highest resolution
5. Download all items sequentially with position numbering
6. File naming: `{original}_1.ext`, `{original}_2.ext`, etc.

## Communication Flow

```
┌─────────┐         ┌──────────────┐         ┌────────────┐
│  Popup  │────────▶│   Background │◀────────│  Content   │
│   UI    │         │    Script    │         │   Script   │
└─────────┘         └──────────────┘         └────────────┘
     │                      │                       │
     │ 1. Send URLs array  │                       │
     ├─────────────────────▶                       │
     │                      │                       │
     │                      │ 2. Open tab + inject │
     │                      ├──────────────────────▶
     │                      │                       │
     │                      │ 3. Media URLs array  │
     │                      ◀──────────────────────┤
     │                      │                       │
     │                      │ 4. Download files    │
     │                      │ (browser.downloads)  │
     │                      │                       │
     │ 5. Progress update  │                       │
     ◀─────────────────────┤                       │
     │                      │                       │
     │                      │ 6. Close tab         │
     │                      ├──────────────────────▶
     │                      │                       │
     │ 7. Process next URL │                       │
     │ (after delay)        │                       │
```

## Message Types
```javascript
// popup → background
{ type: 'PROCESS_URLS', urls: [...], delay: 2 }

// background → content
{ type: 'ANALYZE_PAGE', url: '...' }

// content → background
{ type: 'MEDIA_DETECTED', mediaUrls: [...], originalFilenames: [...] }

// background → popup
{ type: 'PROGRESS_UPDATE', current: 3, total: 10, status: 'success' }

// background → popup
{ type: 'BATCH_COMPLETE', successful: 8, failed: 2 }
```

## Configuration (src/shared/config.js)
```javascript
{
  batchProcessing: {
    defaultDelay: 2, // seconds between URLs
    maxDelay: 30,
    minDelay: 0
  },
  detection: {
    minHeroSize: 200, // pixels
    iconThreshold: 100, // pixels
    pageTimeout: 10000, // ms
    viewportBonusVisible: 1.5,
    viewportBonusPartial: 1.2,
    qualityBonusHD: 1.3,
    qualityBonusSD: 1.1
  },
  downloads: {
    retryAttempts: 3,
    retryDelays: [2000, 4000, 8000] // ms
  }
}
```

## Firefox Permissions (manifest.json)
```json
{
  "permissions": [
    "downloads",
    "tabs",
    "activeTab",
    "<all_urls>",
    "webRequest"
  ]
}
```

## Browser Compatibility Layer
```javascript
// src/shared/browser-api.js
export const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Usage in all modules:
import { browserAPI } from '../shared/browser-api.js';
browserAPI.downloads.download({...});
```
This ensures future Chrome port requires minimal changes.

## Development Phases

### Phase 1: Core Infrastructure ✓
- Project setup with npm, Jest, ESLint, Prettier
- Basic manifest.json for Firefox
- Message passing architecture (popup ↔ background ↔ content)
- Browser compatibility layer
- Unit test framework with mock DOM (jsdom)
- GitHub Actions workflows (.github/workflows/)

### Phase 2: Generic Detection ✓
- Generic detector algorithm implementation
- DOM analyzer utilities (size calculation, viewport check)
- Media extractor (URL extraction, srcset parsing)
- Scoring system for hero media selection
- Unit tests with mock HTML fixtures
- Test fixtures: generic-article.html, generic-with-video.html

### Phase 3: Instagram Support ✓
- Instagram-specific detector implementation
- Carousel detection logic
- High-resolution URL extraction for Instagram
- Instagram unit tests with fixtures
- Test fixtures: instagram-post.html, instagram-carousel.html, instagram-video.html

### Phase 4: Download System ✓
- Background download manager
- Queue system for carousel items
- Filename preservation and collision handling
- Retry logic with exponential backoff
- Integration tests for download flow

### Phase 5: Batch Processing ✓
- Multi-URL input handling in popup
- URL deduplication logic
- Progress tracking UI
- Tab management (open, inject, close)
- Configurable delay between URLs
- Browser notification on completion
- E2E tests for batch workflow

### Phase 6: Polish & Testing ✓
- Full E2E test suite with Puppeteer + Firefox
- Comprehensive error handling
- Complete documentation (README, INSTALLATION, ARCHITECTURE, TESTING)
- Manual testing guide (MANUAL_TESTING.md)
- Code coverage reporting
- Final GitHub Actions integration

### Phase 7: Chrome Port (Future)
- Add Chrome manifest.json compatibility
- Test browser-api.js wrapper with Chrome
- Verify downloads work in Chrome
- Update documentation for Chrome installation
- Add Chrome to CI/CD testing

## Response Format
- Generate complete, production-ready code for each phase
- All code must be immediately runnable with no placeholders
- Include complete test files for each module
- Provide setup instructions for running tests locally
- Document any assumptions or design decisions

## Verification Requirements
- Review all code for errors, duplications, inconsistencies before providing
- Ensure no unused imports, variables, or functions
- Run mental simulation of test suite to verify logic
- Check that all file paths in imports are correct
- Verify manifest.json permissions are minimal and necessary
- Confirm all async operations have proper error handling
- Validate that all tests are deterministic and isolated (no external dependencies)

## License
- MIT License
- Include LICENSE file in repository root

## Repository
- GitHub repository name: **media-hero-catch**
- Include README.md with:
  - Project description
  - Installation instructions
  - Usage guide
  - Development setup
  - Test commands
  - CI/CD status badges
  - License information
  - Contributing guidelines

## Success Criteria
- Extension successfully detects hero media on Instagram posts, carousels, and generic websites
- All carousel items download automatically with correct numbering
- Batch processing handles 10+ URLs reliably with configurable delays
- Failed URLs are skipped gracefully without stopping batch
- All tests pass in GitHub Actions on every push
- Test coverage > 90% for all core modules
- Extension runs without errors in Firefox
- Original filenames preserved in ~/Downloads
- No external dependencies during test execution (all tests use fixtures)
- Code quality passes ESLint and Prettier checks
- Documentation is complete and accurate