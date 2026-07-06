# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Media Hero Catch is a Firefox WebExtension (Manifest V2) that detects and downloads hero media (images/videos) from webpages, with specialized Instagram support. Pure vanilla JavaScript, no framework dependencies.

## Commands

```bash
npm test                    # Unit + integration tests (skips e2e)
npm run test:all            # All tests including e2e (requires Firefox)
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # E2E tests only (Puppeteer)
npm run test:coverage       # Tests with coverage report
npm run test:watch          # Watch mode

npm run lint                # ESLint check
npm run lint:fix            # Auto-fix lint issues
npm run format              # Prettier format
npm run format:check        # Check formatting

npm run build               # Bundle src/ → dist/, package to web-ext-artifacts/*.zip
npm run start:firefox       # Bundle and launch Firefox with extension loaded
npm run validate            # Full CI check (lint + format:check + test)
```

Run a single test file: `npx jest tests/unit/config.test.js`

## Architecture

Three-component message-passing architecture:

**Popup** (`src/popup/`) → sends `PROCESS_URLS` → **Background** (`src/background/`) → sends `ANALYZE_PAGE` → **Content Script** (`src/content/`) → sends `MEDIA_DETECTED` back to Background → downloads files and sends `PROGRESS_UPDATE` to Popup.

### Key modules

- `src/shared/message-types.js` — All message type constants used for inter-component communication
- `src/shared/config.js` — Central configuration (detection thresholds, timeouts, retry settings)
- `src/shared/browser-api.js` — Browser compatibility layer (`browser` vs `chrome` API)
- `src/background/background.js` — Orchestrator: tab lifecycle, message routing, download triggers
- `src/background/download-queue.js` — Sequential download queue with exponential backoff retry (3 attempts)
- `src/content/detectors/detector-registry.js` — Routes to site-specific detector (Instagram) or generic
- `src/content/detectors/generic-detector.js` — Scores media by area with viewport/quality bonuses, min 200px
- `src/content/detectors/instagram-detector.js` — Handles posts, carousels (up to 10 items), reels
- `src/content/utils/dom-analyzer.js` — DOM traversal helpers used by detectors
- `src/content/utils/media-extractor.js` — Extracts URLs from srcset, background-image, and video sources

### Adding a new site-specific detector

Register it in `detector-registry.js` following the Instagram detector pattern. Each detector must implement `detect()` returning an array of media objects.

## Build System

Source files (`src/`) use ES modules and are bundled by esbuild (`scripts/build.js`) into IIFE format under `dist/`. The build script also patches `manifest.json`: it updates script paths to the bundled files and drops `web_accessible_resources` (no longer needed once bundled). `web-ext` then packages `dist/` into a `.zip` under `web-ext-artifacts/`.

When running `npm run start:firefox`, the build runs first automatically. The `src/` files are the source of truth — never edit `dist/` directly.

## Code Style

- ESLint enforces: max complexity 10, max function length 50 lines, prefer const/arrow/template literals
- Prettier: single quotes, 2-space indent, trailing commas (ES5), 80 char width
- Unused variables prefixed with `_` are allowed
- `console.log` is banned; use `console.warn` or `console.error`
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`

## Testing

- Jest with jsdom environment, Babel transpiling for Firefox 115
- Module alias: `@/` maps to `src/`
- Global test setup in `tests/setup.js` mocks the entire `browser` API
- Test fixtures in `test-fixtures/` (mock HTML pages)
- Coverage thresholds: 90% minimum on statements, branches, functions, and lines
- All tests are fully isolated — no network calls
