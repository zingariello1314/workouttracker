/**
 * Hook principal pour la gestion du budget personnel
 * 
 * ✅ PHASE 1 - Solution 1.1 : Chargement Robuste avec Cache
 * - Utilise Promise.allSettled pour robustesse (une erreur n'empêche pas les autres)
 * - Cache intelligent avec TTL pour éviter rechargements inutiles
 * - Fallback avec données par défaut en cas d'erreur
 * - Retry automatique avec exponential backoff
 * 
 * @module hooks/useBudget
 * @see docs/finance/ANALYSE_PROFONDE_4_SOUS_ONGLETS_BOURSE.md - Phase 1, Solution 1.1
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { budgetStorage } from '../services/finance/budgetStorage';
import { pushOrEnsureBudgetCategoryToPlanificateur } from '../services/finance/budgetPlanificateurBridge';
import { cacheService } from '../services/finance/cacheService';
import { CACHE_TYPES } from '../services/finance/cacheService';
import { LRUCache } from '../utils/lruCache';
import { calculateCompleteProjection } from '../services/finance/budgetProjectionService';
import logger from '../utils/logger';

const log = logger.module('useBudget');

// TTL pour cache Budget (5 minutes)
const CACHE_TTL = {
  BUDGET: 5 * 60 * 1000,        // 5 min
  CATEGORIES: 10 * 60 * 1000,   // 10 min (changent moins souvent)
  DEPENSES: 2 * 60 * 1000,      // 2 min (changent souvent)
  DEPENSES_PLANIFIEES: 5 * 60 * 1000, // 5 min
  CHARGES_FIXES: 10 * 60 * 1000 // 10 min (changent rarement)
};

// Clés de cache
const CACHE_KEYS = {
  BUDGET: 'budget_main',
  CATEGORIES: 'budget_categories',
  DEPENSES: 'budget_depenses',
  DEPENSES_PLANIFIEES: 'budget_depenses_planifiees',
  CHARGES_FIXES: 'budget_charges_fixes'
};

// ✅ SOLUTION 1.2 : Cache LRU pour métriques calculées
const METRICS_CACHE_SIZE = 100; // Limite de 100 entrées (suffisant pour plusieurs mois)
const metricsCache = new LRUCache(METRICS_CACHE_SIZE, { enableStats: true });

/**
 * ✅ SOLUTION 1.2 : Fonction de hash optimisée (algorithme djb2)
 * 
 * Basé sur l'algorithme djb2 de Daniel J. Bernstein
 * Rapide, efficace, pas besoin de crypto en frontend
 * 
 * @param {string} str - Chaîne à hasher
 * @returns {string} Hash en base 36 (alphanumérique)
 */
function generateHash(str) {
  if (!str || typeof str !== 'string') {
    return '0';
  }
  
  let hash = 5381; // djb2 seed
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * ✅ SOLUTION 1.2 : Génère un hash des données essentielles pour les métriques
 * 
 * Hash seulement les champs qui impactent les calculs (évite hash trop lourd)
 * 
 * @param {Object} budget - Budget actuel
 * @param {Array} depenses - Liste des dépenses
 * @param {string} mois - Mois au format YYYY-MM
 * @returns {string} Hash des inputs
 */
function generateMetricsHash(budget, depenses, depensesPlanifiees = [], chargesFixes = [], mois) {
  try {
    // ✅ OPTIMISATION : Extraire seulement les champs essentiels pour le hash
    // Évite de hasher tout l'objet (plus rapide, moins de mémoire)
    const budgetHash = {
      id: budget?.id || null,
      revenus: budget?.revenus || 0,
      epargneActuelle: budget?.epargne?.actuelle || 0
    };
    
    // ✅ OPTIMISATION : Hash seulement les dépenses du mois concerné (pas toutes)
    // + hash des métadonnées (count, total) pour détecter changements
    const depensesMois = depenses.filter(d => {
      if (!d.date) return false;
      const dDate = new Date(d.date);
      const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
      return dMois === mois;
    });
    
    // ✅ SOLUTION 1.7 : Inclure depensesPlanifiees et chargesFixes dans le hash
    const depensesPlanifieesHash = {
      count: depensesPlanifiees?.length || 0,
      total: depensesPlanifiees?.reduce((sum, d) => sum + (d.montant || 0), 0) || 0
    };
    
    const chargesFixesHash = {
      count: chargesFixes?.length || 0,
      total: chargesFixes?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0
    };
    
    const depensesHash = {
      count: depensesMois.length,
      total: depensesMois.reduce((sum, d) => sum + (d.montant || 0), 0),
      // Hash des IDs et montants pour détecter changements précis
      items: depensesMois.map(d => `${d.id}_${d.montant}_${d.date}`).sort().join(',')
    };
    
    // ✅ OPTIMISATION : JSON.stringify avec tri pour cohérence
    // Même si ordre change, hash reste identique
    // ✅ SOLUTION 1.7 : Inclure depensesPlanifiees et chargesFixes dans le hash
    const hashInput = {
      budget: budgetHash,
      depenses: depensesHash,
      depensesPlanifiees: depensesPlanifieesHash,
      chargesFixes: chargesFixesHash,
      mois
    };
    
    const hashStr = JSON.stringify(hashInput);
    return generateHash(hashStr);
  } catch (error) {
    log.warn('[generateMetricsHash] Erreur génération hash, fallback:', error);
    // Fallback : hash simple avec longueur
    // ✅ SOLUTION 1.7 : Inclure depensesPlanifiees et chargesFixes dans le fallback
    return generateHash(`${budget?.id || 'null'}_${depenses?.length || 0}_${depensesPlanifiees?.length || 0}_${chargesFixes?.length || 0}_${mois}`);
  }
}

/**
 * Retry avec exponential backoff
 * @param {Function} fn - Fonction à exécuter
 * @param {number} maxRetries - Nombre max de tentatives
 * @param {number} baseDelay - Délai de base en ms
 * @returns {Promise}
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 100) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        log.warn(`[useBudget] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * ✅ SOLUTION 1.4 : Hook amélioré avec fallback robuste
 * 
 * Retourne toujours des données valides même en cas d'erreur.
 * Les warnings permettent d'informer l'utilisateur sans bloquer l'UI.
 */
export const useBudget = () => {
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [depensesPlanifiees, setDepensesPlanifiees] = useState([]);
  const [chargesFixes, setChargesFixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ✅ SOLUTION 1.4 : État pour warnings non-bloquants
  const [warnings, setWarnings] = useState([]);
  
  // Ref pour éviter rechargements multiples simultanés
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const MIN_LOAD_INTERVAL = 1000; // 1 seconde minimum entre chargements

  /**
   * ✅ SOLUTION 1.1 : Chargement Robuste avec Cache
   * 
   * Améliorations :
   * - Promise.allSettled : une erreur n'empêche pas les autres
   * - Cache avec TTL : évite rechargements inutiles
   * - Fallback données par défaut : toujours des données valides
   * - Retry automatique : résilience aux erreurs temporaires
   * - Protection contre chargements multiples simultanés
   */
  const loadData = useCallback(async (forceRefresh = false) => {
    // Protection contre chargements multiples simultanés
    if (loadingRef.current && !forceRefresh) {
      log.debug('[useBudget] Load already in progress, skipping');
      return;
    }

    // Protection contre chargements trop fréquents
    const now = Date.now();
    if (!forceRefresh && (now - lastLoadTimeRef.current) < MIN_LOAD_INTERVAL) {
      log.debug('[useBudget] Load too frequent, using cache');
      return;
    }

    loadingRef.current = true;
    lastLoadTimeRef.current = now;

    try {
      setLoading(true);
      setError(null);

      // ✅ SOLUTION 1.1 : Vérifier cache d'abord (sauf si forceRefresh)
      if (!forceRefresh) {
        const cachedBudget = await cacheService.get(CACHE_KEYS.BUDGET, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.BUDGET,
          allowStale: false
        });
        const cachedCategories = await cacheService.get(CACHE_KEYS.CATEGORIES, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.CATEGORIES,
          allowStale: false
        });
        const cachedDepenses = await cacheService.get(CACHE_KEYS.DEPENSES, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.DEPENSES,
          allowStale: false
        });
        const cachedPlanifiees = await cacheService.get(CACHE_KEYS.DEPENSES_PLANIFIEES, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.DEPENSES_PLANIFIEES,
          allowStale: false
        });
        const cachedCharges = await cacheService.get(CACHE_KEYS.CHARGES_FIXES, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.CHARGES_FIXES,
          allowStale: false
        });

        // Si toutes les données sont en cache, les utiliser
        if (cachedBudget && cachedCategories && cachedDepenses !== null && cachedPlanifiees !== null && cachedCharges) {
          log.debug('[useBudget] Using cached data');
          setBudget(cachedBudget);
          setCategories(cachedCategories);
          setDepenses(cachedDepenses || []);
          setDepensesPlanifiees(cachedPlanifiees || []);
          setChargesFixes(cachedCharges);
          setLoading(false);
          loadingRef.current = false;
          return;
        }
      }

      // ✅ SOLUTION 1.1 : Promise.allSettled pour robustesse
      // Une erreur sur une donnée n'empêche pas les autres
      const results = await Promise.allSettled([
        retryWithBackoff(() => budgetStorage.loadBudget(), 3, 100),
        retryWithBackoff(() => budgetStorage.loadCategories(), 3, 100),
        retryWithBackoff(() => budgetStorage.loadDepenses(), 3, 100),
        retryWithBackoff(() => budgetStorage.loadDepensesPlanifiees(), 3, 100),
        retryWithBackoff(() => budgetStorage.loadChargesFixes(), 3, 100)
      ]);

      // Traiter chaque résultat avec fallback
      const [budgetResult, categoriesResult, depensesResult, planifieesResult, chargesResult] = results;

      // Budget
      if (budgetResult.status === 'fulfilled') {
        const budgetData = budgetResult.value || budgetStorage.getDefaultBudget();
        setBudget(budgetData);
        // Mettre en cache
        await cacheService.set(CACHE_KEYS.BUDGET, budgetData, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.BUDGET
        });
      } else {
        log.error('[useBudget] Error loading budget:', budgetResult.reason);
        // ✅ SOLUTION 1.1 : Fallback avec données par défaut
        const defaultBudget = budgetStorage.getDefaultBudget();
        setBudget(defaultBudget);
        await cacheService.set(CACHE_KEYS.BUDGET, defaultBudget, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.BUDGET
        });
      }

      // Categories
      if (categoriesResult.status === 'fulfilled') {
        const categoriesData = categoriesResult.value || [];
        setCategories(categoriesData);
        await cacheService.set(CACHE_KEYS.CATEGORIES, categoriesData, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.CATEGORIES
        });
      } else {
        log.error('[useBudget] Error loading categories:', categoriesResult.reason);
        setCategories([]);
      }

      // Depenses
      if (depensesResult.status === 'fulfilled') {
        const depensesData = depensesResult.value || [];
        setDepenses(depensesData);
        await cacheService.set(CACHE_KEYS.DEPENSES, depensesData, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.DEPENSES
        });
      } else {
        log.error('[useBudget] Error loading depenses:', depensesResult.reason);
        setDepenses([]);
      }

      // Depenses Planifiées
      if (planifieesResult.status === 'fulfilled') {
        const planifieesData = planifieesResult.value || [];
        setDepensesPlanifiees(planifieesData);
        await cacheService.set(CACHE_KEYS.DEPENSES_PLANIFIEES, planifieesData, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.DEPENSES_PLANIFIEES
        });
      } else {
        log.error('[useBudget] Error loading depenses planifiees:', planifieesResult.reason);
        setDepensesPlanifiees([]);
      }

      // Charges Fixes
      if (chargesResult.status === 'fulfilled') {
        const chargesData = chargesResult.value || [];
        setChargesFixes(chargesData);
        await cacheService.set(CACHE_KEYS.CHARGES_FIXES, chargesData, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.CHARGES_FIXES
        });
      } else {
        log.error('[useBudget] Error loading charges fixes:', chargesResult.reason);
        setChargesFixes([]);
      }

      // Vérifier s'il y a eu des erreurs
      // ✅ SOLUTION 1.4 : Collecter warnings au lieu d'erreurs bloquantes
      const dataTypes = ['Budget', 'Catégories', 'Dépenses', 'Dépenses Planifiées', 'Charges Fixes'];
      const warningsList = [];
      
      // Vérifier chaque résultat individuellement
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          warningsList.push({
            type: dataTypes[index] || 'Données',
            error: result.reason?.message || 'Erreur inconnue',
            recovered: true // Indique qu'on utilise des données par défaut
          });
        }
      });
      
      if (warningsList.length > 0) {
        setWarnings(warningsList);
        log.warn(`[useBudget] ${warningsList.length} error(s) during load, using fallback data`, warningsList);
        
        // Ne pas définir error si on a des fallbacks valides - permettre à l'UI de fonctionner
        // L'erreur ne sera définie que si absolument rien ne fonctionne
        setError(null); // S'assurer que error est null si on a des fallbacks
      } else {
        // Pas d'erreurs, nettoyer les warnings précédents
        setWarnings([]);
        setError(null);
      }

    } catch (err) {
      log.error('[useBudget] Critical error loading budget data:', err);
      
      // ✅ SOLUTION 1.4 : Même en cas d'erreur critique, fournir des données par défaut
      // Ne pas bloquer l'UI, permettre à l'utilisateur de continuer
      setBudget(budgetStorage.getDefaultBudget());
      setCategories([]);
      setDepenses([]);
      setDepensesPlanifiees([]);
      setChargesFixes([]);
      
      // Définir warning au lieu d'erreur bloquante
      setWarnings([{
        type: 'Chargement',
        error: err.message || 'Erreur lors du chargement des données',
        recovered: true,
        critical: true
      }]);
      
      // Ne définir error que si vraiment critique (indexedDB complètement indisponible)
      // Dans ce cas, on peut quand même utiliser les données par défaut
      if (err.name === 'UnknownError' || err.message?.includes('database')) {
        setError(err);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ========== BUDGET ==========
  // ✅ SOLUTION 1.5 : Correction Race Conditions - Update sans dépendance d'état
  const updateBudget = useCallback(async (updates) => {
    try {
      // ✅ SOLUTION 1.5 : Utiliser uniquement update fonctionnel (pas de dépendance budget)
      // Évite stale closures et race conditions
      let optimisticBudget = null;
      let rollbackNeeded = false;
      
      setBudget(prevBudget => {
        optimisticBudget = { ...prevBudget, ...updates };
        rollbackNeeded = true;
        
        // Sauvegarder de manière asynchrone
        budgetStorage.saveBudget(optimisticBudget).then(saved => {
          // ✅ SOLUTION 1.5 : Update avec fonctionnel pour éviter race conditions
          setBudget(prev => {
            // Vérifier que c'est toujours le même budget qu'on a mis à jour
            // (évite écraser un update plus récent)
            if (prev && prev.id === optimisticBudget.id) {
              // Merger les updates avec l'état actuel pour éviter perte de données
              // si d'autres updates sont arrivés entre temps
              return { ...prev, ...updates, ...saved };
            }
            return saved;
          });
          
          // Invalider cache après sauvegarde
          cacheService.delete(CACHE_KEYS.BUDGET, { type: CACHE_TYPES.MEMORY });
          // Remettre en cache
          cacheService.set(CACHE_KEYS.BUDGET, saved, {
            type: CACHE_TYPES.MEMORY,
            ttl: CACHE_TTL.BUDGET
          });
          
          rollbackNeeded = false;
        }).catch(err => {
          log.error('[useBudget] Error saving budget:', err);
          
          // ✅ SOLUTION 1.5 : Rollback optimistic update en cas d'erreur
          // Recharger depuis cache si disponible pour récupérer état valide
          if (rollbackNeeded) {
            cacheService.get(CACHE_KEYS.BUDGET, {
              type: CACHE_TYPES.MEMORY,
              allowStale: true
            }).then(cached => {
              if (cached) {
                setBudget(cached);
              }
            }).catch(() => {
              // Si pas de cache, recharger depuis storage
              budgetStorage.loadBudget().then(budget => {
                setBudget(budget || budgetStorage.getDefaultBudget());
              }).catch(() => {
                // Fallback ultime : budget par défaut
                setBudget(budgetStorage.getDefaultBudget());
              });
            });
          }
          
          // Ne pas définir error si on a récupéré (warnings seulement)
          setWarnings(prev => [...prev, {
            type: 'Budget',
            error: err.message || 'Erreur lors de la sauvegarde',
            recovered: false
          }]);
        });
        
        return optimisticBudget; // Optimistic update
      });
      
      // Retourner budget optimiste (sera mis à jour avec version sauvegardée)
      return optimisticBudget;
    } catch (err) {
      log.error('[useBudget] Error updating budget:', err);
      setWarnings(prev => [...prev, {
        type: 'Budget',
        error: err.message || 'Erreur lors de la mise à jour',
        recovered: false
      }]);
      throw err;
    }
  }, []); // ✅ SOLUTION 1.5 : Pas de dépendances pour éviter stale closures

  // ========== CATEGORIES ==========
  const addCategory = useCallback(async (category) => {
    try {
      const saved = await budgetStorage.saveCategory(category);
      let finalCat = saved;
      try {
        const r = await pushOrEnsureBudgetCategoryToPlanificateur(saved);
        if (r?.budgetCategory) finalCat = r.budgetCategory;
      } catch (e) {
        log.warn('[useBudget] Sync planificateur après ajout catégorie:', e);
      }
      setCategories(prev => {
        const updated = [...prev, finalCat].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        // Invalider et mettre à jour cache
        cacheService.delete(CACHE_KEYS.CATEGORIES, { type: CACHE_TYPES.MEMORY });
        cacheService.set(CACHE_KEYS.CATEGORIES, updated, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.CATEGORIES
        });
        return updated;
      });
      return finalCat;
    } catch (err) {
      log.error('[useBudget] Error adding category:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ✅ SOLUTION 1.5 : Correction Race Conditions - Update sans dépendance d'état
  const updateCategory = useCallback(async (categoryId, updates) => {
    try {
      // ✅ SOLUTION 1.5 : Utiliser uniquement update fonctionnel (pas de dépendance categories)
      let optimisticCategory = null;
      let rollbackNeeded = false;
      
      setCategories(prev => {
        const category = prev.find(c => c.id === categoryId);
        if (!category) {
          throw new Error('Category not found');
        }
        
        optimisticCategory = { ...category, ...updates };
        rollbackNeeded = true;
        
        // Sauvegarder de manière asynchrone
        budgetStorage.saveCategory(optimisticCategory).then(async (saved) => {
          let persisted = saved;
          try {
            const r = await pushOrEnsureBudgetCategoryToPlanificateur(saved);
            if (r?.budgetCategory) persisted = r.budgetCategory;
          } catch (e) {
            log.warn('[useBudget] Sync planificateur après maj catégorie:', e);
          }
          // ✅ SOLUTION 1.5 : Update avec fonctionnel pour éviter race conditions
          setCategories(prevCategories => {
            // Trouver la catégorie dans l'état actuel
            const currentCategory = prevCategories.find(c => c.id === categoryId);
            if (!currentCategory) {
              // Catégorie supprimée entre temps, ne rien faire
              return prevCategories;
            }
            
            // Mettre à jour avec version sauvegardée
            const updatedCategories = prevCategories.map(c => c.id === categoryId ? persisted : c);
            
            // Invalider et mettre à jour cache
            cacheService.delete(CACHE_KEYS.CATEGORIES, { type: CACHE_TYPES.MEMORY });
            cacheService.set(CACHE_KEYS.CATEGORIES, updatedCategories, {
              type: CACHE_TYPES.MEMORY,
              ttl: CACHE_TTL.CATEGORIES
            });
            
            rollbackNeeded = false;
            return updatedCategories;
          });
        }).catch(err => {
          log.error('[useBudget] Error saving category:', err);
          
          // ✅ SOLUTION 1.5 : Rollback optimistic update en cas d'erreur
          // Recharger depuis cache si disponible pour récupérer état valide
          if (rollbackNeeded) {
            cacheService.get(CACHE_KEYS.CATEGORIES, {
              type: CACHE_TYPES.MEMORY,
              allowStale: true
            }).then(cached => {
              if (cached) {
                setCategories(cached);
              }
            }).catch(() => {
              // Si pas de cache, recharger depuis storage
              budgetStorage.loadCategories().then(categories => {
                setCategories(categories || []);
              }).catch(() => {
                // Fallback ultime : tableau vide
                setCategories([]);
              });
            });
          }
          
          setWarnings(prev => [...prev, {
            type: 'Catégories',
            error: err.message || 'Erreur lors de la sauvegarde',
            recovered: false
          }]);
        });
        
        // Optimistic update
        return prev.map(c => c.id === categoryId ? optimisticCategory : c);
      });
      
      // Retourner category optimiste (sera mis à jour avec version sauvegardée)
      return optimisticCategory;
    } catch (err) {
      log.error('[useBudget] Error updating category:', err);
      setWarnings(prev => [...prev, {
        type: 'Catégories',
        error: err.message || 'Erreur lors de la mise à jour',
        recovered: false
      }]);
      throw err;
    }
  }, []); // ✅ SOLUTION 1.5 : Pas de dépendances pour éviter stale closures

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      await budgetStorage.deleteCategory(categoryId);
      setCategories(prev => {
        const updated = prev.filter(c => c.id !== categoryId);
        // Invalider et mettre à jour cache
        cacheService.delete(CACHE_KEYS.CATEGORIES, { type: CACHE_TYPES.MEMORY });
        cacheService.set(CACHE_KEYS.CATEGORIES, updated, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.CATEGORIES
        });
        return updated;
      });
    } catch (err) {
      log.error('[useBudget] Error deleting category:', err);
      setError(err);
      throw err;
    }
  }, []);

  const reorderCategories = useCallback(async (newOrder) => {
    try {
      await budgetStorage.reorderCategories(newOrder);
      setCategories(newOrder);
      // Invalider et mettre à jour cache
      cacheService.delete(CACHE_KEYS.CATEGORIES, { type: CACHE_TYPES.MEMORY });
      cacheService.set(CACHE_KEYS.CATEGORIES, newOrder, {
        type: CACHE_TYPES.MEMORY,
        ttl: CACHE_TTL.CATEGORIES
      });
    } catch (err) {
      log.error('[useBudget] Error reordering categories:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ========== DEPENSES ==========
  const addDepense = useCallback(async (depense) => {
    try {
      const saved = await budgetStorage.saveDepense(depense);
      setDepenses(prev => {
        const updated = [saved, ...prev];
        // Invalider et mettre à jour cache
        cacheService.delete(CACHE_KEYS.DEPENSES, { type: CACHE_TYPES.MEMORY });
        cacheService.set(CACHE_KEYS.DEPENSES, updated, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.DEPENSES
        });
        return updated;
      });
      return saved;
    } catch (err) {
      log.error('[useBudget] Error adding depense:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ✅ SOLUTION 1.5 : Correction Race Conditions - Update sans dépendance d'état
  const updateDepense = useCallback(async (depenseId, updates) => {
    try {
      // ✅ SOLUTION 1.5 : Utiliser uniquement update fonctionnel (pas de dépendance depenses)
      let optimisticDepense = null;
      let rollbackNeeded = false;
      
      setDepenses(prev => {
        const depense = prev.find(d => d.id === depenseId);
        if (!depense) {
          throw new Error('Depense not found');
        }
        
        optimisticDepense = { ...depense, ...updates };
        rollbackNeeded = true;
        
        // Sauvegarder de manière asynchrone
        budgetStorage.saveDepense(optimisticDepense).then(saved => {
          // ✅ SOLUTION 1.5 : Update avec fonctionnel pour éviter race conditions
          setDepenses(prevDepenses => {
            const currentDepense = prevDepenses.find(d => d.id === depenseId);
            if (!currentDepense) {
              // Dépense supprimée entre temps, ne rien faire
              return prevDepenses;
            }
            
            const updatedDepenses = prevDepenses.map(d => d.id === depenseId ? saved : d);
            
            // Invalider et mettre à jour cache
            cacheService.delete(CACHE_KEYS.DEPENSES, { type: CACHE_TYPES.MEMORY });
            cacheService.set(CACHE_KEYS.DEPENSES, updatedDepenses, {
              type: CACHE_TYPES.MEMORY,
              ttl: CACHE_TTL.DEPENSES
            });
            
            rollbackNeeded = false;
            return updatedDepenses;
          });
        }).catch(err => {
          log.error('[useBudget] Error saving depense:', err);
          
          // ✅ SOLUTION 1.5 : Rollback optimistic update en cas d'erreur
          // Recharger depuis cache si disponible pour récupérer état valide
          if (rollbackNeeded) {
            cacheService.get(CACHE_KEYS.DEPENSES, {
              type: CACHE_TYPES.MEMORY,
              allowStale: true
            }).then(cached => {
              if (cached) {
                setDepenses(cached);
              }
            }).catch(() => {
              // Si pas de cache, recharger depuis storage
              budgetStorage.loadDepenses().then(depenses => {
                setDepenses(depenses || []);
              }).catch(() => {
                // Fallback ultime : tableau vide
                setDepenses([]);
              });
            });
          }
          
          setWarnings(prev => [...prev, {
            type: 'Dépenses',
            error: err.message || 'Erreur lors de la sauvegarde',
            recovered: false
          }]);
        });
        
        // Optimistic update
        return prev.map(d => d.id === depenseId ? optimisticDepense : d);
      });
      
      // Retourner depense optimiste (sera mis à jour avec version sauvegardée)
      return optimisticDepense;
    } catch (err) {
      log.error('[useBudget] Error updating depense:', err);
      setWarnings(prev => [...prev, {
        type: 'Dépenses',
        error: err.message || 'Erreur lors de la mise à jour',
        recovered: false
      }]);
      throw err;
    }
  }, []); // ✅ SOLUTION 1.5 : Pas de dépendances pour éviter stale closures

  const deleteDepense = useCallback(async (depenseId) => {
    try {
      await budgetStorage.deleteDepense(depenseId);
      setDepenses(prev => {
        const updated = prev.filter(d => d.id !== depenseId);
        // Invalider et mettre à jour cache
        cacheService.delete(CACHE_KEYS.DEPENSES, { type: CACHE_TYPES.MEMORY });
        cacheService.set(CACHE_KEYS.DEPENSES, updated, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.DEPENSES
        });
        return updated;
      });
    } catch (err) {
      log.error('[useBudget] Error deleting depense:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ========== DEPENSES PLANIFIEES ==========
  const addDepensePlanifiee = useCallback(async (depensePlanifiee) => {
    try {
      const saved = await budgetStorage.saveDepensePlanifiee(depensePlanifiee);
      setDepensesPlanifiees(prev => {
        const updated = [...prev, saved].sort((a, b) => new Date(a.date) - new Date(b.date));
        // Invalider et mettre à jour cache
        cacheService.delete(CACHE_KEYS.DEPENSES_PLANIFIEES, { type: CACHE_TYPES.MEMORY });
        cacheService.set(CACHE_KEYS.DEPENSES_PLANIFIEES, updated, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.DEPENSES_PLANIFIEES
        });
        return updated;
      });
      return saved;
    } catch (err) {
      log.error('[useBudget] Error adding depense planifiee:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ✅ SOLUTION 1.5 : Correction Race Conditions - Update sans dépendance d'état
  const updateDepensePlanifiee = useCallback(async (depenseId, updates) => {
    try {
      // ✅ SOLUTION 1.5 : Utiliser uniquement update fonctionnel (pas de dépendance depensesPlanifiees)
      let optimisticDepense = null;
      let rollbackNeeded = false;
      
      setDepensesPlanifiees(prev => {
        const depense = prev.find(d => d.id === depenseId);
        if (!depense) {
          throw new Error('Depense planifiee not found');
        }
        
        optimisticDepense = { ...depense, ...updates };
        rollbackNeeded = true;
        
        // Sauvegarder de manière asynchrone
        budgetStorage.saveDepensePlanifiee(optimisticDepense).then(saved => {
          // ✅ SOLUTION 1.5 : Update avec fonctionnel pour éviter race conditions
          setDepensesPlanifiees(prevPlanifiees => {
            const currentDepense = prevPlanifiees.find(d => d.id === depenseId);
            if (!currentDepense) {
              // Dépense supprimée entre temps, ne rien faire
              return prevPlanifiees;
            }
            
            const updatedPlanifiees = prevPlanifiees.map(d => d.id === depenseId ? saved : d);
            
            // Invalider et mettre à jour cache
            cacheService.delete(CACHE_KEYS.DEPENSES_PLANIFIEES, { type: CACHE_TYPES.MEMORY });
            cacheService.set(CACHE_KEYS.DEPENSES_PLANIFIEES, updatedPlanifiees, {
              type: CACHE_TYPES.MEMORY,
              ttl: CACHE_TTL.DEPENSES_PLANIFIEES
            });
            
            rollbackNeeded = false;
            return updatedPlanifiees;
          });
        }).catch(err => {
          log.error('[useBudget] Error saving depense planifiee:', err);
          
          // ✅ SOLUTION 1.5 : Rollback optimistic update en cas d'erreur
          // Recharger depuis cache si disponible pour récupérer état valide
          if (rollbackNeeded) {
            cacheService.get(CACHE_KEYS.DEPENSES_PLANIFIEES, {
              type: CACHE_TYPES.MEMORY,
              allowStale: true
            }).then(cached => {
              if (cached) {
                setDepensesPlanifiees(cached);
              }
            }).catch(() => {
              // Si pas de cache, recharger depuis storage
              budgetStorage.loadDepensesPlanifiees().then(depenses => {
                setDepensesPlanifiees(depenses || []);
              }).catch(() => {
                // Fallback ultime : tableau vide
                setDepensesPlanifiees([]);
              });
            });
          }
          
          setWarnings(prev => [...prev, {
            type: 'Dépenses Planifiées',
            error: err.message || 'Erreur lors de la sauvegarde',
            recovered: false
          }]);
        });
        
        // Optimistic update
        return prev.map(d => d.id === depenseId ? optimisticDepense : d);
      });
      
      // Retourner depense planifiee optimiste (sera mis à jour avec version sauvegardée)
      return optimisticDepense;
    } catch (err) {
      log.error('[useBudget] Error updating depense planifiee:', err);
      setWarnings(prev => [...prev, {
        type: 'Dépenses Planifiées',
        error: err.message || 'Erreur lors de la mise à jour',
        recovered: false
      }]);
      throw err;
    }
  }, []); // ✅ SOLUTION 1.5 : Pas de dépendances pour éviter stale closures

  const deleteDepensePlanifiee = useCallback(async (depenseId) => {
    try {
      await budgetStorage.deleteDepensePlanifiee(depenseId);
      setDepensesPlanifiees(prev => {
        const updated = prev.filter(d => d.id !== depenseId);
        // Invalider et mettre à jour cache
        cacheService.delete(CACHE_KEYS.DEPENSES_PLANIFIEES, { type: CACHE_TYPES.MEMORY });
        cacheService.set(CACHE_KEYS.DEPENSES_PLANIFIEES, updated, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.DEPENSES_PLANIFIEES
        });
        return updated;
      });
    } catch (err) {
      log.error('[useBudget] Error deleting depense planifiee:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ========== CHARGES FIXES ==========
  const addChargeFixe = useCallback(async (charge) => {
    try {
      const saved = await budgetStorage.saveChargeFixe(charge);
      setChargesFixes(prev => {
        const updated = [...prev, saved];
        // Invalider et mettre à jour cache
        cacheService.delete(CACHE_KEYS.CHARGES_FIXES, { type: CACHE_TYPES.MEMORY });
        cacheService.set(CACHE_KEYS.CHARGES_FIXES, updated, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.CHARGES_FIXES
        });
        return updated;
      });
      return saved;
    } catch (err) {
      log.error('[useBudget] Error adding charge fixe:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ✅ SOLUTION 1.5 : Correction Race Conditions - Update sans dépendance d'état
  const updateChargeFixe = useCallback(async (chargeId, updates) => {
    try {
      // ✅ SOLUTION 1.5 : Utiliser uniquement update fonctionnel (pas de dépendance chargesFixes)
      let optimisticCharge = null;
      let rollbackNeeded = false;
      
      setChargesFixes(prev => {
        const charge = prev.find(c => c.id === chargeId);
        if (!charge) {
          throw new Error('Charge fixe not found');
        }
        
        optimisticCharge = { ...charge, ...updates };
        rollbackNeeded = true;
        
        // Sauvegarder de manière asynchrone
        budgetStorage.saveChargeFixe(optimisticCharge).then(saved => {
          // ✅ SOLUTION 1.5 : Update avec fonctionnel pour éviter race conditions
          setChargesFixes(prevCharges => {
            const currentCharge = prevCharges.find(c => c.id === chargeId);
            if (!currentCharge) {
              // Charge supprimée entre temps, ne rien faire
              return prevCharges;
            }
            
            const updatedCharges = prevCharges.map(c => c.id === chargeId ? saved : c);
            
            // Invalider et mettre à jour cache
            cacheService.delete(CACHE_KEYS.CHARGES_FIXES, { type: CACHE_TYPES.MEMORY });
            cacheService.set(CACHE_KEYS.CHARGES_FIXES, updatedCharges, {
              type: CACHE_TYPES.MEMORY,
              ttl: CACHE_TTL.CHARGES_FIXES
            });
            
            rollbackNeeded = false;
            return updatedCharges;
          });
        }).catch(err => {
          log.error('[useBudget] Error saving charge fixe:', err);
          
          // ✅ SOLUTION 1.5 : Rollback optimistic update en cas d'erreur
          // Recharger depuis cache si disponible pour récupérer état valide
          if (rollbackNeeded) {
            cacheService.get(CACHE_KEYS.CHARGES_FIXES, {
              type: CACHE_TYPES.MEMORY,
              allowStale: true
            }).then(cached => {
              if (cached) {
                setChargesFixes(cached);
              }
            }).catch(() => {
              // Si pas de cache, recharger depuis storage
              budgetStorage.loadChargesFixes().then(charges => {
                setChargesFixes(charges || []);
              }).catch(() => {
                // Fallback ultime : tableau vide
                setChargesFixes([]);
              });
            });
          }
          
          setWarnings(prev => [...prev, {
            type: 'Charges Fixes',
            error: err.message || 'Erreur lors de la sauvegarde',
            recovered: false
          }]);
        });
        
        // Optimistic update
        return prev.map(c => c.id === chargeId ? optimisticCharge : c);
      });
      
      // Retourner charge fixe optimiste (sera mis à jour avec version sauvegardée)
      return optimisticCharge;
    } catch (err) {
      log.error('[useBudget] Error updating charge fixe:', err);
      setWarnings(prev => [...prev, {
        type: 'Charges Fixes',
        error: err.message || 'Erreur lors de la mise à jour',
        recovered: false
      }]);
      throw err;
    }
  }, []); // ✅ SOLUTION 1.5 : Pas de dépendances pour éviter stale closures

  const deleteChargeFixe = useCallback(async (chargeId) => {
    try {
      await budgetStorage.deleteChargeFixe(chargeId);
      setChargesFixes(prev => {
        const updated = prev.filter(c => c.id !== chargeId);
        // Invalider et mettre à jour cache
        cacheService.delete(CACHE_KEYS.CHARGES_FIXES, { type: CACHE_TYPES.MEMORY });
        cacheService.set(CACHE_KEYS.CHARGES_FIXES, updated, {
          type: CACHE_TYPES.MEMORY,
          ttl: CACHE_TTL.CHARGES_FIXES
        });
        return updated;
      });
    } catch (err) {
      log.error('[useBudget] Error deleting charge fixe:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ========== CALCULS ==========
  /**
   * ✅ SOLUTION 1.2 : Calculs Mémoïsés avec Hash
   * 
   * Améliorations :
   * - Cache LRU avec hash des données pour détecter changements
   * - Pré-calcul des dates pour éviter recréation à chaque appel
   * - Hash seulement des champs essentiels (performance)
   * - Évite recalculs inutiles même si référence change
   */
  const calculateMetrics = useCallback((mois = null) => {
    if (!budget) return null;

    // ✅ SOLUTION 1.2 : Pré-calculer mois actuel une seule fois
    const now = new Date();
    const moisActuel = mois || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // ✅ SOLUTION 1.7 : Générer hash des données pour détecter changements (inclut depensesPlanifiees et chargesFixes)
    const dataHash = generateMetricsHash(budget, depenses, depensesPlanifiees || [], chargesFixes || [], moisActuel);
    const cacheKey = `metrics_${moisActuel}_${dataHash}`;
    
    // ✅ SOLUTION 1.2 : Vérifier cache d'abord
    const cached = metricsCache.get(cacheKey);
    if (cached) {
      log.debug(`[useBudget] Metrics cache hit for ${moisActuel}`);
      return cached;
    }
    
    log.debug(`[useBudget] Calculating metrics for ${moisActuel} (cache miss)`);
    
    // ✅ SOLUTION 1.2 : Optimiser filtrage des dépenses (pré-calculer format mois)
    // Cache des dates formatées pour éviter recréation
    const depensesMois = depenses.filter(d => {
      if (!d.date) return false;
      // Utiliser cache de format date si disponible (optimisation future)
      const dDate = new Date(d.date);
      const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
      return dMois === moisActuel;
    });

    const revenus = budget.revenus || 0;
    const depensesTotal = depensesMois.reduce((sum, d) => sum + (d.montant || 0), 0);
    const epargne = budget.epargne?.actuelle || 0;
    const restant = revenus - depensesTotal - epargne;
    const pourcentUtilise = revenus > 0 ? (depensesTotal / revenus) * 100 : 0;

    // ✅ SOLUTION 1.7 : Calcul projection amélioré avec tous les facteurs
    const joursEcoules = now.getDate();
    const joursTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    // Calculer historique des mois précédents pour projection améliorée
    const historiqueDepenses = [];
    // ✅ SOLUTION 1.7 : Réutiliser moisActuel déjà déclaré (ligne 1034)
    for (let i = 1; i <= 3; i++) {
      const moisDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisKey = `${moisDate.getFullYear()}-${String(moisDate.getMonth() + 1).padStart(2, '0')}`;
      const depensesMois = depenses.filter(d => {
        if (!d.date) return false;
        const dDate = new Date(d.date);
        const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
        return dMois === moisKey;
      });
      const totalMois = depensesMois.reduce((sum, d) => sum + (d.montant || 0), 0);
      if (totalMois > 0) {
        historiqueDepenses.push({ mois: moisKey, total: totalMois });
      }
    }
    
    // ✅ SOLUTION 1.7 : Utiliser service de projection amélioré
    const projectionData = calculateCompleteProjection({
      depensesTotal,
      joursEcoules,
      joursTotal,
      depensesPlanifiees: depensesPlanifiees || [],
      chargesFixes: chargesFixes || [],
      historiqueDepenses,
      options: {
        includePlanned: true,
        includeFixedCharges: true,
        includeHistory: historiqueDepenses.length > 0,
        historyWeight: 0.3
      }
    });
    
    const projection = projectionData.projection;
    const rythmeActuel = projectionData.details.rythmeActuel;

    // Statut
    let statut = 'MAITRISE';
    if (pourcentUtilise > 100) statut = 'CRITIQUE';
    else if (pourcentUtilise > 90) statut = 'DEPASSEMENT';
    else if (pourcentUtilise > 75) statut = 'ATTENTION';

    const metrics = {
      revenus,
      depenses: depensesTotal,
      epargne,
      restant,
      pourcentUtilise: Math.round(pourcentUtilise * 10) / 10,
      projection,
      // ✅ SOLUTION 1.7 : Ajouter détails de projection améliorée
      projectionDetails: {
        projectionSimple: projectionData.projectionSimple,
        projectionWithPlanned: projectionData.projectionWithPlanned,
        projectionWithFixedCharges: projectionData.projectionWithFixedCharges,
        projectionWithHistory: projectionData.projectionWithHistory,
        rythmeActuel: projectionData.details.rythmeActuel,
        joursRestants: projectionData.details.joursRestants,
        depensesPlanifieesRestantes: projectionData.details.depensesPlanifieesRestantes,
        chargesFixesRestantes: projectionData.details.chargesFixesRestantes,
        moyenneHistorique: projectionData.details.moyenneHistorique
      },
      statut,
      depensesMois,
      // ✅ SOLUTION 1.2 : Ajouter métadonnées pour debug
      _cached: true,
      _cacheKey: cacheKey,
      _calculatedAt: Date.now()
    };
    
    // ✅ SOLUTION 1.2 : Mettre en cache (LRU gère automatiquement l'éviction)
    metricsCache.set(cacheKey, metrics);
    
    return metrics;
  }, [budget, depenses, depensesPlanifiees, chargesFixes]);

  // ✅ SOLUTION 1.2 : Dépenses du mois actuel avec cache de format date
  const depensesMoisActuel = useMemo(() => {
    // ✅ OPTIMISATION : Pré-calculer mois actuel une seule fois
    const now = new Date();
    const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // ✅ OPTIMISATION : Cache des dates formatées pour éviter recréation
    const dateFormatCache = new Map();
    
    return depenses.filter(d => {
      if (!d.date) return false;
      
      // Utiliser cache si disponible
      let dMois = dateFormatCache.get(d.date);
      if (!dMois) {
        const dDate = new Date(d.date);
        dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
        dateFormatCache.set(d.date, dMois);
      }
      
      return dMois === moisActuel;
    });
  }, [depenses]);

  return {
    // Data
    budget,
    categories,
    depenses,
    depensesMoisActuel,
    depensesPlanifiees,
    chargesFixes,
    loading,
    error,
    // ✅ SOLUTION 1.4 : Warnings non-bloquants pour informer l'utilisateur
    warnings,

    // Actions Budget
    updateBudget,

    // Actions Categories
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,

    // Actions Depenses
    addDepense,
    updateDepense,
    deleteDepense,

    // Actions Depenses Planifiées
    addDepensePlanifiee,
    updateDepensePlanifiee,
    deleteDepensePlanifiee,

    // Actions Charges Fixes
    addChargeFixe,
    updateChargeFixe,
    deleteChargeFixe,

    // Calculs
    calculateMetrics,
    refreshData: loadData,
    // ✅ SOLUTION 1.1 : Exposer fonction pour forcer refresh
    forceRefresh: () => loadData(true)
  };
};



