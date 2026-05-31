/**
 * Alignement nutrition indicatif jour par jour (v6.3) — kcal cible par jour actif du planning.
 */

import { QUIZ_SCHEDULE_DAY_ORDER } from './trainingScheduleFromQuiz';
import { buildNutritionCoachPayload } from './quizNutritionPayload';

const DAY_LABELS_FR = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche'
};

function isSportIntensityDay(blocks, slot) {
  if (!Array.isArray(blocks)) blocks = [];
  if (blocks.some((b) => b === 'run_interval' || b === 'circuit_metabolic' || b === 'run_long')) {
    return true;
  }
  if (blocks.some((b) => b.startsWith('run_') || b === 'cardio_general')) return true;
  if (slot?.modality === 'cardio' || slot?.modality === 'strength_plus_cardio') return true;
  if (blocks.includes('force_legs')) return true;
  return false;
}

/**
 * @param {object} answers
 * @param {Record<string, object>} schedule
 * @param {object} [weeklyPlanner] — meta.weeklyPlanner
 */
export function buildNutritionDayAlignment(answers, schedule, weeklyPlanner = null) {
  const base = buildNutritionCoachPayload(answers);
  const sportKcal = base.sportDayKcal ?? base.targetKcalDaily;
  const restKcal = base.restDayKcal ?? base.targetKcalDaily;
  const dayBlocks = weeklyPlanner?.dayBlocks || {};
  const byDay = {};
  let sportDays = 0;
  let restDays = 0;

  QUIZ_SCHEDULE_DAY_ORDER.forEach((dayKey) => {
    const slot = schedule?.[dayKey];
    if (!slot?.active) return;
    const blocks = dayBlocks[dayKey] || [];
    const sport = isSportIntensityDay(blocks, slot);
    const kcal = sport ? sportKcal : restKcal;
    if (sport) sportDays += 1;
    else restDays += 1;

    byDay[dayKey] = {
      dayLabelFr: DAY_LABELS_FR[dayKey] || dayKey,
      kcalTarget: kcal,
      intensity: sport ? 'sport' : 'moderate',
      hintFr: sport
        ? `~${kcal} kcal — jour chargé (séance + marge)`
        : `~${kcal} kcal — jour plus léger`,
      timingFr: sport ? 'Glucides autour de la séance' : base.timingHint
    };
  });

  const summaryFr =
    sportDays + restDays === 0
      ? null
      : `${sportDays} jour${sportDays > 1 ? 's' : ''} sport (~${sportKcal} kcal), ${restDays} jour${restDays > 1 ? 's' : ''} modéré${restDays > 1 ? 's' : ''} (~${restKcal} kcal). ${base.mealStructureHint || ''}`.trim();

  return {
    base,
    byDay,
    sportDayCount: sportDays,
    restDayCount: restDays,
    summaryFr
  };
}
