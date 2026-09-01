import { describe, expect, it } from 'vitest';
import {
  classifyStimulus,
  detectFamilyFades,
  detectStructuralShifts,
  familyOfExercise,
  tallyStimulus
} from '../recapStimulusCatalog';

describe('recapStimulusCatalog', () => {
  it('sépare force, endurance, isolation et lesté', () => {
    expect(classifyStimulus('Pompes endurance').endurance).toBe(true);
    expect(classifyStimulus('Dips parallèles').compound).toBe(true);
    expect(classifyStimulus('Dips parallèles').bodyweight).toBe(true);
    expect(classifyStimulus('Extensions triceps').isolation).toBe(true);
    expect(classifyStimulus('Développé militaire').weighted).toBe(true);
    expect(familyOfExercise('501', 'Dips parallèles')).toBe('poussée');
    expect(familyOfExercise('502', 'Tractions australiennes')).toBe('tirage');
  });

  it('détecte un mouvement qui devient structurel dans sa famille', () => {
    const now = {
      exercises: [
        { id: '501', name: 'Dips parallèles', reps: 144, days: 3 },
        { id: '504', name: 'Pompes', reps: 80, days: 3 }
      ],
      byExercise: {
        501: { id: '501', name: 'Dips parallèles', reps: 144, days: 3 }
      }
    };
    const then = {
      exercises: [
        { id: '501', name: 'Dips parallèles', reps: 16, days: 1 },
        { id: '504', name: 'Pompes', reps: 400, days: 8 }
      ],
      byExercise: {
        501: { id: '501', name: 'Dips parallèles', reps: 16, days: 1 }
      }
    };
    const rows = detectStructuralShifts(now, then);
    expect(rows[0].name).toMatch(/dips/i);
    expect(rows[0].family).toBe('poussée');
    expect(rows[0].nowShare).toBeGreaterThan(50);
    expect(rows[0].thenShare).toBeLessThan(10);
  });

  it('agrège le mix de stimulus d’une fenêtre', () => {
    const t = tallyStimulus({
      exercises: [
        { id: '1', name: 'Pompes endurance', reps: 200 },
        { id: '2', name: 'Dips parallèles', reps: 100 },
        { id: '3', name: 'Extensions triceps', reps: 60 },
        { id: '4', name: 'Développé militaire', reps: 40 }
      ]
    });
    expect(t.buckets.endurance).toBe(200);
    expect(t.buckets.isolation).toBe(60);
    expect(t.buckets.weighted).toBe(40);
    expect(t.buckets.total).toBe(400);
    expect(classifyStimulus('Tractions australiennes').horizontal).toBe(true);
    expect(classifyStimulus('Tractions pronation').vertical).toBe(true);
    expect(classifyStimulus('Fentes bulgares').unilateral).toBe(true);
    expect(classifyStimulus('Curl un bras').unilateral).toBe(true);
    expect(classifyStimulus('Pompes').unilateral).toBe(false);
  });

  it('détecte un mouvement qui s’efface d’une famille (18 % → 4 %)', () => {
    const then = {
      exercises: [
        { id: '501', name: 'Dips parallèles', reps: 180, days: 6 },
        { id: '504', name: 'Pompes', reps: 820, days: 10 }
      ]
    };
    const now = {
      exercises: [{ id: '504', name: 'Pompes', reps: 400, days: 6 }],
      byExercise: {
        501: { id: '501', name: 'Dips parallèles', reps: 16, days: 1 },
        504: { id: '504', name: 'Pompes', reps: 400, days: 6 }
      }
    };
    const rows = detectFamilyFades(now, then);
    expect(rows[0].name).toMatch(/dips/i);
    expect(rows[0].thenShare).toBeGreaterThan(15);
    expect(rows[0].nowShare).toBeLessThan(8);
  });
});
