import { describe, it, expect } from 'vitest';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import { stretchDatabase } from '../../data/stretchDatabase';
import { QUIZ_LEGACY_EXERCISE_TEMPLATES } from './quizExerciseTemplates';
import { getMergedQuizExerciseTemplates, countExerciseDatabaseKeys } from './quizExercisePool';
import { auditExerciseBank, auditStretchBank } from './exerciseBankAudit';
import { computeFitnessForGeneration } from './exerciseGenerationFitness';

describe('exerciseBankAudit — préservation banques', () => {
  it('conserve toutes les clés exerciseDatabase (aucune suppression)', () => {
    expect(countExerciseDatabaseKeys()).toBe(Object.keys(exerciseDatabase).length);
    expect(Object.keys(exerciseDatabase).length).toBeGreaterThan(200);
  });

  it('conserve tous les templates legacy dans le pool fusionné', () => {
    const merged = getMergedQuizExerciseTemplates({ forceRefresh: true });
    const mergedKeys = new Set(merged.map((t) => t.dbKey));
    QUIZ_LEGACY_EXERCISE_TEMPLATES.forEach((t) => {
      expect(mergedKeys.has(t.dbKey)).toBe(true);
      expect(merged.find((m) => m.dbKey === t.dbKey)?.source).toBe('legacy');
    });
  });

  it('élargit le pool au-delà des 22 templates sans perdre les legacy', () => {
    const merged = getMergedQuizExerciseTemplates({ forceRefresh: true });
    expect(merged.length).toBeGreaterThan(QUIZ_LEGACY_EXERCISE_TEMPLATES.length);
    expect(merged.filter((t) => t.source === 'bank').length).toBeGreaterThan(0);
  });

  it('audit stretch : aucune entrée stretchDatabase sans name/bodyZone', () => {
    const stretchAudit = auditStretchBank();
    expect(stretchAudit.missingMetadata).toEqual([]);
    expect(stretchAudit.stretchCount).toBe(Object.keys(stretchDatabase).length);
  });

  it('audit exos : legacy présents en base', () => {
    const report = auditExerciseBank();
    expect(report.legacy.missingInDatabase).toEqual([]);
    expect(report.exerciseCount).toBe(Object.keys(exerciseDatabase).length);
    expect(report.mergedPoolSize).toBeGreaterThanOrEqual(QUIZ_LEGACY_EXERCISE_TEMPLATES.length);
  });

  it('chaque clé banque a un score fitness calculable', () => {
    Object.entries(exerciseDatabase).forEach(([key, entry]) => {
      const { score } = computeFitnessForGeneration(key, entry);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
