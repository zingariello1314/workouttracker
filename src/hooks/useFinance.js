/**
 * Hook principal pour la gestion du portfolio Finance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { financeStorage } from '../services/finance/financeStorage';
import { yahooFinanceService } from '../services/finance/yahooFinanceService';
import { 
  calculateBatchMetrics, 
  invalidatePositionCache 
} from '../services/finance/financeCalculations';
import logger from '../utils/logger';

const log = logger.module('useFinance');

export const useFinance = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);
  const refreshAbortControllerRef = useRef(null);

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
                // ✅ PHASE 3 - Étape 3.15 : Ne pas inclure MA si pas de données historiques
                // Les MA seront calculées plus tard quand on aura les données historiques
                return {
                  ...position,
                  yahooData: {
                    ...yahooData
                    // MA (ma20, ma50, ma200) seront calculées plus tard avec données historiques
                    // Ne pas inclure de placeholders pour éviter signaux techniques incorrects
                  }
                };
              } catch (err) {
                log.warn(`Failed to fetch Yahoo data for ${position.ticker}:`, err);
                // Ne pas définir yahooData avec prixEntree pour éviter plus-value à 0
                // Retourner position sans yahooData, un refresh sera nécessaire
                return position;
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
        
        // Si certaines positions n'ont pas de yahooData, forcer un refresh immédiat
        const positionsWithoutYahooData = withCalculations.filter(p => !p.yahooData || !p.yahooData.prixActuel);
        if (positionsWithoutYahooData.length > 0) {
          log.info(`Forcing refresh for ${positionsWithoutYahooData.length} positions without Yahoo data`);
          // Rafraîchir en arrière-plan sans bloquer l'affichage
          setTimeout(() => {
            refreshYahooData().catch(err => {
              log.error('Error refreshing positions without Yahoo data:', err);
            });
          }, 1000);
        }
        
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

  // ✅ PHASE 5 - Étape 5.2 : Auto-refresh intelligent avec comparaison données et Page Visibility API
  useEffect(() => {
    const isMarketOpen = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Lundi-Vendredi, 9h-17h30 (heures bourse US approximatives)
      return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
    };

    // ✅ PHASE 5 - Étape 5.2 : Référence pour état visibilité page
    let isPageVisible = !document.hidden;

    // ✅ PHASE 5 - Étape 5.2 : Handler pour changement visibilité page
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      
      // Si page redevient visible et marché ouvert, refresh immédiat
      if (isPageVisible && isMarketOpen() && portfolio.length > 0) {
        refreshYahooData().catch(err => {
          log.warn('Error refreshing on visibility change:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ✅ PHASE 5 - Étape 5.2 : Auto-refresh intelligent seulement si marché ouvert ET page visible
    if (isMarketOpen() && portfolio.length > 0) {
      refreshIntervalRef.current = setInterval(async () => {
        // ✅ PHASE 5 - Étape 5.2 : Ne refresh que si page visible
        if (!isPageVisible) {
          log.debug('Page not visible, skipping auto-refresh');
          return;
        }

        try {
          // ✅ PHASE 5 - Étape 5.2 : refreshYahooData compare déjà les données (lignes 308-319)
          // et skip si pas de changement, donc on peut appeler directement
          await refreshYahooData();
        } catch (err) {
          log.warn('Error during auto-refresh:', err);
        }
      }, 60000); // 1 minute
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [portfolio.length, refreshYahooData]);

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
    let yahooDataLoaded = false;
    try {
      console.log('🌐 [useFinance] Récupération données Yahoo pour', normalized.ticker);
      const yahooData = await yahooFinanceService.getQuoteData(normalized.ticker, { forceRefresh: true });
      console.log('📊 [useFinance] Données Yahoo reçues:', yahooData);
      
      if (yahooData && yahooData.prixActuel && yahooData.prixActuel > 0) {
        // ✅ PHASE 3 - Étape 3.15 : Ne pas inclure MA si pas de données historiques
        // Les MA seront calculées plus tard quand on aura les données historiques
        normalized.yahooData = {
          ...yahooData
          // MA (ma20, ma50, ma200) seront calculées plus tard avec données historiques
          // Ne pas inclure de placeholders pour éviter signaux techniques incorrects
        };
        yahooDataLoaded = true;
        console.log('📈 [useFinance] Données Yahoo enrichies:', normalized.yahooData);
      } else {
        console.warn('⚠️ [useFinance] Données Yahoo invalides (prixActuel manquant ou 0)');
        normalized.yahooData = undefined;
      }
    } catch (err) {
      console.warn('⚠️ [useFinance] Yahoo data unavailable, will retry on refresh:', err.message);
      // Ne pas définir yahooData avec prixEntree car cela donnerait une plus-value de 0
      // Laisser yahooData undefined pour que le système force un refresh
      normalized.yahooData = undefined;
    }

    // Calculs automatiques et mise à jour state
    // ✅ FIX : Utiliser fonction updater pour éviter closure stale
    let addedPosition;
    setPortfolio(prev => {
      console.log('📋 [useFinance] Portfolio actuel:', prev.length, 'positions');
      
      // Créer nouveau portfolio avec position ajoutée
      const newPortfolio = [...prev, normalized];
      console.log('📊 [useFinance] Nouveau portfolio avant calculs:', newPortfolio.length, 'positions');
      
      // Calculer métriques pour TOUT le portfolio (important pour poidsPortfolio)
      const withCalculations = calculateBatchMetrics(newPortfolio);
      console.log('✅ [useFinance] Portfolio avec calculs:', withCalculations.length, 'positions');
      
      // Récupérer la position ajoutée (dernière dans le tableau)
      addedPosition = withCalculations[withCalculations.length - 1];
      
      // Sauvegarder en storage de manière asynchrone
      financeStorage.savePortfolio(withCalculations).catch(err => {
        log.error('Error saving portfolio after add:', err);
      });
      
      return withCalculations;
    });

    console.log('🎉 [useFinance] Position ajoutée avec succès!');
    
    // Si Yahoo data n'a pas été chargée, forcer un refresh immédiat en arrière-plan
    if (!yahooDataLoaded) {
      console.log('🔄 [useFinance] Forcing refresh pour position sans Yahoo data');
      setTimeout(async () => {
        try {
          await refreshYahooData();
        } catch (err) {
          log.error('Error refreshing after add:', err);
        }
      }, 500);
    }
    
    return addedPosition;
  }, []); // Pas de dépendance portfolio pour éviter closure stale

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
    // ✅ OPTIMISATION Phase 1.2 : Nettoyer cache position supprimée
    invalidatePositionCache(id);
    
    const updated = portfolio.filter(pos => pos.id !== id);
    
    // Recalculer positions restantes pour mettre à jour poidsPortfolio
    const withCalculations = calculateBatchMetrics(updated);
    
    setPortfolio(withCalculations);
    await financeStorage.savePortfolio(withCalculations);
    await financeStorage.deletePosition(id);
  }, [portfolio]);

  /**
   * ✅ OPTIMISATION Phase 1.3 : Refresh Yahoo data refactorisé
   * - Async/await propre (pas d'anti-pattern setState)
   * - Comparaison données avant mise à jour
   * - Gestion erreurs complète
   * - Loading state approprié
   * - Évite race conditions avec AbortController
   */
  const refreshYahooData = useCallback(async () => {
    // Annuler refresh précédent si en cours
    if (refreshAbortControllerRef.current) {
      refreshAbortControllerRef.current.abort();
    }
    refreshAbortControllerRef.current = new AbortController();
    const signal = refreshAbortControllerRef.current.signal;

    // Obtenir portfolio actuel de manière sûre
    let currentPortfolio;
    setPortfolio(prev => {
      currentPortfolio = prev;
      return prev; // Pas de changement immédiat
    });

    if (!currentPortfolio || currentPortfolio.length === 0) {
      log.debug('No portfolio to refresh');
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const tickers = currentPortfolio.map(p => p.ticker);
      const batchSize = 5;
      const BATCH_DELAY = 500; // Réduit à 500ms
      const updatedPositions = [];
      const errors = [];

      // Traiter par batches séquentiels
      for (let i = 0; i < tickers.length; i += batchSize) {
        // Vérifier si annulé
        if (signal.aborted) {
          log.debug('Refresh cancelled');
          return;
        }

        const batch = tickers.slice(i, i + batchSize);
        
        // Charger batch en parallèle
        const batchResults = await Promise.allSettled(
          batch.map(async (ticker) => {
            const position = currentPortfolio.find(p => p.ticker === ticker);
            if (!position) return null;

            try {
              // Récupérer données Yahoo avec forceRefresh pour éviter cache obsolète
              const yahooData = await yahooFinanceService.getQuoteData(ticker, { 
                forceRefresh: true 
              });

              // Comparer avec données existantes pour éviter mises à jour inutiles
              const currentPrice = position.yahooData?.prixActuel;
              const newPrice = yahooData.prixActuel;
              
              // Si prix identique et données récentes, skip
              if (currentPrice === newPrice && position.yahooData?.timestamp) {
                const dataAge = Date.now() - position.yahooData.timestamp;
                if (dataAge < 60000) { // Moins d'1 minute
                  log.debug(`Skipping ${ticker} - no changes`);
                  return null; // Pas de changement
                }
              }

              // Invalider cache position avant recalcul
              invalidatePositionCache(position.id);

              // ✅ PHASE 3 - Étape 3.15 : Construire position mise à jour sans placeholders MA
              // Les MA réelles seront calculées plus tard avec données historiques
              const updated = {
                ...position,
                yahooData: {
                  ...yahooData,
                  timestamp: Date.now()
                  // MA (ma20, ma50, ma200) seront calculées plus tard avec données historiques
                  // Ne pas inclure de placeholders pour éviter signaux techniques incorrects
                }
              };

              return updated;
            } catch (err) {
              log.warn(`Failed to refresh ${ticker}:`, err);
              errors.push({ ticker, error: err });
              return null; // Garder position existante
            }
          })
        );

        // Traiter résultats batch
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            updatedPositions.push(result.value);
          } else if (result.status === 'rejected') {
            const ticker = batch[index];
            errors.push({ ticker, error: result.reason });
          }
        });

        // Délai entre batches seulement si nécessaire
        if (i + batchSize < tickers.length && !signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      // Vérifier si annulé avant mise à jour
      if (signal.aborted) {
        log.debug('Refresh cancelled before update');
        return;
      }

      // Mettre à jour portfolio seulement si changements détectés
      if (updatedPositions.length > 0) {
        setPortfolio(prev => {
          // Créer map pour lookup rapide
          const updatedMap = new Map(updatedPositions.map(p => [p.id || p.ticker, p]));
          
          // Fusionner positions mises à jour avec positions existantes
          const merged = prev.map(p => {
            const updated = updatedMap.get(p.id || p.ticker);
            return updated || p;
          });

          // Recalculer métriques avec cache incrémental
          const withCalculations = calculateBatchMetrics(merged);
          
          // Sauvegarder de manière asynchrone (ne bloque pas UI)
          financeStorage.savePortfolio(withCalculations).catch(err => {
            log.error('Error saving portfolio after refresh:', err);
          });
          
          return withCalculations;
        });
      } else {
        log.debug('No positions updated during refresh');
      }

      // Logger erreurs si présentes
      if (errors.length > 0) {
        log.warn(`Refresh completed with ${errors.length} errors:`, errors);
      }
    } catch (err) {
      if (!signal.aborted) {
        log.error('Error refreshing Yahoo data:', err);
        setError(err);
      }
    } finally {
      if (!signal.aborted) {
        setRefreshing(false);
      }
      refreshAbortControllerRef.current = null;
    }
  }, []);

  return {
    portfolio,
    loading,
    error,
    refreshing, // ✅ OPTIMISATION Phase 1.3 : Loading state pour refresh
    addPosition,
    updatePosition,
    deletePosition,
    refreshYahooData,
    calculateMetrics: useCallback(() => {
      return calculateBatchMetrics(portfolio);
    }, [portfolio])
  };
};

