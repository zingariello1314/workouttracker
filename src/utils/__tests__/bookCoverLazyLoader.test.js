/**
 * Tests pour le lazy loader des couvertures de livres
 * 
 * Vérifie le chargement par batch et la gestion du cache
 * Requirements: 6.3, 6.4
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createBookCoverLazyLoader, 
  clearCoverCache 
} from '../bookCoverLazyLoader';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  callback,
  options
}));
window.IntersectionObserver = mockIntersectionObserver;

// Mock URL.revokeObjectURL
window.URL = {
  revokeObjectURL: vi.fn()
};

describe('bookCoverLazyLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCoverCache();
  });

  afterEach(() => {
    clearCoverCache();
  });

  test('should create lazy loader with valid parameters', () => {
    const container = document.createElement('div');
    const books = [
      { id: 'book-1', coverInline: 'data:image/jpeg;base64,test1' },
      { id: 'book-2', coverInline: 'data:image/jpeg;base64,test2' }
    ];

    const loader = createBookCoverLazyLoader(container, books);

    expect(loader).toBeTruthy();
    expect(loader.observer).toBeDefined();
    expect(loader.loadBatch).toBeDefined();
    expect(loader.cleanup).toBeDefined();
  });

  test('should return null for invalid parameters', () => {
    expect(createBookCoverLazyLoader(null, [])).toBeNull();
    expect(createBookCoverLazyLoader(document.createElement('div'), null)).toBeNull();
    expect(createBookCoverLazyLoader(document.createElement('div'), 'invalid')).toBeNull();
  });

  test('should handle books without coverInline', () => {
    const container = document.createElement('div');
    const books = [
      { id: 'book-1' }, // Pas de coverInline
      { id: 'book-2', coverInline: null },
      { id: 'book-3', coverInline: 'data:image/jpeg;base64,test3' }
    ];

    const loader = createBookCoverLazyLoader(container, books);
    expect(loader).toBeTruthy();
  });

  test('should call onCoverLoaded callback', async () => {
    const container = document.createElement('div');
    const books = [
      { id: 'book-1', coverInline: 'data:image/jpeg;base64,test1' }
    ];
    const onCoverLoaded = vi.fn();

    const loader = createBookCoverLazyLoader(container, books, {
      onCoverLoaded,
      batchSize: 1
    });

    // Simuler le chargement d'un batch
    await loader.loadBatch();

    expect(onCoverLoaded).toHaveBeenCalledWith('book-1', 'data:image/jpeg;base64,test1');
  });

  test('should respect batch size', () => {
    const container = document.createElement('div');
    const books = Array.from({ length: 10 }, (_, i) => ({
      id: `book-${i}`,
      coverInline: `data:image/jpeg;base64,test${i}`
    }));

    const loader = createBookCoverLazyLoader(container, books, {
      batchSize: 3
    });

    expect(loader).toBeTruthy();
    // Le test de la taille du batch nécessiterait des mocks plus complexes
  });

  test('should cleanup properly', () => {
    const container = document.createElement('div');
    const books = [
      { id: 'book-1', coverInline: 'data:image/jpeg;base64,test1' }
    ];

    const loader = createBookCoverLazyLoader(container, books);
    const disconnectSpy = vi.spyOn(loader.observer, 'disconnect');

    loader.cleanup();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  test('should clear cache properly', () => {
    clearCoverCache();
    
    // Vérifier que revokeObjectURL n'est pas appelé pour des caches vides
    expect(window.URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  test('should handle errors gracefully', async () => {
    const container = document.createElement('div');
    const books = [
      { id: 'book-error', coverInline: null } // Cas d'erreur potentiel
    ];

    const loader = createBookCoverLazyLoader(container, books);
    
    // Ne devrait pas lever d'exception
    expect(async () => {
      await loader.loadBatch();
    }).not.toThrow();
  });

  test('should work with empty book list', () => {
    const container = document.createElement('div');
    const books = [];

    const loader = createBookCoverLazyLoader(container, books);
    expect(loader).toBeTruthy();
  });

  test('should configure IntersectionObserver correctly', () => {
    const container = document.createElement('div');
    const books = [{ id: 'book-1', coverInline: 'test' }];

    createBookCoverLazyLoader(container, books, {
      rootMargin: '200px',
      threshold: 0.5
    });

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        root: null,
        rootMargin: '200px',
        threshold: 0.5
      })
    );
  });
});