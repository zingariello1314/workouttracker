import { describe, it, expect } from 'vitest';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import { computeFitnessForGeneration, FITNESS_THRESHOLD_AUTO } from './exerciseGenerationFitness';
import { buildTemplateFromDbEntry } from './quizExerciseBankBridge';

describe('exerciseGenerationFitness', () => {
  it('templates legacy ont un score élevé', () => {
    const fit = computeFitnessForGeneration('pompes', exerciseDatabase.pompes);
    expect(fit.score).toBeGreaterThanOrEqual(FITNESS_THRESHOLD_AUTO);
    expect(fit.eligible).toBe(true);
  });

  it('buildTemplateFromDbEntry produit un template pour pompes', () => {
    const t = buildTemplateFromDbEntry('pompes', exerciseDatabase.pompes);
    expect(t?.dbKey).toBe('pompes');
    expect(t?.group).toBe('upper');
    expect(t?.quizEquipment).toContain('bodyweight');
  });
});
