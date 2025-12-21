/**
 * budgetProjectionService.js
 * 
 * Service de calcul de projection amélioré pour Budget Personnel
 * 
 * ✅ SOLUTION 1.7 : Calcul Projection Amélioré
 * 
 * Ce service fournit :
 * - Projection basée sur rythme actuel (simple)
 * - Projection avec dépenses planifiées (améliorée)
 * - Projection avec historique (saisonnière)
 * - Projection avec charges fixes (complète)
 * - Modèle prédictif avec pondération intelligente
 * 
 * @module services/finance/budgetProjectionService
 */

import logger from '../../utils/logger';

const log = logger.module('budgetProjectionService');

/**
 * Calcule la projection simple basée sur le rythme actuel
 * 
 * @param {number} depensesTotal - Dépenses totales du mois actuel
 * @param {number} joursEcoules - Nombre de jours écoulés dans le mois
 * @param {number} joursTotal - Nombre total de jours dans le mois
 * @returns {number} Projection simple
 */
export function calculateSimpleProjection(depensesTotal, joursEcoules, joursTotal) {
  if (joursEcoules <= 0) {
    return 0;
  }
  
  const rythmeActuel = depensesTotal / joursEcoules;
  return rythmeActuel * joursTotal;
}

/**
 * Calcule la projection avec dépenses planifiées
 * 
 * @param {number} depensesTotal - Dépenses totales du mois actuel
 * @param {number} joursEcoules - Nombre de jours écoulés dans le mois
 * @param {number} joursTotal - Nombre total de jours dans le mois
 * @param {Array} depensesPlanifiees - Dépenses planifiées pour le reste du mois
 * @returns {number} Projection avec dépenses planifiées
 */
export function calculateProjectionWithPlanned(depensesTotal, joursEcoules, joursTotal, depensesPlanifiees = []) {
  if (joursEcoules <= 0) {
    return 0;
  }
  
  const now = new Date();
  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const joursRestants = joursTotal - joursEcoules;
  
  // Calculer rythme actuel
  const rythmeActuel = depensesTotal / joursEcoules;
  
  // Calculer dépenses planifiées pour le reste du mois
  const depensesPlanifieesRestantes = depensesPlanifiees
    .filter(dp => {
      if (!dp.date || dp.statut === 'annule') return false;
      const dpDate = new Date(dp.date);
      const dpMois = `${dpDate.getFullYear()}-${String(dpDate.getMonth() + 1).padStart(2, '0')}`;
      return dpMois === moisActuel && dpDate >= now;
    })
    .reduce((sum, dp) => sum + (dp.montant || 0), 0);
  
  // Projection = dépenses actuelles + rythme actuel * jours restants + dépenses planifiées
  const projectionRythme = rythmeActuel * joursRestants;
  const projection = depensesTotal + projectionRythme + depensesPlanifieesRestantes;
  
  return projection;
}

/**
 * Calcule la projection avec charges fixes
 * 
 * @param {number} depensesTotal - Dépenses totales du mois actuel
 * @param {number} joursEcoules - Nombre de jours écoulés dans le mois
 * @param {number} joursTotal - Nombre total de jours dans le mois
 * @param {Array} chargesFixes - Charges fixes mensuelles
 * @returns {number} Projection avec charges fixes
 */
export function calculateProjectionWithFixedCharges(depensesTotal, joursEcoules, joursTotal, chargesFixes = []) {
  if (joursEcoules <= 0) {
    return 0;
  }
  
  const now = new Date();
  const joursRestants = joursTotal - joursEcoules;
  
  // Calculer rythme actuel (sans charges fixes)
  const chargesFixesPayees = chargesFixes
    .filter(cf => {
      if (!cf.dateDernierPaiement) return false;
      const cfDate = new Date(cf.dateDernierPaiement);
      return cfDate.getMonth() === now.getMonth() && cfDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, cf) => sum + (cf.montant || 0), 0);
  
  const depensesSansChargesFixes = depensesTotal - chargesFixesPayees;
  const rythmeActuel = joursEcoules > 0 ? depensesSansChargesFixes / joursEcoules : 0;
  
  // Charges fixes restantes à payer
  const chargesFixesRestantes = chargesFixes
    .filter(cf => {
      if (!cf.dateDernierPaiement) return true; // Jamais payée
      const cfDate = new Date(cf.dateDernierPaiement);
      return !(cfDate.getMonth() === now.getMonth() && cfDate.getFullYear() === now.getFullYear());
    })
    .reduce((sum, cf) => sum + (cf.montant || 0), 0);
  
  // Projection = dépenses actuelles + rythme actuel * jours restants + charges fixes restantes
  const projectionRythme = rythmeActuel * joursRestants;
  const projection = depensesTotal + projectionRythme + chargesFixesRestantes;
  
  return projection;
}

/**
 * Calcule la projection avec historique (moyenne des mois précédents)
 * 
 * @param {number} depensesTotal - Dépenses totales du mois actuel
 * @param {number} joursEcoules - Nombre de jours écoulés dans le mois
 * @param {number} joursTotal - Nombre total de jours dans le mois
 * @param {Array} historiqueDepenses - Dépenses des mois précédents (format: [{ mois: 'YYYY-MM', total: number }])
 * @param {number} nombreMoisHistorique - Nombre de mois à considérer (défaut: 3)
 * @returns {number} Projection avec historique
 */
export function calculateProjectionWithHistory(depensesTotal, joursEcoules, joursTotal, historiqueDepenses = [], nombreMoisHistorique = 3) {
  if (joursEcoules <= 0) {
    return 0;
  }
  
  const joursRestants = joursTotal - joursEcoules;
  
  // Calculer moyenne historique
  const historiqueRecents = historiqueDepenses
    .slice(-nombreMoisHistorique)
    .map(h => h.total || 0);
  
  const moyenneHistorique = historiqueRecents.length > 0
    ? historiqueRecents.reduce((sum, total) => sum + total, 0) / historiqueRecents.length
    : 0;
  
  // Calculer rythme actuel
  const rythmeActuel = depensesTotal / joursEcoules;
  const rythmeMoyen = moyenneHistorique / joursTotal;
  
  // Pondération : 70% rythme actuel, 30% moyenne historique
  const rythmePondere = (rythmeActuel * 0.7) + (rythmeMoyen * 0.3);
  
  // Projection = dépenses actuelles + rythme pondéré * jours restants
  const projection = depensesTotal + (rythmePondere * joursRestants);
  
  return projection;
}

/**
 * Calcule la projection complète (tous facteurs combinés)
 * 
 * @param {Object} params - Paramètres de projection
 * @param {number} params.depensesTotal - Dépenses totales du mois actuel
 * @param {number} params.joursEcoules - Nombre de jours écoulés dans le mois
 * @param {number} params.joursTotal - Nombre total de jours dans le mois
 * @param {Array} params.depensesPlanifiees - Dépenses planifiées pour le reste du mois
 * @param {Array} params.chargesFixes - Charges fixes mensuelles
 * @param {Array} params.historiqueDepenses - Dépenses des mois précédents
 * @param {Object} params.options - Options de calcul
 * @param {boolean} options.includePlanned - Inclure dépenses planifiées (défaut: true)
 * @param {boolean} options.includeFixedCharges - Inclure charges fixes (défaut: true)
 * @param {boolean} options.includeHistory - Inclure historique (défaut: true)
 * @param {number} options.historyWeight - Poids de l'historique (0-1, défaut: 0.3)
 * @returns {Object} Projection complète avec détails
 */
export function calculateCompleteProjection(params) {
  const {
    depensesTotal,
    joursEcoules,
    joursTotal,
    depensesPlanifiees = [],
    chargesFixes = [],
    historiqueDepenses = [],
    options = {}
  } = params;
  
  const {
    includePlanned = true,
    includeFixedCharges = true,
    includeHistory = true,
    historyWeight = 0.3
  } = options;
  
  if (joursEcoules <= 0) {
    return {
      projection: 0,
      projectionSimple: 0,
      projectionWithPlanned: 0,
      projectionWithFixedCharges: 0,
      projectionWithHistory: 0,
      details: {
        rythmeActuel: 0,
        joursRestants: joursTotal,
        depensesPlanifieesRestantes: 0,
        chargesFixesRestantes: 0,
        moyenneHistorique: 0
      }
    };
  }
  
  const joursRestants = joursTotal - joursEcoules;
  const rythmeActuel = depensesTotal / joursEcoules;
  
  // Calculer chaque type de projection
  const projectionSimple = calculateSimpleProjection(depensesTotal, joursEcoules, joursTotal);
  
  let projectionWithPlanned = projectionSimple;
  let depensesPlanifieesRestantes = 0;
  if (includePlanned) {
    const now = new Date();
    const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    depensesPlanifieesRestantes = depensesPlanifiees
      .filter(dp => {
        if (!dp.date || dp.statut === 'annule') return false;
        const dpDate = new Date(dp.date);
        const dpMois = `${dpDate.getFullYear()}-${String(dpDate.getMonth() + 1).padStart(2, '0')}`;
        return dpMois === moisActuel && dpDate >= now;
      })
      .reduce((sum, dp) => sum + (dp.montant || 0), 0);
    projectionWithPlanned = depensesTotal + (rythmeActuel * joursRestants) + depensesPlanifieesRestantes;
  }
  
  let projectionWithFixedCharges = projectionWithPlanned;
  let chargesFixesRestantes = 0;
  if (includeFixedCharges) {
    const now = new Date();
    const chargesFixesPayees = chargesFixes
      .filter(cf => {
        if (!cf.dateDernierPaiement) return false;
        const cfDate = new Date(cf.dateDernierPaiement);
        return cfDate.getMonth() === now.getMonth() && cfDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, cf) => sum + (cf.montant || 0), 0);
    
    chargesFixesRestantes = chargesFixes
      .filter(cf => {
        if (!cf.dateDernierPaiement) return true;
        const cfDate = new Date(cf.dateDernierPaiement);
        return !(cfDate.getMonth() === now.getMonth() && cfDate.getFullYear() === now.getFullYear());
      })
      .reduce((sum, cf) => sum + (cf.montant || 0), 0);
    
    const depensesSansChargesFixes = depensesTotal - chargesFixesPayees;
    const rythmeSansChargesFixes = depensesSansChargesFixes / joursEcoules;
    projectionWithFixedCharges = depensesTotal + (rythmeSansChargesFixes * joursRestants) + chargesFixesRestantes;
  }
  
  let projectionWithHistory = projectionWithFixedCharges;
  let moyenneHistorique = 0;
  if (includeHistory && historiqueDepenses.length > 0) {
    const historiqueRecents = historiqueDepenses
      .slice(-3)
      .map(h => h.total || 0);
    
    moyenneHistorique = historiqueRecents.length > 0
      ? historiqueRecents.reduce((sum, total) => sum + total, 0) / historiqueRecents.length
      : 0;
    
    const rythmeMoyen = moyenneHistorique / joursTotal;
    const rythmePondere = (rythmeActuel * (1 - historyWeight)) + (rythmeMoyen * historyWeight);
    projectionWithHistory = depensesTotal + (rythmePondere * joursRestants) + depensesPlanifieesRestantes + chargesFixesRestantes;
  }
  
  return {
    projection: projectionWithHistory,
    projectionSimple,
    projectionWithPlanned,
    projectionWithFixedCharges,
    projectionWithHistory,
    details: {
      rythmeActuel,
      joursRestants,
      depensesPlanifieesRestantes,
      chargesFixesRestantes,
      moyenneHistorique,
      rythmePondere: includeHistory && historiqueDepenses.length > 0
        ? (rythmeActuel * (1 - historyWeight)) + ((moyenneHistorique / joursTotal) * historyWeight)
        : rythmeActuel
    }
  };
}

