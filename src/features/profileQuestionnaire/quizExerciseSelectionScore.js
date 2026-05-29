/**
 * Scoring de sélection d’exercices (curateur) — lecture banque, sans mutation.
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';
import {
  resolveFineMuscleFromBankEntry,
  resolveFineMuscleFromName
} from './quizFineMuscleResolve';
import { FITNESS_THRESHOLD_AUTO } from './exerciseGenerationFitness';

const UPPER_FINE = new Set(['chest', 'back', 'shoulders', 'biceps', 'triceps']);
const LOWER_FINE = new Set(['quads', 'hamstrings', 'glutes', 'calves']);

/** Bonus legacy uniquement si le pool filtré est restreint (filet de sécurité). */
export const LEGACY_TIE_BONUS_ELIGIBLE_MAX = 12;

/**
 * @param {number} [fitnessScore]
 */
export function scoreFitnessForPick(fitnessScore) {
  const s = Number(fitnessScore) || 0;
  if (s >= 95) return 5;
  if (s >= FITNESS_THRESHOLD_AUTO) return 4;
  if (s >= 70) return 2;
  if (s >= 60) return 1;
  return 0;
}

/**
 * Affinité priorités quiz (pectoraux, dos fin, etc.) via primaryMuscles banque.
 * @param {string} dbKey
 * @param {object} [answers]
 */
export function scorePriorityMuscleAffinity(dbKey, answers) {
  const prio = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  if (!prio.length) return 0;

  const entry = exerciseDatabase[dbKey];
  if (!entry) return 0;

  const fine = resolveFineMuscleFromBankEntry(dbKey, entry);
  const prim = (entry.primaryMuscles || []).join(' ').toLowerCase();
  const keyBlob = `${dbKey} ${entry.name || ''}`.toLowerCase();
  let score = 0;

  const matchesFine = (target) => fine === target;

  prio.forEach((p) => {
    if (p === 'cardio') return;
    if (p === 'core' && matchesFine('core')) score += 5;
    if (p === 'upper_body' && fine && UPPER_FINE.has(fine)) score += 3;
    if (p === 'lower_body' && fine && LOWER_FINE.has(fine)) score += 3;
    if (matchesFine(p)) score += 6;
    if (p === 'chest' && /pectoraux sup|supérieur|inclin|haut/.test(`${prim} ${keyBlob}`)) score += 3;
    if (p === 'chest' && /inférieur|bas|dip/.test(`${prim} ${keyBlob}`)) score += 2;
    if (p === 'back' && /vertical|lat|tirage|traction/.test(`${prim} ${keyBlob}`)) score += 2;
    if (p === 'biceps' && /curl|biceps|brachial/.test(`${prim} ${keyBlob}`)) score += 2;
    if (p === 'triceps' && /triceps|extension|dip/.test(`${prim} ${keyBlob}`)) score += 2;
    if (p === 'shoulders' && /delto|épaule|militaire|élévation/.test(`${prim} ${keyBlob}`)) score += 2;
  });

  return score;
}

/**
 * @param {object} template
 * @param {object} answers
 * @param {string} targetGroup
 */
export function scoreTrainingStyleAffinity(template, answers, targetGroup) {
  const styles = Array.isArray(answers?.triedTrainingStyles) ? answers.triedTrainingStyles : [];
  const key = template.dbKey;
  let score = 0;

  if (styles.includes('calisthenics') && /pompe|traction|dips|australienne|muscle up|front lever|l-sit/.test(key)) {
    score += 3;
  }
  if (styles.includes('bodybuilding') && template.tier === 'standard') score += 2;
  if (styles.includes('hiit_cardio') && template.group === 'cardio') score += 2;
  if (
    (styles.includes('running_road') || styles.includes('running_track') || styles.includes('running_trail')) &&
    /course|fractionné|fractionne/.test(key)
  ) {
    score += 2;
  }
  if (styles.includes('crossfit') && (template.group === 'cardio' || key.includes('burpee'))) score += 1;
  if (styles.includes('functional') && template.tier === 'classic' && targetGroup !== 'cardio') score += 1;

  return score;
}

/**
 * Pénalité légère si l’exo ressemble peu au groupe cible du slot.
 */
export function scoreGroupCoherence(template, targetGroup) {
  if (template.group === targetGroup) return 5;
  const entry = exerciseDatabase[template.dbKey];
  if (!entry) return 0;
  const fine = resolveFineMuscleFromBankEntry(template.dbKey, entry);
  if (targetGroup === 'upper' && fine && UPPER_FINE.has(fine)) return 2;
  if (targetGroup === 'lower' && fine && LOWER_FINE.has(fine)) return 2;
  if (targetGroup === 'core' && fine === 'core') return 3;
  return 0;
}

/**
 * @param {object} opts
 */
export function scoreLegacyTieBonus(template, { eligibleCount = 99 } = {}) {
  if (template.source !== 'legacy') return 0;
  if (eligibleCount <= LEGACY_TIE_BONUS_ELIGIBLE_MAX) return 2;
  return 0;
}

/**
 * Anti-répétition : favorise la variété motrice (nom + muscles primaires).
 */
export function scoreVarietyVsUsed(template, usedKeys) {
  if (!usedKeys?.size) return 0;
  const entry = exerciseDatabase[template.dbKey];
  const sig = `${resolveFineMuscleFromBankEntry(template.dbKey, entry) || ''}:${(entry?.primaryMuscles || [])[0] || ''}`;
  let penalty = 0;
  usedKeys.forEach((usedKey) => {
    if (usedKey === template.dbKey) return;
    const uEntry = exerciseDatabase[usedKey];
    const uSig = `${resolveFineMuscleFromBankEntry(usedKey, uEntry) || ''}:${(uEntry?.primaryMuscles || [])[0] || ''}`;
    if (sig && sig === uSig) penalty += 2;
    const nameA = (entry?.name || template.dbKey).toLowerCase();
    const nameB = (uEntry?.name || usedKey).toLowerCase();
    if (resolveFineMuscleFromName(nameA) === resolveFineMuscleFromName(nameB) && nameA.split(' ')[0] === nameB.split(' ')[0]) {
      penalty += 1;
    }
  });
  return -penalty;
}
