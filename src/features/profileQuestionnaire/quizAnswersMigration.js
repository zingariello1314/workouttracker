/**
 * Migration réponses quiz v11 → v12 (champs v6 + inférence mission).
 */

import { normalizePrimaryMissionSelection, suggestPrimaryMissionsFromAnswers } from './quizMissionResolver';
import { inferStreetSkillGoal, isStreetOrientedProfile } from './quizStreetSkillGoal';
import { normalizeProgramConstraints } from './quizProfileConstraints';

/**
 * @param {object} answers — déjà sanitizées
 * @returns {object}
 */
export function migrateAnswersToV12(answers) {
  const out = { ...answers };

  const missionSel = normalizePrimaryMissionSelection(out);
  if (!missionSel.length) {
    out.primaryMission = suggestPrimaryMissionsFromAnswers(out);
  } else if (typeof out.primaryMission === 'string') {
    out.primaryMission = [out.primaryMission];
  }

  if (!out.runningGoal) {
    if (answers.goalPhysique === 'endurance_lean') out.runningGoal = '10k';
    else if (answers.cardioTrainingDesire === 'priority_hiit') out.runningGoal = '5k';
    else if (isRunStyles(answers)) out.runningGoal = 'health';
  }

  if (!out.runStrengthPriority && isRunAndForceGoal(answers)) {
    if (answers.goalPhysique === 'endurance_lean') out.runStrengthPriority = 'run_first';
    else if (['muscular_defined', 'bulk_mass'].includes(answers.goalPhysique)) {
      out.runStrengthPriority = 'muscle_first';
    } else {
      out.runStrengthPriority = 'balanced';
    }
  }

  if (!out.neuralFatigueTolerance) {
    const exp = answers.experienceLevel;
    if (exp === 'expert_3y_plus' || exp === 'advanced_1_3y') out.neuralFatigueTolerance = 'high';
    else if (exp === 'beginner_total' || exp === 'beginner_0_3m') out.neuralFatigueTolerance = 'low';
    else out.neuralFatigueTolerance = 'moderate';
  }

  if (!out.volumeTolerance) {
    const rec = answers.sleepQuality === 'poor' || answers.stressLevel === 'very_high';
    out.volumeTolerance = rec ? 'low' : 'moderate';
  }

  if (!out.preferredWeeklyStructure) {
    if (answers.goalPhysique === 'endurance_lean') out.preferredWeeklyStructure = 'running_focus';
    else if (['muscular_defined', 'lean_toned', 'bulk_mass'].includes(answers.goalPhysique)) {
      out.preferredWeeklyStructure = 'upper_lower';
    }
  }

  out.weeklyConstraints = normalizeProgramConstraints(out);

  if (!out.programDurationWeeks) {
    out.programDurationWeeks = 'auto';
  }

  if (!out.streetSkillGoal && isStreetOrientedProfile(out)) {
    out.streetSkillGoal = inferStreetSkillGoal(out);
  }

  return out;
}

function isRunStyles(answers) {
  const styles = Array.isArray(answers.triedTrainingStyles) ? answers.triedTrainingStyles : [];
  return styles.some((s) => /^running_/.test(s));
}

function isRunAndForceGoal(answers) {
  if (answers.goalPhysique === 'endurance_lean') return true;
  if (isRunStyles(answers) && answers.goalPhysique !== 'endurance_lean') return true;
  return false;
}
