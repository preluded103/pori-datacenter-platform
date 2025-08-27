/**
 * Test setup configuration for Vitest
 * Global test utilities and mocks
 */

import { vi } from 'vitest';

// Mock mapbox-gl globally
vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      getBounds: vi.fn(() => ({
        getWest: () => -1,
        getEast: () => 1,
        getNorth: () => 1,
        getSouth: () => -1
      })),
      getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
      getZoom: vi.fn(() => 10),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      addSource: vi.fn(),
      removeSource: vi.fn(),
      getLayer: vi.fn(),
      getSource: vi.fn()
    })),
    Popup: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setHTML: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn()
    })),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn()
    }))
  }
}));

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  })
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}));

// Global fetch mock setup
global.fetch = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Console error suppression for known React warnings in tests
const originalError = console.error;
console.error = (...args) => {
  const errorMessage = args[0];
  
  // Suppress known React warnings that are expected in tests
  if (
    typeof errorMessage === 'string' && (
      errorMessage.includes('Warning: ReactDOM.render is no longer supported') ||
      errorMessage.includes('Warning: validateDOMNesting') ||
      errorMessage.includes('Warning: Function components cannot be given refs')
    )
  ) {
    return;
  }
  
  originalError.call(console, ...args);
};