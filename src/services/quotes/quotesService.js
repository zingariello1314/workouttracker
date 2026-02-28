/**
 * Business Logic Service for Quotes
 * Smart selection algorithms and validation
 * Supports legacy format (line1/2/3) and new format (textFr/textEn + bold range)
 */

import quotesStorage from './quotesStorage';
import { autoSplitText } from './quoteAutoSplit';
import logger from '../../utils/logger';

const log = logger.component('QuotesService');

const TARGET_CHARS_PER_LINE = 28;
const MIN_LINES = 2;
const MAX_LINES = 10;

/** Fisher-Yates shuffle — ordre aléatoire différent à chaque fois */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Detect if quote uses legacy format (line1Fr, line2Fr, line3Fr)
 */
function isLegacyQuote(quote) {
  return quote && typeof quote.line1Fr === 'string';
}

/**
 * Get lines array and bold range from a quote for a given language
 */
function getLinesFromQuote(quote, language = 'fr') {
  if (!quote) return { lines: [], boldFrom: 2, boldTo: 2 };

  if (isLegacyQuote(quote)) {
    const line1 = language === 'en' ? quote.line1En : quote.line1Fr;
    const line2 = language === 'en' ? quote.line2En : quote.line2Fr;
    const line3 = language === 'en' ? quote.line3En : quote.line3Fr;
    const lines = [line1, line2, line3].filter(Boolean);
    return { lines, boldFrom: 2, boldTo: 2 };
  }

  const text = language === 'en' ? (quote.textEn || quote.textFr || '') : (quote.textFr || '');
  const trimmed = text.trim();
  if (!trimmed) {
    const fallback = language === 'en' ? quote.textFr : quote.textEn;
    if (fallback) return getLinesFromQuote({ ...quote, textFr: fallback, textEn: fallback }, language);
    return { lines: [], boldFrom: 2, boldTo: 2 };
  }

  let lines;
  if (trimmed.includes('\n')) {
    lines = trimmed.split(/\n/).map((l) => l.trim()).filter(Boolean);
  } else {
    lines = autoSplitText(trimmed, {
      targetCharsPerLine: TARGET_CHARS_PER_LINE,
      minLines: MIN_LINES,
      maxLines: MAX_LINES,
    });
  }

  const boldFrom = Math.max(1, Math.min(quote.boldLineStart ?? 2, lines.length));
  const boldTo = Math.max(boldFrom, Math.min(quote.boldLineEnd ?? 2, lines.length));

  return { lines, boldFrom, boldTo };
}

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
   * Select next quote: cycle aléatoire équilibré
   * - On mélange la liste une fois (ordre différent à chaque cycle)
   * - On affiche chaque citation une fois dans cet ordre
   * - À la fin du cycle, on remélange pour le cycle suivant
   * → Aucune phrase oubliée, ordre jamais le même
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

      const settings = await this.storage.getSettings();
      const quoteIds = quotes.map((q) => q.id);
      let cycleIds = settings.displayCycleIds;
      let cycleIndex = settings.displayCycleIndex ?? 0;

      const cycleValid =
        Array.isArray(cycleIds) &&
        cycleIds.length === quoteIds.length &&
        cycleIds.every((id) => quoteIds.includes(id));

      if (!cycleValid || cycleIndex >= (cycleIds?.length ?? 0)) {
        cycleIds = shuffleArray(quoteIds);
        cycleIndex = 0;
      }

      const selectedId = cycleIds[cycleIndex];
      const selected = quotes.find((q) => q.id === selectedId);
      cycleIndex += 1;

      await this.storage.updateSettings({
        lastDisplayedId: selectedId,
        displayCycleIds: cycleIds,
        displayCycleIndex: cycleIndex,
      });

      return selected;
    } catch (error) {
      log.error('Failed to select random quote', error);
      return this.getDefaultQuote(language);
    }
  }

  /**
   * Weighted random selection (conservé pour un éventuel mode "épinglées 3x" plus tard)
   * Non utilisé par le cycle aléatoire actuel.
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
   * Validate quote data (accepts legacy or new format)
   */
  validateQuote(quoteData) {
    const errors = [];
    const isNewFormat = quoteData.textFr !== undefined;

    if (isNewFormat) {
      if (!quoteData.textFr || quoteData.textFr.trim() === '') {
        errors.push('textFr is required');
      }
      if (quoteData.textFr && quoteData.textFr.length > 2000) {
        errors.push('textFr exceeds 2000 characters');
      }
      if (quoteData.textEn !== undefined && quoteData.textEn !== null && quoteData.textEn.length > 2000) {
        errors.push('textEn exceeds 2000 characters');
      }
      const start = quoteData.boldLineStart ?? 2;
      const end = quoteData.boldLineEnd ?? 2;
      if (typeof start !== 'number' || start < 1) {
        errors.push('boldLineStart must be a positive number');
      }
      if (typeof end !== 'number' || end < 1) {
        errors.push('boldLineEnd must be a positive number');
      }
      if (start > end) {
        errors.push('boldLineStart must be <= boldLineEnd');
      }
    } else {
      const requiredFields = ['line1Fr', 'line2Fr', 'line3Fr', 'line1En', 'line2En', 'line3En'];
      requiredFields.forEach((field) => {
        if (!quoteData[field] || quoteData[field].trim() === '') {
          errors.push(`${field} is required`);
        }
      });
      requiredFields.forEach((field) => {
        if (quoteData[field] && quoteData[field].length > 500) {
          errors.push(`${field} exceeds 500 characters`);
        }
      });
    }

    if (quoteData.isPinned !== undefined && typeof quoteData.isPinned !== 'boolean') {
      errors.push('isPinned must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format quote for display: returns { lines, boldFrom, boldTo } (1-based)
   */
  formatQuoteForDisplay(quote, language = 'fr') {
    if (!quote) return null;
    return getLinesFromQuote(quote, language);
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
