/**
 * Tests Vitest sur la formule XP étirements :
 *   • computeStretchXpFromRating : 100 → 300 XP linéaire selon moyenne 1-10
 *   • Intégration calculateSportXP : breakdown.stretches & breakdown.stretchesXp
 */

import { describe, it, expect } from 'vitest';
import {
  computeStretchXpFromRating,
  STRETCH_XP_MIN,
  STRETCH_XP_MAX,
  STRETCH_XP_FALLBACK,
  calculateSportXP
} from '../xpCalculations';
import { generateStretchItemKey } from '../../../utils/exerciseKeyGenerator';

describe('computeStretchXpFromRating', () => {
  it('renvoie le fallback (150 XP) quand aucune note', () => {
    expect(computeStretchXpFromRating(null)).toBe(STRETCH_XP_FALLBACK);
    expect(computeStretchXpFromRating({})).toBe(STRETCH_XP_FALLBACK);
    expect(computeStretchXpFromRating({ difficulty: 0, enjoyment: 0, recovery: 0 })).toBe(STRETCH_XP_FALLBACK);
  });

  it('renvoie 100 XP pour moyenne 1/10', () => {
    expect(computeStretchXpFromRating({ difficulty: 1, enjoyment: 1, recovery: 1 })).toBe(STRETCH_XP_MIN);
    expect(computeStretchXpFromRating({ difficulty: 1 })).toBe(STRETCH_XP_MIN);
  });

  it('renvoie 300 XP pour moyenne 10/10', () => {
    expect(computeStretchXpFromRating({ difficulty: 10, enjoyment: 10, recovery: 10 })).toBe(STRETCH_XP_MAX);
    expect(computeStretchXpFromRating({ difficulty: 10 })).toBe(STRETCH_XP_MAX);
  });

  it('progresse linéairement entre 1/10 (100 XP) et 10/10 (300 XP)', () => {
    // moyenne 5.5/10 → milieu (≈ 200 XP)
    const xp = computeStretchXpFromRating({ difficulty: 5, enjoyment: 6, recovery: 5.5 });
    expect(xp).toBeGreaterThanOrEqual(195);
    expect(xp).toBeLessThanOrEqual(205);
  });

  it('ignore les critères à 0 (pas de pénalité pour critère non noté)', () => {
    const xpFull = computeStretchXpFromRating({ difficulty: 8, enjoyment: 8, recovery: 8 });
    const xpPartial = computeStretchXpFromRating({ difficulty: 8 });
    // Les deux doivent donner ≈ 256 XP (moyenne 8/10)
    expect(xpFull).toBe(xpPartial);
  });

  it('clip les valeurs > 10 et < 0 dans la plage', () => {
    expect(computeStretchXpFromRating({ difficulty: 999 })).toBe(STRETCH_XP_MAX);
    expect(computeStretchXpFromRating({ difficulty: -5 })).toBe(STRETCH_XP_FALLBACK); // -5 → 0 → fallback
  });

  it('progresse de manière monotone (10/10 > 9/10 > ... > 1/10)', () => {
    let last = 0;
    for (let n = 1; n <= 10; n++) {
      const xp = computeStretchXpFromRating({ difficulty: n, enjoyment: n, recovery: n });
      expect(xp).toBeGreaterThan(last);
      last = xp;
    }
  });
});

describe('calculateSportXP — intégration étirements', () => {
  // Date qui matche le programme par défaut (un samedi quelconque)
  const dateStr = '2026-05-09';
  // ID d'un étirement présent dans workoutProgram[samedi].etirements.matin (cf. workoutProgram.js)
  const sampleStretchId = 9611; // marche_lente_consciente

  it('compte 0 stretchesXp si aucun étirement coché', () => {
    const data = {
      checkedExercises: {},
      reps: {},
      checkedStretches: {},
      stretchPerceivedRatings: {}
    };
    const result = calculateSportXP(data, null, null, {});
    expect(result.breakdown.stretches).toBe(0);
    expect(result.breakdown.stretchesXp).toBe(0);
  });

  it('attribue le fallback (150 XP) pour un étirement coché jamais noté', () => {
    const data = {
      checkedExercises: {},
      reps: {},
      checkedStretches: {
        [generateStretchItemKey(dateStr, 'matin', sampleStretchId)]: true
      },
      stretchPerceivedRatings: {}
    };
    const result = calculateSportXP(data, null, null, {});
    expect(result.breakdown.stretches).toBe(1);
    expect(result.breakdown.stretchesXp).toBe(150);
  });

  it('attribue 300 XP pour un étirement coché noté 10/10/10', () => {
    const data = {
      checkedExercises: {},
      reps: {},
      checkedStretches: {
        [generateStretchItemKey(dateStr, 'matin', sampleStretchId)]: true
      },
      stretchPerceivedRatings: {
        marche_lente_consciente: { difficulty: 10, enjoyment: 10, recovery: 10 }
      }
    };
    const result = calculateSportXP(data, null, null, {});
    expect(result.breakdown.stretchesXp).toBe(300);
  });

  it('ignore les clés legacy "YYYY-MM-DD_matin" (pas de double comptage)', () => {
    const data = {
      checkedExercises: {},
      reps: {},
      checkedStretches: {
        // Format legacy granularité moment → ignoré
        [`${dateStr}_matin`]: true,
        // Format nouveau granularité item → compté
        [generateStretchItemKey(dateStr, 'midi', 9612)]: true
      },
      stretchPerceivedRatings: {}
    };
    const result = calculateSportXP(data, null, null, {});
    expect(result.breakdown.stretches).toBe(1); // seul le nouveau format est compté
  });

  it('résout les stretchKey via le programme custom utilisateur passé en sportOptions', () => {
    const customProgram = {
      schedule: {
        samedi: {
          etirements: {
            matin: [{ id: 88888, stretchKey: 'auto_grandissement_assis', duration: 60 }],
            midi: [],
            soir: []
          }
        }
      }
    };
    const data = {
      checkedExercises: {},
      reps: {},
      checkedStretches: {
        [generateStretchItemKey(dateStr, 'matin', 88888)]: true
      },
      stretchPerceivedRatings: {
        auto_grandissement_assis: { difficulty: 5, enjoyment: 5, recovery: 5 }
      }
    };
    const result = calculateSportXP(data, null, null, { programs: [customProgram] });
    expect(result.breakdown.stretches).toBe(1);
    // moyenne 5/10 → ~189 XP (entre 100 à 1/10 et 300 à 10/10)
    expect(result.breakdown.stretchesXp).toBeGreaterThanOrEqual(180);
    expect(result.breakdown.stretchesXp).toBeLessThanOrEqual(195);
  });
});
