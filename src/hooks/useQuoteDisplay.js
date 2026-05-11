/**
 * React Hook for Quote Display
 * Handles quote selection and display logic
 * Features:
 * - Auto-rotation every 90 seconds
 * - Change on any user interaction (click, touch, etc.)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import quotesService from '../services/quotes/quotesService';
import quotesStorage from '../services/quotes/quotesStorage';
import { normalizeQuoteLineBreaks } from '../services/quotes/quoteNewlines';
import { QUOTE_SPLIT_SETTINGS_UPDATED } from '../services/quotes/quoteSettingsEvents';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

const log = logger.component('useQuoteDisplay');

const AUTO_ROTATION_INTERVAL = 90000; // 90 seconds
const INTERACTION_MIN_GAP_MS = 280;
async function loadQuoteSplitPrefs() {
  try {
    const s = await quotesStorage.getSettings();
    const g = s.autoSplitLineGoal;
    if (g == null || g === '') return { autoSplitLineGoal: null };
    const n = Number(g);
    if (!Number.isFinite(n) || n < 2 || n > 12) return { autoSplitLineGoal: null };
    return { autoSplitLineGoal: n };
  } catch {
    return { autoSplitLineGoal: null };
  }
}

export function useQuoteDisplay(options = {}) {
  const {
    enableAutoRotation = true,
    enableInteractionRotation = true,
    autoRotationInterval = AUTO_ROTATION_INTERVAL,
  } = options;

  const { language } = useLanguage();
  const { currentUser, isAuthenticated } = useAuth();
  const [currentQuote, setCurrentQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const autoRotationTimerRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());
  const isInitialLoadRef = useRef(true); // Track if this is the first load
  const requestVersionRef = useRef(0);
  const inFlightRef = useRef(false);
  const [quoteSplitPrefs, setQuoteSplitPrefs] = useState({ autoSplitLineGoal: null });

  useEffect(() => {
    let cancelled = false;
    loadQuoteSplitPrefs().then((p) => {
      if (!cancelled) setQuoteSplitPrefs(p);
    });
    const onPrefs = () => {
      loadQuoteSplitPrefs().then((p) => setQuoteSplitPrefs(p));
    };
    window.addEventListener(QUOTE_SPLIT_SETTINGS_UPDATED, onPrefs);
    return () => {
      cancelled = true;
      window.removeEventListener(QUOTE_SPLIT_SETTINGS_UPDATED, onPrefs);
    };
  }, []);

  // Select and display quote - SEAMLESS: no loading state after initial load
  const selectQuote = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    const requestVersion = ++requestVersionRef.current;
    try {
      if (!isAuthenticated) {
        const guestQuote = "Bienvenue. Connecte-toi pour afficher ta phrase inspirante personnelle.";
        if (requestVersion !== requestVersionRef.current) return;
        setCurrentQuote({
          id: 'guest-default',
          textFr: guestQuote,
          textEn: guestQuote,
          isPinned: true,
        });
        if (isInitialLoadRef.current) {
          setLoading(false);
          isInitialLoadRef.current = false;
        }
        return;
      }

      /** Citations locales (Paramètres → Citations) : priorité sur la phrase profil Auth, sinon l’édition IndexedDB était ignorée et tout passait en auto-split ~28 car. */
      if (isInitialLoadRef.current) {
        setLoading(true);
      }
      setError(null);

      let quotes = [];
      try {
        quotes = await quotesStorage.getAllQuotes();
      } catch {
        quotes = [];
      }

      const preferredRaw = String(
        currentUser?.preferredHomeQuote || currentUser?.inspirationalPhrase || '',
      ).trim();
      const preferredUserQuote = normalizeQuoteLineBreaks(preferredRaw).trim();

      if (quotes.length > 0) {
        const quote = await quotesService.selectQuote(language);
        if (requestVersion !== requestVersionRef.current) return;
        if (quote && typeof quote === 'object') {
          setCurrentQuote(quote);
          log.info('Quote selected from library', { id: quote.id, count: quotes.length });
        } else {
          setCurrentQuote((prev) => prev || quotesService.getDefaultQuote(language));
          log.warn('Quote sélection invalide — conservation de la citation affichée si possible');
        }
      } else if (preferredUserQuote) {
        if (requestVersion !== requestVersionRef.current) return;
        setCurrentQuote({
          id: `user-preferred-${currentUser?.id || 'unknown'}`,
          textFr: preferredUserQuote,
          textEn: preferredUserQuote,
          isPinned: true,
        });
        log.info('Home quote: profil (aucune citation dans la bibliothèque locale)');
      } else {
        const quote = await quotesService.selectQuote(language);
        if (requestVersion !== requestVersionRef.current) return;
        if (quote && typeof quote === 'object') {
          setCurrentQuote(quote);
          log.info('Quote selected', { id: quote.id });
        } else {
          setCurrentQuote((prev) => prev || quotesService.getDefaultQuote(language));
          log.warn('Quote sélection invalide — conservation de la citation affichée si possible');
        }
      }
    } catch (err) {
      if (requestVersion !== requestVersionRef.current) return;
      log.error('Failed to select quote', err);
      setError(err.message);
      // Garder la citation précédente si disponible pour éviter les flashes.
      setCurrentQuote((prev) => prev || quotesService.getDefaultQuote(language));
    } finally {
      inFlightRef.current = false;
      if (isInitialLoadRef.current) {
        setLoading(false);
        isInitialLoadRef.current = false; // Mark initial load as complete
      }
    }
  }, [currentUser?.id, currentUser?.inspirationalPhrase, currentUser?.preferredHomeQuote, isAuthenticated, language]);

  // Initial load
  useEffect(() => {
    selectQuote();
  }, [selectQuote]);

  // Auto-rotation timer
  useEffect(() => {
    if (!enableAutoRotation) return;

    // Clear existing timer
    if (autoRotationTimerRef.current) {
      clearInterval(autoRotationTimerRef.current);
    }

    // Set up new timer
    autoRotationTimerRef.current = setInterval(() => {
      log.info('Auto-rotating quote (90s timer)');
      selectQuote();
    }, autoRotationInterval);

    // Cleanup on unmount
    return () => {
      if (autoRotationTimerRef.current) {
        clearInterval(autoRotationTimerRef.current);
      }
    };
  }, [enableAutoRotation, autoRotationInterval, selectQuote]);

  // Refresh quote (for manual refresh)
  const refreshQuote = useCallback(() => {
    selectQuote();
    
    // Reset auto-rotation timer
    if (enableAutoRotation && autoRotationTimerRef.current) {
      clearInterval(autoRotationTimerRef.current);
      autoRotationTimerRef.current = setInterval(() => {
        log.info('Auto-rotating quote (90s timer)');
        selectQuote();
      }, autoRotationInterval);
    }
  }, [selectQuote, enableAutoRotation, autoRotationInterval]);

  /**
   * Tente de faire défiler la citation (même throttle que l’interaction page d’accueil).
   * Retourne true si un nouveau tirage est lancé — pour synchroniser fond + texte.
   */
  const tryAdvanceQuoteFromInteraction = useCallback(() => {
    if (!enableInteractionRotation) return false;
    if (inFlightRef.current) return false;
    const now = Date.now();
    if (now - lastInteractionRef.current < INTERACTION_MIN_GAP_MS) return false;

    log.info('Quote changed by user interaction');
    lastInteractionRef.current = now;
    refreshQuote();
    return true;
  }, [enableInteractionRotation, refreshQuote]);

  // Handle user interaction (click, touch, etc.)
  const handleInteraction = useCallback(() => {
    tryAdvanceQuoteFromInteraction();
  }, [tryAdvanceQuoteFromInteraction]);

  // Format for display (reflète Paramètres → objectif de lignes pour l’auto-découpe)
  const displayQuote = useMemo(() => {
    if (!currentQuote) return null;
    return quotesService.formatQuoteForDisplay(currentQuote, language, {
      autoSplitLineGoal: quoteSplitPrefs.autoSplitLineGoal,
    });
  }, [currentQuote, language, quoteSplitPrefs.autoSplitLineGoal]);

  return {
    currentQuote,
    displayQuote,
    loading,
    error,
    refreshQuote,
    handleInteraction,
    tryAdvanceQuoteFromInteraction,
  };
}
