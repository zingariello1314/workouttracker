/**
 * Module STREET v6 — objectifs skill + boosts templates (SPEC §6.7).
 */

import { resolvePrimaryMissionIds } from './quizMissionResolver';

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);

/** @type {Record<string, string[]>} */
export const STREET_SKILL_TEMPLATE_BOOSTS = {
  first_pullup: ['tractions australiennes', 'tractions pronation', 'gainage'],
  pullups_10: ['tractions pronation', 'tractions australiennes', 'rowing haltère'],
  pullups_20: ['tractions pronation', 'rowing barre', 'dips'],
  muscle_up: ['tractions pronation', 'dips', 'tractions australiennes'],
  front_lever: ['tractions pronation', 'gainage', 'planche'],
  back_lever: ['tractions pronation', 'dips', 'gainage'],
  planche: ['pompes', 'gainage', 'planche', 'dips'],
  handstand: ['pompes', 'gainage', 'développé militaire'],
  street_hypertrophy: ['tractions pronation', 'dips', 'pompes', 'développé militaire'],
  street_general: ['tractions pronation', 'dips', 'pompes', 'rowing haltère']
};

export const STREET_SKILL_GOAL_KEYS = Object.keys(STREET_SKILL_TEMPLATE_BOOSTS);

/**
 * @param {object} answers
 */
export function isStreetOrientedProfile(answers) {
  if (!answers) return false;
  const keys = resolvePrimaryMissionIds(answers);
  if (keys.includes('hypertrophy_street') || keys.includes('street_strength')) return true;
  if (!HYPERTROPHY_GOALS.has(answers.goalPhysique)) return false;
  const eq = Array.isArray(answers.availableEquipment) ? answers.availableEquipment : [];
  return eq.includes('pullup_bar') || eq.includes('dip_station') || eq.includes('parallel_bars');
}

/**
 * Infère un skill par défaut depuis repères / mission.
 * @param {object} answers
 */
export function inferStreetSkillGoal(answers) {
  if (answers?.streetSkillGoal && STREET_SKILL_TEMPLATE_BOOSTS[answers.streetSkillGoal]) {
    return answers.streetSkillGoal;
  }
  const b = answers?.strengthBaselineMaxes || {};
  const pull = Number(b.pullupsMax) || 0;
  const dips = Number(b.dipsMax) || 0;
  if (pull <= 2) return 'first_pullup';
  if (pull < 8) return 'pullups_10';
  if (pull >= 15 && dips >= 15) return 'street_hypertrophy';
  if (pull >= 10) return 'pullups_20';
  if (resolvePrimaryMissionIds(answers).includes('hypertrophy_street')) return 'street_hypertrophy';
  return 'street_general';
}

/**
 * @param {object} answers
 * @returns {{ skillId: string, boosts: string[], labelFr: string }}
 */
export function resolveStreetSkillPlan(answers) {
  const skillId = inferStreetSkillGoal(answers);
  const boosts = [...(STREET_SKILL_TEMPLATE_BOOSTS[skillId] || STREET_SKILL_TEMPLATE_BOOSTS.street_general)];
  const labels = {
    first_pullup: 'Premières tractions',
    pullups_10: 'Viser 10 tractions',
    pullups_20: 'Viser 20 tractions',
    muscle_up: 'Muscle-up',
    front_lever: 'Front lever',
    back_lever: 'Back lever',
    planche: 'Planche',
    handstand: 'Handstand',
    street_hypertrophy: 'Street hypertrophie',
    street_general: 'Street général'
  };
  return {
    skillId,
    boosts,
    labelFr: labels[skillId] || 'Street'
  };
}
