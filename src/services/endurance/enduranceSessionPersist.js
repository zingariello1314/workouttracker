/**
 * Ajout / mise à jour session endurance + défis + sync reps Aujourd’hui.
 */
import { loadEnduranceData, normalizeEnduranceSession } from './enduranceDataService';
import { evaluateChallenges, listMatchingChallengeIds } from './enduranceChallengesService';
import { applyWorkoutRepIntegrations } from './workoutRepIntegrations';
import { normalizePushupSessionFields } from './pushupSessionUtils';

function prepSession(activityType, sessionData) {
  let raw = { ...sessionData };
  if (activityType === 'pushups') {
    raw = normalizePushupSessionFields(raw);
  }
  return normalizeEnduranceSession(activityType, raw);
}

/**
 * @returns {Promise<{ success: boolean, workoutPayload?: object, validatedIds?: string[] }>}
 */
export async function buildWorkoutAfterEnduranceSession({
  workoutData,
  activityType,
  sessionData,
  mode = 'append'
}) {
  const enduranceRaw = workoutData?.enduranceData || {};
  const normalized = loadEnduranceData(enduranceRaw);
  const challenges = normalized.challenges || [];
  const sessionsMap = { ...(normalized.sessions || {}) };
  const list = Array.isArray(sessionsMap[activityType]) ? [...sessionsMap[activityType]] : [];

  const prepared = prepSession(activityType, sessionData);
  const relatedPushupSessions =
    activityType === 'pushups' ? [...list, prepared] : undefined;

  const evaluation = evaluateChallenges(challenges, prepared, activityType, {
    relatedPushupSessions,
    workoutAggregate: workoutData
  });

  const badgeIds = listMatchingChallengeIds(challenges, prepared, activityType, {
    relatedPushupSessions,
    workoutAggregate: workoutData
  });

  const newSession = {
    ...prepared,
    activityType,
    validatedChallenges: badgeIds
  };

  let nextList = list;
  if (mode === 'append') {
    nextList = [...list, newSession];
  }

  const nextEndurance = {
    ...normalized,
    sessions: { ...sessionsMap, [activityType]: nextList },
    challenges: evaluation.updatedChallenges,
    lastUpdated: new Date().toISOString()
  };

  const merged = applyWorkoutRepIntegrations(
    { ...workoutData, enduranceData: nextEndurance },
    { workoutAggregate: workoutData }
  );

  return {
    success: true,
    workoutPayload: merged,
    validatedIds: evaluation.validatedIds,
    session: newSession
  };
}
