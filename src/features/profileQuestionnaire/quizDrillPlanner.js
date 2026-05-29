/**
 * Drills course : bloc complémentaire (`day.drillsCourse`), hors `exercises`.
 */

import {
  buildQuizDrillTemplate,
  shouldInjectDrillsFromQuiz
} from './quizInfluence';
import { QUIZ_SCHEDULE_DAY_ORDER } from './trainingScheduleFromQuiz';

const PLACEMENT_LABELS = {
  avant_course: 'Avant la course / le bloc cardio',
  apres_echauffement: 'Après l’échauffement, avant l’effort principal',
  fin_seance: 'En fin de séance (retour au calme technique)'
};

function levelFromExperience(experienceLevel) {
  if (experienceLevel === 'beginner_total' || experienceLevel === 'beginner_0_3m') return 'beginner';
  if (experienceLevel === 'intermediate_3_12m') return 'intermediate';
  return 'advanced';
}

function dayHasRunningOrCardio(day) {
  const exercises = Array.isArray(day?.exercises) ? day.exercises : [];
  return exercises.some((ex) => {
    const n = `${ex?.name || ''} ${ex?.exerciseBankKey || ''}`.toLowerCase();
    return (
      ex?.programCategory === 'cardio' ||
      ex?.type === 'cardio' ||
      n.includes('course') ||
      n.includes('fractionné') ||
      n.includes('endurance')
    );
  });
}

export function resolveDrillPlacement(answers, dayHasCardio) {
  const lvl = levelFromExperience(answers?.experienceLevel);
  const cardio = answers?.cardioTrainingDesire;
  const goal = answers?.goalPhysique;

  if (!dayHasCardio) return 'fin_seance';
  if (lvl === 'beginner' || cardio === 'minimal') return 'apres_echauffement';
  if (goal === 'endurance_lean' || goal === 'athletic_performance' || cardio === 'priority_hiit') {
    return 'avant_course';
  }
  return 'apres_echauffement';
}

function resolveDrillDaysCount(answers, activeDayCount) {
  const lvl = levelFromExperience(answers?.experienceLevel);
  let days = lvl === 'beginner' ? 1 : 2;
  if (answers?.cardioTrainingDesire === 'high' || answers?.cardioTrainingDesire === 'priority_hiit') {
    days = Math.min(3, days + 1);
  }
  if (answers?.cardioTrainingDesire === 'minimal') days = 1;
  return Math.min(activeDayCount, Math.max(1, days));
}

function rankDaysForDrills(schedule, activeDays) {
  return activeDays
    .map((dayKey) => {
      const day = schedule[dayKey];
      const cardio = dayHasRunningOrCardio(day);
      const exCount = Array.isArray(day?.exercises) ? day.exercises.length : 0;
      return { dayKey, score: (cardio ? 12 : 0) + exCount };
    })
    .sort((a, b) => b.score - a.score)
    .map((r) => r.dayKey);
}

export function injectQuizDrillsIntoSchedule(schedule, answers, coachOpts = {}) {
  if (coachOpts?.coachContext?.deformers?.allowDrills === false) return schedule;
  if (!shouldInjectDrillsFromQuiz(answers)) return schedule;
  const activeDays = QUIZ_SCHEDULE_DAY_ORDER.filter((d) => schedule?.[d]?.active);
  if (!activeDays.length) return schedule;

  const template = buildQuizDrillTemplate(answers);
  if (!template.length) return schedule;

  const dayCount = resolveDrillDaysCount(answers, activeDays.length);
  const ranked = rankDaysForDrills(schedule, activeDays).slice(0, dayCount);

  ranked.forEach((dayKey, dayIdx) => {
    const day = schedule[dayKey];
    if (!day) return;
    const hasCardio = dayHasRunningOrCardio(day);
    const placement = resolveDrillPlacement(answers, hasCardio);
    const items = template.map((ex, i) => ({
      id: `${ex.id}_${dayKey}_${dayIdx}_${i}`,
      stretchKey: ex.stretchKey,
      name: ex.name,
      series: ex.series,
      rest: ex.rest,
      intensity: ex.intensity,
      difficulty: ex.difficulty,
      instructions: 'Drill course — technique et réactivité (quiz).'
    }));

    day.drillsCourse = {
      placement,
      placementLabel: PLACEMENT_LABELS[placement] || PLACEMENT_LABELS.apres_echauffement,
      items
    };
  });

  return schedule;
}

export function scheduleHasDrillsCourse(schedule) {
  if (!schedule || typeof schedule !== 'object') return false;
  return Object.values(schedule).some(
    (d) => d?.active && Array.isArray(d?.drillsCourse?.items) && d.drillsCourse.items.length > 0
  );
}
