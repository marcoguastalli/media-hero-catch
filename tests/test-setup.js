// Global test setup for Jest

// Mock browser API for tests
global.browser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  downloads: {
    download: jest.fn(),
  },
  tabs: {
    create: jest.fn(),
    remove: jest.fn(),
    query: jest.fn(),
  },
  notifications: {
    create: jest.fn(),
  },
};

// Mock chrome API (for Chrome compatibility layer testing)
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  downloads: {
    download: jest.fn(),
  },
  tabs: {
    create: jest.fn(),
    remove: jest.fn(),
    query: jest.fn(),
  },
  notifications: {
    create: jest.fn(),
  },
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  jest.restoreAllMocks();
});