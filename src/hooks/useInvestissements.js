/**
 * Hook centralisé pour gérer les investissements divers
 * 
 * ✅ PHASE 2 - Solution 2.2 : Calculs Allocation Optimisés
 * - Intégration prix or via useOrPrice (cache partagé)
 * - Mémoïsation avec cache LRU et hash
 * - Calculs optimisés pour éviter recalculs inutiles
 * 
 * @module hooks/useInvestissements
 * @see docs/finance/ANALYSE_PROFONDE_4_SOUS_ONGLETS_BOURSE.md - Phase 2, Solution 2.2
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { investissementsStorage } from '../services/finance/investissementsStorage';
import { useOrPrice } from './useOrPrice';
import { LRUCache } from '../utils/lruCache';
import { syncAll as syncAllIncremental } from '../services/finance/investissementsSyncService';
import { financeDataSync } from '../services/finance/financeDataSync';
import logger from '../utils/logger';

const log = logger.module('useInvestissements');

// ==================== CACHE ET HASH ====================

/**
 * ✅ SOLUTION 2.2 : Cache LRU pour calculs d'allocation
 * Limite de 50 entrées (suffisant pour plusieurs sessions)
 */
const ALLOCATION_CACHE_SIZE = 50;
const allocationCache = new LRUCache(ALLOCATION_CACHE_SIZE, { enableStats: true });

/**
 * ✅ SOLUTION 2.2 : Fonction de hash optimisée (algorithme djb2)
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
 * ✅ SOLUTION 2.2 : Génère un hash des données essentielles pour l'allocation
 * 
 * Hash seulement les champs essentiels pour détecter changements réels
 * Évite de hasher tout l'objet (plus rapide, moins de mémoire)
 * 
 * @param {Object} or - Données or
 * @param {Object} liquidites - Données liquidités
 * @param {Object} bourseCrypto - Données bourse/crypto
 * @param {number} prixOr - Prix or actuel
 * @returns {string} Hash des données
 */
function generateAllocationHash(or, liquidites, bourseCrypto, prixOr) {
  try {
    // Extraire seulement les champs essentiels pour le hash
    const orHash = {
      stockActuel: or?.stockActuel || 0
    };
    
    const liquiditesHash = {
      stockTotal: liquidites?.stockTotal || 0
    };
    
    const bourseCryptoHash = {
      positionsCount: bourseCrypto?.positions?.length || 0,
      totalMontant: bourseCrypto?.positions?.reduce((sum, pos) => sum + (pos.montant || 0), 0) || 0
    };
    
    // Hash seulement les métadonnées, pas toutes les données
    const hashInput = {
      or: orHash,
      liquidites: liquiditesHash,
      bourseCrypto: bourseCryptoHash,
      prixOr: prixOr || 0
    };
    
    const hashStr = JSON.stringify(hashInput);
    return generateHash(hashStr);
  } catch (error) {
    log.warn('[generateAllocationHash] Erreur génération hash, fallback:', error);
    // Fallback : hash simple avec longueur
    return generateHash(`${or?.stockActuel || 0}_${liquidites?.stockTotal || 0}_${bourseCrypto?.positions?.length || 0}_${prixOr || 0}`);
  }
}

export const useInvestissements = () => {
  const [or, setOr] = useState(null);
  const [liquidites, setLiquidites] = useState(null);
  const [bourseCrypto, setBourseCrypto] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ SOLUTION 2.2 : Intégrer prix or via hook avec cache partagé
  // initialLoad: true pour charger le prix dès le montage (nécessaire pour calculs)
  const { price: prixOr } = useOrPrice({
    autoRefresh: true,
    refreshInterval: 60 * 60 * 1000, // 1h
    initialLoad: true // Charger au montage pour calculs d'allocation
  });

  // Charger toutes les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger avec gestion d'erreur individuelle pour chaque store
      const results = await Promise.allSettled([
        investissementsStorage.getOrData(),
        investissementsStorage.getLiquiditesData(),
        investissementsStorage.getBourseCryptoData(),
        investissementsStorage.getAllocation()
      ]);

      // Traiter chaque résultat
      const [orResult, liqResult, bcResult, allocResult] = results;

      if (orResult.status === 'fulfilled') {
        setOr(orResult.value);
      } else {
        log.error('Error loading OR data:', orResult.reason);
        setOr(investissementsStorage.getDefaultOrData());
      }

      if (liqResult.status === 'fulfilled') {
        setLiquidites(liqResult.value);
      } else {
        log.error('Error loading Liquidites data:', liqResult.reason);
        setLiquidites(investissementsStorage.getDefaultLiquiditesData());
      }

      if (bcResult.status === 'fulfilled') {
        setBourseCrypto(bcResult.value);
      } else {
        log.error('Error loading BourseCrypto data:', bcResult.reason);
        setBourseCrypto(investissementsStorage.getDefaultBourseCryptoData());
      }

      if (allocResult.status === 'fulfilled') {
        setAllocation(allocResult.value);
      } else {
        // Allocation est optionnelle, pas d'erreur si null
        setAllocation(null);
      }
    } catch (err) {
      log.error('Error loading investissements data:', err);
      setError(err);
      // En cas d'erreur globale, initialiser avec valeurs par défaut
      setOr(investissementsStorage.getDefaultOrData());
      setLiquidites(investissementsStorage.getDefaultLiquiditesData());
      setBourseCrypto(investissementsStorage.getDefaultBourseCryptoData());
      setAllocation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ========== OR ==========

  const addOrAcquisition = useCallback(async (acquisition) => {
    try {
      const saved = await investissementsStorage.saveOrAcquisition(acquisition);
      await loadData();
      return saved;
    } catch (err) {
      log.error('Error adding or acquisition:', err);
      throw err;
    }
  }, [loadData]);

  const updateOrData = useCallback(async (updates) => {
    try {
      const updated = await investissementsStorage.saveOrData({
        ...or,
        ...updates
      });
      setOr(updated);
      return updated;
    } catch (err) {
      log.error('Error updating or data:', err);
      throw err;
    }
  }, [or]);

  // ========== LIQUIDITES ==========

  const updateLiquidites = useCallback(async (updates) => {
    try {
      const updated = await investissementsStorage.saveLiquiditesData({
        ...liquidites,
        ...updates
      });
      setLiquidites(updated);
      return updated;
    } catch (err) {
      log.error('Error updating liquidites:', err);
      throw err;
    }
  }, [liquidites]);

  const addLiquiditesEntry = useCallback(async (entry) => {
    try {
      const progression = [...(liquidites?.progression || []), {
        ...entry,
        date: entry.date || new Date().toISOString().split('T')[0],
        timestamp: Date.now()
      }];
      
      const updated = await investissementsStorage.saveLiquiditesData({
        ...liquidites,
        stockTotal: (liquidites?.stockTotal || 0) + (entry.montant || 0),
        progression
      });
      setLiquidites(updated);
      return updated;
    } catch (err) {
      log.error('Error adding liquidites entry:', err);
      throw err;
    }
  }, [liquidites]);

  // ========== BOURSE & CRYPTO ==========

  const updateBourseCrypto = useCallback(async (updates) => {
    try {
      const updated = await investissementsStorage.saveBourseCryptoData({
        ...bourseCrypto,
        ...updates
      });
      setBourseCrypto(updated);
      return updated;
    } catch (err) {
      log.error('Error updating bourse crypto:', err);
      throw err;
    }
  }, [bourseCrypto]);

  const addPosition = useCallback(async (position) => {
    try {
      const positions = [...(bourseCrypto?.positions || []), {
        ...position,
        id: position.id || `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: position.date || new Date().toISOString().split('T')[0],
        timestamp: Date.now()
      }];
      
      const updated = await investissementsStorage.saveBourseCryptoData({
        ...bourseCrypto,
        positions
      });
      setBourseCrypto(updated);
      
      // ✅ FIX : Synchroniser avec portfolio (BourseSubTab) si position de type action/etf
      if (position.type === 'action' || position.type === 'etf' || !position.type) {
        try {
          await financeDataSync.syncBourseCryptoToPortfolio(updated);
          log.debug('[addPosition] bourseCrypto synchronisé avec portfolio');
        } catch (syncError) {
          log.warn('[addPosition] Erreur synchronisation portfolio (non bloquant):', syncError);
          // Ne pas bloquer l'ajout si synchronisation échoue
        }
      }
      
      return updated;
    } catch (err) {
      log.error('Error adding position:', err);
      throw err;
    }
  }, [bourseCrypto]);

  // ========== ALLOCATION ==========

  /**
   * ✅ SOLUTION 2.2 : Calcul Allocation Optimisé avec Mémoïsation
   * 
   * Améliorations :
   * - Intégration prix or via useOrPrice (cache partagé, prix réel)
   * - Cache LRU avec hash des données pour détecter changements
   * - Calculs optimisés (évite recalculs si données identiques)
   * - Fallback prix or si non disponible (65€/g)
   * 
   * @returns {Object|null} Allocation calculée ou null
   */
  const calculateAllocation = useCallback(() => {
    if (!or || !liquidites || !bourseCrypto) return null;

    // ✅ SOLUTION 2.2 : Utiliser prix or réel (ou fallback)
    const prixOrActuel = prixOr || 65; // Fallback si prix non chargé
    
    // ✅ SOLUTION 2.2 : Générer hash des données pour détecter changements
    const dataHash = generateAllocationHash(or, liquidites, bourseCrypto, prixOrActuel);
    const cacheKey = `allocation_${dataHash}`;
    
    // ✅ SOLUTION 2.2 : Vérifier cache d'abord
    const cached = allocationCache.get(cacheKey);
    if (cached) {
      log.debug(`[useInvestissements] Allocation cache hit`);
      return cached;
    }
    
    log.debug(`[useInvestissements] Calculating allocation (cache miss)`);
    
    // ✅ SOLUTION 2.2 : Calculs optimisés
    // Valorisation or avec prix réel
    const valorisationOr = (or.stockActuel || 0) * prixOrActuel;
    
    // Total liquidités (déjà calculé dans stockTotal)
    const totalLiquidites = liquidites.stockTotal || 0;
    
    // ✅ OPTIMISATION : Calcul valorisation bourse/crypto optimisé
    // Utiliser reduce seulement si positions existent, sinon 0 directement
    const valorisationBourseCrypto = bourseCrypto.positions && bourseCrypto.positions.length > 0
      ? bourseCrypto.positions.reduce((sum, pos) => sum + (pos.montant || 0), 0)
      : 0;

    const patrimoineTotal = valorisationOr + totalLiquidites + valorisationBourseCrypto;

    // ✅ FIX: Retourner allocation avec valeurs à 0 au lieu de null si patrimoineTotal === 0
    // Permet d'afficher le dashboard même si pas encore d'investissements
    if (patrimoineTotal === 0) {
      const emptyAllocation = {
        or: 0,
        liquidites: 0,
        bourseCrypto: 0,
        total: 0,
        details: {
          valorisationOr: 0,
          totalLiquidites: 0,
          valorisationBourseCrypto: 0,
          prixOr: prixOrActuel
        },
        _cached: true,
        _cacheKey: `allocation_empty_${dataHash}`,
        _calculatedAt: Date.now()
      };
      // Mettre en cache pour éviter recalculs
      allocationCache.set(`allocation_empty_${dataHash}`, emptyAllocation);
      return emptyAllocation;
    }

    // ✅ SOLUTION 2.2 : Calculs de pourcentages avec division sécurisée
    const allocationResult = {
      or: patrimoineTotal > 0 ? (valorisationOr / patrimoineTotal) * 100 : 0,
      liquidites: patrimoineTotal > 0 ? (totalLiquidites / patrimoineTotal) * 100 : 0,
      bourseCrypto: patrimoineTotal > 0 ? (valorisationBourseCrypto / patrimoineTotal) * 100 : 0,
      total: patrimoineTotal,
      // ✅ SOLUTION 2.2 : Ajouter détails de valorisation pour debugging et affichage
      details: {
        valorisationOr,
        totalLiquidites,
        valorisationBourseCrypto,
        prixOr: prixOrActuel
      },
      // ✅ SOLUTION 2.2 : Métadonnées pour cache
      _cached: true,
      _cacheKey: cacheKey,
      _calculatedAt: Date.now()
    };
    
    // ✅ SOLUTION 2.2 : Mettre en cache (LRU gère automatiquement l'éviction)
    allocationCache.set(cacheKey, allocationResult);
    
    return allocationResult;
  }, [or, liquidites, bourseCrypto, prixOr]);

  const updateAllocation = useCallback(async (allocationData) => {
    try {
      await investissementsStorage.saveAllocation(allocationData);
      setAllocation(allocationData);
      return allocationData;
    } catch (err) {
      log.error('Error updating allocation:', err);
      throw err;
    }
  }, []);

  /**
   * ✅ SOLUTION 2.3 : Synchronisation Incrémentale Optimisée
   * 
   * Au lieu de recharger toutes les données, synchronise seulement
   * celles qui ont changé depuis la dernière synchronisation.
   * 
   * @param {Object} options - Options de synchronisation
   * @param {boolean} options.forceFullSync - Forcer synchronisation complète
   * @returns {Promise<Object>} Allocation calculée après synchronisation
   */
  const synchronizeAssets = useCallback(async (options = {}) => {
    try {
      const { forceFullSync = false } = options;
      
      log.debug(`[synchronizeAssets] Début synchronisation${forceFullSync ? ' (forcée)' : ' (incrémentale)'}`);
      
      // ✅ SOLUTION 2.3 : Synchronisation incrémentale
      const syncResults = await syncAllIncremental({ forceFullSync });
      
      // Mettre à jour seulement les états pour les données qui ont changé
      if (syncResults.changed.or && syncResults.or !== null) {
        setOr(syncResults.or);
        log.debug('[synchronizeAssets] OR mis à jour');
      }
      
      if (syncResults.changed.liquidites && syncResults.liquidites !== null) {
        setLiquidites(syncResults.liquidites);
        log.debug('[synchronizeAssets] Liquidités mises à jour');
      }
      
      if (syncResults.changed.bourseCrypto && syncResults.bourseCrypto !== null) {
        setBourseCrypto(syncResults.bourseCrypto);
        log.debug('[synchronizeAssets] Bourse/Crypto mis à jour');
      }
      
      if (syncResults.changed.allocation && syncResults.allocation !== null) {
        setAllocation(syncResults.allocation);
        log.debug('[synchronizeAssets] Allocation mise à jour');
      }
      
      // Recalculer allocation si nécessaire
      const newAllocation = calculateAllocation();
      
      const changedCount = Object.values(syncResults.changed).filter(changed => changed).length;
      log.debug(`[synchronizeAssets] Synchronisation terminée: ${changedCount} types modifiés`);
      
      return newAllocation;
    } catch (err) {
      log.error('[synchronizeAssets] Erreur synchronisation:', err);
      // En cas d'erreur, fallback vers chargement complet
      log.warn('[synchronizeAssets] Fallback vers chargement complet');
      await loadData();
      return calculateAllocation();
    }
  }, [calculateAllocation, loadData]);

  // Charger acquisitions
  const loadAcquisitions = useCallback(async (filters = {}) => {
    try {
      return await investissementsStorage.loadAcquisitions(filters);
    } catch (err) {
      log.error('Error loading acquisitions:', err);
      throw err;
    }
  }, []);

  return {
    // Data
    or,
    liquidites,
    bourseCrypto,
    allocation,
    loading,
    error,
    
    // Actions OR
    addOrAcquisition,
    updateOrData,
    
    // Actions Liquidités
    updateLiquidites,
    addLiquiditesEntry,
    
    // Actions Bourse/Crypto
    updateBourseCrypto,
    addPosition,
    
    // Calculs
    calculateAllocation,
    updateAllocation,
    synchronizeAssets,
    loadAcquisitions,
    
    // Utilitaires
    reload: loadData
  };
};

