/**
 * Unit Tests for useQuotes Hook
 * Tests CRUD operations and state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuotes } from '../useQuotes';
import quotesStorage from '../../services/quotes/quotesStorage';
import quotesService from '../../services/quotes/quotesService';

// Mock dependencies
vi.mock('../../services/quotes/quotesStorage');
vi.mock('../../services/quotes/quotesService');
vi.mock('../../utils/logger', () => ({
  default: {
    component: () => ({
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

describe('useQuotes', () => {
  const mockQuotes = [
    {
      id: '1',
      line1Fr: 'Test 1',
      line2Fr: 'Quote 1',
      line3Fr: 'FR',
      line1En: 'Test 1',
      line2En: 'Quote 1',
      line3En: 'EN',
      isPinned: false,
      order: 0,
    },
    {
      id: '2',
      line1Fr: 'Test 2',
      line2Fr: 'Quote 2',
      line3Fr: 'FR',
      line1En: 'Test 2',
      line2En: 'Quote 2',
      line3En: 'EN',
      isPinned: true,
      order: 1,
    },
  ];

  const mockSettings = {
    mode: 'random',
    fixedQuoteId: null,
    lastDisplayedId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    quotesStorage.getAllQuotes.mockResolvedValue(mockQuotes);
    quotesStorage.getSettings.mockResolvedValue(mockSettings);
  });

  describe('Initial Load', () => {
    it('should load quotes and settings on mount', async () => {
      const { result } = renderHook(() => useQuotes());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quotes).toEqual(mockQuotes);
      expect(result.current.settings).toEqual(mockSettings);
      expect(result.current.error).toBeNull();
    });

    it('should handle load error', async () => {
      quotesStorage.getAllQuotes.mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Load failed');
      expect(result.current.quotes).toEqual([]);
    });
  });

  describe('addQuote', () => {
    it('should add valid quote', async () => {
      const newQuote = {
        line1Fr: 'New',
        line2Fr: 'Quote',
        line3Fr: 'FR',
        line1En: 'New',
        line2En: 'Quote',
        line3En: 'EN',
        isPinned: false,
      };

      const addedQuote = { ...newQuote, id: '3', order: 2 };

      quotesService.validateQuote.mockReturnValue({ valid: true, errors: [] });
      quotesStorage.addQuote.mockResolvedValue(addedQuote);

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let addResult;
      await act(async () => {
        addResult = await result.current.addQuote(newQuote);
      });

      expect(addResult.success).toBe(true);
      expect(addResult.quote).toEqual(addedQuote);
      expect(result.current.quotes).toContainEqual(addedQuote);
    });

    it('should reject invalid quote', async () => {
      const invalidQuote = { line1Fr: 'Incomplete' };

      quotesService.validateQuote.mockReturnValue({
        valid: false,
        errors: ['Missing fields'],
      });

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let addResult;
      await act(async () => {
        addResult = await result.current.addQuote(invalidQuote);
      });

      expect(addResult.success).toBe(false);
      expect(addResult.error).toContain('Missing fields');
    });

    it('should handle add error', async () => {
      const newQuote = {
        line1Fr: 'New',
        line2Fr: 'Quote',
        line3Fr: 'FR',
        line1En: 'New',
        line2En: 'Quote',
        line3En: 'EN',
      };

      quotesService.validateQuote.mockReturnValue({ valid: true, errors: [] });
      quotesStorage.addQuote.mockRejectedValue(new Error('Add failed'));

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let addResult;
      await act(async () => {
        addResult = await result.current.addQuote(newQuote);
      });

      expect(addResult.success).toBe(false);
      expect(addResult.error).toBe('Add failed');
    });
  });

  describe('updateQuote', () => {
    it('should update existing quote', async () => {
      const updates = { line1Fr: 'Updated' };
      const updatedQuote = { ...mockQuotes[0], ...updates };

      quotesStorage.updateQuote.mockResolvedValue(updatedQuote);

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateQuote('1', updates);
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.quote).toEqual(updatedQuote);
      expect(result.current.quotes.find((q) => q.id === '1')).toEqual(updatedQuote);
    });

    it('should handle update error', async () => {
      quotesStorage.updateQuote.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateQuote('1', { line1Fr: 'Updated' });
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toBe('Update failed');
    });
  });

  describe('deleteQuote', () => {
    it('should delete existing quote', async () => {
      quotesStorage.deleteQuote.mockResolvedValue();

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteQuote('1');
      });

      expect(deleteResult.success).toBe(true);
      expect(result.current.quotes.find((q) => q.id === '1')).toBeUndefined();
    });

    it('should handle delete error', async () => {
      quotesStorage.deleteQuote.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteQuote('1');
      });

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe('Delete failed');
    });
  });

  describe('togglePin', () => {
    it('should toggle pin status', async () => {
      const toggledQuote = { ...mockQuotes[0], isPinned: true };
      quotesStorage.updateQuote.mockResolvedValue(toggledQuote);

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let toggleResult;
      await act(async () => {
        toggleResult = await result.current.togglePin('1');
      });

      expect(toggleResult.success).toBe(true);
      expect(toggleResult.quote.isPinned).toBe(true);
      expect(result.current.quotes.find((q) => q.id === '1').isPinned).toBe(true);
    });

    it('should handle toggle error', async () => {
      quotesStorage.updateQuote.mockRejectedValue(new Error('Toggle failed'));

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let toggleResult;
      await act(async () => {
        toggleResult = await result.current.togglePin('1');
      });

      expect(toggleResult.success).toBe(false);
      expect(toggleResult.error).toBe('Toggle failed');
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const newSettings = { ...mockSettings, mode: 'fixed' };
      quotesStorage.updateSettings.mockResolvedValue(newSettings);

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateSettings({ mode: 'fixed' });
      });

      expect(updateResult.success).toBe(true);
      expect(result.current.settings.mode).toBe('fixed');
    });

    it('should handle settings update error', async () => {
      quotesStorage.updateSettings.mockRejectedValue(new Error('Settings update failed'));

      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateSettings({ mode: 'fixed' });
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toBe('Settings update failed');
    });
  });

  describe('refresh', () => {
    it('should reload data', async () => {
      const { result } = renderHook(() => useQuotes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newQuotes = [...mockQuotes, { id: '3', order: 2 }];
      quotesStorage.getAllQuotes.mockResolvedValue(newQuotes);

      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.quotes).toHaveLength(3);
      });
    });
  });
});
