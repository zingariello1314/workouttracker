/**
 * ✅ PHASE 1.2 : Module de validation pour synchronisation Garmin
 * 
 * Ce module contient les fonctions de validation des données Garmin :
 * - `isDataEmptyForDate` : Vérifie si les données sont vides pour une date donnée
 * 
 * Utilisé pour :
 * - Détecter si un retry automatique est nécessaire (Phase 5.1)
 * - Vérifier la validité des données avant utilisation
 * - Éviter d'utiliser des données vides comme données valides
 * 
 * @module garminSyncValidation
 */

import logger from '../../../../utils/logger';

const log = logger.module('garminSyncValidation');

/**
 * Vérifie si les données sont vides pour une date donnée
 * 
 * Cette fonction vérifie les métriques essentielles pour déterminer si les données
 * sont considérées comme "vides" :
 * - Steps (pas)
 * - Calories totales
 * - Points de time series de fréquence cardiaque
 * 
 * Les données sont considérées comme vides si :
 * - La réponse JSON est invalide ou n'a pas de données
 * - Il n'y a pas de métriques pour la date
 * - Toutes les métriques essentielles sont à 0
 * 
 * ⚠️ IMPORTANT : Cette fonction est utilisée pour la Phase 5.1 (retry automatique)
 * qui se déclenche si les données sont vides après 00:15. Elle doit donc être
 * précise pour éviter les faux positifs/négatifs.
 * 
 * @param {Object} json - Réponse JSON du serveur
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @returns {boolean} True si les données sont vides, false sinon
 * 
 * @example
 * // Vérifier si les données sont vides pour aujourd'hui
 * const isEmpty = isDataEmptyForDate(jsonResponse, '2025-01-15');
 * if (isEmpty) {
 *   // Déclencher retry automatique
 * }
 */
export const isDataEmptyForDate = (json, dateStr) => {
  // Validation des paramètres
  if (!json || typeof json !== 'object') {
    log.debug(`[isDataEmptyForDate] Invalid JSON for ${dateStr}`);
    return true; // Pas de données = vide
  }
  
  if (!json.ok) {
    log.debug(`[isDataEmptyForDate] JSON not OK for ${dateStr}`);
    return true; // Réponse non OK = vide
  }
  
  if (!json.data || typeof json.data !== 'object') {
    log.debug(`[isDataEmptyForDate] No data object for ${dateStr}`);
    return true; // Pas de données = vide
  }

  // Vérifier les métriques quotidiennes pour la date
  const dailyMetrics = json.data.dailyMetrics || {};
  const dateMetrics = dailyMetrics[dateStr];
  
  if (!dateMetrics || typeof dateMetrics !== 'object') {
    log.debug(`[isDataEmptyForDate] No metrics for ${dateStr}`);
    return true; // Pas de métriques pour cette date
  }

  // Vérifier si les données essentielles sont vides
  const steps = dateMetrics.steps || 0;
  const calories = dateMetrics.calories?.total || 0;
  const heartRatePoints = dateMetrics.heartRate?.timeSeries?.length || 0;
  
  // Considérer comme vide si toutes les métriques essentielles sont à 0
  const isEmpty = steps === 0 && calories === 0 && heartRatePoints === 0;
  
  log.debug(`[isDataEmptyForDate] Check for ${dateStr}: steps=${steps}, calories=${calories}, hrPoints=${heartRatePoints}, isEmpty=${isEmpty}`);
  
  return isEmpty;
};

/**
 * Vérifie si les métriques quotidiennes sont valides pour une date donnée
 * 
 * Valide que les métriques contiennent au moins une donnée non nulle.
 * Plus permissif que `isDataEmptyForDate` car ne vérifie que l'existence de données.
 * 
 * @param {Object} dailyMetrics - Objet des métriques quotidiennes (par date)
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @returns {boolean} True si les métriques sont valides, false sinon
 */
export const hasValidMetricsForDate = (dailyMetrics, dateStr) => {
  if (!dailyMetrics || typeof dailyMetrics !== 'object') {
    return false;
  }
  
  const dateMetrics = dailyMetrics[dateStr];
  if (!dateMetrics || typeof dateMetrics !== 'object') {
    return false;
  }
  
  // Vérifier qu'au moins une métrique existe (peut être 0, mais doit exister)
  return (
    dateMetrics.steps !== undefined ||
    dateMetrics.distance !== undefined ||
    dateMetrics.calories !== undefined ||
    dateMetrics.heartRate !== undefined ||
    dateMetrics.bodyBattery !== undefined ||
    dateMetrics.stress !== undefined
  );
};

/**
 * Valide la structure de la réponse JSON du serveur
 * 
 * Vérifie que la réponse a la structure attendue :
 * - `ok` : boolean
 * - `data` : object (optionnel)
 * - `data.activities` : object (optionnel)
 * - `data.dailyMetrics` : object (optionnel)
 * 
 * @param {Object} json - Réponse JSON du serveur
 * @returns {boolean} True si la structure est valide, false sinon
 */
export const isValidSyncResponse = (json) => {
  if (!json || typeof json !== 'object') {
    return false;
  }
  
  // Vérifier que 'ok' existe (peut être true ou false)
  if (typeof json.ok !== 'boolean') {
    return false;
  }
  
  // Si 'data' existe, vérifier sa structure
  if (json.data !== undefined) {
    if (typeof json.data !== 'object' || json.data === null) {
      return false;
    }
    
    // Vérifier que activities et dailyMetrics sont des objets si présents
    if (json.data.activities !== undefined && typeof json.data.activities !== 'object') {
      return false;
    }
    
    if (json.data.dailyMetrics !== undefined && typeof json.data.dailyMetrics !== 'object') {
      return false;
    }
  }
  
  return true;
};

