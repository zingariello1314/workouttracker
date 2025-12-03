/**
 * Hook centralisé pour gérer les investissements divers
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { investissementsStorage } from '../services/finance/investissementsStorage';
import logger from '../utils/logger';

const log = logger.module('useInvestissements');

export const useInvestissements = () => {
  const [or, setOr] = useState(null);
  const [liquidites, setLiquidites] = useState(null);
  const [bourseCrypto, setBourseCrypto] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      return updated;
    } catch (err) {
      log.error('Error adding position:', err);
      throw err;
    }
  }, [bourseCrypto]);

  // ========== ALLOCATION ==========

  const calculateAllocation = useCallback(() => {
    if (!or || !liquidites || !bourseCrypto) return null;

    const valorisationOr = or.stockActuel * 65; // Prix or approximatif, sera remplacé par API
    const totalLiquidites = liquidites.stockTotal || 0;
    const valorisationBourseCrypto = bourseCrypto.positions?.reduce((sum, pos) => 
      sum + (pos.montant || 0), 0) || 0;

    const patrimoineTotal = valorisationOr + totalLiquidites + valorisationBourseCrypto;

    if (patrimoineTotal === 0) return null;

    return {
      or: (valorisationOr / patrimoineTotal) * 100,
      liquidites: (totalLiquidites / patrimoineTotal) * 100,
      bourseCrypto: (valorisationBourseCrypto / patrimoineTotal) * 100,
      total: patrimoineTotal
    };
  }, [or, liquidites, bourseCrypto]);

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

  const synchronizeAssets = useCallback(async () => {
    try {
      // Recalculer et synchroniser toutes les données
      await loadData();
      return calculateAllocation();
    } catch (err) {
      log.error('Error synchronizing assets:', err);
      throw err;
    }
  }, [loadData, calculateAllocation]);

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

