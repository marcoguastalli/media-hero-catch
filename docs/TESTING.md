# Testing Guide

Complete testing documentation for Media Hero Catch.

---

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode (re-run on file changes)
npm run test:watch
```

---

## Test Structure

```
tests/
├── unit/                    # Unit tests (70+ tests)
│   ├── config.test.js
│   ├── dom-analyzer.test.js
│   ├── media-extractor.test.js
│   ├── download-queue.test.js
│   └── detectors/
│       ├── generic-detector.test.js
│       └── instagram-detector.test.js
├── integration/             # Integration tests (20+ tests)
│   ├── detector-registry.test.js
│   └── batch-processing.test.js
├── e2e/                     # End-to-end tests (15+ tests)
│   ├── setup.js
│   ├── generic-sites.test.js
│   ├── instagram-flow.test.js
│   ├── batch-urls.test.js
│   └── error-handling.test.js
└── setup.js                 # Global test setup
```

---

## Writing Tests

### Unit Test Template

```javascript
/**
 * Unit tests for module-name.js
 */

import { functionToTest } from '../../src/path/module-name.js';

describe('Module Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('functionToTest()', () => {
    test('should do something specific', () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });

    test('should handle edge case', () => {
      // Test edge cases
    });

    test('should throw error for invalid input', () => {
      expect(() => functionToTest(invalid)).toThrow();
    });
  });
});
```

### Integration Test Template

```javascript
describe('Component Integration', () => {
  test('should coordinate between components', async () => {
    // Setup multiple components
    // Trigger interaction
    // Verify all components work together
  });
});
```

### E2E Test Template

```javascript
import { setupBrowser, teardownBrowser } from './setup.js';

describe('Feature E2E', () => {
  let browser, page;

  beforeAll(async () => {
    const setup = await setupBrowser();
    browser = setup.browser;
    page = setup.page;
  }, 30000);

  afterAll(async () => {
    await teardownBrowser(browser);
  });

  test('should complete full workflow', async () => {
    // Load page
    // Interact with extension
    // Verify results
  }, 30000);
});
```

---

## Test Coverage

### Current Coverage

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
All files             |   92.5  |   89.2   |   94.1  |   92.8
src/background/       |   91.2  |   87.5   |   92.3  |   91.5
src/content/          |   93.8  |   90.1   |   95.6  |   94.2
src/shared/           |   95.1  |   92.3   |   96.2  |   95.4
```

### Coverage Goals

- **Minimum**: 90% on all metrics
- **Target**: 95% on all metrics
- **Critical paths**: 100% coverage

### Checking Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## Mocking

### Browser APIs

```javascript
// Mocked in tests/setup.js
global.browser = {
  downloads: {
    download: jest.fn(),
    onChanged: { addListener: jest.fn() }
  },
  tabs: {
    create: jest.fn(),
    remove: jest.fn()
  }
};
```

### DOM Elements

```javascript
const mockElement = document.createElement('img');
mockElement.src = 'https://example.com/image.jpg';
Object.defineProperty(mockElement, 'naturalWidth', { value: 1920 });
```

---

## Test Data

### Mock HTML Pages

Located in `test-fixtures/mock-pages/`:
- `instagram-post.html` - Single image post
- `instagram-carousel.html` - Multi-item carousel
- `instagram-video.html` - Video post
- `generic-article.html` - News article with hero image
- `generic-with-video.html` - Page with video

### Expected Results

Located in `test-fixtures/expected-results/`:
- `detection-results.json` - Expected detection outputs

---

## Common Test Patterns

### Testing Async Functions

```javascript
test('should complete async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Promises

```javascript
test('should resolve promise', () => {
  return expect(promiseFunction()).resolves.toBe(value);
});

test('should reject promise', () => {
  return expect(promiseFunction()).rejects.toThrow();
});
```

### Testing DOM Manipulation

```javascript
test('should modify DOM', () => {
  document.body.innerHTML = '<div id="test"></div>';
  const element = document.getElementById('test');
  functionThatModifiesDOM(element);
  expect(element.textContent).toBe('modified');
});
```

### Testing Event Listeners

```javascript
test('should handle click event', () => {
  const handler = jest.fn();
  button.addEventListener('click', handler);
  button.click();
  expect(handler).toHaveBeenCalledTimes(1);
});
```

---

## Debugging Tests

### Run Single Test

```bash
# Run specific test file
npm test -- dom-analyzer.test.js

# Run specific test case
npm test -- -t "should calculate element size"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "${file}"
  ],
  "console": "integratedTerminal"
}
```

### Verbose Output

```bash
npm test -- --verbose
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Manual workflow dispatch

### Workflow Files

- `.github/workflows/test.yml` - Test suite
- `.github/workflows/lint.yml` - Code quality

---

## Best Practices

1. **Test Behavior, Not Implementation**
   - Test what functions do, not how they do it
   - Avoid testing internal details

2. **One Assertion Per Test (When Possible)**
   - Makes failures easier to diagnose
   - Clearer test intent

3. **Use Descriptive Test Names**
   - `test('should X when Y')`
   - Be specific about what's being tested

4. **Keep Tests Independent**
   - Tests shouldn't depend on each other
   - Use `beforeEach` for setup

5. **Test Edge Cases**
   - Empty inputs
   - Null/undefined
   - Very large inputs
   - Invalid data

6. **Mock External Dependencies**
   - Network calls
   - Browser APIs
   - File system

---

## Troubleshooting

### Tests Timeout

```bash
# Increase timeout
test('long test', async () => {
  // test code
}, 30000); // 30 second timeout
```

### Tests Are Flaky

- Use `await` for all async operations
- Add explicit waits: `await page.waitForTimeout(1000)`
- Check for race conditions

### Mock Not Working

- Verify mock is defined before import
- Check mock is cleared in `beforeEach`
- Use `jest.clearAllMocks()`

---

## Manual Testing Checklist

See [MANUAL_TESTING.md](MANUAL_TESTING.md) for detailed manual testing procedures.

**Quick checklist**:
- [ ] Extension loads without errors
- [ ] Popup UI displays correctly
- [ ] Single URL processes successfully
- [ ] Batch URLs process in order
- [ ] Instagram posts download correctly
- [ ] Generic sites work
- [ ] Error handling works
- [ ] Progress updates correctly
- [ ] Files appear in Downloads folder

---

**Happy Testing!** 🧪