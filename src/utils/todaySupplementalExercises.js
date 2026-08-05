/**
 * Défis reps à fusionner dans la liste Aujourd’hui (additif, hors GTG).
 */

import { ENDURANCE_REP_ACTIVITY_WORKOUT_ID } from '../services/endurance/enduranceRepsWorkoutSync';
import { listRepChallengesScheduledOnDate } from '../services/endurance/challengeScheduleUtils';

function challengeRowForActivity(challenge, t) {
  const activity = challenge.activityType;
  const exId = ENDURANCE_REP_ACTIVITY_WORKOUT_ID[activity];
  if (exId == null) return null;
  const defaultNames = { pushups: t('today.supplemental.pushups', 'Pompes') };
  return {
    id: exId,
    name: challenge.name || defaultNames[activity] || challenge.activityType,
    series: t('today.supplemental.challengeSeries', 'Défi répétitions'),
    materiel: '',
    type: 'standard',
    source: 'rep_challenge',
    challengeId: challenge.id,
    supplementalLabel: t('today.supplemental.challengeBadge', 'Défi')
  };
}

/**
 * @returns {object[]} lignes exercice compatibles TodayTab (hors programme)
 */
export function buildSupplementalExercisesForDate({ dateStr, challenges = [], t = (k, d) => d }) {
  const rows = [];
  const seenIds = new Set();

  listRepChallengesScheduledOnDate(challenges, dateStr).forEach((challenge) => {
    const row = challengeRowForActivity(challenge, t);
    if (!row) return;
    const key = String(row.id);
    if (seenIds.has(key)) return;
    seenIds.add(key);
    rows.push(row);
  });

  return rows;
}

/** Exclut les suppléments déjà présents dans le programme (même id). */
export function mergeSupplementalWithProgram(programExercises, supplemental) {
  const programIds = new Set((programExercises || []).map((ex) => String(ex.id)));
  return (supplemental || []).filter((ex) => !programIds.has(String(ex.id)));
}
