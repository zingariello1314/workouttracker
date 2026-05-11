/**
 * Business Logic Service for Quotes
 * Smart selection algorithms and validation
 * Supports legacy format (line1/2/3) and new format (textFr/textEn + bold range)
 */

import quotesStorage from './quotesStorage';
import { autoSplitText } from './quoteAutoSplit';
import { normalizeQuoteLineBreaks } from './quoteNewlines';
import logger from '../../utils/logger';

const log = logger.component('QuotesService');

const TARGET_CHARS_PER_LINE = 28;
const MIN_LINES = 2;
/** Découpe auto + plafond d’affichage accueil : au-delà, fusion dans la dernière ligne visible (évite 6 lignes rognées). */
const MAX_LINES_AUTO = 5;

/** Fusionne les lignes au-delà du plafond (saisie manuelle longue ou anciennes données). */
function capQuoteLinesForHome(lines, maxLines = MAX_LINES_AUTO) {
  if (!Array.isArray(lines) || lines.length <= maxLines) return lines;
  const head = lines.slice(0, maxLines - 1);
  head.push(lines.slice(maxLines - 1).join(' '));
  return head;
}

/** True si au moins un champ textFr/textEn (non vide) : source « nouvelle » à privilégier sur line1–3 résiduels. */
function quoteHasSeparateTextBlob(quote) {
  const fr = typeof quote?.textFr === 'string' ? quote.textFr.trim() : '';
  const en = typeof quote?.textEn === 'string' ? quote.textEn.trim() : '';
  return fr !== '' || en !== '';
}

/** Coupe + plafonne (logique commune format nouveau et legacy mono-bloc). */
function splitPlainToDisplayLines(trimmed, splitOptions) {
  const t = trimmed.trim();
  if (!t) return [];
  let lines;
  if (t.includes('\n')) {
    lines = t.split('\n').map((l) => l.trim()).filter(Boolean);
  } else {
    const goal = splitOptions.autoSplitLineGoal;
    lines = autoSplitText(t, {
      targetCharsPerLine: TARGET_CHARS_PER_LINE,
      minLines: MIN_LINES,
      maxLines: MAX_LINES_AUTO,
      balancedLineGoal:
        goal != null && Number.isFinite(Number(goal))
          ? Math.min(Math.max(2, Math.floor(Number(goal))), MAX_LINES_AUTO)
          : null,
    });
  }
  return capQuoteLinesForHome(lines);
}

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
 * Ancien format (line1–3) seulement quand aucun bloc textFr/textEn exploitable —
 * sinon on reste sur la voie nouvelle même si line1Fr traîne après une migration/import.
 */
function isLegacyQuote(quote) {
  return quote && typeof quote.line1Fr === 'string' && !quoteHasSeparateTextBlob(quote);
}

/**
 * Get lines array and bold range from a quote for a given language
 */
function getLinesFromQuote(quote, language = 'fr', splitOptions = {}) {
  if (!quote) return { lines: [], boldFrom: 2, boldTo: 2 };

  if (isLegacyQuote(quote)) {
    const line1 = language === 'en' ? quote.line1En : quote.line1Fr;
    const line2 = language === 'en' ? quote.line2En : quote.line2Fr;
    const line3 = language === 'en' ? quote.line3En : quote.line3Fr;
    let lines = [line1, line2, line3]
      .filter((x) => x != null && String(x).trim() !== '')
      .flatMap((l) =>
        normalizeQuoteLineBreaks(String(l))
          .split('\n')
          .map((seg) => seg.trim())
          .filter(Boolean),
      );

    /*
     * Ancien schéma : tout le poème dans line1Fr, line2–3 vides → un seul <span>,
     * le navigateur coupe en ~6 lignes visuelles sans appliquer maxLines Auto / plafond 5.
     */
    const joinedApprox = lines.join(' ').length;
    if (lines.length === 1 && joinedApprox >= 64) {
      lines = splitPlainToDisplayLines(lines[0], splitOptions);
    } else {
      lines = capQuoteLinesForHome(lines);
    }

    let boldFrom = 2;
    let boldTo = 2;
    if (quote.boldLineStart != null || quote.boldLineEnd != null) {
      boldFrom = Math.max(1, Math.min(quote.boldLineStart ?? 2, Math.max(lines.length, 1)));
      boldTo = Math.max(boldFrom, Math.min(quote.boldLineEnd ?? boldFrom, lines.length));
    }
    return { lines, boldFrom, boldTo };
  }

  const raw = language === 'en' ? (quote.textEn || quote.textFr || '') : (quote.textFr || '');
  const text = normalizeQuoteLineBreaks(raw);
  const trimmed = text.trim();
  if (!trimmed) {
    const fallback = language === 'en' ? quote.textFr : quote.textEn;
    if (fallback)
      return getLinesFromQuote({ ...quote, textFr: fallback, textEn: fallback }, language, splitOptions);
    return { lines: [], boldFrom: 2, boldTo: 2 };
  }

  const lines = splitPlainToDisplayLines(trimmed, splitOptions);

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

      let selectedId = cycleIds[cycleIndex];
      let selected = quotes.find((q) => String(q.id) === String(selectedId));

      // Id du cycle inexistant / type id différent → évite undefined (flash fallback page d’accueil)
      if (!selected) {
        log.warn('[QuotesService] Cycle id introuvable, remélange du cycle', { selectedId });
        cycleIds = shuffleArray(quoteIds);
        cycleIndex = 0;
        selectedId = cycleIds[cycleIndex];
        selected = quotes.find((q) => String(q.id) === String(selectedId));
      }

      cycleIndex += 1;

      await this.storage.updateSettings({
        lastDisplayedId: selectedId ?? null,
        displayCycleIds: cycleIds,
        displayCycleIndex: cycleIndex,
      });

      return selected || this.getDefaultQuote(language);
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
  formatQuoteForDisplay(quote, language = 'fr', splitOptions = {}) {
    if (!quote) return null;
    return getLinesFromQuote(quote, language, splitOptions);
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
