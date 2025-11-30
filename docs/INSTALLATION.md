# Installation Guide

Complete guide for installing and setting up Media Hero Catch.

---

## Table of Contents

- [For Users](#for-users)
- [For Developers](#for-developers)
- [Troubleshooting](#troubleshooting)
- [System Requirements](#system-requirements)

---

## For Users

### Firefox Installation

#### Option 1: From Release File (Recommended)

1. **Download the Extension**
   - Go to [Releases](https://github.com/YOUR_USERNAME/media-hero-catch/releases)
   - Download the latest `.xpi` file

2. **Install in Firefox**
   - Open Firefox
   - Go to `about:addons` (or Menu → Add-ons)
   - Click the gear icon ⚙️
   - Select "Install Add-on From File..."
   - Choose the downloaded `.xpi` file
   - Click "Add" when prompted

3. **Verify Installation**
   - Extension icon should appear in toolbar
   - Click icon to open popup
   - Extension is ready to use!

#### Option 2: Temporary Installation (for testing)

1. **Open Debug Page**
   - Go to `about:debugging#/runtime/this-firefox`

2. **Load Extension**
   - Click "Load Temporary Add-on..."
   - Navigate to extension folder
   - Select `manifest.json`

3. **Note**: Temporary extensions are removed when Firefox closes

### Permissions Explained

The extension requires these permissions:

- **Downloads**: To save media files to your Downloads folder
- **Tabs**: To open URLs in background tabs for analysis
- **Active Tab**: To analyze the current page
- **All URLs**: To work on any website (Instagram, news sites, etc.)
- **Web Request**: To intercept and analyze media requests

---

## For Developers

### Prerequisites

- **Node.js**: Version 18 or later
- **npm**: Version 9 or later
- **Firefox**: Version 115 or later
- **Git**: For cloning the repository

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/media-hero-catch.git
cd media-hero-catch
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages:
- Jest (testing)
- ESLint (code quality)
- Prettier (formatting)
- Puppeteer (E2E testing)
- web-ext (Firefox extension tool)

### Step 3: Verify Setup

```bash
# Run tests
npm test

# Check code quality
npm run lint

# Check formatting
npm run format:check
```

All checks should pass ✅

### Step 4: Load Extension in Firefox

#### Method 1: Using web-ext (Recommended)

```bash
npm run start:firefox
```

This automatically:
- Launches Firefox with a clean profile
- Loads the extension
- Opens a test tab
- Auto-reloads on file changes

#### Method 2: Manual Loading

1. Open Firefox
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select `manifest.json` from project folder

### Step 5: Development Workflow

```bash
# Watch tests during development
npm run test:watch

# Run specific test file
npm run test:unit -- dom-analyzer

# Check test coverage
npm run test:coverage

# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Build extension package
npm run build
```

### File Structure

```
media-hero-catch/
├── src/                    # Source code
│   ├── background/         # Background scripts
│   ├── content/            # Content scripts
│   │   ├── detectors/      # Detection algorithms
│   │   └── utils/          # Utility functions
│   ├── popup/              # Extension UI
│   └── shared/             # Shared utilities
├── tests/                  # Test suites
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── test-fixtures/          # Mock HTML pages
├── docs/                   # Documentation
└── .github/workflows/      # CI/CD configs
```

---

## Troubleshooting

### Extension Not Loading

**Problem**: Extension doesn't appear in toolbar

**Solutions**:
1. Check Firefox version (requires 115+)
2. Verify `manifest.json` is valid JSON
3. Check browser console for errors (F12)
4. Try restarting Firefox

---

### Tests Failing

**Problem**: `npm test` shows errors

**Solutions**:
1. Delete `node_modules` and run `npm install` again
2. Check Node.js version: `node --version` (should be 18+)
3. Clear Jest cache: `npm test -- --clearCache`
4. Check for syntax errors in test files

---

### Downloads Not Working

**Problem**: Files not downloading

**Solutions**:
1. Check Firefox Downloads settings
2. Verify Downloads folder exists and is writable
3. Check extension has "downloads" permission
4. Look for errors in background script console

---

### Instagram Detection Not Working

**Problem**: Extension doesn't detect Instagram media

**Solutions**:
1. **Log into Instagram** - Extension uses your session
2. Check URL is a valid post URL (e.g., `/p/ABC123/`)
3. Instagram may have changed their HTML structure
4. Check content script console for errors

---

### Build Errors

**Problem**: `npm run build` fails

**Solutions**:
1. Ensure all tests pass first: `npm test`
2. Check for linting errors: `npm run lint`
3. Verify all files are saved
4. Check disk space

---

### Permission Errors

**Problem**: "Permission denied" errors

**Solutions**:

**On Linux/Mac**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules

# Make scripts executable
chmod +x scripts/*
```

**On Windows**:
- Run terminal as Administrator
- Check antivirus isn't blocking

---

### Extension Crashes

**Problem**: Extension stops working

**Solutions**:
1. Check browser console (F12) for errors
2. Check background script console:
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Inspect" on extension
3. Reload extension
4. Clear browser cache and restart

---

### Network Errors During Tests

**Problem**: E2E tests fail with network errors

**Solutions**:
1. Tests should NOT require internet (they use fixtures)
2. Check test-fixtures exist
3. Verify Puppeteer installed correctly
4. Try: `npm install puppeteer --force`

---

## System Requirements

### Minimum Requirements

- **OS**: Windows 10, macOS 10.15, or Linux (Ubuntu 20.04+)
- **RAM**: 4 GB
- **Disk**: 500 MB free space
- **Browser**: Firefox 115+

### Recommended Requirements

- **OS**: Latest version
- **RAM**: 8 GB or more
- **Disk**: 1 GB free space
- **Browser**: Firefox latest stable version

### Development Requirements

- **Node.js**: 18.x or 20.x LTS
- **npm**: 9.x or later
- **Git**: 2.x or later
- **Code Editor**: VS Code recommended

---

## Uninstallation

### Remove Extension

1. Open Firefox
2. Go to `about:addons`
3. Find "Media Hero Catch"
4. Click "..." menu
5. Select "Remove"

### Clean Development Setup

```bash
# Remove dependencies
rm -rf node_modules/

# Remove build artifacts
rm -rf dist/
rm -rf coverage/

# Remove temp files
rm -rf .cache/
rm -rf dev-profile/
```

---

## Next Steps

After installation:

1. **Read the [User Guide](../README.md)** - Learn how to use the extension
2. **Check [Architecture Docs](ARCHITECTURE.md)** - Understand how it works
3. **Read [Testing Guide](TESTING.md)** - Learn how to test
4. **See [Contributing Guide](CONTRIBUTING.md)** - Start contributing!

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/media-hero-catch/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/media-hero-catch/discussions)
- **Documentation**: [Docs Folder](../docs/)

---

## Updating

### For Users

When a new version is released:
1. Download new `.xpi` file
2. Install over existing version
3. Firefox handles the upgrade automatically

### For Developers

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Run tests
npm test

# Reload extension in Firefox
```

---

**Installation complete!** 🎉 Ready to start catching hero media!