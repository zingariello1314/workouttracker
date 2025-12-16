/**
 * Hook principal pour la gestion du portfolio Finance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { financeStorage } from '../services/finance/financeStorage';
import { yahooFinanceService } from '../services/finance/yahooFinanceService';
import { calculateBatchMetrics } from '../services/finance/financeCalculations';
import logger from '../utils/logger';

const log = logger.module('useFinance');

export const useFinance = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshIntervalRef = useRef(null);

  // Chargement initial avec optimisme
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await financeStorage.loadPortfolio();
        
        // Charger données Yahoo en parallèle (batch limité à 5)
        const batchSize = 5;
        const enrichedData = [];
        
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          const enrichedBatch = await Promise.all(
            batch.map(async (position) => {
              try {
                const yahooData = await yahooFinanceService.getQuoteData(position.ticker);
                return {
                  ...position,
                  yahooData: {
                    ...yahooData,
                    // Moyennes mobiles basiques (à améliorer avec historique)
                    ma20: yahooData.prixActuel * 0.98, // Placeholder
                    ma50: yahooData.prixActuel * 0.95, // Placeholder
                    ma200: yahooData.prixActuel * 0.90  // Placeholder
                  }
                };
              } catch (err) {
                log.warn(`Failed to fetch Yahoo data for ${position.ticker}:`, err);
                return {
                  ...position,
                  yahooData: {
                    prixActuel: position.prixEntree,
                    variationJour: 0
                  }
                };
              }
            })
          );
          
          enrichedData.push(...enrichedBatch);
          
          // Délai entre batches pour respecter rate limits
          if (i + batchSize < data.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Calculer métriques
        const withCalculations = calculateBatchMetrics(enrichedData);
        setPortfolio(withCalculations);
      } catch (err) {
        setError(err);
        log.error('Error loading portfolio:', err);
        // Fallback : données locales sans Yahoo
        try {
          const localData = await financeStorage.loadPortfolio();
          const withCalculations = calculateBatchMetrics(localData);
          setPortfolio(withCalculations);
        } catch (e) {
          setPortfolio([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-refresh intelligent (seulement heures bourse)
  useEffect(() => {
    const isMarketOpen = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Lundi-Vendredi, 9h-17h30 (heures bourse US approximatives)
      return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
    };

    if (isMarketOpen() && portfolio.length > 0) {
      refreshIntervalRef.current = setInterval(async () => {
        await refreshYahooData();
      }, 60000); // 1 minute
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [portfolio.length]);

  // Ajout position avec validation
  const addPosition = useCallback(async (newPosition) => {
    console.log('🚀 [useFinance] Début addPosition avec:', newPosition);
    
    // Validation
    if (!newPosition.ticker || !newPosition.quantite || !newPosition.prixEntree) {
      console.error('❌ [useFinance] Validation échouée - données incomplètes');
      throw new Error('Données incomplètes');
    }

    // Normalisation ticker (uppercase)
    const normalized = {
      ...newPosition,
      ticker: newPosition.ticker.toUpperCase().trim(),
      id: crypto.randomUUID(),
      dateAchat: newPosition.dateAchat || new Date().toISOString().split('T')[0],
      investissementTotal: newPosition.quantite * newPosition.prixEntree
    };
    
    console.log('✅ [useFinance] Position normalisée:', normalized);

    // Récupérer données Yahoo
    try {
      console.log('🌐 [useFinance] Récupération données Yahoo pour', normalized.ticker);
      const yahooData = await yahooFinanceService.getQuoteData(normalized.ticker);
      console.log('📊 [useFinance] Données Yahoo reçues:', yahooData);
      
      normalized.yahooData = {
        ...yahooData,
        ma20: yahooData.prixActuel * 0.98,
        ma50: yahooData.prixActuel * 0.95,
        ma200: yahooData.prixActuel * 0.90
      };
      console.log('📈 [useFinance] Données Yahoo enrichies:', normalized.yahooData);
    } catch (err) {
      console.warn('⚠️ [useFinance] Yahoo data unavailable, using defaults:', err.message);
      normalized.yahooData = { 
        prixActuel: normalized.prixEntree,
        variationJour: 0
      };
    }

    // Calculs automatiques
    console.log('🧮 [useFinance] Calcul des métriques...');
    console.log('📋 [useFinance] Portfolio actuel:', portfolio.length, 'positions');
    const withCalculations = calculateBatchMetrics([...portfolio, normalized]);
    const updated = withCalculations[withCalculations.length - 1];
    console.log('✅ [useFinance] Position avec calculs:', updated);

    // Sauvegarder
    console.log('💾 [useFinance] Sauvegarde en cours...');
    setPortfolio(prev => {
      console.log('📊 [useFinance] Portfolio précédent:', prev.length, 'positions');
      const newPortfolio = [...prev, updated];
      console.log('📊 [useFinance] Nouveau portfolio:', newPortfolio.length, 'positions');
      
      // Sauvegarder en storage
      financeStorage.savePortfolio(newPortfolio);
      console.log('💾 [useFinance] Sauvegarde terminée');
      
      return newPortfolio;
    });

    console.log('🎉 [useFinance] Position ajoutée avec succès!');
    return updated;
  }, [portfolio]);

  // Mise à jour position
  const updatePosition = useCallback(async (id, updates) => {
    const updated = portfolio.map(pos => {
      if (pos.id === id) {
        const merged = { ...pos, ...updates };
        const withCalculations = calculateBatchMetrics([merged]);
        return withCalculations[0];
      }
      return pos;
    });
    
    setPortfolio(updated);
    await financeStorage.savePortfolio(updated);
  }, [portfolio]);

  // Suppression position
  const deletePosition = useCallback(async (id) => {
    const updated = portfolio.filter(pos => pos.id !== id);
    setPortfolio(updated);
    await financeStorage.savePortfolio(updated);
    await financeStorage.deletePosition(id);
  }, [portfolio]);

  // Refresh Yahoo data avec debounce batch
  const refreshYahooData = useCallback(async () => {
    setPortfolio(prev => {
      const tickers = prev.map(p => p.ticker);
      
      // Batch requests (max 5 simultanés)
      const batchSize = 5;
      const refreshPromises = [];
      
      for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);
        const batchPromise = Promise.all(
          batch.map(async (ticker) => {
            const position = prev.find(p => p.ticker === ticker);
            if (position) {
              try {
                const yahooData = await yahooFinanceService.getQuoteData(ticker, { forceRefresh: false });
                const updated = {
                  ...position,
                  yahooData: {
                    ...yahooData,
                    ma20: yahooData.prixActuel * 0.98,
                    ma50: yahooData.prixActuel * 0.95,
                    ma200: yahooData.prixActuel * 0.90
                  }
                };
                
                const withCalculations = calculateBatchMetrics([updated]);
                return withCalculations[0];
              } catch (err) {
                log.warn(`Failed to refresh ${ticker}`, err);
                return position; // Garder position existante en cas d'erreur
              }
            }
            return null;
          })
        );
        
        refreshPromises.push(batchPromise);
        
        // Délai entre batches
        if (i + batchSize < tickers.length) {
          refreshPromises.push(new Promise(resolve => setTimeout(resolve, 1000)));
        }
      }
      
      // Exécuter tous les batches
      Promise.all(refreshPromises).then(async (results) => {
        const refreshed = results
          .filter(r => Array.isArray(r))
          .flat()
          .filter(p => p !== null);
        
        if (refreshed.length > 0) {
          const updated = prev.map(p => {
            const refreshedPos = refreshed.find(r => r.ticker === p.ticker);
            return refreshedPos || p;
          });
          
          const withCalculations = calculateBatchMetrics(updated);
          setPortfolio(withCalculations);
          await financeStorage.savePortfolio(withCalculations);
        }
      });
      
      return prev; // Retour immédiat pour éviter blocage UI
    });
  }, []);

  return {
    portfolio,
    loading,
    error,
    addPosition,
    updatePosition,
    deletePosition,
    refreshYahooData,
    calculateMetrics: useCallback(() => {
      return calculateBatchMetrics(portfolio);
    }, [portfolio])
  };
};

