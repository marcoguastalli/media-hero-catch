# Architecture Documentation

System architecture and design decisions for Media Hero Catch.

---

## Overview

Media Hero Catch is a Firefox WebExtension that detects and downloads hero media from webpages. It uses a three-component architecture:

1. **Popup UI** - User interface
2. **Background Script** - Orchestration and downloads
3. **Content Script** - DOM analysis and detection

---

## Component Architecture

```
┌─────────────┐
│   Popup UI  │ (User interaction)
└──────┬──────┘
       │ Messages
       ▼
┌─────────────────┐
│ Background      │ (Orchestration)
│ Script          │
│  • Download     │
│    Queue        │
│  • Tab          │
│    Management   │
└──────┬──────────┘
       │ Messages
       ▼
┌─────────────────┐
│ Content Script  │ (Injected into pages)
│  • Detector     │
│    Registry     │
│  • Instagram    │
│    Detector     │
│  • Generic      │
│    Detector     │
└─────────────────┘
```

---

## Message Flow

### Batch Processing Flow

```
User enters URLs in popup
        ↓
Popup → PROCESS_URLS → Background
        ↓
Background opens tab for URL #1
        ↓
Background → ANALYZE_PAGE → Content Script
        ↓
Content Script detects media
        ↓
Content → MEDIA_DETECTED → Background
        ↓
Background creates download queue
        ↓
Downloads files with retry logic
        ↓
Background → URL_PROCESSED → Popup
        ↓
Background closes tab
        ↓
Wait configured delay
        ↓
Repeat for URL #2, #3, etc.
        ↓
Background → BATCH_COMPLETE → Popup
        ↓
Browser notification shown
```

---

## Core Modules

### 1. Popup UI (`src/popup/`)

**Purpose**: User interface for batch URL processing

**Files**:
- `popup.html` - UI structure
- `popup.css` - Styling
- `popup.js` - User interaction logic

**Responsibilities**:
- Accept user input (URLs, delay)
- Display progress
- Show results
- Persist settings (localStorage)

**State**:
```javascript
{
  isProcessing: boolean,
  currentBatch: {
    total: number,
    current: number,
    urlItems: Map<url, DOMElement>
  }
}
```

---

### 2. Background Script (`src/background/`)

**Purpose**: Orchestrate processing and downloads

**Files**:
- `background.js` - Main orchestrator
- `download-queue.js` - Download management

**Responsibilities**:
- Tab lifecycle management
- Message routing
- Download orchestration
- Progress tracking
- Error handling

**State**:
```javascript
{
  currentBatch: {
    urls: string[],
    delay: number,
    total: number,
    current: number,
    results: Array
  },
  isProcessing: boolean,
  downloadQueue: DownloadQueue
}
```

---

### 3. Content Script (`src/content/`)

**Purpose**: Analyze pages and detect media

**Files**:
- `content-script.js` - Main content script
- `detectors/` - Detection algorithms
  - `detector-registry.js` - Detector selection
  - `instagram-detector.js` - Instagram-specific
  - `generic-detector.js` - Universal detection
- `utils/` - Helper utilities
  - `dom-analyzer.js` - DOM manipulation
  - `media-extractor.js` - URL extraction

**Responsibilities**:
- Inject into target pages
- Analyze DOM structure
- Detect hero media
- Extract media URLs
- Report findings to background

---

## Detection System

### Detector Registry

Selects appropriate detector based on hostname:

```javascript
if (hostname.includes('instagram.com')) {
  return InstagramDetector;
} else {
  return GenericDetector;
}
```

### Instagram Detector

**Detection Strategy**:
1. Identify post type (single/carousel/video/reel)
2. Find article container
3. Extract media from specific selectors
4. Filter out profile pics and UI icons
5. Return all carousel items

**Post Types**:
- Single image: 1 image element
- Single video: 1 video element
- Carousel: Multiple images/videos
- Reel: Video with playsinline attribute

### Generic Detector

**Multi-Stage Algorithm**:

```
Stage 1: Video Detection
  ↓
  Find all <video> elements
  ↓
  Filter by size (>200x200px)
  ↓
  Score by area × viewport bonus × quality bonus
  ↓
  Return highest scoring video

Stage 2: Image Detection (if no video)
  ↓
  Find all <img> elements
  ↓
  Filter out icons (<100x100px)
  ↓
  Filter out ads (by class name)
  ↓
  Extract highest resolution from srcset
  ↓
  Score by area × bonuses
  ↓
  Return highest scoring image

Stage 3: Background Images (fallback)
  ↓
  Find elements with background-image CSS
  ↓
  Extract URL from style
  ↓
  Score and return best match
```

**Scoring Formula**:
```
score = area × viewportBonus × qualityBonus

where:
  area = width × height
  viewportBonus = 1.0 - 1.5 (based on visibility)
  qualityBonus = 1.0 - 1.3 (based on resolution)
```

---

## Download System

### Download Queue

**Purpose**: Manage sequential downloads with retry logic

**Key Features**:
- Sequential processing (one at a time)
- Exponential backoff retry (2s, 4s, 8s)
- Maximum 3 retry attempts
- 60-second timeout per download
- Progress tracking

**Queue Item Structure**:
```javascript
{
  media: {
    url: string,
    filename: string,
    type: 'image' | 'video'
  },
  sourceUrl: string,
  retryCount: number,
  status: 'pending' | 'downloading' | 'completed' | 'failed'
}
```

**Retry Logic**:
```javascript
for (attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    downloadId = await browser.downloads.download({...});
    success = await waitForDownload(downloadId);
    if (success) return;
  } catch (error) {
    if (attempt < maxRetries) {
      await sleep(retryDelays[attempt]);
    } else {
      throw error;
    }
  }
}
```

---

## Configuration System

### Config Structure (`src/shared/config.js`)

```javascript
{
  batchProcessing: {
    defaultDelay: 2,        // seconds between URLs
    maxDelay: 30,
    minDelay: 0,
    tabCloseDelay: 1000     // ms after download
  },
  
  detection: {
    minHeroSize: 200,       // minimum px for hero
    iconThreshold: 100,     // max px for icons
    pageTimeout: 10000,     // page load timeout
    viewportBonusVisible: 1.5,
    viewportBonusPartial: 1.2,
    qualityBonusHD: 1.3,
    qualityBonusSD: 1.1
  },
  
  downloads: {
    retryAttempts: 3,
    retryDelays: [2000, 4000, 8000],
    conflictAction: 'uniquify'
  },
  
  instagram: {
    domain: 'instagram.com',
    carouselWaitDelay: 500,
    maxCarouselItems: 10
  }
}
```

---

## Message Types

### Message Structure

All messages follow this format:
```javascript
{
  type: string,           // Message type constant
  data: object,           // Message payload
  timestamp: number       // Unix timestamp
}
```

### Message Types

**Popup → Background**:
- `PROCESS_URLS` - Start batch processing
- `GET_SETTINGS` - Retrieve saved settings
- `CANCEL_BATCH` - Cancel current batch

**Background → Content**:
- `ANALYZE_PAGE` - Start page analysis
- `PING_CONTENT_SCRIPT` - Check if ready

**Content → Background**:
- `MEDIA_DETECTED` - Send detected media
- `ANALYSIS_FAILED` - Report analysis failure
- `CONTENT_SCRIPT_READY` - Script loaded

**Background → Popup**:
- `PROGRESS_UPDATE` - Update progress bar
- `URL_PROCESSED` - Single URL complete
- `BATCH_COMPLETE` - All URLs processed

---

## Data Flow

### Media Object Structure

```javascript
{
  url: string,              // Absolute URL
  filename: string,         // Original filename
  type: 'image' | 'video',
  score: number,            // Detection score
  element: string,          // 'img' | 'video' | 'div'
  timestamp: number,
  
  // Carousel only:
  position?: number,        // 1-indexed
  totalItems?: number       // Total in carousel
}
```

### Batch Result Structure

```javascript
{
  url: string,
  status: 'success' | 'failed',
  mediaCount: number,
  downloadedCount: number,
  failedCount: number,
  downloads: Array<{
    media: MediaObject,
    status: 'completed' | 'failed',
    downloadId?: number,
    error?: string
  }>
}
```

---

## Browser Compatibility

### API Compatibility Layer

```javascript
// src/shared/browser-api.js
export const browserAPI = 
  typeof browser !== 'undefined' ? browser : chrome;
```

**Firefox Uses**: `browser.*` (Promise-based)
**Chrome Uses**: `chrome.*` (Callback-based)

Our layer abstracts this difference for future Chrome support.

---

## Error Handling Strategy

### Levels of Error Handling

1. **UI Level** (Popup)
   - User-friendly messages
   - Actionable errors
   - No technical jargon

2. **Processing Level** (Background)
   - Skip failed URLs
   - Continue batch processing
   - Log errors for debugging
   - Retry downloads

3. **Detection Level** (Content)
   - Graceful degradation
   - Return empty if no media
   - Classify error types

### Error Types

```javascript
{
  NETWORK_ERROR: Network/connectivity issues
  PARSE_ERROR: Invalid HTML/data
  DOWNLOAD_FAILED: Download couldn't complete
  NO_MEDIA_FOUND: No hero media detected
  LOGIN_REQUIRED: Page requires authentication
  TIMEOUT: Operation took too long
  UNKNOWN: Unexpected error
}
```

---

## Performance Considerations

### Memory Management

- Content scripts cleanup after analysis
- Download queue cleared after processing
- No persistent state between batches

### Network Optimization

- Sequential downloads (avoid rate limiting)
- Configurable delays between URLs
- Retry with exponential backoff
- Connection reuse where possible

### Browser Resource Usage

- Tabs opened in background (not active)
- Tabs closed immediately after processing
- No excessive DOM manipulation
- Minimal memory footprint

---

## Security Considerations

### Permissions

- Only request necessary permissions
- No access to sensitive data
- Downloads use browser's security model
- No external API calls

### Data Privacy

- No data sent to external servers
- No analytics or tracking
- No user data collection
- Settings stored locally only

### Content Security

- No eval() or similar unsafe functions
- Strict CSP in manifest
- Input validation on all URLs
- XSS protection via CSP

---

## Testing Strategy

### Test Pyramid

```
       E2E Tests
      (Puppeteer)
     ▲
    ▲ ▲
   ▲   ▲
  ▲     ▲
 ▲ Integration Tests ▲
▲         (Jest)      ▲
▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    Unit Tests
      (Jest)
```

**Unit Tests**: 70+ tests (fast, isolated)
**Integration Tests**: 20+ tests (component interaction)
**E2E Tests**: 15+ tests (full workflow)

### Test Coverage Goals

- **Lines**: >90%
- **Functions**: >90%
- **Branches**: >90%
- **Statements**: >90%

---

## Future Enhancements

### Phase 7: Chrome Port

- Minimal changes needed
- Browser API wrapper already in place
- Different manifest format (v3)
- Same core logic

### Potential Features

- [ ] Twitter/X support
- [ ] YouTube thumbnail extraction
- [ ] Pinterest board downloads
- [ ] Custom detector plugins
- [ ] Download history
- [ ] Duplicate detection
- [ ] Format conversion options

---

## Design Decisions

### Why Sequential Downloads?

**Pros**:
- Avoid rate limiting
- Simpler error handling
- Predictable resource usage
- Better progress tracking

**Cons**:
- Slower than parallel
- Not maximizing bandwidth

**Decision**: Sequential is safer for Instagram and respectful to servers.

### Why MV2 Instead of MV3?

**Reason**: Firefox has better MV2 support. MV3 migration planned for Chrome port.

### Why No localStorage in Artifacts?

**Reason**: Claude.ai artifact restrictions. Real extension uses browser.storage.

---

## Resources

- [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)

---

**Architecture designed for**: Reliability, Maintainability, Extensibility 🏗️