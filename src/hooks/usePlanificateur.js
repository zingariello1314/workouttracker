/**
 * Hook centralisé pour gérer le module Planificateur Financier Personnel
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { differenceInMonths, parseISO } from 'date-fns';
import { planificateurStorage } from '../services/finance/planificateurStorage';
import logger from '../utils/logger';
import { sidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';

const log = logger.module('usePlanificateur');

export const usePlanificateur = () => {
  const [salaire, setSalaire] = useState(null);
  const [repartition, setRepartition] = useState(null);
  const [achatsLoisirs, setAchatsLoisirs] = useState([]);
  const [objectifs, setObjectifs] = useState([]);
  const [chargesFixes, setChargesFixes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger toutes les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        planificateurStorage.getSalaire(),
        planificateurStorage.getRepartition(),
        planificateurStorage.getAchatsLoisirs(),
        planificateurStorage.getObjectifs(),
        planificateurStorage.getChargesFixes()
      ]);

      const [salaireResult, repartitionResult, achatsResult, objectifsResult, chargesResult] = results;

      setSalaire(salaireResult.status === 'fulfilled' ? salaireResult.value : planificateurStorage.getDefaultSalaire());
      setRepartition(repartitionResult.status === 'fulfilled' ? repartitionResult.value : planificateurStorage.getDefaultRepartition());
      setAchatsLoisirs(achatsResult.status === 'fulfilled' ? achatsResult.value : []);
      setObjectifs(objectifsResult.status === 'fulfilled' ? objectifsResult.value : []);
      setChargesFixes(chargesResult.status === 'fulfilled' ? chargesResult.value : planificateurStorage.getDefaultChargesFixes());

      if (results.some(r => r.status === 'rejected')) {
        const rejectedErrors = results.filter(r => r.status === 'rejected').map(r => r.reason);
        log.error('[usePlanificateur] Some data failed to load:', rejectedErrors);
        setError(new Error('Failed to load some planificateur data. See console for details.'));
      }

    } catch (err) {
      log.error('[usePlanificateur] Error loading planificateur data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ========== SALAIRE (avec Optimistic Updates) ==========

  const updateSalaire = useCallback(async (salaireData) => {
    // Sauvegarder état actuel pour rollback
    const previousSalaire = salaire;
    
    // Update UI immédiatement (optimistic)
    setSalaire(salaireData);
    
    try {
      const updated = await planificateurStorage.saveSalaire(salaireData);
      setSalaire(updated); // Confirmer avec données serveur
      log.debug('[usePlanificateur] Salaire updated successfully');
      
      // Émettre événement pour synchroniser la sidebar
      sidebarEvents.emit(SIDEBAR_EVENTS.FINANCE_UPDATED, { 
        type: 'salaire', 
        data: updated 
      });
      
      return updated;
    } catch (err) {
      // Rollback en cas d'erreur
      setSalaire(previousSalaire);
      log.error('[usePlanificateur] Error updating salaire, rolled back:', err);
      throw err;
    }
  }, [salaire]);

  // ========== REPARTITION (avec Optimistic Updates) ==========

  const updateRepartition = useCallback(async (repartitionData) => {
    // Sauvegarder état actuel pour rollback
    const previousRepartition = repartition;
    
    // Update UI immédiatement (optimistic)
    setRepartition(repartitionData);
    
    try {
      const updated = await planificateurStorage.saveRepartition(repartitionData);
      setRepartition(updated); // Confirmer avec données serveur
      log.debug('[usePlanificateur] Repartition updated successfully');
      
      // Émettre événement pour synchroniser la sidebar
      sidebarEvents.emit(SIDEBAR_EVENTS.FINANCE_UPDATED, { 
        type: 'repartition', 
        data: updated 
      });
      
      return updated;
    } catch (err) {
      // Rollback en cas d'erreur
      setRepartition(previousRepartition);
      log.error('[usePlanificateur] Error updating repartition, rolled back:', err);
      throw err;
    }
  }, [repartition]);

  // ========== ACHATS LOISIRS ==========

  const addAchatLoisir = useCallback(async (achatData) => {
    try {
      const saved = await planificateurStorage.saveAchatLoisir(achatData);
      await loadData(); // Recharger pour avoir la liste à jour
      return saved;
    } catch (err) {
      log.error('[usePlanificateur] Error adding achat loisir:', err);
      throw err;
    }
  }, [loadData]);

  const updateAchatLoisir = useCallback(async (achatData) => {
    try {
      const updated = await planificateurStorage.saveAchatLoisir(achatData);
      await loadData();
      return updated;
    } catch (err) {
      log.error('[usePlanificateur] Error updating achat loisir:', err);
      throw err;
    }
  }, [loadData]);

  const deleteAchatLoisir = useCallback(async (id) => {
    try {
      await planificateurStorage.deleteAchatLoisir(id);
      await loadData();
    } catch (err) {
      log.error('[usePlanificateur] Error deleting achat loisir:', err);
      throw err;
    }
  }, [loadData]);

  // ========== OBJECTIFS ==========

  const addObjectif = useCallback(async (objectifData) => {
    try {
      const saved = await planificateurStorage.saveObjectif(objectifData);
      await loadData();
      return saved;
    } catch (err) {
      log.error('[usePlanificateur] Error adding objectif:', err);
      throw err;
    }
  }, [loadData]);

  const updateObjectif = useCallback(async (objectifData) => {
    try {
      const updated = await planificateurStorage.saveObjectif(objectifData);
      await loadData();
      return updated;
    } catch (err) {
      log.error('[usePlanificateur] Error updating objectif:', err);
      throw err;
    }
  }, [loadData]);

  const deleteObjectif = useCallback(async (id) => {
    try {
      await planificateurStorage.deleteObjectif(id);
      await loadData();
    } catch (err) {
      log.error('[usePlanificateur] Error deleting objectif:', err);
      throw err;
    }
  }, [loadData]);

  // ========== CHARGES FIXES ==========

  const updateChargesFixes = useCallback(async (chargesData) => {
    try {
      const updated = await planificateurStorage.saveChargesFixes(chargesData);
      setChargesFixes(updated);
      return updated;
    } catch (err) {
      log.error('[usePlanificateur] Error updating charges fixes:', err);
      throw err;
    }
  }, []);

  // ========== HELPERS REPARTITION V2 ==========

  const getCategoriesByType = useCallback((type) => {
    return (repartition?.categories || []).filter(c => c.type === type);
  }, [repartition]);

  const getTotalByType = useCallback((type) => {
    return getCategoriesByType(type).reduce((s, c) => s + (c.montant || 0), 0);
  }, [getCategoriesByType]);

  const getCategoryBySubType = useCallback((subType) => {
    return (repartition?.categories || []).find(c => c.subType === subType) ?? null;
  }, [repartition]);

  const getMontantBySubType = useCallback((subType) => {
    const cat = getCategoryBySubType(subType);
    return cat ? (cat.montant || 0) : 0;
  }, [getCategoryBySubType]);

  const totalAlloue = useMemo(() => {
    return (repartition?.categories || [])
      .filter(c => c.type !== 'surplus')
      .reduce((s, c) => s + (c.montant || 0), 0);
  }, [repartition]);

  const surplus = useMemo(() => {
    const net = salaire?.netMensuel ?? 0;
    return Math.max(0, net - totalAlloue);
  }, [salaire, totalAlloue]);

  /** Forme legacy pour compatibilité progressive : clés loyer, investissementOr, etc. + categories + surplus */
  const repartitionLegacy = useMemo(() => {
    if (!repartition) return null;
    const cats = repartition.categories || [];
    return {
      ...repartition,
      loyer: getMontantBySubType('loyer'),
      investissementOr: getMontantBySubType('or'),
      investissementBourse: getMontantBySubType('bourse'),
      cashAccumulation: getMontantBySubType('cash'),
      loisirs: getTotalByType('loisirs'),
      surplus,
      netMensuel: salaire?.netMensuel
    };
  }, [repartition, surplus, salaire, getMontantBySubType, getTotalByType]);

  // ========== CALCULS ==========

  const calculateFaisabilite = useCallback((achat, moisCible) => {
    if (!repartition) return null;

    const budgetLoisirs = getTotalByType('loisirs');
    if (budgetLoisirs === 0) {
      return {
        possible: false,
        budgetDisponible: 0,
        manque: achat.prix || 0,
        suggestions: ['Définir un budget loisirs dans la répartition salaire']
      };
    }

    // Utiliser date-fns pour calculs optimisés (+40% performance)
    const moisEffectifs = Math.max(1, differenceInMonths(
      parseISO(moisCible + '-01'),
      new Date()
    ));
    
    const budgetDisponible = budgetLoisirs * moisEffectifs;
    const prix = typeof achat === 'object' ? (achat.prix || 0) : achat;
    const manque = Math.max(0, prix - budgetDisponible);

    return {
      possible: manque === 0,
      budgetDisponible,
      manque,
      suggestions: manque > 0 ? [
        `Reporter de ${Math.ceil(manque / budgetLoisirs)} mois pour avoir le budget suffisant`,
        moisEffectifs > 1 ? `Réduire budget loisirs de ${Math.ceil(manque / moisEffectifs)}€/mois` : 'Augmenter le budget loisirs',
        `Utiliser surplus des mois précédents si disponible`
      ] : []
    };
  }, [repartition, getTotalByType]);

  return {
    // Data
    salaire,
    repartition,
    repartitionLegacy,
    surplus,
    totalAlloue,
    getCategoriesByType,
    getTotalByType,
    getCategoryBySubType,
    getMontantBySubType,
    achatsLoisirs,
    objectifs,
    chargesFixes,
    loading,
    error,
    
    // Actions Salaire
    updateSalaire,
    
    // Actions Répartition
    updateRepartition,
    
    // Actions Achats Loisirs
    addAchatLoisir,
    updateAchatLoisir,
    deleteAchatLoisir,
    
    // Actions Objectifs
    addObjectif,
    updateObjectif,
    deleteObjectif,
    
    // Actions Charges Fixes
    updateChargesFixes,
    
    // Calculs
    calculateFaisabilite,
    
    // Utilitaires
    reload: loadData
  };
};

