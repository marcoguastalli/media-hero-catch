# Contributing Guide

Thank you for your interest in contributing to Media Hero Catch!

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards others

---

## How to Contribute

### Reporting Bugs

**Before submitting**:
- Search existing issues
- Check if it's already fixed in latest version
- Test in clean Firefox profile

**Include in report**:
1. Clear description of bug
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment (Firefox version, OS)
5. Console logs/screenshots
6. Example URL (if applicable)

### Suggesting Features

**Before suggesting**:
- Check existing issues/discussions
- Consider if it fits project scope
- Think about implementation complexity

**Include in suggestion**:
1. Clear use case
2. Expected behavior
3. Possible implementation approach
4. Alternatives considered

### Submitting Code

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Add tests**
5. **Run all checks**:
   ```bash
   npm run validate
   ```
6. **Commit with conventional commits**:
   ```bash
   git commit -m "feat: add new feature"
   ```
7. **Push and create Pull Request**

---

## Development Setup

See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

**Quick start**:
```bash
git clone https://github.com/YOUR_USERNAME/media-hero-catch.git
cd media-hero-catch
npm install
npm test
npm run start:firefox
```

---

## Code Style

### JavaScript

- Use ES6+ features
- Prefer `const` over `let`
- Use arrow functions where appropriate
- Add JSDoc comments for functions
- Follow existing code patterns

**Example**:
```javascript
/**
 * Calculate element size
 * @param {HTMLElement} element - Element to measure
 * @returns {Object} Size object with width, height, area
 */
export function calculateElementSize(element) {
  // Implementation
}
```

### Formatting

- Run Prettier before committing:
  ```bash
  npm run format
  ```
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in objects/arrays

### Linting

- Run ESLint before committing:
  ```bash
  npm run lint
  ```
- Fix auto-fixable issues:
  ```bash
  npm run lint:fix
  ```
- No unused variables
- Complexity limit: 10

---

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Adding tests
- `refactor:` - Code restructuring
- `perf:` - Performance improvement
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes

**Examples**:
```bash
feat: add Twitter support
fix: handle missing srcset gracefully
docs: update installation guide
test: add carousel detection tests
refactor: simplify download queue logic
```

---

## Testing Requirements

### All code changes must include tests

**Unit tests** for:
- New functions
- Changed logic
- Edge cases

**Integration tests** for:
- Component interactions
- Message passing
- Workflows

**E2E tests** for:
- New user-facing features
- Critical paths

### Running Tests

```bash
# All tests
npm test

# Specific suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Coverage
npm run test:coverage
```

### Coverage Requirements

- Maintain >90% coverage
- No decrease in coverage
- Critical paths: 100% coverage

---

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**:
   ```bash
   npm run validate
   ```
4. **Update README** if user-facing changes
5. **Link related issues** in PR description
6. **Request review** from maintainers

### PR Description Template

```markdown
## Description
[Clear description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added comments for complex logic
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tests pass locally
- [ ] Coverage maintained/improved

## Related Issues
Fixes #123
Relates to #456
```

---

## Project Structure

```
media-hero-catch/
├── src/
│   ├── background/       # Add background features here
│   ├── content/
│   │   ├── detectors/    # Add new detectors here
│   │   └── utils/        # Add utility functions here
│   ├── popup/            # Add UI features here
│   └── shared/           # Add shared code here
├── tests/
│   ├── unit/             # Add unit tests here
│   ├── integration/      # Add integration tests here
│   └── e2e/              # Add E2E tests here
└── docs/                 # Add documentation here
```

---

## Adding New Features

### Adding a New Detector (e.g., Twitter)

1. **Create detector file**:
   ```
   src/content/detectors/twitter-detector.js
   ```

2. **Implement detector**:
   ```javascript
   export async function detectHeroMedia() {
     // Detection logic
   }
   
   export function shouldUseTwitterDetector() {
     return window.location.hostname.includes('twitter.com');
   }
   ```

3. **Update detector registry**:
   ```javascript
   // src/content/detectors/detector-registry.js
   import { detectHeroMedia as detectTwitter } from './twitter-detector.js';
   
   if (shouldUseTwitterDetector()) {
     return detectTwitter;
   }
   ```

4. **Add tests**:
   ```
   tests/unit/detectors/twitter-detector.test.js
   ```

5. **Add test fixture**:
   ```
   test-fixtures/mock-pages/twitter-post.html
   ```

6. **Update documentation**

---

## Debugging

### Browser Console

Check different consoles:
1. **Page console** (F12): Content script logs
2. **Background console** (`about:debugging`): Background script logs
3. **Popup console** (F12 on popup): Popup script logs

### Using Debugger

Add `debugger;` statement:
```javascript
export function detectHeroMedia() {
  debugger; // Execution pauses here
  // ...
}
```

### Logging Best Practices

```javascript
// Good
console.log('Instagram detector: Starting detection');
console.log('Found media:', { url, type, filename });

// Avoid
console.log('test');
console.log(obj); // Log object directly
```

---

## Common Tasks

### Adding a Configuration Option

1. **Update config**:
   ```javascript
   // src/shared/config.js
   export const CONFIG = {
     newFeature: {
       option1: value1,
       option2: value2
     }
   };
   ```

2. **Add tests**:
   ```javascript
   test('should use new config option', () => {
     expect(CONFIG.newFeature.option1).toBe(value1);
   });
   ```

3. **Document** in README or relevant docs

### Adding a Message Type

1. **Define constant**:
   ```javascript
   // src/shared/message-types.js
   export const NEW_MESSAGE_TYPE = 'NEW_MESSAGE_TYPE';
   ```

2. **Handle in receiver**:
   ```javascript
   case NEW_MESSAGE_TYPE:
     return await handleNewMessage(message.data);
   ```

3. **Add tests**

### Adding a Test Fixture

1. **Create HTML file**:
   ```
   test-fixtures/mock-pages/new-site.html
   ```

2. **Add realistic structure**:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <article>
       <img src="hero.jpg" />
     </article>
   </body>
   </html>
   ```

3. **Use in tests**:
   ```javascript
   await loadFixture(page, 'new-site.html');
   ```

---

## Release Process

(For maintainers)

1. **Update version**:
   ```bash
   npm version patch|minor|major
   ```

2. **Update CHANGELOG.md**

3. **Create release tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Build extension**:
   ```bash
   npm run build
   ```

5. **Create GitHub release** with build artifact

---

## Getting Help

- **Questions**: Open a [Discussion](https://github.com/YOUR_USERNAME/media-hero-catch/discussions)
- **Bugs**: Open an [Issue](https://github.com/YOUR_USERNAME/media-hero-catch/issues)
- **Chat**: [Community chat link]

---

## Recognition

Contributors will be:
- Listed in README.md
- Credited in release notes
- Thanked publicly

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🙏