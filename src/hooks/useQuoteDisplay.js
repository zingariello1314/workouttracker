/**
 * React Hook for Quote Display
 * Handles quote selection and display logic
 * Features:
 * - Auto-rotation every 90 seconds
 * - Change on any user interaction (click, touch, etc.)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import quotesService from '../services/quotes/quotesService';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

const log = logger.component('useQuoteDisplay');

const AUTO_ROTATION_INTERVAL = 90000; // 90 seconds

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

  // Select and display quote - SEAMLESS: no loading state after initial load
  const selectQuote = useCallback(async () => {
    try {
      const preferredUserQuote = String(currentUser?.preferredHomeQuote || currentUser?.inspirationalPhrase || '').trim();
      if (isAuthenticated && preferredUserQuote) {
        setCurrentQuote({
          id: `user-preferred-${currentUser?.id || 'unknown'}`,
          textFr: preferredUserQuote,
          textEn: preferredUserQuote,
          isPinned: true,
        });
        if (isInitialLoadRef.current) {
          setLoading(false);
          isInitialLoadRef.current = false;
        }
        return;
      }
      if (!isAuthenticated) {
        const guestQuote = "Bienvenue. Connecte-toi pour afficher ta phrase inspirante personnelle.";
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

      // ✅ Only show loading on initial load, not on subsequent changes
      if (isInitialLoadRef.current) {
        setLoading(true);
      }
      setError(null);

      const quote = await quotesService.selectQuote(language);
      setCurrentQuote(quote);
      log.info('Quote selected', { id: quote.id });
    } catch (err) {
      log.error('Failed to select quote', err);
      setError(err.message);
      // Fallback to default
      setCurrentQuote(quotesService.getDefaultQuote(language));
    } finally {
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

  // Handle user interaction (click, touch, etc.)
  const handleInteraction = useCallback(() => {
    if (!enableInteractionRotation) return;

    // ✅ INSTANT RESPONSE: No debounce - change immediately on every click
    // This matches the background image behavior for perfect synchronization
    log.info('Quote changed by user interaction');
    lastInteractionRef.current = Date.now();
    refreshQuote();
  }, [enableInteractionRotation, refreshQuote]);

  // Format for display
  const displayQuote = currentQuote
    ? quotesService.formatQuoteForDisplay(currentQuote, language)
    : null;

  return {
    currentQuote,
    displayQuote,
    loading,
    error,
    refreshQuote,
    handleInteraction, // New: call this on user interactions
  };
}
