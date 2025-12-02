/**
 * Hook pour récupérer les données Yahoo Finance d'un ticker
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { yahooFinanceService } from '../services/finance/yahooFinanceService';
import logger from '../utils/logger';

const log = logger.module('useYahooFinance');

export const useYahooFinance = (ticker, options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 60000,
    enabled = true,
    period = '1mo'
  } = options;

  const [quoteData, setQuoteData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!ticker || !enabled) return;

    // Annuler requête précédente si en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Fetch quote data
      const quote = await yahooFinanceService.getQuoteData(ticker, { forceRefresh });
      setQuoteData(quote);
      
      // Fetch historical data
      const historical = await yahooFinanceService.getHistoricalData(ticker, period, { forceRefresh });
      setHistoricalData(historical);
      
      setLastUpdate(new Date());
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        log.error('Yahoo Finance fetch error:', err);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [ticker, enabled, period]);

  // Chargement initial
  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !enabled) return;

    intervalRef.current = setInterval(() => {
      fetchData(false); // Utiliser cache si disponible
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, enabled, fetchData]);

  const refresh = useCallback(() => {
    fetchData(true); // Force refresh
  }, [fetchData]);

  return {
    quoteData,
    historicalData,
    loading,
    error,
    lastUpdate,
    refresh
  };
};

