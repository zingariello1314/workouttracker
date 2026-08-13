import { describe, it, expect } from 'vitest';
import {
  resolveExerciseScoring,
  resolveCatalogIntensityCoeff,
  resolveCatalogDifficultyStars
} from '../exerciseScoringResolver';
import { ALL_SCORING_ENTRIES } from '../../data/exerciseScoring/index';

describe('exerciseScoringResolver', () => {
  it('résout Pompes depuis le nom', () => {
    const s = resolveExerciseScoring({ name: 'Pompes' });
    expect(s).not.toBeNull();
    expect(s.difficultyStars).toBe(2);
    expect(s.intensityCoeff).toBe(1);
    expect(s.unit).toBe('reps');
    expect(s.scoringType).toBe('dynamic');
  });

  it('résout Pompes archer comme variante distincte', () => {
    const s = resolveExerciseScoring({ name: 'Pompes archer' });
    expect(s?.difficultyStars).toBe(5);
    expect(s?.intensityCoeff).toBe(1.55);
  });

  it('résout Gainage en isométrique secondes', () => {
    const s = resolveExerciseScoring({ name: 'Gainage' });
    expect(s?.unit).toBe('seconds');
    expect(s?.scoringType).toBe('isometric');
    expect(s?.intensityCoeff).toBe(0.95);
  });

  it('résout Gainage dynamique en reps', () => {
    const s = resolveExerciseScoring({ name: 'Gainage dynamique' });
    expect(s?.unit).toBe('reps');
    expect(s?.scoringType).toBe('dynamic');
  });

  it('résout niveau 8 avec couronne (muscle-up strict)', () => {
    expect(resolveCatalogDifficultyStars({ name: 'Muscle up strict' })).toBe(7);
    expect(resolveCatalogIntensityCoeff({ name: 'Traction un bras négative' })).toBe(2.3);
    expect(resolveCatalogDifficultyStars({ name: 'Traction un bras négative' })).toBe(8);
  });

  it('catalogue musculation couvre au moins 350 exercices', () => {
    expect(ALL_SCORING_ENTRIES.length).toBeGreaterThanOrEqual(350);
  });

  it('résout les ajouts prioritaires (tractions neutres, dead hang, power clean)', () => {
    const neutral = resolveExerciseScoring({ name: 'Tractions prise neutre' });
    expect(neutral?.difficultyStars).toBe(4);
    expect(neutral?.intensityCoeff).toBe(1.3);

    const hang = resolveExerciseScoring({ name: 'Dead hang' });
    expect(hang?.unit).toBe('seconds');
    expect(hang?.scoringType).toBe('isometric');
    expect(hang?.difficultyStars).toBe(3);

    const clean = resolveExerciseScoring({ name: 'Power clean' });
    expect(clean?.difficultyStars).toBe(7);
    expect(clean?.intensityCoeff).toBe(1.6);
  });
});
