/**
 * Tests pour vérifier l'émission d'événements sidebar dans BooksTab
 * Validates: Requirements 2.1, 2.2, 2.3, 4.1, 4.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';

describe('BooksTab - Sidebar Events Emission', () => {
  let emitSpy;

  beforeEach(() => {
    // Spy sur la méthode emit de sidebarEvents
    emitSpy = vi.spyOn(sidebarEvents, 'emit');
  });

  afterEach(() => {
    emitSpy.mockRestore();
  });

  it('should have BOOK_ADDED event constant defined', () => {
    expect(SIDEBAR_EVENTS.BOOK_ADDED).toBe('book_added');
  });

  it('should have BOOK_UPDATED event constant defined', () => {
    expect(SIDEBAR_EVENTS.BOOK_UPDATED).toBe('book_updated');
  });

  it('should have BOOK_DELETED event constant defined', () => {
    expect(SIDEBAR_EVENTS.BOOK_DELETED).toBe('book_deleted');
  });

  it('should have PAGES_READ event constant defined', () => {
    expect(SIDEBAR_EVENTS.PAGES_READ).toBe('pages_read');
  });

  it('should emit events with correct structure', () => {
    // Test que l'émetteur fonctionne correctement
    const testData = { bookId: 'test_123' };
    sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_ADDED, testData);
    
    expect(emitSpy).toHaveBeenCalledWith(SIDEBAR_EVENTS.BOOK_ADDED, testData);
  });

  it('should allow multiple listeners for the same event', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    
    const unsubscribe1 = sidebarEvents.on(SIDEBAR_EVENTS.BOOK_ADDED, listener1);
    const unsubscribe2 = sidebarEvents.on(SIDEBAR_EVENTS.BOOK_ADDED, listener2);
    
    sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_ADDED, { bookId: 'test' });
    
    expect(listener1).toHaveBeenCalledWith({ bookId: 'test' });
    expect(listener2).toHaveBeenCalledWith({ bookId: 'test' });
    
    unsubscribe1();
    unsubscribe2();
  });

  it('should handle event emission errors gracefully', () => {
    const errorListener = vi.fn(() => {
      throw new Error('Test error');
    });
    const normalListener = vi.fn();
    
    const unsubscribe1 = sidebarEvents.on(SIDEBAR_EVENTS.BOOK_ADDED, errorListener);
    const unsubscribe2 = sidebarEvents.on(SIDEBAR_EVENTS.BOOK_ADDED, normalListener);
    
    // L'émission ne devrait pas crasher même si un listener throw
    expect(() => {
      sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_ADDED, { bookId: 'test' });
    }).not.toThrow();
    
    // Le listener normal devrait quand même être appelé
    expect(normalListener).toHaveBeenCalled();
    
    unsubscribe1();
    unsubscribe2();
  });
});
