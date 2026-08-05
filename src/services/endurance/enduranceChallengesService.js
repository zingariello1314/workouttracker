import { shouldExcludeStoredGarminRunningSession } from '../../utils/garminRunningLaps';
import {
  resolveSessionCalendarDate,
  readGarminActivityDateOverrides
} from '../../utils/sessionCalendarDate';
import { resolvePushupSessionTotalReps } from './pushupSessionUtils';
import { isWeeklyQuotaChallenge } from './pushupChallengeSchedule';

const DEFAULT_LOGGER = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

/**
 * Évalue l'impact d'une session sur les défis actifs et retourne les défis mis à jour.
 *
 * @param {Array} challenges - Liste complète des défis actuels.
 * @param {Object} sessionData - Données de la session (date, count, duration...).
 * @param {string} activityType - Type d'activité concernée par la session.
 * @param {Object} [options]
 * @param {Object} [options.logger] - Logger optionnel.
 * @param {Array} [options.relatedPushupSessions] - Sessions pompes (déjà normalisées) pour défis cumul.
 * @param {Object} [options.workoutAggregate] - Agrégat workout (overrides date logique).
 * @returns {{ validatedIds: Array<string>, updatedChallenges: Array }}
 */
/**
 * Indique si une session satisfait les critères d’un défi (sans tenir compte du statut du défi).
 * Sert à l’affichage des pastilles « défi validé » sur toutes les sessions éligibles,
 * même après passage du défi en « terminé ».
 */
export function listMatchingChallengeIds(challenges = [], sessionData = {}, activityType, options = {}) {
  const { logger = DEFAULT_LOGGER, relatedPushupSessions } = options;
  if (!activityType || !Array.isArray(challenges) || challenges.length === 0) {
    return [];
  }
  if (activityType === 'running' && shouldExcludeStoredGarminRunningSession(sessionData)) {
    return [];
  }
  const ids = [];
  challenges.forEach((challenge) => {
    if (!challenge || challenge.activityType !== activityType) return;
    let ok = false;
    switch (challenge.type) {
      case 'ponctuel':
        ok = validatePonctuelChallenge(challenge, sessionData, logger, options);
        break;
      case 'recurrent':
        ok = validateRecurrentChallenge(challenge, sessionData, logger, options);
        break;
      case 'periode':
        ok = validatePeriodeChallenge(challenge, sessionData, logger, options);
        break;
      case 'pushups_cumul':
        ok =
          activityType === 'pushups' &&
          validatePushupsCumulSessionIsCompletion(challenge, sessionData, relatedPushupSessions, options);
        break;
      default:
        ok = false;
    }
    if (ok && challenge.id != null) {
      ids.push(challenge.id);
    }
  });
  return ids;
}

export function evaluateChallenges(challenges = [], sessionData = {}, activityType, options = {}) {
  const { logger = DEFAULT_LOGGER, relatedPushupSessions } = options;
  if (!activityType) {
    logger.warn?.('[enduranceChallengesService] activityType manquant pour evaluateChallenges');
    return { validatedIds: [], updatedChallenges: challenges };
  }

  if (activityType === 'running' && shouldExcludeStoredGarminRunningSession(sessionData)) {
    return { validatedIds: [], updatedChallenges: challenges };
  }

  if (!Array.isArray(challenges) || challenges.length === 0) {
    return { validatedIds: [], updatedChallenges: challenges };
  }

  const validatedChallengeIds = [];

  const updatedChallenges = challenges.map((challenge) => {
    if (challenge.activityType !== activityType || challenge.status !== 'active') {
      return challenge;
    }

    let isValid = false;
    switch (challenge.type) {
      case 'ponctuel':
        isValid = validatePonctuelChallenge(challenge, sessionData, logger, options);
        break;
      case 'recurrent':
        isValid = validateRecurrentChallenge(challenge, sessionData, logger, options);
        break;
      case 'periode':
        isValid = validatePeriodeChallenge(challenge, sessionData, logger, options);
        break;
      case 'pushups_cumul':
        isValid =
          activityType === 'pushups' &&
          validatePushupsCumulSessionIsCompletion(challenge, sessionData, relatedPushupSessions, options);
        break;
      default:
        logger.debug?.('[enduranceChallengesService] Type de défi non supporté:', challenge.type);
        isValid = false;
    }

    if (!isValid) {
      return challenge;
    }

    validatedChallengeIds.push(challenge.id);

    if (challenge.type === 'recurrent') {
      if (isWeeklyQuotaChallenge(challenge)) {
        return {
          ...challenge,
          status: 'active',
          lastSessionDate: challengeSessionYmd(sessionData, options) || sessionData.date || null,
          completedSessionId: sessionData.id || null
        };
      }
      return {
        ...challenge,
        status: 'active',
        lastCompletedDate: challengeSessionYmd(sessionData, options) || sessionData.date || null,
        completedSessionId: sessionData.id || null
      };
    }

    return {
      ...challenge,
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedSessionId: sessionData.id || null
    };
  });

  return { validatedIds: validatedChallengeIds, updatedChallenges };
}

// ---------- Validations internes ----------

function challengeSessionYmd(sessionData, options = {}) {
  const overrides = readGarminActivityDateOverrides(options.workoutAggregate);
  const logical = resolveSessionCalendarDate(sessionData, overrides);
  if (logical) return logical;
  if (!sessionData?.date) return null;
  const m = String(sessionData.date).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function challengeSessionDate(sessionData, options = {}) {
  const ymd = challengeSessionYmd(sessionData, options);
  return ymd ? toDate(ymd) : null;
}

function validatePonctuelChallenge(challenge, sessionData, logger = DEFAULT_LOGGER, options = {}) {
  const sessionYmd = challengeSessionYmd(sessionData, options);
  if (!sessionYmd || !challenge?.targetDate) {
    logger.debug?.('[enduranceChallengesService] Données insuffisantes pour défi ponctuel');
    return false;
  }

  const sessionDate = challengeSessionDate(sessionData, options);
  const targetDate = toDate(challenge.targetDate);

  if (!sessionDate || sessionDate.getTime() > targetDate.getTime()) {
    return false;
  }

  switch (challenge.activityType) {
    case 'pushups':
    case 'gainage':
      return (
        numericAtLeast(sessionData.count, challenge.goalCount) &&
        numericAtMost(sessionData.duration, challenge.goalDuration)
      );
    case 'swimming': {
      const totalDistance = toNumber(sessionData.totalDistance || sessionData.distance);
      const totalTimeMinutes = toNumber(sessionData.totalTime) > 0
        ? toNumber(sessionData.totalTime) / 60
        : toNumber(sessionData.duration);
      return (
        numericAtLeast(totalDistance, challenge.goalDistance) &&
        numericAtMost(totalTimeMinutes, challenge.goalDuration)
      );
    }
    case 'running':
      return (
        numericAtLeast(sessionData.distance, challenge.goalDistance) &&
        numericAtMost(sessionData.duration, challenge.goalDuration)
      );
    case 'jumprope': {
      const dm = jumpropeSessionDurationMinutes(sessionData);
      const jumps = toNumber(sessionData.jumps ?? sessionData.reps, 0);
      return numericAtLeast(dm, challenge.goalDuration) && numericAtLeast(jumps, challenge.goalJumps);
    }
    default:
      logger.debug?.('[enduranceChallengesService] Activité non supportée pour défi ponctuel:', challenge.activityType);
      return false;
  }
}

function validateRecurrentChallenge(challenge, sessionData, logger = DEFAULT_LOGGER, options = {}) {
  const sessionDate = challengeSessionDate(sessionData, options);
  if (!sessionDate) {
    logger.debug?.('[enduranceChallengesService] Session sans date pour défi récurrent');
    return false;
  }

  if (challenge.endDate && sessionDate > toDate(challenge.endDate)) {
    return false;
  }
  if (challenge.startDate && sessionDate < toDate(challenge.startDate)) {
    return false;
  }

  switch (challenge.frequency) {
    case 'weekly_quota':
      break;
    case 'daily':
      if (challenge.timeOfDay && challenge.timeOfDay !== sessionData.timeOfDay) {
        return false;
      }
      break;
    case 'weekly': {
      const dayOfWeek = sessionDate.getDay();
      if (challenge.dayOfWeek !== undefined && challenge.dayOfWeek !== dayOfWeek) {
        return false;
      }
      break;
    }
    default:
      break;
  }

  return validatePonctuelChallenge(challenge, sessionData, logger, options);
}

function validatePeriodeChallenge(challenge, sessionData, logger = DEFAULT_LOGGER, options = {}) {
  const sessionDate = challengeSessionDate(sessionData, options);
  if (!sessionDate || !challenge?.startDate || !challenge?.endDate) {
    logger.debug?.('[enduranceChallengesService] Données insuffisantes pour défi période');
    return false;
  }

  const startDate = toDate(challenge.startDate);
  const endDate = toDate(challenge.endDate);

  if (sessionDate < startDate || sessionDate > endDate) {
    return false;
  }

  return validatePonctuelChallenge(challenge, sessionData, logger, options);
}

function sessionSortTimestamp(s, workoutAggregate = null) {
  const overrides = readGarminActivityDateOverrides(workoutAggregate);
  const ymd = resolveSessionCalendarDate(s, overrides) || String(s?.date || '').slice(0, 10);
  const t = s?.time && String(s.time).length >= 5 ? String(s.time).slice(0, 5) : '00:00';
  return new Date(`${ymd}T${t}:00`).getTime();
}

/** Ordre chronologique strict pour le cumul pompes (uniquement données onglet pompes). */
export function sortedPushupSessionsForCumul(list = [], workoutAggregate = null) {
  if (!Array.isArray(list)) return [];
  return [...list].sort(
    (a, b) => sessionSortTimestamp(a, workoutAggregate) - sessionSortTimestamp(b, workoutAggregate)
  );
}

/**
 * Total des `count` sur les sessions pompes dont la date calendrier est dans [startDate, endDate].
 */
export function sumPushupRepsInChallengeWindow(challenge, pushupSessions = [], workoutAggregate = null) {
  if (!challenge?.startDate || !challenge?.endDate) return 0;
  const start = toDate(challenge.startDate);
  const end = toDate(challenge.endDate);
  const overrides = readGarminActivityDateOverrides(workoutAggregate);
  let sum = 0;
  sortedPushupSessionsForCumul(pushupSessions, workoutAggregate).forEach((s) => {
    const ymd = resolveSessionCalendarDate(s, overrides);
    const d = ymd ? toDate(ymd) : toDate(s.date);
    if (d >= start && d <= end) sum += resolvePushupSessionTotalReps(s);
  });
  return sum;
}

/**
 * La session courante est celle où le cumul atteint pour la première fois `goalTotalCount`
 * (uniquement sessions pompes dans la fenêtre).
 */
function validatePushupsCumulSessionIsCompletion(
  challenge,
  sessionData,
  relatedPushupSessions,
  options = {}
) {
  if (challenge.activityType !== 'pushups' || challenge.type !== 'pushups_cumul') return false;
  if (!Array.isArray(relatedPushupSessions) || relatedPushupSessions.length === 0) return false;
  const sessionYmd = challengeSessionYmd(sessionData, options);
  if (!sessionYmd || !challenge.startDate || !challenge.endDate) return false;
  const goal = toNumber(challenge.goalTotalCount, 0);
  if (goal <= 0) return false;

  const sessionDate = challengeSessionDate(sessionData, options);
  const start = toDate(challenge.startDate);
  const end = toDate(challenge.endDate);
  if (!sessionDate || sessionDate < start || sessionDate > end) return false;

  const sid = sessionData.id != null ? String(sessionData.id) : null;
  if (!sid) return false;

  const overrides = readGarminActivityDateOverrides(options.workoutAggregate);
  let cum = 0;
  let completionId = null;
  sortedPushupSessionsForCumul(relatedPushupSessions, options.workoutAggregate).forEach((s) => {
    const ymd = resolveSessionCalendarDate(s, overrides);
    const d = ymd ? toDate(ymd) : toDate(s.date);
    if (d < start || d > end) return;
    cum += resolvePushupSessionTotalReps(s);
    if (completionId == null && cum >= goal) {
      completionId = s.id != null ? String(s.id) : null;
    }
  });

  return completionId != null && completionId === sid;
}

// ---------- Utilitaires ----------

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/** Durée séance corde en minutes (aligné sur durationSec ou mm:ss saisi). */
function jumpropeSessionDurationMinutes(sessionData) {
  if (!sessionData) return 0;
  const sec = toNumber(sessionData.durationSec, NaN);
  if (Number.isFinite(sec) && sec > 0) return sec / 60;
  const raw = sessionData.duration;
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const str = String(raw);
  if (str.includes(':')) {
    const parts = str.split(':').map((p) => Number(p));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      return (parts[0] * 60 + parts[1]) / 60;
    }
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      return (parts[0] * 3600 + parts[1] * 60 + parts[2]) / 60;
    }
  }
  return toNumber(raw, 0);
}

function numericAtLeast(actual, expected) {
  if (expected === undefined || expected === null || expected === '') return true;
  return toNumber(actual) >= toNumber(expected);
}

function numericAtMost(actual, expected) {
  if (expected === undefined || expected === null || expected === '') return true;
  return toNumber(actual) <= toNumber(expected);
}

function toDate(value) {
  if (value instanceof Date) return value;
  return new Date(`${value}T00:00:00`);
}

