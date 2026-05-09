/**
 * Tests Vitest pour le service XP des circuits.
 *
 * Barème "tieredOnly" :
 *  - rounds < target → 0 XP
 *  - rounds === target → 100 XP (atteinte cible)
 *  - chaque tour bonus → +100 XP
 *  - tour numéro 3×target (palier triple) → +250 XP au lieu de +100 (replace, pas additive)
 */

import { describe, it, expect } from 'vitest';
import {
  computeCircuitXpForDay,
  computeCircuitsXp,
  CIRCUIT_BASE_XP_PER_BONUS_ROUND,
  CIRCUIT_TRIPLE_TARGET_BONUS_XP
} from '../circuitsXpService';

describe('computeCircuitXpForDay', () => {
  it("renvoie 0 XP tant qu'on n'a pas atteint la cible", () => {
    expect(computeCircuitXpForDay(0, 3).xp).toBe(0);
    expect(computeCircuitXpForDay(1, 3).xp).toBe(0);
    expect(computeCircuitXpForDay(2, 3).xp).toBe(0);
  });

  it('donne 100 XP exactement à l\'atteinte de la cible', () => {
    const r = computeCircuitXpForDay(3, 3);
    expect(r.xp).toBe(CIRCUIT_BASE_XP_PER_BONUS_ROUND);
    expect(r.isCompleted).toBe(true);
    expect(r.isTripleAchieved).toBe(false);
    expect(r.bonusRounds).toBe(1);
  });

  it('ajoute +100 XP par tour bonus tant qu\'on n\'a pas atteint le 3× cible', () => {
    expect(computeCircuitXpForDay(4, 3).xp).toBe(2 * CIRCUIT_BASE_XP_PER_BONUS_ROUND); // 200
    expect(computeCircuitXpForDay(5, 3).xp).toBe(3 * CIRCUIT_BASE_XP_PER_BONUS_ROUND); // 300
    expect(computeCircuitXpForDay(8, 3).xp).toBe(6 * CIRCUIT_BASE_XP_PER_BONUS_ROUND); // 600 (8-3+1=6 bonus)
  });

  it('au tour 3× cible, le palier remplace le +100 par +250 (gain net = +150 par rapport à la projection linéaire)', () => {
    // target=3, 3×target=9, sans triple : (9-3+1)×100 = 700, avec triple : 700 - 100 + 250 = 850
    const r = computeCircuitXpForDay(9, 3);
    expect(r.isTripleAchieved).toBe(true);
    expect(r.xp).toBe(7 * CIRCUIT_BASE_XP_PER_BONUS_ROUND - CIRCUIT_BASE_XP_PER_BONUS_ROUND + CIRCUIT_TRIPLE_TARGET_BONUS_XP);
    expect(r.xp).toBe(850);
  });

  it('le palier triple ne déclenche qu\'une fois (bonus stable au-delà)', () => {
    const r10 = computeCircuitXpForDay(10, 3); // 8 bonus + triple
    const r11 = computeCircuitXpForDay(11, 3); // 9 bonus + triple
    expect(r11.xp - r10.xp).toBe(CIRCUIT_BASE_XP_PER_BONUS_ROUND);
  });

  it('clamp les valeurs invalides', () => {
    expect(computeCircuitXpForDay(-3, 3).xp).toBe(0);
    expect(computeCircuitXpForDay('abc', 3).xp).toBe(0);
    // target invalide → ramené à 1, 1 tour suffit
    expect(computeCircuitXpForDay(1, 0).xp).toBe(CIRCUIT_BASE_XP_PER_BONUS_ROUND);
    expect(computeCircuitXpForDay(1, NaN).xp).toBe(CIRCUIT_BASE_XP_PER_BONUS_ROUND);
  });
});

describe('computeCircuitsXp', () => {
  const definitions = {
    c1: { id: 'c1', name: 'A', targetRounds: 3 },
    c2: { id: 'c2', name: 'B', targetRounds: 4 }
  };

  it('renvoie 0 quand pas de progression', () => {
    expect(computeCircuitsXp({}, definitions).totalXp).toBe(0);
    expect(computeCircuitsXp(null, definitions).totalXp).toBe(0);
    expect(computeCircuitsXp({ '2026-01-01': {} }, definitions).totalXp).toBe(0);
  });

  it('agrège correctement plusieurs jours et plusieurs circuits', () => {
    const progress = {
      '2026-05-01': {
        c1: { roundsCompleted: 3 }, // 100
        c2: { roundsCompleted: 2 } // 0 (sous cible)
      },
      '2026-05-02': {
        c1: { roundsCompleted: 9 } // 850 (triple)
      }
    };
    const r = computeCircuitsXp(progress, definitions);
    expect(r.totalXp).toBe(950);
    expect(r.completedCircuitDays).toBe(2);
    expect(r.tripleAchievedDays).toBe(1);
    expect(r.perCircuit).toHaveLength(1); // c2 ne compte pas
    expect(r.perCircuit[0].circuitId).toBe('c1');
    expect(r.perCircuit[0].xp).toBe(950);
  });

  it('ignore les circuits sans définition', () => {
    const progress = {
      '2026-05-01': { ghost: { roundsCompleted: 100 } }
    };
    const r = computeCircuitsXp(progress, definitions);
    expect(r.totalXp).toBe(0);
  });
});
