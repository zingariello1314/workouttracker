import { describe, expect, it } from 'vitest';
import { analysisEditionKey } from '../analysisEdition';
import {
  exerciseWorkModality,
  classifyExerciseAxes,
  extractSessionTemplates,
  buildProgramSessionGraph
} from '../sessionStructureGraph';
import { matchSessionToProgramSlot } from '../sessionSlotMatching';
import { composeVolumeFrequencyContentReading } from '../phenomenonComposition';
import { polishCardProse } from '../editorialProseGuard';

describe('Mission 13 — causes racines', () => {
  it('édition v12 classification + matching', () => {
    const key = analysisEditionKey();
    expect(key).toMatch(/editorial=p6-sovereign-v\d+/);
    expect(key).toMatch(/classification=modality-authority-v1/);
    expect(key).toMatch(/matching=session-slot-v[12]/);
  });

  it('ne classe pas développé Arnold / couché incliné en cardio', () => {
    const cases = [
      { name: 'Développé Arnold', programCategory: 'cardio' },
      { name: 'Développé couché incliné aux haltères', programCategory: 'cardio', type: 'cardio' },
      { name: 'Développé couché incline aux halteres', category: 'cardio' },
      { name: 'Pompes déclinées', programCategory: 'street_workout' }
    ];
    cases.forEach((ex) => {
      expect(exerciseWorkModality(ex)).toBe('strength_reps');
      expect(classifyExerciseAxes(ex).modality).toBe('strength_reps');
    });
  });

  it('classe wall sit en isométrique et course en cardio', () => {
    expect(exerciseWorkModality({ name: 'Wall sit', series: '45s' })).toBe('isometric');
    expect(exerciseWorkModality({ name: 'Chaise au mur', series: '60 secondes' })).toBe('isometric');
    expect(exerciseWorkModality({ name: 'Course endurance fondamentale', series: '20 min' })).toBe(
      'cardio'
    );
    expect(exerciseWorkModality({ name: 'Course endurance fondamentale', programCategory: 'cardio' })).toBe(
      'cardio'
    );
  });

  it('cardioKeys du programme réel n’incluent plus les développés', () => {
    const program = {
      schedule: {
        monday: {
          name: 'A',
          exercises: [
            { name: 'Course endurance fondamentale', series: '25 min', programCategory: 'cardio' },
            { name: 'Pompes déclinées', series: '3x12' }
          ]
        },
        tuesday: {
          name: 'B',
          exercises: [
            { name: 'Développé couché incliné aux haltères', series: '4x10', programCategory: 'cardio' },
            { name: 'Wall sit', series: '45s' }
          ]
        },
        wednesday: {
          name: 'C',
          exercises: [
            { name: 'Développé Arnold', series: '3x10', programCategory: 'cardio' },
            { name: 'Gainage', series: '60s' }
          ]
        }
      }
    };
    const templates = extractSessionTemplates(program);
    const byDay = Object.fromEntries(templates.map((t) => [t.dayKey, t]));
    expect(byDay.monday.cardioKeys.join(' ')).toMatch(/course/);
    expect(byDay.tuesday.cardioKeys.join(' ')).not.toMatch(/developpe|arnold|couche/i);
    expect(byDay.wednesday.cardioKeys.join(' ')).not.toMatch(/arnold|developpe/i);
    expect(byDay.tuesday.modalities.isometric).toBeGreaterThanOrEqual(1);
    expect(byDay.wednesday.modalities.isometric).toBeGreaterThanOrEqual(1);
    expect(byDay.tuesday.strengthExerciseCount).toBeGreaterThanOrEqual(1);
    const graph = buildProgramSessionGraph(program);
    expect(graph.available).toBe(true);
    const familyProse = (graph.families || [])
      .map((f) => f.muscleProse || f.description || '')
      .join(' ');
    // Pas d’aérobie inventée sur une famille sans vraie course
    const tueFamily = graph.families?.find((f) => (f.members || []).includes('tuesday'));
    if (tueFamily?.modalities) {
      expect(tueFamily.modalities.cardio || 0).toBe(0);
    }
  });

  it('décomposition volume privilégie les journées de renforcement', () => {
    // 4281/12 vs 6044/17 ≈ 357 vs 356 (fréquence)
    const reading = composeVolumeFrequencyContentReading({
      repsBefore: 4281,
      repsAfter: 6044,
      daysBefore: 12,
      daysAfter: 17,
      labelBefore: 'période précédente',
      labelAfter: 'ces 30 jours'
    });
    expect(reading.coverage).toBe('concluded');
    expect(reading.conclusion).toMatch(/renforcement/);
    expect(Math.abs(reading.decomposition.repsPerSessionBefore - 357)).toBeLessThan(2);
    expect(Math.abs(reading.decomposition.repsPerSessionAfter - 356)).toBeLessThan(2);
    // Pas le piège calendrier 15/18 → ≈285/336
    expect(reading.decomposition.repsPerSessionAfter).toBeGreaterThan(300);
  });

  it('appariement créneau par composition, pas par jour de semaine', () => {
    const program = {
      schedule: {
        mon: {
          name: 'Push A',
          exercises: [
            { name: 'Pompes déclinées', series: '3x12' },
            { name: 'Pompes inclinées', series: '3x12' }
          ]
        },
        fri: {
          name: "Push A'",
          exercises: [{ name: 'Pompes déclinées', series: '5x10' }]
        }
      }
    };
    const realized = {
      date: '2026-11-18',
      exercises: [
        { name: 'Pompes déclinées', reps: 50 },
        { name: 'Pompes inclinées', reps: 36 }
      ]
    };
    const match = matchSessionToProgramSlot(realized, program);
    expect(['matched_proven', 'partial_session', 'matched_probable']).toContain(match.status);
    expect(match.primary?.sessionName || match.candidates?.[0]?.sessionName).toMatch(/Push A/);
  });

  it('polish et déni causal sommeil', () => {
    const polished = polishCardProse({
      title: 'Architecture',
      body: 'REM et éveil covarient aussi, sans preuve que l’architecture soit la cause.',
      evidence: ''
    });
    expect(polished.body).toMatch(/sans preuve/i);
  });

  it('registre de faits atomiques : même clé → même valeur', async () => {
    const { createAtomicFactRegistry, makeAtomicFact, FACT_POPULATION } = await import(
      '../atomicFactRegistry'
    );
    const reg = createAtomicFactRegistry();
    const a = makeAtomicFact({
      subject: 'hyperextension',
      canonicalId: 'ex:hyperextension',
      population: FACT_POPULATION.LAST_30D,
      windowStart: '2026-10-22',
      windowEnd: '2026-11-20',
      numerator: 336,
      value: 336,
      unit: 'reps',
      method: 'sum_checked_reps'
    });
    expect(reg.register(a).status).toBe('inserted');
    expect(reg.register({ ...a }).status).toBe('reuse');
    expect(
      reg.register({ ...a, value: 400 }).status
    ).toBe('contradiction');
    expect(reg.contradictions()).toHaveLength(1);
  });

  it('équivalence sémantique : même pic de journée', async () => {
    const { substantiveEquivalence } = await import('../discoveryIdentity');
    const left = {
      kind: 'disc_th_concentration',
      title: 'Le 18 novembre porte une grande part de la semaine',
      metrics: { peakDate: '2026-11-18', sharePct: 42, totalReps: 900 }
    };
    const right = {
      kind: 'disc_span_volume',
      title: 'La séance du 18 novembre concentre une part importante de la semaine',
      metrics: { peakDate: '2026-11-18', sharePct: 40, totalReps: 900 }
    };
    const eq = substantiveEquivalence(left, right);
    expect(eq.equivalent).toBe(true);
    expect(['same_semantic_phenomenon', 'same_peak_concentration_day']).toContain(eq.reason);
  });
});
