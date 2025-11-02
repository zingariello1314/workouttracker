/**
 * Configuration setup pour tests Vitest
 * Mock des APIs navigateur et dépendances
 */

import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// jsdom fournit document automatiquement - on le vérifie et on l'améliore
if (typeof document === 'undefined') {
  // Fallback si jsdom n'a pas fourni document
  global.document = {
    createElement: vi.fn()
  };
}

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

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4 * 100 * 100), // 100x100 image
    width: 100,
    height: 100
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4 * 100 * 100),
    width: 100,
    height: 100
  })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

// Créer mock complet pour document.createElement
const createMockCanvas = () => {
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn((contextType) => {
      if (contextType === '2d') {
        return {
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          getImageData: vi.fn((sx, sy, sw, sh) => ({
            data: new Uint8ClampedArray(4 * sw * sh),
            width: sw,
            height: sh
          })),
          putImageData: vi.fn(),
          createImageData: vi.fn((width, height) => ({
            data: new Uint8ClampedArray(4 * width * height),
            width,
            height
          })),
          setTransform: vi.fn(),
          drawImage: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          measureText: vi.fn(() => ({ width: 0 })),
          transform: vi.fn(),
          rect: vi.fn(),
          clip: vi.fn(),
        };
      }
      return null;
    })
  };
  return canvas;
};

const createMockImage = () => ({
  width: 0,
  height: 0,
  src: '',
  onload: null,
  onerror: null
});

// Surcharger document.createElement pour mocks complets
if (typeof document !== 'undefined') {
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = vi.fn((tagName) => {
    if (tagName === 'canvas') {
      return createMockCanvas();
    } else if (tagName === 'img') {
      return createMockImage();
    }
    // Pour autres éléments, utiliser création jsdom normale
    try {
      return originalCreateElement(tagName);
    } catch (e) {
      return {};
    }
  });
} else {
  // Fallback complet si document n'existe pas
  global.document = {
    createElement: vi.fn((tagName) => {
      if (tagName === 'canvas') {
        return createMockCanvas();
      } else if (tagName === 'img') {
        return createMockImage();
      }
      return {};
    })
  };
}

// Mock Image
global.Image = class {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.src = '';
    this.onload = null;
    this.onerror = null;
  }
  
  // Simuler chargement réussi
  triggerLoad() {
    this.width = 1920;
    this.height = 1080;
    if (this.onload) this.onload();
  }
  
  // Simuler erreur
  triggerError() {
    if (this.onerror) this.onerror();
  }
};

// Mock performance.now()
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 30000000
  }
};

// Mock console pour éviter bruit dans tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

