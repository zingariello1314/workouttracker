/**
 * Context Provider pour le module Finance
 * 
 * ✅ FIX : Partage state entre tous les composants Finance
 * - Évite problème de closure stale
 * - État global synchronisé
 * - Pattern identique à WorkoutContext et GarminContext
 * 
 * @module context/FinanceContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { financeStorage } from '../services/finance/financeStorage';
import { yahooFinanceService } from '../services/finance/yahooFinanceService';
import { 
  calculateBatchMetrics, 
  invalidatePositionCache 
} from '../services/finance/financeCalculations';
import logger from '../utils/logger';

const log = logger.module('FinanceContext');

const FinanceContext = createContext(null);

/**
 * Hook pour utiliser le contexte Finance
 */
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

/**
 * Provider pour le contexte Finance
 */
export const FinanceProvider = ({ children }) => {
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
                // Utiliser forceRefresh: true au chargement initial pour obtenir les vraies données
                const yahooData = await yahooFinanceService.getQuoteData(position.ticker, { forceRefresh: true });
                
                // Vérifier que les données sont valides
                if (!yahooData || !yahooData.prixActuel || yahooData.prixActuel <= 0) {
                  log.warn(`Invalid Yahoo data for ${position.ticker}:`, yahooData);
                  return position; // Retourner position sans yahooData
                }
                
                return {
                  ...position,
                  yahooData: {
                    ...yahooData,
                    timestamp: Date.now(),
                    // Moyennes mobiles basiques (à améliorer avec historique)
                    ma20: yahooData.prixActuel * 0.98, // Placeholder
                    ma50: yahooData.prixActuel * 0.95, // Placeholder
                    ma200: yahooData.prixActuel * 0.90  // Placeholder
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
        const positionsWithoutYahooData = withCalculations.filter(p => !p.yahooData || !p.yahooData.prixActuel || p.yahooData.prixActuel === p.prixEntree);
        if (positionsWithoutYahooData.length > 0) {
          log.info(`Forcing refresh for ${positionsWithoutYahooData.length} positions without valid Yahoo data`);
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

  // Refresh automatique au chargement si des positions n'ont pas de données Yahoo valides
  useEffect(() => {
    if (!loading && portfolio.length > 0) {
      const positionsWithoutValidData = portfolio.filter(p => 
        !p.yahooData || 
        !p.yahooData.prixActuel || 
        p.yahooData.prixActuel <= 0 ||
        p.yahooData.prixActuel === p.prixEntree
      );
      
      if (positionsWithoutValidData.length > 0) {
        log.info(`Auto-refreshing ${positionsWithoutValidData.length} positions without valid Yahoo data`);
        // Attendre un peu avant de rafraîchir pour ne pas bloquer le rendu initial
        const timeoutId = setTimeout(() => {
          refreshYahooData().catch(err => {
            log.error('Error auto-refreshing Yahoo data:', err);
          });
        }, 2000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [loading, portfolio, refreshYahooData]);

  // Auto-refresh intelligent (seulement heures bourse)
  useEffect(() => {
    const isMarketOpen = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Bourse ouverte : lundi-vendredi, 9h-17h30 (heure Paris)
      return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
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
  }, [portfolio.length, refreshYahooData]);

  // Ajout position avec validation
  const addPosition = useCallback(async (newPosition) => {
    console.log('🚀 [FinanceContext] Début addPosition avec:', newPosition);
    
    // Validation
    if (!newPosition.ticker || !newPosition.quantite || !newPosition.prixEntree) {
      console.error('❌ [FinanceContext] Validation échouée - données incomplètes');
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
    
    console.log('✅ [FinanceContext] Position normalisée:', normalized);

    // Récupérer données Yahoo avec forceRefresh pour obtenir les vraies données
    let yahooDataLoaded = false;
    try {
      console.log('🌐 [FinanceContext] Récupération données Yahoo pour', normalized.ticker);
      const yahooData = await yahooFinanceService.getQuoteData(normalized.ticker, { forceRefresh: true });
      console.log('📊 [FinanceContext] Données Yahoo reçues:', yahooData);
      
      if (yahooData && yahooData.prixActuel && yahooData.prixActuel > 0) {
        normalized.yahooData = {
          ...yahooData,
          timestamp: Date.now(),
          ma20: yahooData.prixActuel * 0.98,
          ma50: yahooData.prixActuel * 0.95,
          ma200: yahooData.prixActuel * 0.90
        };
        yahooDataLoaded = true;
        console.log('📈 [FinanceContext] Données Yahoo enrichies:', normalized.yahooData);
      } else {
        console.warn('⚠️ [FinanceContext] Données Yahoo invalides (prixActuel manquant ou 0)');
        normalized.yahooData = undefined;
      }
    } catch (err) {
      console.warn('⚠️ [FinanceContext] Yahoo data unavailable, will retry on refresh:', err.message);
      // Ne pas définir yahooData avec prixEntree pour éviter plus-value à 0
      normalized.yahooData = undefined;
    }

    // Calculs automatiques et mise à jour state
    // ✅ FIX : Utiliser fonction updater pour éviter closure stale
    let addedPosition;
    setPortfolio(prev => {
      console.log('📋 [FinanceContext] Portfolio actuel:', prev.length, 'positions');
      
      // Créer nouveau portfolio avec position ajoutée
      const newPortfolio = [...prev, normalized];
      console.log('📊 [FinanceContext] Nouveau portfolio avant calculs:', newPortfolio.length, 'positions');
      
      // Calculer métriques pour TOUT le portfolio (important pour poidsPortfolio)
      const withCalculations = calculateBatchMetrics(newPortfolio);
      console.log('✅ [FinanceContext] Portfolio avec calculs:', withCalculations.length, 'positions');
      
      // Récupérer la position ajoutée (dernière dans le tableau)
      addedPosition = withCalculations[withCalculations.length - 1];
      
      // Sauvegarder en storage de manière asynchrone
      financeStorage.savePortfolio(withCalculations).catch(err => {
        log.error('Error saving portfolio after add:', err);
      });
      
      return withCalculations;
    });

    console.log('🎉 [FinanceContext] Position ajoutée avec succès!');
    
    // Si Yahoo data n'a pas été chargée, forcer un refresh immédiat en arrière-plan
    if (!yahooDataLoaded) {
      console.log('🔄 [FinanceContext] Forcing refresh pour position sans Yahoo data');
      setTimeout(async () => {
        try {
          await refreshYahooData();
        } catch (err) {
          log.error('Error refreshing after add:', err);
        }
      }, 500);
    }
    
    return addedPosition;
  }, []);

  // Mise à jour position
  // ✅ Support deux signatures : updatePosition(id, updates) ou updatePosition(positionComplete)
  const updatePosition = useCallback(async (idOrPosition, updates) => {
    // Détecter si premier paramètre est un objet (position complète) ou string (id)
    let positionId;
    let positionUpdates;
    
    if (typeof idOrPosition === 'string' || typeof idOrPosition === 'number') {
      // Signature classique : updatePosition(id, updates)
      positionId = idOrPosition;
      positionUpdates = updates;
    } else if (idOrPosition && typeof idOrPosition === 'object' && idOrPosition.id) {
      // Signature alternative : updatePosition(positionComplete) - pour compatibilité AlertSettings
      positionId = idOrPosition.id;
      positionUpdates = idOrPosition;
    } else {
      throw new Error('Invalid arguments to updatePosition');
    }
    
    invalidatePositionCache(positionId);
    
    setPortfolio(prev => {
      const updated = prev.map(pos => {
        if (pos.id === positionId) {
          const merged = { ...pos, ...positionUpdates };
          const withCalculations = calculateBatchMetrics([merged]);
          return withCalculations[0];
        }
        return pos;
      });
      
      // Recalculer tout le portfolio pour mettre à jour poidsPortfolio
      const withCalculations = calculateBatchMetrics(updated);
      
      financeStorage.savePortfolio(withCalculations).catch(err => {
        log.error('Error saving portfolio after update:', err);
      });
      
      return withCalculations;
    });
  }, []);

  // Suppression position
  const deletePosition = useCallback(async (id) => {
    invalidatePositionCache(id);
    
    setPortfolio(prev => {
      const updated = prev.filter(pos => pos.id !== id);
      
      // Recalculer positions restantes pour mettre à jour poidsPortfolio
      const withCalculations = calculateBatchMetrics(updated);
      
      financeStorage.savePortfolio(withCalculations).catch(err => {
        log.error('Error saving portfolio after delete:', err);
      });
      
      return withCalculations;
    });
    
    await financeStorage.deletePosition(id);
  }, []);

  /**
   * ✅ OPTIMISATION Phase 1.3 : Refresh Yahoo data refactorisé
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
      const BATCH_DELAY = 500;
      const updatedPositions = [];
      const errors = [];

      // Traiter par batches séquentiels
      for (let i = 0; i < tickers.length; i += batchSize) {
        if (signal.aborted) {
          log.debug('Refresh cancelled');
          return;
        }

        const batch = tickers.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (ticker) => {
            const position = currentPortfolio.find(p => p.ticker === ticker);
            if (!position) return null;

            try {
              // Utiliser forceRefresh: true pour obtenir les vraies données à jour
              const yahooData = await yahooFinanceService.getQuoteData(ticker, { 
                forceRefresh: true 
              });
              
              // Vérifier que les données sont valides
              if (!yahooData || !yahooData.prixActuel || yahooData.prixActuel <= 0) {
                log.warn(`Invalid Yahoo data for ${ticker}:`, yahooData);
                return null;
              }

              const currentPrice = position.yahooData?.prixActuel;
              const newPrice = yahooData.prixActuel;
              
              if (currentPrice === newPrice && position.yahooData?.timestamp) {
                const dataAge = Date.now() - position.yahooData.timestamp;
                if (dataAge < 60000) {
                  log.debug(`Skipping ${ticker} - no changes`);
                  return null;
                }
              }

              invalidatePositionCache(position.id);

              const updated = {
                ...position,
                yahooData: {
                  ...yahooData,
                  timestamp: Date.now(),
                  ma20: yahooData.prixActuel * 0.98,
                  ma50: yahooData.prixActuel * 0.95,
                  ma200: yahooData.prixActuel * 0.90
                }
              };

              return updated;
            } catch (err) {
              log.warn(`Failed to refresh ${ticker}:`, err);
              errors.push({ ticker, error: err });
              return null;
            }
          })
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            updatedPositions.push(result.value);
          } else if (result.status === 'rejected') {
            const ticker = batch[index];
            errors.push({ ticker, error: result.reason });
          }
        });

        if (i + batchSize < tickers.length && !signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      if (signal.aborted) {
        log.debug('Refresh cancelled before update');
        return;
      }

      if (updatedPositions.length > 0) {
        setPortfolio(prevPortfolio => {
          const updatedMap = new Map(updatedPositions.map(p => [p.id || p.ticker, p]));
          
          const merged = prevPortfolio.map(p => {
            const updated = updatedMap.get(p.id || p.ticker);
            return updated || p;
          });

          const withCalculations = calculateBatchMetrics(merged);
          
          financeStorage.savePortfolio(withCalculations).catch(err => {
            log.error('Error saving portfolio after refresh:', err);
          });
          
          return withCalculations;
        });
      } else {
        log.debug('No positions updated during refresh');
      }

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

  // ✅ FIX : calculateMetrics en dehors de useMemo (évite violation règles hooks)
  const calculateMetrics = useCallback(() => {
    return calculateBatchMetrics(portfolio);
  }, [portfolio]);

  const value = React.useMemo(() => ({
    portfolio,
    loading,
    error,
    refreshing,
    addPosition,
    updatePosition,
    deletePosition,
    refreshYahooData,
    calculateMetrics
  }), [portfolio, loading, error, refreshing, addPosition, updatePosition, deletePosition, refreshYahooData, calculateMetrics]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export default FinanceContext;
