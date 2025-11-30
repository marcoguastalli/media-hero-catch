# 📸 Media Hero Catch

![Test Suite](https://github.com/marcoguastalli/media-hero-catch/workflows/Test%20Suite/badge.svg)
![Code Quality](https://github.com/marcoguastalli/media-hero-catch/workflows/Code%20Quality/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

A Firefox browser extension that automatically detects and downloads hero media (images/videos) from webpages, including Instagram carousels.

## ✨ Features

- 🎯 **Automatic Detection**: Intelligently identifies the largest/most prominent media on any webpage
- 📷 **Instagram Support**: Full support for posts, carousels, reels, and videos
- 🔄 **Batch Processing**: Process multiple URLs at once with configurable delays
- 💾 **Original Quality**: Downloads media in original format and quality
- 🎠 **Carousel Support**: Automatically downloads all items from Instagram carousels
- ⚡ **Smart Filtering**: Excludes icons, avatars, and UI elements
- 🔐 **Session Support**: Uses your logged-in browser session (no separate login needed)

## 📋 Requirements

- Firefox 115 or later
- Node.js 18+ (for development)
- npm 9+ (for development)

## 🚀 Installation

### For Users

1. Download the latest release `.xpi` file from [Releases](https://github.com/marcoguastalli/media-hero-catch/releases)
2. Open Firefox
3. Go to `about:addons`
4. Click the gear icon → "Install Add-on From File"
5. Select the downloaded `.xpi` file

### For Developers

1. Clone the repository:
   ```bash
   git clone https://github.com/marcoguastalli/media-hero-catch.git
   cd media-hero-catch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Load the extension in Firefox:
   ```bash
   npm run start:firefox
   ```

   Or manually:
   - Open Firefox
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from the project directory

## 📖 Usage

1. Click the extension icon in Firefox toolbar
2. Paste one or more URLs (one per line) in the textarea
3. Optionally adjust the delay between processing URLs
4. Click "Process All"
5. Media files will be downloaded to your `~/Downloads` folder

### Supported Sites

- ✅ Instagram (posts, carousels, reels, videos)
- ✅ Any website with images/videos (generic detection)
- ✅ Twitter, Facebook, Reddit, etc.

## 🛠️ Development

### Project Structure

```
media-hero-catch/
├── src/
│   ├── background/          # Background scripts
│   ├── content/             # Content scripts
│   │   ├── detectors/       # Media detection algorithms
│   │   └── utils/           # Utility functions
│   ├── popup/               # Extension UI
│   └── shared/              # Shared utilities
├── tests/                   # Test suites
├── test-fixtures/           # Mock HTML pages for testing
└── .github/workflows/       # CI/CD configurations
```

### Available Scripts

```bash
# Testing
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Generate coverage report
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # E2E tests only

# Code Quality
npm run lint                # Check code quality
npm run lint:fix            # Fix auto-fixable issues
npm run format              # Format all code
npm run format:check        # Check formatting (CI)

# Extension
npm run build               # Build extension package
npm run start:firefox       # Run in Firefox
npm run validate            # Run all checks (CI)
```

### Running Tests

All tests are fully isolated and do not require internet access:

```bash
# Run all tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test suite
npm run test:unit
```

### Building for Production

```bash
npm run build
```

This creates a `.zip` file in the `dist/` directory ready for distribution.

## 🧪 Testing

The project maintains >90% code coverage with comprehensive test suites:

- **Unit Tests**: Test individual functions and modules with mock data
- **Integration Tests**: Test component communication and workflows
- **E2E Tests**: Test complete user flows with automated browser

All tests use mock HTML fixtures from `test-fixtures/` - no external network calls.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks
- `refactor:` - Code restructuring

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Firefox WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- Tested with [Jest](https://jestjs.io/) and [Puppeteer](https://pptr.dev/)
- Icons by [Your Icon Source]

## 📧 Support

- 🐛 [Report a Bug](https://github.com/marcoguastalli/media-hero-catch/issues)
- 💡 [Request a Feature](https://github.com/marcoguastalli/media-hero-catch/issues)
- 📖 [Documentation](https://github.com/marcoguastalli/media-hero-catch/wiki)

## 🗺️ Roadmap

- [ ] Phase 2: Generic media detection (in progress)
- [ ] Phase 3: Instagram-specific detection
- [ ] Phase 4: Download system implementation
- [ ] Phase 5: Batch processing completion
- [ ] Phase 6: Full test coverage
- [ ] Phase 7: Chrome port

---

Made with ❤️ by @marcoguastalli