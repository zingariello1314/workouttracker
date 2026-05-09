/**
 * Calcul de l'XP gagnée via les Circuits.
 *
 * Barème (mode "tieredOnly", validé par l'utilisateur) :
 *  - Tour 0 → target-1 : 0 XP (les tours partiels ne donnent pas d'XP)
 *  - Atteinte du target (tour numéro `targetRounds`) : +100 XP
 *  - Chaque tour supplémentaire après target : +100 XP
 *  - Atteinte du palier 3× target (tour numéro `3 * targetRounds`) : +250 XP
 *    (ce tour-là remplace le +100, il ne s'y ajoute pas)
 *
 * Pour qu'un circuit "compte" comme effectué un jour donné, il doit donc
 * avoir au moins atteint son `targetRounds` ce jour-là.
 *
 * @module services/xp/circuitsXpService
 */

const BASE_XP_PER_BONUS_ROUND = 100;
const TRIPLE_TARGET_BONUS_XP = 250;

/**
 * Calcule l'XP gagnée pour un circuit donné un jour donné.
 *
 * @param {number} roundsCompleted - Nombre de tours réalisés ce jour (>= 0).
 * @param {number} targetRounds - Cible du circuit (>= 1).
 * @returns {{ xp: number, baseXp: number, tripleBonusXp: number, bonusRounds: number, isCompleted: boolean, isTripleAchieved: boolean }}
 */
export function computeCircuitXpForDay(roundsCompleted, targetRounds) {
  const rounds = Math.max(0, Math.round(Number(roundsCompleted) || 0));
  const target = Math.max(1, Math.round(Number(targetRounds) || 1));

  if (rounds < target) {
    return {
      xp: 0,
      baseXp: 0,
      tripleBonusXp: 0,
      bonusRounds: 0,
      isCompleted: false,
      isTripleAchieved: false
    };
  }

  // Nombre de tours qui déclenchent un bonus (target, target+1, ...)
  const bonusRounds = rounds - target + 1;
  const tripleTargetRound = 3 * target;
  const isTripleAchieved = rounds >= tripleTargetRound;

  // Sans le palier triple, chaque tour-bonus vaut 100 XP.
  // Avec le palier triple, le tour numéro 3×target vaut 250 (au lieu de 100), donc +150.
  const baseXp = bonusRounds * BASE_XP_PER_BONUS_ROUND;
  const tripleBonusXp = isTripleAchieved ? TRIPLE_TARGET_BONUS_XP - BASE_XP_PER_BONUS_ROUND : 0;

  return {
    xp: baseXp + tripleBonusXp,
    baseXp,
    tripleBonusXp,
    bonusRounds,
    isCompleted: true,
    isTripleAchieved
  };
}

/**
 * Calcule l'XP totale pour tous les circuits enregistrés dans `circuitProgress`.
 *
 * @param {object} circuitProgress - Map { date → { circuitId → { roundsCompleted } } }
 * @param {object} circuitDefinitions - Map { circuitId → CircuitDef }
 * @returns {{
 *   totalXp: number,
 *   completedCircuitDays: number,
 *   tripleAchievedDays: number,
 *   bonusRoundsTotal: number,
 *   perCircuit: Array<{ circuitId: string, xp: number, completedDays: number, tripleDays: number }>
 * }}
 */
export function computeCircuitsXp(circuitProgress, circuitDefinitions) {
  const result = {
    totalXp: 0,
    completedCircuitDays: 0,
    tripleAchievedDays: 0,
    bonusRoundsTotal: 0,
    perCircuit: []
  };

  if (!circuitProgress || typeof circuitProgress !== 'object') return result;
  if (!circuitDefinitions || typeof circuitDefinitions !== 'object') return result;

  const perCircuitMap = new Map();

  Object.entries(circuitProgress).forEach(([_dateStr, byCircuit]) => {
    if (!byCircuit || typeof byCircuit !== 'object') return;
    Object.entries(byCircuit).forEach(([circuitId, val]) => {
      const def = circuitDefinitions[circuitId];
      if (!def) return;
      const r = computeCircuitXpForDay(val?.roundsCompleted, def.targetRounds);
      if (r.xp <= 0) return;

      result.totalXp += r.xp;
      if (r.isCompleted) result.completedCircuitDays += 1;
      if (r.isTripleAchieved) result.tripleAchievedDays += 1;
      result.bonusRoundsTotal += r.bonusRounds;

      const existing = perCircuitMap.get(circuitId) || {
        circuitId,
        xp: 0,
        completedDays: 0,
        tripleDays: 0
      };
      existing.xp += r.xp;
      if (r.isCompleted) existing.completedDays += 1;
      if (r.isTripleAchieved) existing.tripleDays += 1;
      perCircuitMap.set(circuitId, existing);
    });
  });

  result.perCircuit = Array.from(perCircuitMap.values()).sort((a, b) => b.xp - a.xp);
  return result;
}

export const CIRCUIT_BASE_XP_PER_BONUS_ROUND = BASE_XP_PER_BONUS_ROUND;
export const CIRCUIT_TRIPLE_TARGET_BONUS_XP = TRIPLE_TARGET_BONUS_XP;
