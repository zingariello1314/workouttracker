/**
 * Trophées circuits — paliers d'accomplissement basés sur la progression
 * cumulée (`circuitProgress` × `circuitDefinitions`).
 *
 * Ces trophées ne donnent pas d'XP supplémentaire (l'XP des circuits passe
 * déjà par `circuitsXpService`) ; ils servent uniquement à afficher des
 * jalons motivants dans le hub Défis > Circuits.
 *
 * @module services/circuits/circuitTrophiesService
 */

import {
  computeCircuitsXp
} from '../xp/circuitsXpService';

/** Catégorie « cibles atteintes » (jours où un circuit a été terminé). */
const COMPLETED_TIERS = [
  { id: 'starter', threshold: 1, label: 'Première cible' },
  { id: 'rookie', threshold: 5, label: '5 cibles atteintes' },
  { id: 'regular', threshold: 10, label: '10 cibles atteintes' },
  { id: 'hardcore', threshold: 25, label: '25 cibles atteintes' },
  { id: 'machine', threshold: 50, label: '50 cibles atteintes' },
  { id: 'legend', threshold: 100, label: '100 cibles atteintes' }
];

/** Catégorie « 3× cible » (atteinte du palier triple). */
const TRIPLE_TIERS = [
  { id: 'triple-starter', threshold: 1, label: '1 fois 3× cible' },
  { id: 'triple-rookie', threshold: 5, label: '5 fois 3× cible' },
  { id: 'triple-machine', threshold: 15, label: '15 fois 3× cible' },
  { id: 'triple-legend', threshold: 50, label: '50 fois 3× cible' }
];

/** Catégorie « tours bonus cumulés ». */
const BONUS_ROUND_TIERS = [
  { id: 'bonus-starter', threshold: 5, label: '5 tours-bonus' },
  { id: 'bonus-rookie', threshold: 25, label: '25 tours-bonus' },
  { id: 'bonus-machine', threshold: 100, label: '100 tours-bonus' },
  { id: 'bonus-legend', threshold: 500, label: '500 tours-bonus' }
];

/** Catégorie « XP totale circuits ». */
const XP_TIERS = [
  { id: 'xp-bronze', threshold: 100, label: '100 XP circuits' },
  { id: 'xp-silver', threshold: 1000, label: '1 000 XP circuits' },
  { id: 'xp-gold', threshold: 5000, label: '5 000 XP circuits' },
  { id: 'xp-elite', threshold: 25000, label: '25 000 XP circuits' }
];

const evaluateTier = (value, tiers) => tiers.map((t) => ({
  ...t,
  unlocked: value >= t.threshold,
  current: value
}));

/**
 * Calcule les trophées circuits.
 *
 * @param {object} workoutData
 * @returns {{
 *   summary: { totalXp:number, completedDays:number, tripleDays:number, bonusRounds:number },
 *   completedTiers: Array<object>,
 *   tripleTiers: Array<object>,
 *   bonusRoundTiers: Array<object>,
 *   xpTiers: Array<object>,
 *   unlockedCount: number,
 *   totalCount: number
 * }}
 */
export function evaluateCircuitTrophies(workoutData) {
  const xpRes = computeCircuitsXp(
    workoutData?.circuitProgress,
    workoutData?.circuitDefinitions
  );
  const summary = {
    totalXp: xpRes.totalXp,
    completedDays: xpRes.completedCircuitDays,
    tripleDays: xpRes.tripleAchievedDays,
    bonusRounds: xpRes.bonusRoundsTotal
  };

  const completedTiers = evaluateTier(summary.completedDays, COMPLETED_TIERS);
  const tripleTiers = evaluateTier(summary.tripleDays, TRIPLE_TIERS);
  const bonusRoundTiers = evaluateTier(summary.bonusRounds, BONUS_ROUND_TIERS);
  const xpTiers = evaluateTier(summary.totalXp, XP_TIERS);

  const allTiers = [...completedTiers, ...tripleTiers, ...bonusRoundTiers, ...xpTiers];
  const unlockedCount = allTiers.filter((t) => t.unlocked).length;
  return {
    summary,
    completedTiers,
    tripleTiers,
    bonusRoundTiers,
    xpTiers,
    unlockedCount,
    totalCount: allTiers.length
  };
}

export const CIRCUIT_TROPHY_TIERS = {
  COMPLETED_TIERS,
  TRIPLE_TIERS,
  BONUS_ROUND_TIERS,
  XP_TIERS
};
