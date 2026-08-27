/**
 * Service de persistance et de normalisation pour les données Endurance.
 * L’objectif est de centraliser la logique métier actuellement dispersée
 * dans `EnduranceTab.jsx` afin de supprimer les effets secondaires côté UI.
 *
 * Les fonctions exposées sont pures autant que possible : elles prennent
 * des données brutes en argument, retournent des structures normalisées,
 * et délèguent la persistance à la fonction `updateData` injectée au moment
 * de l’appel.
 */

import { normalizePushupSessionFields } from './pushupSessionUtils';

const ACTIVITY_TYPES = ['boxing', 'pushups', 'gainage', 'swimming', 'jumprope', 'running'];
export const ENDURANCE_SCHEMA_VERSION = '2.0.0';

const DEFAULT_LOGGER = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

/**
 * Normalise et prépare les données d’endurance issues du stockage.
 *
 * @param {Object} rawEnduranceData - Données telles que stockées dans IndexedDB / JSON export.
 * @param {Object} [options]
 * @param {Object} [options.logger] - Logger facultatif (doit exposer info/warn/error).
 * @returns {{ sessions: Record<string, Array>, challenges: Array, metadata: Object }}
 */
export function loadEnduranceData(rawEnduranceData = {}, options = {}) {
  const { logger = DEFAULT_LOGGER } = options;

  const { sessions: mergedSessions, legacyMigrated } = migrateLegacySessions(rawEnduranceData);
  const { sessions: dedupedSessions, duplicateCount: sessionDuplicates } = dedupeSessions(mergedSessions, { logger });

  const rawChallenges = Array.isArray(rawEnduranceData.challenges)
    ? rawEnduranceData.challenges
    : [];
  const { challenges: dedupedChallenges, duplicateCount: challengeDuplicates } = dedupeChallenges(rawChallenges, { logger });

  const metadata = {
    schemaVersion: rawEnduranceData.schemaVersion || ENDURANCE_SCHEMA_VERSION,
    legacyMigrated,
    duplicatesResolved: {
      sessions: sessionDuplicates,
      challenges: challengeDuplicates
    },
    lastUpdated: rawEnduranceData.lastUpdated || null
  };

  return {
    sessions: dedupedSessions,
    challenges: dedupedChallenges,
    metadata
  };
}

/**
 * Persiste une mise à jour partielle d’enduranceData en s’appuyant sur updateData.
 *
 * @param {Object} params
 * @param {Object} params.currentData - L’objet data complet provenant du contexte.
 * @param {Object} params.patch - Les changements à appliquer à enduranceData.
 * @param {Function} params.updateData - Fonction de persistance (context).
 * @param {Object} [params.logger] - Logger optionnel.
 * @returns {Promise<Object>} - Les données complètes après sauvegarde.
 */
import { applyWorkoutRepIntegrations } from './workoutRepIntegrations';
import {
  mergeEnduranceWithoutSilentWipe,
  writeEnduranceLocalBackup
} from './enduranceWipeGuard';

export async function persistEnduranceData({ currentData = {}, patch = {}, updateData, logger = DEFAULT_LOGGER }) {
  if (typeof updateData !== 'function') {
    throw new Error('[enduranceDataService] persistEnduranceData requiert updateData');
  }

  const currentEndurance = currentData.enduranceData || {};

  const patched = {
    ...currentEndurance,
    ...patch,
    lastUpdated: new Date().toISOString(),
    schemaVersion: ENDURANCE_SCHEMA_VERSION
  };

  const nextEndurance = mergeEnduranceWithoutSilentWipe(currentEndurance, patched, {
    sessionTypesTouched: patch.sessionTypesTouched,
    allowEmptyChallenges: patch.allowEmptyChallenges === true,
    allowWipe: patch.allowWipe === true
  });
  delete nextEndurance.sessionTypesTouched;
  delete nextEndurance.allowEmptyChallenges;
  delete nextEndurance.allowWipe;

  let nextData = {
    ...currentData,
    enduranceData: nextEndurance
  };

  nextData = applyWorkoutRepIntegrations(nextData, { workoutAggregate: nextData });

  logger.debug?.('[enduranceDataService] persistEnduranceData', { patch, nextEndurance });

  await updateData(nextData);
  writeEnduranceLocalBackup(currentData.storageKey || currentData._storageKey, nextEndurance);
  return nextData;
}

/**
 * Persiste les sessions pour une activité donnée.
 *
 * @param {Object} params
 * @param {Object} params.currentData
 * @param {string} params.activityType - Type d’activité (doit appartenir à ACTIVITY_TYPES).
 * @param {Array} params.sessions - Sessions à persister (brutes ou normalisées).
 * @param {Function} params.updateData
 * @param {Object} [params.logger]
 * @returns {Promise<{ data: Object, sessions: Record<string, Array>, metadata: Object }>}
 */
export async function persistSessions({ currentData = {}, activityType, sessions = [], updateData, logger = DEFAULT_LOGGER }) {
  if (!ACTIVITY_TYPES.includes(activityType)) {
    throw new Error(`[enduranceDataService] activityType inconnu: ${activityType}`);
  }

  const currentEndurance = currentData.enduranceData || {};
  const currentSessionsByType = {
    ...buildEmptySessions(),
    ...(currentEndurance.sessions || {})
  };

  const normalizedSessions = sessions.map(session => normalizeSession(activityType, session));
  const { sessions: deduped } = dedupeSessions({
    ...currentSessionsByType,
    [activityType]: normalizedSessions
  }, { logger });

  const patch = {
    sessions: deduped,
    sessionTypesTouched: [activityType]
  };

  const data = await persistEnduranceData({ currentData, patch, updateData, logger });

  const metadata = {
    activityType,
    totalSessions: deduped[activityType].length
  };

  return { data, sessions: deduped, metadata };
}

/**
 * Persiste l’intégralité du tableau de challenges.
 *
 * @param {Object} params
 * @param {Object} params.currentData
 * @param {Array} params.challenges
 * @param {Function} params.updateData
 * @param {Object} [params.logger]
 * @returns {Promise<{ data: Object, challenges: Array, metadata: Object }>}
 */
export async function persistChallenges({ currentData = {}, challenges = [], updateData, logger = DEFAULT_LOGGER }) {
  const normalized = challenges.map(challenge => normalizeChallenge(challenge));
  const { challenges: deduped, duplicateCount } = dedupeChallenges(normalized, { logger });

  const patch = {
    challenges: deduped,
    allowEmptyChallenges: true
  };

  const data = await persistEnduranceData({ currentData, patch, updateData, logger });

  const metadata = {
    totalChallenges: deduped.length,
    duplicatesResolved: duplicateCount
  };

  return { data, challenges: deduped, metadata };
}

// ---------- Helpers internes ----------

function migrateLegacySessions(rawEnduranceData = {}) {
  const sessionsByType = buildEmptySessions();
  let legacyMigrated = 0;

  const rawSessions = rawEnduranceData.sessions || {};

  ACTIVITY_TYPES.forEach((type) => {
    const legacyKey = `${type}Sessions`;
    const primaryList = Array.isArray(rawSessions[type]) ? rawSessions[type] : [];
    const legacyList = Array.isArray(rawEnduranceData[legacyKey]) ? rawEnduranceData[legacyKey] : [];

    if (legacyList.length > 0) {
      legacyMigrated += legacyList.length;
    }

    const combined = [...primaryList, ...legacyList];
    sessionsByType[type] = combined.map(session => normalizeSession(type, session));
  });

  return { sessions: sessionsByType, legacyMigrated };
}

function dedupeSessions(sessionsByType, { logger = DEFAULT_LOGGER } = {}) {
  const result = {};
  let duplicateCount = 0;

  ACTIVITY_TYPES.forEach((type) => {
    const list = Array.isArray(sessionsByType[type]) ? sessionsByType[type] : [];
    const idMap = new Map();
    const dedupedList = list.map((session, index) => {
      const sessionId = String(session.id);
      if (!idMap.has(sessionId)) {
        idMap.set(sessionId, index);
        return session;
      }

      duplicateCount += 1;
      const newId = generateStableId(type);
      logger.warn?.(`[enduranceDataService] Duplicate session id detected for ${type}: ${sessionId} → ${newId}`);
      return {
        ...session,
        id: newId
      };
    });

    result[type] = dedupedList;
  });

  return { sessions: result, duplicateCount };
}

function buildChallengeSignature(challenge = {}) {
  return [
    challenge.name || '',
    challenge.activityType || '',
    challenge.type || '',
    challenge.targetDate || '',
    challenge.startDate || '',
    challenge.endDate || '',
    challenge.frequency || '',
    challenge.dayOfWeek ?? '',
    challenge.goalCount ?? '',
    challenge.goalDuration ?? '',
    challenge.goalDistance ?? '',
    challenge.goalJumps ?? '',
    challenge.goalTotalCount ?? '',
    challenge.status || ''
  ].join('|');
}

function dedupeChallenges(challenges, { logger = DEFAULT_LOGGER } = {}) {
  const idMap = new Map();
  const signatureMap = new Map();
  let duplicateCount = 0;
  let signatureDuplicates = 0;

  const deduped = [];

  challenges.forEach((challenge, index) => {
    const challengeId = String(challenge.id);
    if (idMap.has(challengeId)) {
      duplicateCount += 1;
      const newId = generateStableId('challenge');
      logger.warn?.(`[enduranceDataService] Duplicate challenge id detected: ${challengeId} → ${newId}`);
      const next = { ...challenge, id: newId };
      const signature = buildChallengeSignature(next);
      if (signatureMap.has(signature)) {
        signatureDuplicates += 1;
        return;
      }
      idMap.set(newId, index);
      signatureMap.set(signature, true);
      deduped.push(next);
      return;
    }

    const signature = buildChallengeSignature(challenge);
    if (signatureMap.has(signature)) {
      signatureDuplicates += 1;
      return;
    }

    idMap.set(challengeId, index);
    signatureMap.set(signature, true);
    deduped.push(challenge);
  });

  return { challenges: deduped, duplicateCount: duplicateCount + signatureDuplicates };
}

function normalizeSession(activityType, session = {}) {
  const normalized = {
    ...session,
    id: ensureId(session.id, activityType),
    activityType: session.activityType || activityType
  };

  if (normalized.laps && Array.isArray(normalized.laps)) {
    normalized.laps = normalized.laps.map((lap) => ({ ...lap }));
  }

  if (activityType === 'pushups') {
    return normalizePushupSessionFields(normalized);
  }

  return normalized;
}

/** Exposé pour aligner id / activityType avant évaluation des défis (ex. cumul pompes). */
export function normalizeEnduranceSession(activityType, session = {}) {
  return normalizeSession(activityType, session);
}

function normalizeChallenge(challenge = {}) {
  return {
    ...challenge,
    id: ensureId(challenge.id, 'challenge'),
    status: challenge.status || 'active'
  };
}

function ensureId(id, activityType) {
  if (id === undefined || id === null || id === '') {
    return generateStableId(activityType);
  }
  return String(id);
}

function generateStableId(activityType) {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return `${activityType}-${globalThis.crypto.randomUUID()}`;
  }

  const randomPart = Math.random().toString(36).slice(2, 11);
  const timestamp = Date.now();
  return `${activityType}-${timestamp}-${randomPart}`;
}

function buildEmptySessions() {
  return ACTIVITY_TYPES.reduce((acc, type) => {
    acc[type] = [];
    return acc;
  }, {});
}


