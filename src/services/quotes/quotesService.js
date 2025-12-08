/**
 * Business Logic Service for Quotes
 * Smart selection algorithms and validation
 */

import quotesStorage from './quotesStorage';
import logger from '../../utils/logger';

const log = logger.component('QuotesService');

class QuotesService {
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Get default quote (fallback)
   */
  getDefaultQuote(language = 'fr') {
    const defaultQuotes = {
      fr: {
        id: 'default',
        line1Fr: "N'attends rien,",
        line2Fr: 'Apprécie',
        line3Fr: 'tout.',
        line1En: 'Expect nothing,',
        line2En: 'Appreciate',
        line3En: 'everything.',
        isPinned: false,
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    return defaultQuotes.fr;
  }

  /**
   * Select random quote with weighted algorithm
   * - Avoids immediate repetition
   * - Gives 3x weight to pinned quotes
   * - Uses Fisher-Yates for fair distribution
   */
  async selectRandomQuote(language = 'fr') {
    try {
      const quotes = await this.storage.getAllQuotes();

      if (quotes.length === 0) {
        return this.getDefaultQuote(language);
      }

      if (quotes.length === 1) {
        return quotes[0];
      }

      // Get last displayed ID to avoid repetition
      const settings = await this.storage.getSettings();
      const lastDisplayedId = settings.lastDisplayedId;

      // Filter out last displayed quote
      const available = quotes.filter((q) => q.id !== lastDisplayedId);

      if (available.length === 0) {
        // If somehow all filtered, use all quotes
        return this.weightedRandomSelect(quotes);
      }

      // Select with weighted algorithm
      const selected = this.weightedRandomSelect(available);

      // Update last displayed
      await this.storage.updateSettings({ lastDisplayedId: selected.id });

      return selected;
    } catch (error) {
      log.error('Failed to select random quote', error);
      return this.getDefaultQuote(language);
    }
  }

  /**
   * Weighted random selection
   * Pinned quotes get 3x probability
   */
  weightedRandomSelect(quotes) {
    // Create weighted pool
    const pool = [];

    quotes.forEach((quote) => {
      const weight = quote.isPinned ? 3 : 1;
      for (let i = 0; i < weight; i++) {
        pool.push(quote);
      }
    });

    // Random selection from pool
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  /**
   * Select fixed quote
   */
  async selectFixedQuote(language = 'fr') {
    try {
      const settings = await this.storage.getSettings();

      if (!settings.fixedQuoteId) {
        return this.getDefaultQuote(language);
      }

      const quote = await this.storage.getQuote(settings.fixedQuoteId);

      if (!quote) {
        log.warn('Fixed quote not found, falling back to default');
        return this.getDefaultQuote(language);
      }

      return quote;
    } catch (error) {
      log.error('Failed to select fixed quote', error);
      return this.getDefaultQuote(language);
    }
  }

  /**
   * Select appropriate quote based on mode
   */
  async selectQuote(language = 'fr') {
    try {
      const settings = await this.storage.getSettings();

      if (settings.mode === 'fixed') {
        return await this.selectFixedQuote(language);
      } else {
        return await this.selectRandomQuote(language);
      }
    } catch (error) {
      log.error('Failed to select quote', error);
      return this.getDefaultQuote(language);
    }
  }

  /**
   * Validate quote data
   */
  validateQuote(quoteData) {
    const errors = [];

    // Check required fields
    const requiredFields = ['line1Fr', 'line2Fr', 'line3Fr', 'line1En', 'line2En', 'line3En'];

    requiredFields.forEach((field) => {
      if (!quoteData[field] || quoteData[field].trim() === '') {
        errors.push(`${field} is required`);
      }
    });

    // Check length limits (500 chars per line)
    requiredFields.forEach((field) => {
      if (quoteData[field] && quoteData[field].length > 500) {
        errors.push(`${field} exceeds 500 characters`);
      }
    });

    // Check isPinned is boolean
    if (quoteData.isPinned !== undefined && typeof quoteData.isPinned !== 'boolean') {
      errors.push('isPinned must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format quote for display based on language
   */
  formatQuoteForDisplay(quote, language = 'fr') {
    if (!quote) return null;

    if (language === 'en') {
      return {
        line1: quote.line1En,
        line2: quote.line2En,
        line3: quote.line3En,
      };
    }

    return {
      line1: quote.line1Fr,
      line2: quote.line2Fr,
      line3: quote.line3Fr,
    };
  }

  /**
   * Get quote statistics
   */
  async getStatistics() {
    try {
      const quotes = await this.storage.getAllQuotes();
      const settings = await this.storage.getSettings();

      return {
        total: quotes.length,
        pinned: quotes.filter((q) => q.isPinned).length,
        mode: settings.mode,
        lastDisplayed: settings.lastDisplayedId,
      };
    } catch (error) {
      log.error('Failed to get statistics', error);
      return {
        total: 0,
        pinned: 0,
        mode: 'random',
        lastDisplayed: null,
      };
    }
  }
}

// Singleton instance
const quotesService = new QuotesService(quotesStorage);

export default quotesService;
