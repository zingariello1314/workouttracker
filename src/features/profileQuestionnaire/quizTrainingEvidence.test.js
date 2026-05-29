import { describe, it, expect } from 'vitest';
import {
  buildTrainingEvidence,
  resolveEvidenceMaturity,
  applyTrainingEvidenceToDeformers,
  FORCE_BLOCK_WEEKS_THRESHOLD
} from './quizTrainingEvidence';
import { computeGlobalLoadState } from './quizGlobalLoadEngine';

describe('quizTrainingEvidence', () => {
  it('maturité none sans historique', () => {
    expect(resolveEvidenceMaturity({ activeDays28: 0, tenureDays: 0, lifetimeReps: 0 })).toBe('none');
    const ev = buildTrainingEvidence({ snapshot: {}, answers: { goalPhysique: 'muscular_defined' } });
    expect(ev.maturity).toBe('none');
    expect(ev.whyLines.some((l) => l.includes('Premier cycle'))).toBe(true);
  });

  it('pivot volume après bloc force si objectif hypertrophie', () => {
    const programStart = new Date();
    programStart.setDate(programStart.getDate() - FORCE_BLOCK_WEEKS_THRESHOLD * 7 - 3);
    const ymd = `${programStart.getFullYear()}-${String(programStart.getMonth() + 1).padStart(2, '0')}-${String(programStart.getDate()).padStart(2, '0')}`;
    const reps = {};
    const checked = {};
    for (let i = 0; i < 12; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const key = `${ds}_101`;
      reps[key] = 6;
      checked[key] = true;
    }
    const ev = buildTrainingEvidence({
      snapshot: { reps, checkedExercises: checked, trainingPrefs: { journeyStartYmd: ymd } },
      answers: { goalPhysique: 'muscular_defined', availableTrainingDays: ['lundi', 'mercredi', 'vendredi'] },
      activeProgram: {
        startDate: programStart.toISOString(),
        schedule: {
          lundi: {
            active: true,
            exercises: [{ series: '4×5' }, { series: '3×5' }]
          }
        },
        quizGenerationMeta: { generationMode: 'performance_hybrid' }
      }
    });
    expect(ev.maturity).toBe('rich');
    expect(ev.forceBlockWeeks).toBe(true);
    const load = computeGlobalLoadState({
      archetypeId: 'hybrid_street_home_dense',
      constraints: { recoveryScore: 70 },
      trainingEvidence: ev
    });
    expect(load.globalLoadFactor).toBeGreaterThan(1);
    const d = applyTrainingEvidenceToDeformers({ volumeMul: 1, maxExercisesPerSession: 7, preferredGroupWeights: {} }, ev);
    expect(d.repRangeOverride).toBeTruthy();
  });

  it('n’altère pas les deformers en maturité none', () => {
    const base = { volumeMul: 1, maxExercisesPerSession: 7, preferredGroupWeights: {} };
    const ev = buildTrainingEvidence({ snapshot: {}, answers: {} });
    expect(applyTrainingEvidenceToDeformers(base, ev).volumeMul).toBe(1);
  });
});
