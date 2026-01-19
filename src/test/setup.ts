import { expect, afterEach, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { cleanup } from '@testing-library/react';
import { configure } from '@testing-library/dom';
import * as matchers from '@testing-library/jest-dom/matchers';

if (typeof document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).navigator = dom.window.navigator;
}

configure({ document: global.document });

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cargar tokens de test si están disponibles
if (typeof (global as any).__TEST_TOKENS__ !== 'undefined') {
  const tokens = (global as any).__TEST_TOKENS__;
  localStorage.setItem('test_tokens', JSON.stringify(tokens));
  console.log('✅ Tokens de test cargados en localStorage');
}

// Cleanup after each test
// Usar cleanup de testing-library que maneja correctamente el DOM
afterEach(() => {
  cleanup();
});

// Mock localStorage con implementación real para guardar tokens
// Permite guardar tokens reales para tests de autenticación
const localStorageMock = {
  storage: {} as Record<string, string>,
  getItem: vi.fn((key: string) => {
    return localStorageMock.storage[key] || null;
  }),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.storage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.storage[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.storage = {};
  }),
  get length() {
    return Object.keys(localStorageMock.storage).length;
  },
  key: vi.fn((index: number) => {
    const keys = Object.keys(localStorageMock.storage);
    return keys[index] || null;
  }),
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
// También necesitamos mockear document para que user-event funcione
if (!global.navigator) {
  (global as any).navigator = {
    clipboard: mockClipboard,
    userAgent: 'test',
  };
} else {
  Object.defineProperty(global.navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
    configurable: true,
  });
}

// Mock window.clipboardData para user-event (IE/Edge)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'clipboardData', {
    value: {
      getData: vi.fn(() => ''),
      setData: vi.fn(() => true),
    },
    writable: true,
    configurable: true,
  });
  
  // Asegurar que window tiene clipboard
  Object.defineProperty(window, 'clipboard', {
    value: mockClipboard,
    writable: true,
    configurable: true,
  });
}

// Asegurar que document.defaultView (window) tiene clipboard
if (typeof document !== 'undefined' && document.defaultView) {
  Object.defineProperty(document.defaultView, 'clipboard', {
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

