/**
 * Tests pour le service de navigation précise
 * 
 * @module services/navigation/__tests__/DeepLinkService.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import deepLinkService from '../DeepLinkService';

// Mock du DOM
const mockElement = {
  getBoundingClientRect: () => ({ top: 100, height: 50 }),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(() => false)
  },
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  scrollIntoView: vi.fn()
};

// Mock des fonctions globales
global.document = {
  querySelector: vi.fn(() => mockElement),
  querySelectorAll: vi.fn(() => [mockElement])
};

global.window = {
  pageYOffset: 0,
  innerHeight: 800,
  scrollTo: vi.fn(),
  dispatchEvent: vi.fn(),
  requestAnimationFrame: vi.fn(cb => setTimeout(cb, 16))
};

global.setTimeout = vi.fn((cb, delay) => {
  cb();
  return 1;
});

global.clearTimeout = vi.fn();

describe('DeepLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    deepLinkService.cleanup();
  });

  describe('navigateToModule', () => {
    it('should navigate to a module successfully', async () => {
      const mockSetActiveTab = vi.fn();
      const target = {
        tab: 'today',
        moduleId: 'sport-main',
        scrollBehavior: 'smooth'
      };

      const result = await deepLinkService.navigateToModule(target, mockSetActiveTab);

      expect(mockSetActiveTab).toHaveBeenCalledWith('today');
      expect(result).toBe(true);
    });

    it('should handle navigation with subtab', async () => {
      const mockSetActiveTab = vi.fn();
      const target = {
        tab: 'finance',
        subtab: 'synthese',
        moduleId: 'finance-patrimony',
        scrollBehavior: 'smooth'
      };

      const result = await deepLinkService.navigateToModule(target, mockSetActiveTab);

      expect(mockSetActiveTab).toHaveBeenCalledWith('finance');
      expect(result).toBe(true);
    });

    it('should prevent concurrent navigations', async () => {
      const mockSetActiveTab = vi.fn();
      const target = {
        tab: 'books',
        moduleId: 'books-main'
      };

      // Démarrer deux navigations simultanément
      const promise1 = deepLinkService.navigateToModule(target, mockSetActiveTab);
      const promise2 = deepLinkService.navigateToModule(target, mockSetActiveTab);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Une seule navigation devrait réussir
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('findModuleElement', () => {
    it('should find element by ID', () => {
      const element = deepLinkService.findModuleElement('test-module');
      expect(document.querySelector).toHaveBeenCalledWith('#test-module');
      expect(element).toBe(mockElement);
    });

    it('should try multiple selectors', () => {
      document.querySelector
        .mockReturnValueOnce(null) // #test-module
        .mockReturnValueOnce(mockElement); // [data-module-id="test-module"]

      const element = deepLinkService.findModuleElement('test-module');
      expect(element).toBe(mockElement);
    });

    it('should return null if element not found', () => {
      document.querySelector.mockReturnValue(null);
      
      const element = deepLinkService.findModuleElement('non-existent');
      expect(element).toBe(null);
    });
  });

  describe('calculateScrollPosition', () => {
    it('should calculate correct scroll position', () => {
      const position = deepLinkService.calculateScrollPosition(mockElement);
      
      // Position calculée: rect.top + pageYOffset + (height/2) - viewportCenter - headerHeight
      // 100 + 0 + 25 - 400 - 0 = -275, mais Math.max(0, -275) = 0
      expect(position).toBe(0);
    });
  });

  describe('highlightModule', () => {
    it('should add highlight class to element', () => {
      deepLinkService.highlightModule('test-module', 1000);
      
      expect(mockElement.classList.add).toHaveBeenCalledWith('module-highlighted');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
    });

    it('should clear highlight after duration', () => {
      vi.useFakeTimers();
      
      deepLinkService.highlightModule('test-module', 1000);
      
      // Avancer le temps
      vi.advanceTimersByTime(1000);
      
      expect(mockElement.classList.remove).toHaveBeenCalledWith('module-highlighted');
      
      vi.useRealTimers();
    });

    it('should handle missing element gracefully', () => {
      document.querySelector.mockReturnValue(null);
      
      expect(() => {
        deepLinkService.highlightModule('non-existent');
      }).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clear all highlights and timeouts', () => {
      deepLinkService.highlightModule('test1', 1000);
      deepLinkService.highlightModule('test2', 1000);
      
      deepLinkService.cleanup();
      
      expect(mockElement.classList.remove).toHaveBeenCalledWith('module-highlighted');
    });
  });

  describe('emitNavigationEvent', () => {
    it('should dispatch custom event', () => {
      const target = { tab: 'test', moduleId: 'test-module' };
      
      deepLinkService.emitNavigationEvent(target);
      
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'deeplink-navigation',
          detail: expect.objectContaining({ target })
        })
      );
    });
  });
});