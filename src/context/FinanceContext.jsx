/**
 * Context Provider pour le module Finance
 * 
 * ✅ FIX : Partage state entre tous les composants Finance
 * ✅ PHASE 4 - Étape 4.4 : State management centralisé optimisé
 * - Évite problème de closure stale
 * - État global synchronisé
 * - Pattern identique à WorkoutContext et GarminContext
 * - Gestion d'erreurs robuste avec classification
 * - Loading states centralisés pour toutes opérations
 * - Queue pour éviter race conditions
 * - Optimisations performance (useCallback, useMemo, refs)
 * 
 * @module context/FinanceContext
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Phase 4, Étape 24
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

/**
 * @typedef {Object} FinanceContextValue
 * @property {Array<Object>} portfolio - Liste des positions du portfolio
 * @property {boolean} loading - État de chargement initial
 * @property {Error|null} error - Erreur éventuelle
 * @property {boolean} refreshing - État de rafraîchissement en cours
 * @property {Object} loadingStates - États de chargement détaillés par opération
 * @property {Function} addPosition - Ajouter une nouvelle position
 * @property {Function} updatePosition - Mettre à jour une position existante
 * @property {Function} deletePosition - Supprimer une position
 * @property {Function} refreshYahooData - Rafraîchir les données Yahoo Finance
 * @property {Function} calculateMetrics - Calculer les métriques du portfolio
 */

/**
 * @typedef {Object} LoadingStates
 * @property {boolean} initial - Chargement initial du portfolio
 * @property {boolean} refreshing - Rafraîchissement des données Yahoo
 * @property {boolean} adding - Ajout d'une position en cours
 * @property {boolean} updating - Mise à jour d'une position en cours
 * @property {boolean} deleting - Suppression d'une position en cours
 */
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
 * 
 * ✅ PHASE 4 - Étape 4.4 : Hook optimisé avec validation
 * 
 * @returns {FinanceContextValue} Valeur du contexte Finance
 * @throws {Error} Si utilisé en dehors d'un FinanceProvider
 * 
 * @example
 * const { portfolio, addPosition, loadingStates } = useFinance();
 * 
 * // Ajouter une position
 * await addPosition({
 *   ticker: 'AAPL',
 *   quantite: 10,
 *   prixEntree: 150
 * });
 * 
 * // Vérifier état de chargement
 * if (loadingStates.adding) {
 *   console.log('Ajout en cours...');
 * }
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
 * 
 * ✅ PHASE 4 - Étape 4.4 : State management centralisé optimisé
 * 
 * Gère :
 * - État du portfolio (chargement, sauvegarde IndexedDB)
 * - Opérations CRUD (add, update, delete)
 * - Rafraîchissement automatique des données Yahoo Finance
 * - Gestion d'erreurs avec classification
 * - Loading states granulaires par opération
 * - Queue pour éviter race conditions lors d'ajouts multiples
 * - Optimisations performance (refs, memoization)
 * 
 * @param {Object} props - Props du Provider
 * @param {React.ReactNode} props.children - Composants enfants
 * @returns {JSX.Element} Provider avec contexte Finance
 * 
 * @example
 * <FinanceProvider>
 *   <FinanceTab />
 * </FinanceProvider>
 */
export const FinanceProvider = ({ children }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ PHASE 3 - Étape 3.16 : Loading states centralisés pour toutes les opérations
  // ✅ PHASE 4 - Étape 4.4 : Types JSDoc pour loading states
  /** @type {[LoadingStates, React.Dispatch<React.SetStateAction<LoadingStates>>]} */
  const [loadingStates, setLoadingStates] = useState({
    initial: true,      // Chargement initial portfolio
    refreshing: false,   // Refresh données Yahoo
    adding: false,       // Ajout position
    updating: false,     // Mise à jour position
    deleting: false      // Suppression position
  });
  
  const refreshIntervalRef = useRef(null);
  const refreshAbortControllerRef = useRef(null);
  
  // ✅ PHASE 3 - Étape 3.11 : Refs pour éviter re-exécutions inutiles useEffect
  const portfolioRef = useRef([]);
  const hasAutoRefreshedRef = useRef(false);
  const lastAutoRefreshTimeRef = useRef(0);
  
  // ✅ PHASE 3 - Étape 3.12 : Verrou et queue pour éviter race conditions addPosition
  const addPositionLockRef = useRef(false);
  const addPositionQueueRef = useRef([]);

  /**
   * Classifier les erreurs pour gestion intelligente
   * 
   * ✅ PHASE 3 - Étape 3.10 : Améliorer gestion erreurs refresh
   * ✅ PHASE 4 - Étape 4.4 : Documentation complète
   * ✅ PHASE 4 - Étape 4.7 : Utiliser système erreurs standardisé
   * 
   * @param {Error|unknown} error - Erreur à classifier
   * @param {string} ticker - Ticker concerné (pour messages utilisateur)
   * @returns {Object} Objet avec type, recoverable et userMessage
   * @property {string} type - Type d'erreur (RATE_LIMIT, NETWORK, TIMEOUT, etc.)
   * @property {boolean} recoverable - Si l'erreur est récupérable
   * @property {string} userMessage - Message à afficher à l'utilisateur
   * @property {FinanceError} [financeError] - FinanceError si disponible (optionnel)
   * 
   * @private
   */
  const classifyError = useCallback((error, ticker) => {
    // ✅ PHASE 4 - Étape 4.7 : Utiliser système erreurs standardisé si disponible
    try {
      // Essayer d'importer et wrapper l'erreur
      const { wrapError } = require('../../utils/financeErrors');
      const financeError = wrapError(error, `refreshYahooData:${ticker}`);
      
      // Mapper code FinanceError vers type legacy pour compatibilité
      const typeMap = {
        'API_RATE_LIMIT_EXCEEDED': 'RATE_LIMIT',
        'API_NETWORK_ERROR': 'NETWORK',
        'API_TIMEOUT': 'TIMEOUT',
        'API_INVALID_KEY': 'API_KEY',
        'VALIDATION_INVALID_TICKER': 'INVALID_TICKER',
        'API_INVALID_RESPONSE': 'INVALID_DATA'
      };
      
      return {
        type: typeMap[financeError.code] || 'UNKNOWN',
        recoverable: financeError.isRecoverable(),
        userMessage: financeError.getUserMessage(),
        financeError // Exposer FinanceError pour usage avancé
      };
    } catch (importError) {
      // Fallback si système erreurs non disponible (ne devrait pas arriver)
      log.warn('Système erreurs standardisé non disponible, utilisation fallback');
    }
    
    // Fallback : Classification manuelle (compatibilité)
    const errorMessage = error?.message || String(error);
    const errorName = error?.name || '';
    
    // Classification des erreurs
    if (errorMessage.includes('rate limit') || errorMessage.includes('API rate limit')) {
      return { type: 'RATE_LIMIT', recoverable: true, userMessage: `Limite API atteinte pour ${ticker}. Réessayez dans quelques instants.` };
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Network')) {
      return { type: 'NETWORK', recoverable: true, userMessage: `Erreur réseau pour ${ticker}. Vérifiez votre connexion.` };
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return { type: 'TIMEOUT', recoverable: true, userMessage: `Timeout pour ${ticker}. Réessayez.` };
    }
    if (errorMessage.includes('API key') || errorMessage.includes('Invalid API')) {
      return { type: 'API_KEY', recoverable: false, userMessage: `Clé API invalide. Vérifiez la configuration.` };
    }
    if (errorMessage.includes('Invalid ticker') || errorMessage.includes('symbol')) {
      return { type: 'INVALID_TICKER', recoverable: false, userMessage: `Ticker ${ticker} invalide.` };
    }
    if (errorMessage.includes('Invalid response') || errorMessage.includes('Invalid data')) {
      return { type: 'INVALID_DATA', recoverable: true, userMessage: `Données invalides pour ${ticker}. Réessayez.` };
    }
    
    // Erreur générique
    return { type: 'UNKNOWN', recoverable: true, userMessage: `Erreur pour ${ticker}: ${errorMessage}` };
  }, []);

  /**
   * Rafraîchir les données Yahoo Finance pour toutes les positions
   * 
   * ✅ OPTIMISATION Phase 1.3 : Refresh Yahoo data refactorisé
   * ✅ PHASE 3 - Étape 3.10 : Gestion erreurs améliorée
   * ✅ PHASE 4 - Étape 4.4 : Documentation complète
   * 
   * Fonctionnalités :
   * - Traitement par batches (5 tickers à la fois)
   * - Comparaison intelligente (skip si données identiques et récentes)
   * - Gestion erreurs partielles (continue même si certaines positions échouent)
   * - Annulation possible via AbortController
   * - Mise à jour incrémentale (seulement positions modifiées)
   * 
   * @returns {Promise<void>} Promise qui se résout quand le refresh est terminé
   * 
   * @example
   * // Rafraîchir manuellement
   * await refreshYahooData();
   * 
   * // Annuler refresh en cours
   * refreshAbortControllerRef.current?.abort();
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
    // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
    setLoadingStates(prev => ({ ...prev, refreshing: true }));
    setError(null);

    try {
      const tickers = currentPortfolio.map(p => p.ticker);
      const batchSize = 5;
      const BATCH_DELAY = 500;
      const updatedPositions = [];
      const errors = [];
      const skipped = [];

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
              
              // ✅ PHASE 3.10 : Validation robuste des données
              if (!yahooData || !yahooData.prixActuel || yahooData.prixActuel <= 0) {
                const error = new Error(`Invalid Yahoo data for ${ticker}: prixActuel missing or invalid`);
                const classified = classifyError(error, ticker);
                errors.push({ ticker, error, classified });
                log.warn(`Invalid Yahoo data for ${ticker}:`, yahooData);
                return null;
              }

              // ✅ PHASE 3.10 : Comparaison intelligente (Solution 3)
              const currentPrice = position.yahooData?.prixActuel;
              const newPrice = yahooData.prixActuel;
              const currentVariation = position.yahooData?.variationJour;
              const newVariation = yahooData.variationJour;
              
              // Vérifier si données ont vraiment changé
              const hasChanged = !position.yahooData || 
                currentPrice !== newPrice ||
                currentVariation !== newVariation;
              
              // Si pas de changement et données récentes (< 1 min), skip
              if (!hasChanged && position.yahooData?.timestamp) {
                const dataAge = Date.now() - position.yahooData.timestamp;
                if (dataAge < 60000) {
                  log.debug(`Skipping ${ticker} - no changes, data age: ${dataAge}ms`);
                  skipped.push(ticker);
                  return null;
                }
              }

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
              // ✅ PHASE 3.10 : Classification et logging amélioré
              const classified = classifyError(err, ticker);
              errors.push({ ticker, error: err, classified });
              
              // Logger selon type d'erreur
              if (classified.type === 'RATE_LIMIT' || classified.type === 'API_KEY') {
                log.error(`[${classified.type}] Failed to refresh ${ticker}:`, err);
              } else {
                log.warn(`[${classified.type}] Failed to refresh ${ticker}:`, err);
              }
              
              return null;
            }
          })
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            updatedPositions.push(result.value);
          } else if (result.status === 'rejected') {
            const ticker = batch[index];
            const classified = classifyError(result.reason, ticker);
            errors.push({ ticker, error: result.reason, classified });
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

      // ✅ PHASE 3.10 : Mise à jour portfolio avec gestion erreurs partielles
      if (updatedPositions.length > 0) {
        // ✅ PHASE 4 - Étape 4.9 : Calculer métriques AVANT setPortfolio (car async)
        const currentPortfolio = portfolioRef.current;
        const updatedMap = new Map(updatedPositions.map(p => [p.id || p.ticker, p]));

        const merged = currentPortfolio.map(p => {
          const updated = updatedMap.get(p.id || p.ticker);
          return updated || p;
        });

        const withCalculations = await calculateBatchMetrics(merged);

        // Mettre à jour le state avec les calculs
        setPortfolio(withCalculations);
        
        // ✅ PHASE 3.12 : Mettre à jour portfolioRef après setState
        portfolioRef.current = withCalculations;

        financeStorage.savePortfolio(withCalculations).catch(err => {
          log.error('Error saving portfolio after refresh:', err);
        });
      } else {
        log.debug('No positions updated during refresh');
      }

      // ✅ PHASE 3.10 : Gestion erreurs avec classification
      if (errors.length > 0) {
        const errorTypes = errors.reduce((acc, e) => {
          const type = e.classified?.type || 'UNKNOWN';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        const criticalErrors = errors.filter(e => !e.classified?.recoverable);
        const recoverableErrors = errors.filter(e => e.classified?.recoverable);
        
        log.warn(`Refresh completed with ${errors.length} errors:`, {
          total: errors.length,
          types: errorTypes,
          critical: criticalErrors.length,
          recoverable: recoverableErrors.length,
          skipped: skipped.length,
          updated: updatedPositions.length
        });
        
        // ✅ PHASE 3.10 : Set error seulement si erreurs critiques ou toutes les positions ont échoué
        if (criticalErrors.length > 0 || (errors.length === tickers.length && updatedPositions.length === 0)) {
          const criticalError = criticalErrors[0] || errors[0];
          const errorMessage = criticalError.classified?.userMessage || criticalError.error?.message || 'Erreur lors du rafraîchissement';
          setError(new Error(errorMessage));
        } else if (recoverableErrors.length > 0 && updatedPositions.length === 0) {
          // Si toutes les positions ont des erreurs récupérables, set error
          const firstError = recoverableErrors[0];
          const errorMessage = firstError.classified?.userMessage || firstError.error?.message || 'Erreur réseau lors du rafraîchissement';
          setError(new Error(errorMessage));
        }
        // Si certaines positions ont réussi, ne pas set error global (erreurs partielles OK)
      }
    } catch (err) {
      if (!signal.aborted) {
        // ✅ PHASE 3.10 : Classification erreur globale
        const classified = classifyError(err, 'global');
        log.error(`[${classified.type}] Error refreshing Yahoo data:`, err);
        setError(new Error(classified.userMessage || err.message || 'Erreur lors du rafraîchissement'));
      }
    } finally {
      if (!signal.aborted) {
        setRefreshing(false);
        // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
        setLoadingStates(prev => ({ ...prev, refreshing: false }));
      }
      refreshAbortControllerRef.current = null;
    }
  }, [classifyError]);

  // Chargement initial avec optimisme
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
        setLoadingStates(prev => ({ ...prev, initial: true }));
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
                    timestamp: Date.now()
                    // ✅ PHASE 3 - Étape 3.15 : Ne pas inclure MA si pas de données historiques
                    // Les MA seront calculées plus tard quand on aura les données historiques
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
        const withCalculations = await calculateBatchMetrics(enrichedData);
        
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
        // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
        setLoadingStates(prev => ({ ...prev, initial: false }));
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // refreshYahooData est stable et défini avant, pas besoin de dépendance
  }, []);

  // ✅ PHASE 3 - Étape 3.11 : Refresh automatique avec refs pour éviter re-exécutions inutiles
  // Mettre à jour ref à chaque changement portfolio
  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);

  // Refresh automatique au chargement si des positions n'ont pas de données Yahoo valides
  useEffect(() => {
    // ✅ PHASE 3.11 : Utiliser refs pour éviter re-exécutions inutiles
    // Ne faire auto-refresh qu'une fois après chargement initial
    if (!loading && portfolio.length > 0 && !hasAutoRefreshedRef.current) {
      const positionsWithoutValidData = portfolio.filter(p => 
        !p.yahooData || 
        !p.yahooData.prixActuel || 
        p.yahooData.prixActuel <= 0 ||
        p.yahooData.prixActuel === p.prixEntree
      );
      
      if (positionsWithoutValidData.length > 0) {
        hasAutoRefreshedRef.current = true;
        lastAutoRefreshTimeRef.current = Date.now();
        
        log.info(`Auto-refreshing ${positionsWithoutValidData.length} positions without valid Yahoo data`);
        // Attendre un peu avant de rafraîchir pour ne pas bloquer le rendu initial
        const timeoutId = setTimeout(() => {
          refreshYahooData().catch(err => {
            log.error('Error auto-refreshing Yahoo data:', err);
          });
        }, 2000);
        
        return () => clearTimeout(timeoutId);
      } else {
        // Même si pas de positions sans données, marquer comme fait pour éviter re-exécution
        hasAutoRefreshedRef.current = true;
      }
    }
    
    // ✅ PHASE 3.11 : Réinitialiser flag si portfolio devient vide (nouveau chargement)
    if (portfolio.length === 0) {
      hasAutoRefreshedRef.current = false;
    }
  }, [loading, portfolio.length, refreshYahooData]); // ✅ PHASE 3.11 : Seulement length au lieu de portfolio complet

  // ✅ PHASE 3 - Étape 3.11 : Auto-refresh intelligent avec refs pour éviter re-exécutions
  // Auto-refresh intelligent (seulement heures bourse)
  useEffect(() => {
    const isMarketOpen = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Bourse ouverte : lundi-vendredi, 9h-17h30 (heure Paris)
      return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
    };

    // ✅ PHASE 3.11 : Nettoyer interval précédent avant d'en créer un nouveau
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (isMarketOpen() && portfolioRef.current.length > 0) {
      // ✅ PHASE 3.11 : Utiliser portfolioRef pour accéder à portfolio actuel sans dépendance
      refreshIntervalRef.current = setInterval(async () => {
        // Vérifier que portfolio n'est pas vide avant refresh
        if (portfolioRef.current.length > 0) {
          await refreshYahooData();
        }
      }, 60000); // 1 minute
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [refreshYahooData]); // ✅ PHASE 3.11 : Seulement refreshYahooData (stable), portfolio via ref

  /**
   * Traiter la queue d'ajout de positions de manière séquentielle
   * 
   * ✅ PHASE 3 - Étape 3.12 : Traiter queue addPosition de manière séquentielle
   * ✅ PHASE 4 - Étape 4.4 : Documentation complète
   * 
   * Évite race conditions lors d'ajouts multiples rapides en traitant
   * les demandes une par une avec un verrou.
   * 
   * @private
   * @returns {Promise<void>} Promise qui se résout quand la queue est traitée
   */
  const processAddPositionQueue = useCallback(async () => {
    if (addPositionLockRef.current || addPositionQueueRef.current.length === 0) {
      return;
    }
    
    addPositionLockRef.current = true;
    
    try {
      const item = addPositionQueueRef.current.shift();
      if (item && item.process) {
        await item.process();
        if (item.resolve) {
          item.resolve();
        }
      }
    } catch (err) {
      log.error('Error processing addPosition queue:', err);
      const item = addPositionQueueRef.current[0];
      if (item && item.reject) {
        item.reject(err);
      }
    } finally {
      addPositionLockRef.current = false;
      
      // Traiter le prochain item si la queue n'est pas vide
      if (addPositionQueueRef.current.length > 0) {
        // Utiliser setTimeout pour permettre au thread principal de respirer
        setTimeout(() => {
          processAddPositionQueue();
        }, 0);
      }
    }
  }, []);

  /**
   * Ajouter une nouvelle position au portfolio
   * 
   * ✅ PHASE 3 - Étape 3.12 : Ajout position avec verrou et queue
   * ✅ PHASE 4 - Étape 4.4 : Documentation complète
   * 
   * Fonctionnalités :
   * - Validation des données avant ajout
   * - Vérification doublons (triple-check pour éviter race conditions)
   * - Queue séquentielle pour ajouts multiples
   * - Chargement automatique données Yahoo Finance
   * - Calcul automatique des métriques
   * - Sauvegarde automatique dans IndexedDB
   * 
   * @param {Object} newPosition - Nouvelle position à ajouter
   * @param {string} newPosition.ticker - Ticker de l'action (requis)
   * @param {number} newPosition.quantite - Quantité d'actions (requis)
   * @param {number} newPosition.prixEntree - Prix d'achat par action (requis)
   * @param {string} [newPosition.entreprise] - Nom de l'entreprise (optionnel)
   * @param {string} [newPosition.dateAchat] - Date d'achat au format YYYY-MM-DD (optionnel)
   * @returns {Promise<Object>} Promise qui se résout avec la position ajoutée (avec calculs)
   * @throws {Error} Si données incomplètes ou position déjà existante
   * 
   * @example
   * try {
   *   const position = await addPosition({
   *     ticker: 'AAPL',
   *     quantite: 10,
   *     prixEntree: 150,
   *     entreprise: 'Apple Inc.',
   *     dateAchat: '2024-01-15'
   *   });
   *   console.log('Position ajoutée:', position);
   * } catch (error) {
   *   console.error('Erreur:', error.message);
   * }
   */
  const addPosition = useCallback(async (newPosition) => {
    // ✅ PHASE 3.12 : Validation avant queue
    if (!newPosition.ticker || !newPosition.quantite || !newPosition.prixEntree) {
      throw new Error('Données incomplètes');
    }

    // ✅ PHASE 3.12 : Vérifier si ticker existe déjà (évite doublons)
    const tickerUpper = newPosition.ticker.toUpperCase().trim();
    const currentPortfolio = portfolioRef.current;
    const existingPosition = currentPortfolio.find(p => p.ticker === tickerUpper);
    
    if (existingPosition) {
      log.warn(`Position ${tickerUpper} already exists in portfolio`);
      throw new Error(`La position ${tickerUpper} existe déjà dans le portfolio`);
    }

    // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
    setLoadingStates(prev => ({ ...prev, adding: true }));
    
    // ✅ PHASE 3.12 : Créer promise pour queue (traitement séquentiel)
    return new Promise((resolve, reject) => {
      const processAdd = async () => {
        try {
          // ✅ PHASE 3.12 : Double-check dans process (vérification finale avant ajout)
          const currentPortfolioInProcess = portfolioRef.current;
          const duplicateInProcess = currentPortfolioInProcess.find(p => p.ticker === tickerUpper);
          if (duplicateInProcess) {
            log.warn(`Position ${tickerUpper} already exists (race condition detected in process)`);
            throw new Error(`La position ${tickerUpper} existe déjà`);
          }

          // Normalisation ticker (uppercase)
          const normalized = {
            ...newPosition,
            ticker: tickerUpper,
            id: crypto.randomUUID(),
            dateAchat: newPosition.dateAchat || new Date().toISOString().split('T')[0],
            investissementTotal: newPosition.quantite * newPosition.prixEntree,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Récupérer données Yahoo avec forceRefresh pour obtenir les vraies données
          let yahooDataLoaded = false;
          try {
            const yahooData = await yahooFinanceService.getQuoteData(normalized.ticker, { forceRefresh: true });
            
            if (yahooData && yahooData.prixActuel && yahooData.prixActuel > 0) {
              // ✅ PHASE 3 - Étape 3.15 : Ne pas inclure MA si pas de données historiques
              // Les MA seront calculées plus tard quand on aura les données historiques
              normalized.yahooData = {
                ...yahooData,
                timestamp: Date.now()
                // MA (ma20, ma50, ma200) seront calculées plus tard avec données historiques
                // Ne pas inclure de placeholders pour éviter signaux techniques incorrects
              };
              yahooDataLoaded = true;
            } else {
              normalized.yahooData = undefined;
            }
          } catch (err) {
            log.warn(`Yahoo data unavailable for ${normalized.ticker}, will retry on refresh:`, err.message);
            normalized.yahooData = undefined;
          }

          // ✅ PHASE 3.12 : Utiliser fonction updater uniquement (évite stale closure)
          let addedPosition;
          
          // ✅ PHASE 4 - Étape 4.9 : Calculer métriques AVANT setPortfolio (car async)
          const currentPortfolio = portfolioRef.current;
          const duplicate = currentPortfolio.find(p => p.ticker === normalized.ticker);
          if (duplicate) {
            throw new Error(`La position ${normalized.ticker} existe déjà`);
          }
          
          // Créer nouveau portfolio avec position ajoutée
          const newPortfolio = [...currentPortfolio, normalized];
          
          // Calculer métriques pour TOUT le portfolio (important pour poidsPortfolio)
          const withCalculations = await calculateBatchMetrics(newPortfolio);
          
          // Récupérer la position ajoutée (dernière dans le tableau)
          addedPosition = withCalculations[withCalculations.length - 1];
          
          // Mettre à jour le state avec les calculs
          setPortfolio(withCalculations);
          
          // ✅ PHASE 3.12 : Mettre à jour portfolioRef après setState
          portfolioRef.current = withCalculations;
          
          // ✅ PHASE 3.12 : Sauvegarder de manière atomique
          financeStorage.savePortfolio(withCalculations).catch(err => {
            log.error('Error saving portfolio after add:', err);
          });
          
          // ✅ PHASE 3.12 : Vérifier que position a été ajoutée (sécurité supplémentaire)
          if (!addedPosition) {
            throw new Error(`La position ${tickerUpper} n'a pas pu être ajoutée`);
          }
          
          // Si pas de yahooData, forcer un refresh en arrière-plan
          if (!yahooDataLoaded) {
            setTimeout(() => {
              refreshYahooData().catch(err => {
                log.error('Error refreshing after add:', err);
              });
            }, 1000);
          }
          
          // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
          setLoadingStates(prev => ({ ...prev, adding: false }));
          resolve(addedPosition);
        } catch (err) {
          log.error('Error in addPosition process:', err);
          // ✅ PHASE 3.16 : Mettre à jour loading state centralisé même en cas d'erreur
          setLoadingStates(prev => ({ ...prev, adding: false }));
          reject(err);
        }
      };

      // ✅ PHASE 3.12 : Ajouter à queue
      addPositionQueueRef.current.push({
        process: processAdd,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // ✅ PHASE 3.12 : Traiter queue si pas déjà en cours
      processAddPositionQueue();
    });
  }, [refreshYahooData, processAddPositionQueue]);

  /**
   * Mettre à jour une position existante dans le portfolio
   * 
   * ✅ PHASE 3 - Étape 3.12 : Mise à jour position avec updatedAt
   * ✅ PHASE 4 - Étape 4.4 : Documentation complète
   * 
   * Supporte deux signatures :
   * 1. `updatePosition(id, updates)` - Mise à jour partielle
   * 2. `updatePosition(positionComplete)` - Mise à jour complète (pour compatibilité AlertSettings)
   * 
   * Fonctionnalités :
   * - Invalidation du cache de la position
   * - Recalcul automatique des métriques
   * - Mise à jour de `updatedAt`
   * - Sauvegarde automatique dans IndexedDB
   * 
   * @param {string|Object} idOrPosition - ID de la position (string) ou position complète (object)
   * @param {Object} [updates] - Objet avec les champs à mettre à jour (si idOrPosition est string)
   * @returns {Promise<void>} Promise qui se résout quand la mise à jour est terminée
   * @throws {Error} Si arguments invalides ou position non trouvée
   * 
   * @example
   * // Signature 1 : Mise à jour partielle
   * await updatePosition('position-id-123', {
   *   quantite: 20,
   *   prixEntree: 155
   * });
   * 
   * // Signature 2 : Mise à jour complète
   * await updatePosition({
   *   id: 'position-id-123',
   *   ticker: 'AAPL',
   *   quantite: 20,
   *   // ... autres champs
   * });
   */
  const updatePosition = useCallback(async (idOrPosition, updates) => {
    // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
    setLoadingStates(prev => ({ ...prev, updating: true }));
    
    try {
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
    
      // ✅ PHASE 4 - Étape 4.9 : Calculer métriques AVANT setPortfolio (car async)
      // Mettre à jour la position dans le portfolio actuel
      const currentPortfolio = portfolioRef.current;
      const updated = currentPortfolio.map(pos => {
        if (pos.id === positionId) {
          // ✅ PHASE 3.12 : Ajouter updatedAt et préserver createdAt
          return { 
            ...pos, 
            ...positionUpdates,
            updatedAt: new Date().toISOString(),
            createdAt: pos.createdAt || new Date().toISOString() // Préserver createdAt si existe
          };
        }
        return pos;
      });
      
      // Recalculer tout le portfolio pour mettre à jour poidsPortfolio
      const withCalculations = await calculateBatchMetrics(updated);
      
      // Mettre à jour le state avec les calculs
      setPortfolio(withCalculations);
      
      // ✅ PHASE 3.12 : Mettre à jour portfolioRef après setState
      portfolioRef.current = withCalculations;
      
      financeStorage.savePortfolio(withCalculations).catch(err => {
        log.error('Error saving portfolio after update:', err);
      });
      
      // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
      setLoadingStates(prev => ({ ...prev, updating: false }));
    } catch (err) {
      // ✅ PHASE 3.16 : Mettre à jour loading state centralisé même en cas d'erreur
      setLoadingStates(prev => ({ ...prev, updating: false }));
      throw err;
    }
  }, []);

  /**
   * Supprimer une position du portfolio
   * 
   * ✅ PHASE 4 - Étape 4.4 : Documentation complète
   * 
   * Fonctionnalités :
   * - Invalidation du cache de la position
   * - Recalcul automatique des métriques pour positions restantes
   * - Suppression dans IndexedDB
   * - Sauvegarde automatique du portfolio mis à jour
   * 
   * @param {string} id - ID de la position à supprimer
   * @returns {Promise<void>} Promise qui se résout quand la suppression est terminée
   * @throws {Error} Si la suppression échoue
   * 
   * @example
   * try {
   *   await deletePosition('position-id-123');
   *   console.log('Position supprimée');
   * } catch (error) {
   *   console.error('Erreur:', error.message);
   * }
   */
  const deletePosition = useCallback(async (id) => {
    // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
    setLoadingStates(prev => ({ ...prev, deleting: true }));
    
    try {
      invalidatePositionCache(id);
      
      // ✅ PHASE 4 - Étape 4.9 : Calculer métriques AVANT setPortfolio (car async)
      const currentPortfolio = portfolioRef.current;
      const updated = currentPortfolio.filter(pos => pos.id !== id);
      
      // Recalculer positions restantes pour mettre à jour poidsPortfolio
      const withCalculations = await calculateBatchMetrics(updated);
      
      // Mettre à jour le state avec les calculs
      setPortfolio(withCalculations);
      
      // ✅ PHASE 3.12 : Mettre à jour portfolioRef après setState
      portfolioRef.current = withCalculations;
      
      financeStorage.savePortfolio(withCalculations).catch(err => {
        log.error('Error saving portfolio after delete:', err);
      });
    
      await financeStorage.deletePosition(id);
    
    // ✅ PHASE 3.16 : Mettre à jour loading state centralisé
    setLoadingStates(prev => ({ ...prev, deleting: false }));
    } catch (err) {
      // ✅ PHASE 3.16 : Mettre à jour loading state centralisé même en cas d'erreur
      setLoadingStates(prev => ({ ...prev, deleting: false }));
      throw err;
    }
  }, []);


  /**
   * Calculer les métriques pour toutes les positions du portfolio
   * 
   * ✅ FIX : calculateMetrics en dehors de useMemo (évite violation règles hooks)
   * ✅ PHASE 4 - Étape 4.4 : Documentation complète
   * 
   * Calcule pour chaque position :
   * - valeurPosition (quantité × prix actuel)
   * - plusValueEuro (gain/perte en euros)
   * - plusValuePourcent (gain/perte en pourcentage)
   * - poidsPortfolio (pourcentage du portfolio total)
   * - signal (signal technique basé sur MA50/MA200)
   * 
   * @returns {Array<Object>} Portfolio avec métriques calculées pour chaque position
   * 
   * @example
   * const portfolioWithMetrics = calculateMetrics();
   * portfolioWithMetrics.forEach(position => {
   *   console.log(`${position.ticker}: ${position.calculs.plusValueEuro}€`);
   * });
   */
  const calculateMetrics = useCallback(async () => {
    return await calculateBatchMetrics(portfolio);
  }, [portfolio]);

  const value = React.useMemo(() => ({
    portfolio,
    loading,
    error,
    refreshing,
    // ✅ PHASE 3.16 : Exposer loading states centralisés
    loadingStates,
    addPosition,
    updatePosition,
    deletePosition,
    refreshYahooData,
    calculateMetrics
  }), [portfolio, loading, error, refreshing, loadingStates, addPosition, updatePosition, deletePosition, refreshYahooData, calculateMetrics]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export default FinanceContext;
