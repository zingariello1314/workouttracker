/**
 * Utilitaires pour les exports
 * 
 * ✅ PHASE 4 : Extraction des fonctions utilitaires d'export
 * 
 * @module components/tabs/SettingsTab/utils/exportUtils
 */

import { ENDURANCE_SCHEMA_VERSION } from '../../../../services/endurance/enduranceDataService';

/**
 * Construit les statistiques d'export pour les données d'endurance
 * 
 * @param {Object} enduranceData - Données d'endurance
 * @returns {Object} Statistiques d'endurance
 */
export const buildEnduranceExportStats = (enduranceData = {}) => {
  const sessions = enduranceData.sessions || {};
  const getList = (type) => (Array.isArray(sessions[type]) ? sessions[type] : []);

  const perTypeCounts = {
    boxing: getList('boxing').length,
    pushups: getList('pushups').length,
    swimming: getList('swimming').length,
    jumprope: getList('jumprope').length,
    running: getList('running').length
  };

  const totalSessions = Object.values(perTypeCounts).reduce((sum, count) => sum + count, 0);

  const swimmingDetail = getList('swimming').reduce(
    (acc, session) => {
      if (Array.isArray(session?.laps) && session.laps.length > 0) acc.withLaps += 1;
      if (session?.pace100m) acc.withPace100m += 1;
      if (session?.heartRate !== undefined && session.heartRate !== null) acc.withHeartRate += 1;
      if (session?.calories !== undefined && session.calories !== null) acc.withCalories += 1;
      return acc;
    },
    { withLaps: 0, withPace100m: 0, withHeartRate: 0, withCalories: 0 }
  );

  const jumpropeDetail = getList('jumprope').reduce(
    (acc, session) => {
      if (session?.durationSec) acc.withDurationSec += 1;
      if (session?.jumpsPerMin) acc.withJumpsPerMin += 1;
      if (session?.hrMax || session?.hrAvg) acc.withHeartRate += 1;
      return acc;
    },
    { withDurationSec: 0, withJumpsPerMin: 0, withHeartRate: 0 }
  );

  const challenges = Array.isArray(enduranceData.challenges) ? enduranceData.challenges : [];
  const challengeStats = challenges.reduce(
    (acc, challenge) => {
      const status = challenge?.status || 'unknown';
      acc.byStatus[status] = (acc.byStatus[status] || 0) + 1;
      return acc;
    },
    { total: challenges.length, byStatus: {} }
  );

  const gtgDays =
    enduranceData.gtg?.days && typeof enduranceData.gtg.days === 'object'
      ? Object.keys(enduranceData.gtg.days).length
      : 0;
  const gtgExercises = Array.isArray(enduranceData.gtg?.config?.selectedIds)
    ? enduranceData.gtg.config.selectedIds.length
    : 0;

  return {
    schemaVersion: enduranceData.schemaVersion || ENDURANCE_SCHEMA_VERSION,
    lastUpdated: enduranceData.lastUpdated || null,
    totalSessions,
    perTypeCounts,
    swimmingDetail,
    jumpropeDetail,
    challenges: challengeStats,
    gtg: {
      days: gtgDays,
      exercises: gtgExercises
    }
  };
};
