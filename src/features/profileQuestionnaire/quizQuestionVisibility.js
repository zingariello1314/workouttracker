/**
 * Arbre conditionnel quiz v12 — quelles questions afficher selon les réponses.
 */

import { isStreetOrientedProfile } from './quizStreetSkillGoal';

export { isStreetOrientedProfile };

/** @typedef {'always'|'run_module'|'mission_pick'|'structure_pick'|'recovery_pick'|'street_module'|'hybrid_priority'|'triathlon_module'|'sport_module'} QuestionShowWhen */

/**
 * @param {object} answers
 */
export function isSpecializedSportProfile(answers) {
  if (!answers) return false;
  const pm = answers.primaryMission;
  return (
    pm === 'sport_collective' ||
    pm === 'combat_sport' ||
    pm === 'military_prep'
  );
}

/**
 * @param {object} answers
 */
export function isTriathlonProfile(answers) {
  if (!answers) return false;
  const pm = answers.primaryMission;
  if (pm === 'triathlon' || (typeof pm === 'string' && pm.startsWith('triathlon_'))) return true;
  return Boolean(answers.triathlonDistance);
}

/**
 * @param {object} answers
 */
export function isRunOrientedProfile(answers) {
  if (!answers) return false;
  const goal = answers.goalPhysique;
  if (goal === 'endurance_lean' || goal === 'athletic_performance') return true;

  const mission = answers.primaryMission;
  if (typeof mission === 'string' && (mission.startsWith('run_') || mission.startsWith('triathlon_'))) {
    return true;
  }
  if (mission === 'triathlon' || answers.triathlonDistance) return true;

  const cardio = answers.cardioTrainingDesire;
  if (cardio === 'high' || cardio === 'priority_hiit') return true;

  const prefs = Array.isArray(answers.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  if (prefs.includes('cardio_endurance')) return true;

  const styles = Array.isArray(answers.triedTrainingStyles) ? answers.triedTrainingStyles : [];
  return styles.some((s) => /^running_/.test(s) || s === 'sprint_track' || s === 'hiit_cardio');
}

/**
 * @param {object} answers
 */
export function isHybridRunAndStrength(answers) {
  if (!isRunOrientedProfile(answers)) return false;
  const goal = answers.goalPhysique;
  if (['muscular_defined', 'lean_toned', 'bulk_mass', 'recomposition', 'strong_powerful'].includes(goal)) {
    return true;
  }
  return answers.primaryMission === 'hybrid_run_strength';
}

/**
 * @param {{ showWhen?: QuestionShowWhen, id?: string }} question
 * @param {object} answers
 */
export function shouldShowQuestion(question, answers) {
  if (question.id === 'weekAlternationSites') {
    return answers?.weekAlternation === 'ab_enabled';
  }

  const when = question.showWhen || 'always';
  if (when === 'always') return true;
  if (when === 'run_module') return isRunOrientedProfile(answers);
  if (when === 'mission_pick') return Boolean(answers?.goalPhysique);
  if (when === 'structure_pick') {
    return ['muscular_defined', 'lean_toned', 'bulk_mass', 'recomposition', 'strong_powerful', 'balanced_functional'].includes(
      answers?.goalPhysique
    );
  }
  if (when === 'recovery_pick') return Boolean(answers?.goalPhysique);
  if (when === 'street_module') return isStreetOrientedProfile(answers);
  if (when === 'hybrid_priority') return isHybridRunAndStrength(answers);
  if (when === 'triathlon_module') return isTriathlonProfile(answers);
  if (when === 'sport_module') return isSpecializedSportProfile(answers);
  return true;
}

/**
 * @param {object[]} defs
 * @param {object} answers
 */
export function filterActiveQuestions(defs, answers) {
  return defs.filter((q) => shouldShowQuestion(q, answers));
}
