import { expect, afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock window.CloudTalk
(global as any).window = {
  ...global.window,
  CloudTalk: undefined,
  location: {
    href: '',
  },
};

// Mock navigator.clipboard para user-event
// Necesario porque user-event intenta acceder a navigator.clipboard
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue(''),
};

// Asegurar que navigator existe y tiene clipboard
if (!global.navigator) {
  (global as any).navigator = {
    clipboard: mockClipboard,
  };
} else {
  Object.defineProperty(global.navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
    configurable: true,
  });
}

// Mock fetch
global.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

