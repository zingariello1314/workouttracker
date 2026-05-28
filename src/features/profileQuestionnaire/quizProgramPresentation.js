/**
 * Titre et description courts pour les programmes générés depuis le quiz.
 */

import { getProgramGoalLabel } from './quizInfluence';
import { scheduleHasPlyometrics } from './quizPlyometricPlanner';
import { scheduleHasDrillsCourse } from './quizDrillPlanner';
import { formatSessionDurationLabel } from './quizSessionDurationBudget';
import { QUIZ_SCHEDULE_DAY_ORDER } from './trainingScheduleFromQuiz';

const LOCATION_SHORT = {
  commercial_gym: 'salle',
  home_gym: 'home gym',
  home_minimal: 'maison',
  outdoor: 'extérieur',
  track: 'piste'
};

function activeTrainingDays(schedule) {
  return QUIZ_SCHEDULE_DAY_ORDER.filter((d) => schedule?.[d]?.active);
}

function primaryLocationLabel(answers) {
  const loc = Array.isArray(answers?.trainingLocation)
    ? answers.trainingLocation
    : answers?.trainingLocation
      ? [answers.trainingLocation]
      : [];
  if (!loc.length) return '';
  const labels = loc.slice(0, 2).map((k) => LOCATION_SHORT[k] || k).filter(Boolean);
  return labels.join(' & ');
}

function trainingStyleHint(answers, schedule) {
  const parts = [];
  const prio = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  if (prio.includes('cardio') || answers?.cardioTrainingDesire === 'priority_hiit') parts.push('cardio');
  if (prio.includes('upper_body') && prio.includes('lower_body')) parts.push('full body');
  else if (prio.includes('upper_body')) parts.push('haut du corps');
  else if (prio.includes('lower_body')) parts.push('bas du corps');
  if (scheduleHasPlyometrics(schedule)) parts.push('pliométrie');
  if (scheduleHasDrillsCourse(schedule)) parts.push('drills course');
  if (answers?.weekAlternation === 'ab_enabled') parts.push('variantes A/B');
  return parts.length ? parts.join(', ') : 'musculation équilibrée';
}

/**
 * Titre court affiché sur la carte programme.
 */
export function buildProgramTitleFromQuiz(answers, schedule) {
  const goal = getProgramGoalLabel(answers?.goalPhysique || 'balanced_functional');
  const days = activeTrainingDays(schedule);
  const n = days.length || (Array.isArray(answers?.availableTrainingDays) ? answers.availableTrainingDays.length : 0);
  const loc = primaryLocationLabel(answers);
  const dur = formatSessionDurationLabel(answers);
  const base = n > 0 ? `${goal} · ${n} séance${n > 1 ? 's' : ''}/sem` : goal;
  const extras = [dur, loc].filter(Boolean);
  return extras.length ? `${base} · ${extras.join(' · ')}` : base;
}

/**
 * Une phrase de description alignée sur le contenu réel du planning.
 */
export function buildProgramDescriptionFromQuiz(answers, schedule) {
  const goal = getProgramGoalLabel(answers?.goalPhysique || 'balanced_functional').toLowerCase();
  const days = activeTrainingDays(schedule);
  const n = days.length;
  const dur = formatSessionDurationLabel(answers);
  const style = trainingStyleHint(answers, schedule);
  const loc = primaryLocationLabel(answers);

  if (n === 0) {
    return `Programme orienté ${goal}, à compléter selon tes jours disponibles (${dur} visées au quiz).`;
  }

  let sentence = `Programme ${goal} sur ${n} jour${n > 1 ? 's' : ''} par semaine (${dur}), axé ${style}`;
  if (loc) sentence += `, principalement en ${loc}`;
  if (scheduleHasPlyometrics(schedule)) {
    const placementNote =
      answers?.cardioTrainingDesire === 'priority_hiit' ||
      answers?.goalPhysique === 'athletic_performance'
        ? 'activée avant le cardio'
        : 'coordination avec le cardio du jour';
    sentence += `, avec pliométrie en complément (${placementNote})`;
  }
  if (scheduleHasDrillsCourse(schedule)) {
    sentence += scheduleHasPlyometrics(schedule) ? ' et drills course' : ', avec drills course';
  }
  sentence += '.';
  return sentence;
}
