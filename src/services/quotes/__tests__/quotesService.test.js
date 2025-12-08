/**
 * Unit Tests for QuotesService
 * Tests business logic and selection algorithms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import quotesService from '../quotesService';
import quotesStorage from '../quotesStorage';

// Mock quotesStorage
vi.mock('../quotesStorage', () => ({
  default: {
    getAllQuotes: vi.fn(),
    getQuote: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('QuotesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDefaultQuote', () => {
    it('should return default French quote', () => {
      const quote = quotesService.getDefaultQuote('fr');
      expect(quote).toHaveProperty('line1Fr');
      expect(quote).toHaveProperty('line2Fr');
      expect(quote).toHaveProperty('line3Fr');
      expect(quote.id).toBe('default');
    });

    it('should return default quote for any language', () => {
      const quote = quotesService.getDefaultQuote('en');
      expect(quote).toHaveProperty('line1En');
      expect(quote).toHaveProperty('line2En');
      expect(quote).toHaveProperty('line3En');
    });
  });

  describe('validateQuote', () => {
    it('should validate complete quote data', () => {
      const validQuote = {
        line1Fr: 'Test',
        line2Fr: 'Quote',
        line3Fr: 'FR',
        line1En: 'Test',
        line2En: 'Quote',
        line3En: 'EN',
        isPinned: false,
      };

      const result = quotesService.validateQuote(validQuote);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject quote with missing fields', () => {
      const invalidQuote = {
        line1Fr: 'Test',
        line2Fr: 'Quote',
        // Missing line3Fr and all EN fields
      };

      const result = quotesService.validateQuote(invalidQuote);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject quote with empty strings', () => {
      const invalidQuote = {
        line1Fr: '',
        line2Fr: 'Quote',
        line3Fr: 'FR',
        line1En: 'Test',
        line2En: 'Quote',
        line3En: 'EN',
      };

      const result = quotesService.validateQuote(invalidQuote);
      expect(result.valid).toBe(false);
    });

    it('should reject quote with lines exceeding 500 characters', () => {
      const invalidQuote = {
        line1Fr: 'a'.repeat(501),
        line2Fr: 'Quote',
        line3Fr: 'FR',
        line1En: 'Test',
        line2En: 'Quote',
        line3En: 'EN',
      };

      const result = quotesService.validateQuote(invalidQuote);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('exceeds 500 characters'))).toBe(true);
    });

    it('should reject quote with invalid isPinned type', () => {
      const invalidQuote = {
        line1Fr: 'Test',
        line2Fr: 'Quote',
        line3Fr: 'FR',
        line1En: 'Test',
        line2En: 'Quote',
        line3En: 'EN',
        isPinned: 'yes', // Should be boolean
      };

      const result = quotesService.validateQuote(invalidQuote);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must be a boolean'))).toBe(true);
    });
  });

  describe('formatQuoteForDisplay', () => {
    const testQuote = {
      id: 'test-1',
      line1Fr: 'Ligne 1 FR',
      line2Fr: 'Ligne 2 FR',
      line3Fr: 'Ligne 3 FR',
      line1En: 'Line 1 EN',
      line2En: 'Line 2 EN',
      line3En: 'Line 3 EN',
    };

    it('should format quote for French display', () => {
      const formatted = quotesService.formatQuoteForDisplay(testQuote, 'fr');
      expect(formatted).toEqual({
        line1: 'Ligne 1 FR',
        line2: 'Ligne 2 FR',
        line3: 'Ligne 3 FR',
      });
    });

    it('should format quote for English display', () => {
      const formatted = quotesService.formatQuoteForDisplay(testQuote, 'en');
      expect(formatted).toEqual({
        line1: 'Line 1 EN',
        line2: 'Line 2 EN',
        line3: 'Line 3 EN',
      });
    });

    it('should default to French if language not specified', () => {
      const formatted = quotesService.formatQuoteForDisplay(testQuote);
      expect(formatted.line1).toBe('Ligne 1 FR');
    });

    it('should return null for null quote', () => {
      const formatted = quotesService.formatQuoteForDisplay(null);
      expect(formatted).toBeNull();
    });
  });

  describe('weightedRandomSelect', () => {
    it('should select from single quote', () => {
      const quotes = [{ id: '1', isPinned: false }];
      const selected = quotesService.weightedRandomSelect(quotes);
      expect(selected.id).toBe('1');
    });

    it('should give higher probability to pinned quotes', () => {
      const quotes = [
        { id: 'pinned', isPinned: true },
        { id: 'normal', isPinned: false },
      ];

      // Run multiple times to test probability
      const selections = {};
      for (let i = 0; i < 1000; i++) {
        const selected = quotesService.weightedRandomSelect(quotes);
        selections[selected.id] = (selections[selected.id] || 0) + 1;
      }

      // Pinned should be selected ~3x more often (75% vs 25%)
      expect(selections.pinned).toBeGreaterThan(selections.normal);
      expect(selections.pinned / selections.normal).toBeGreaterThan(2);
    });

    it('should handle all pinned quotes', () => {
      const quotes = [
        { id: '1', isPinned: true },
        { id: '2', isPinned: true },
      ];

      const selected = quotesService.weightedRandomSelect(quotes);
      expect(['1', '2']).toContain(selected.id);
    });

    it('should handle all unpinned quotes', () => {
      const quotes = [
        { id: '1', isPinned: false },
        { id: '2', isPinned: false },
      ];

      const selected = quotesService.weightedRandomSelect(quotes);
      expect(['1', '2']).toContain(selected.id);
    });
  });

  describe('selectRandomQuote', () => {
    it('should return default quote when no quotes available', async () => {
      quotesStorage.getAllQuotes.mockResolvedValue([]);
      quotesStorage.getSettings.mockResolvedValue({ lastDisplayedId: null });

      const quote = await quotesService.selectRandomQuote('fr');
      expect(quote.id).toBe('default');
    });

    it('should return single quote when only one available', async () => {
      const singleQuote = {
        id: 'only-one',
        line1Fr: 'Test',
        line2Fr: 'Quote',
        line3Fr: 'FR',
      };
      quotesStorage.getAllQuotes.mockResolvedValue([singleQuote]);
      quotesStorage.getSettings.mockResolvedValue({ lastDisplayedId: null });

      const quote = await quotesService.selectRandomQuote('fr');
      expect(quote.id).toBe('only-one');
    });

    it('should avoid repeating last displayed quote', async () => {
      const quotes = [
        { id: 'quote-1', isPinned: false },
        { id: 'quote-2', isPinned: false },
        { id: 'quote-3', isPinned: false },
      ];
      quotesStorage.getAllQuotes.mockResolvedValue(quotes);
      quotesStorage.getSettings.mockResolvedValue({ lastDisplayedId: 'quote-1' });
      quotesStorage.updateSettings.mockResolvedValue({});

      const quote = await quotesService.selectRandomQuote('fr');
      expect(quote.id).not.toBe('quote-1');
      expect(['quote-2', 'quote-3']).toContain(quote.id);
    });

    it('should update lastDisplayedId after selection', async () => {
      const quotes = [
        { id: 'quote-1', isPinned: false },
        { id: 'quote-2', isPinned: false },
      ];
      quotesStorage.getAllQuotes.mockResolvedValue(quotes);
      quotesStorage.getSettings.mockResolvedValue({ lastDisplayedId: null });
      quotesStorage.updateSettings.mockResolvedValue({});

      await quotesService.selectRandomQuote('fr');
      expect(quotesStorage.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ lastDisplayedId: expect.any(String) })
      );
    });

    it('should return default quote on error', async () => {
      quotesStorage.getAllQuotes.mockRejectedValue(new Error('DB Error'));

      const quote = await quotesService.selectRandomQuote('fr');
      expect(quote.id).toBe('default');
    });
  });

  describe('selectFixedQuote', () => {
    it('should return default quote when no fixed quote set', async () => {
      quotesStorage.getSettings.mockResolvedValue({ fixedQuoteId: null });

      const quote = await quotesService.selectFixedQuote('fr');
      expect(quote.id).toBe('default');
    });

    it('should return fixed quote when set', async () => {
      const fixedQuote = {
        id: 'fixed-1',
        line1Fr: 'Fixed',
        line2Fr: 'Quote',
        line3Fr: 'FR',
      };
      quotesStorage.getSettings.mockResolvedValue({ fixedQuoteId: 'fixed-1' });
      quotesStorage.getQuote.mockResolvedValue(fixedQuote);

      const quote = await quotesService.selectFixedQuote('fr');
      expect(quote.id).toBe('fixed-1');
    });

    it('should return default quote when fixed quote not found', async () => {
      quotesStorage.getSettings.mockResolvedValue({ fixedQuoteId: 'missing-id' });
      quotesStorage.getQuote.mockResolvedValue(null);

      const quote = await quotesService.selectFixedQuote('fr');
      expect(quote.id).toBe('default');
    });

    it('should return default quote on error', async () => {
      quotesStorage.getSettings.mockRejectedValue(new Error('DB Error'));

      const quote = await quotesService.selectFixedQuote('fr');
      expect(quote.id).toBe('default');
    });
  });

  describe('selectQuote', () => {
    it('should select fixed quote when mode is fixed', async () => {
      const fixedQuote = { id: 'fixed-1' };
      quotesStorage.getSettings.mockResolvedValue({ mode: 'fixed', fixedQuoteId: 'fixed-1' });
      quotesStorage.getQuote.mockResolvedValue(fixedQuote);

      const quote = await quotesService.selectQuote('fr');
      expect(quote.id).toBe('fixed-1');
    });

    it('should select random quote when mode is random', async () => {
      const quotes = [{ id: 'random-1', isPinned: false }];
      quotesStorage.getSettings.mockResolvedValue({ mode: 'random', lastDisplayedId: null });
      quotesStorage.getAllQuotes.mockResolvedValue(quotes);
      quotesStorage.updateSettings.mockResolvedValue({});

      const quote = await quotesService.selectQuote('fr');
      expect(quote.id).toBe('random-1');
    });

    it('should return default quote on error', async () => {
      quotesStorage.getSettings.mockRejectedValue(new Error('DB Error'));

      const quote = await quotesService.selectQuote('fr');
      expect(quote.id).toBe('default');
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', async () => {
      const quotes = [
        { id: '1', isPinned: true },
        { id: '2', isPinned: false },
        { id: '3', isPinned: true },
      ];
      quotesStorage.getAllQuotes.mockResolvedValue(quotes);
      quotesStorage.getSettings.mockResolvedValue({
        mode: 'random',
        lastDisplayedId: '2',
      });

      const stats = await quotesService.getStatistics();
      expect(stats).toEqual({
        total: 3,
        pinned: 2,
        mode: 'random',
        lastDisplayed: '2',
      });
    });

    it('should return default statistics on error', async () => {
      quotesStorage.getAllQuotes.mockRejectedValue(new Error('DB Error'));

      const stats = await quotesService.getStatistics();
      expect(stats).toEqual({
        total: 0,
        pinned: 0,
        mode: 'random',
        lastDisplayed: null,
      });
    });
  });
});
