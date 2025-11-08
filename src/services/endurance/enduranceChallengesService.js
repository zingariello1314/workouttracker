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
 * @returns {{ validatedIds: Array<string>, updatedChallenges: Array }}
 */
export function evaluateChallenges(challenges = [], sessionData = {}, activityType, options = {}) {
  const { logger = DEFAULT_LOGGER } = options;
  if (!activityType) {
    logger.warn?.('[enduranceChallengesService] activityType manquant pour evaluateChallenges');
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
        isValid = validatePonctuelChallenge(challenge, sessionData, logger);
        break;
      case 'recurrent':
        isValid = validateRecurrentChallenge(challenge, sessionData, logger);
        break;
      case 'periode':
        isValid = validatePeriodeChallenge(challenge, sessionData, logger);
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
      return {
        ...challenge,
        status: 'active',
        lastCompletedDate: sessionData.date || null,
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

function validatePonctuelChallenge(challenge, sessionData, logger = DEFAULT_LOGGER) {
  if (!sessionData?.date || !challenge?.targetDate) {
    logger.debug?.('[enduranceChallengesService] Données insuffisantes pour défi ponctuel');
    return false;
  }

  const sessionDate = toDate(sessionData.date);
  const targetDate = toDate(challenge.targetDate);

  if (sessionDate.getTime() > targetDate.getTime()) {
    return false;
  }

  switch (challenge.activityType) {
    case 'pushups':
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
    case 'jumprope':
      return (
        numericAtLeast(sessionData.duration, challenge.goalDuration) &&
        numericAtLeast(sessionData.jumps ?? sessionData.reps, challenge.goalJumps)
      );
    default:
      logger.debug?.('[enduranceChallengesService] Activité non supportée pour défi ponctuel:', challenge.activityType);
      return false;
  }
}

function validateRecurrentChallenge(challenge, sessionData, logger = DEFAULT_LOGGER) {
  if (!sessionData?.date) {
    logger.debug?.('[enduranceChallengesService] Session sans date pour défi récurrent');
    return false;
  }

  const sessionDate = toDate(sessionData.date);

  if (challenge.endDate && sessionDate > toDate(challenge.endDate)) {
    return false;
  }
  if (challenge.startDate && sessionDate < toDate(challenge.startDate)) {
    return false;
  }

  switch (challenge.frequency) {
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

  return validatePonctuelChallenge(challenge, sessionData, logger);
}

function validatePeriodeChallenge(challenge, sessionData, logger = DEFAULT_LOGGER) {
  if (!sessionData?.date || !challenge?.startDate || !challenge?.endDate) {
    logger.debug?.('[enduranceChallengesService] Données insuffisantes pour défi période');
    return false;
  }

  const sessionDate = toDate(sessionData.date);
  const startDate = toDate(challenge.startDate);
  const endDate = toDate(challenge.endDate);

  if (sessionDate < startDate || sessionDate > endDate) {
    return false;
  }

  return validatePonctuelChallenge(challenge, sessionData, logger);
}

// ---------- Utilitaires ----------

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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

