/**
 * React Hook for Quotes Management
 * Provides CRUD operations and state management
 */

import { useState, useEffect, useCallback } from 'react';
import quotesStorage from '../services/quotes/quotesStorage';
import quotesService from '../services/quotes/quotesService';
import logger from '../utils/logger';

const log = logger.component('useQuotes');

export function useQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load quotes and settings
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [quotesData, settingsData] = await Promise.all([
        quotesStorage.getAllQuotes(),
        quotesStorage.getSettings(),
      ]);

      setQuotes(quotesData);
      setSettings(settingsData);
    } catch (err) {
      log.error('Failed to load quotes', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add quote
  const addQuote = useCallback(async (quoteData) => {
    try {
      // Validate
      const validation = quotesService.validateQuote(quoteData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const newQuote = await quotesStorage.addQuote(quoteData);
      setQuotes((prev) => [...prev, newQuote].sort((a, b) => a.order - b.order));
      return { success: true, quote: newQuote };
    } catch (err) {
      log.error('Failed to add quote', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Update quote
  const updateQuote = useCallback(async (id, updates) => {
    try {
      const updated = await quotesStorage.updateQuote(id, updates);
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      return { success: true, quote: updated };
    } catch (err) {
      log.error('Failed to update quote', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Delete quote
  const deleteQuote = useCallback(async (id) => {
    try {
      await quotesStorage.deleteQuote(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      return { success: true };
    } catch (err) {
      log.error('Failed to delete quote', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Reorder quotes
  const reorderQuotes = useCallback(async (quoteIds) => {
    try {
      await quotesStorage.reorderQuotes(quoteIds);
      // Reload to get updated order
      await loadData();
      return { success: true };
    } catch (err) {
      log.error('Failed to reorder quotes', err);
      return { success: false, error: err.message };
    }
  }, [loadData]);

  // Toggle pin
  const togglePin = useCallback(
    async (id) => {
      try {
        const quote = quotes.find((q) => q.id === id);
        if (!quote) throw new Error('Quote not found');

        const updated = await quotesStorage.updateQuote(id, {
          isPinned: !quote.isPinned,
        });

        setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
        return { success: true, quote: updated };
      } catch (err) {
        log.error('Failed to toggle pin', err);
        return { success: false, error: err.message };
      }
    },
    [quotes]
  );

  // Update settings
  const updateSettings = useCallback(async (newSettings) => {
    try {
      const updated = await quotesStorage.updateSettings(newSettings);
      setSettings(updated);
      return { success: true, settings: updated };
    } catch (err) {
      log.error('Failed to update settings', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    quotes,
    settings,
    loading,
    error,
    addQuote,
    updateQuote,
    deleteQuote,
    reorderQuotes,
    togglePin,
    updateSettings,
    refresh,
  };
}
