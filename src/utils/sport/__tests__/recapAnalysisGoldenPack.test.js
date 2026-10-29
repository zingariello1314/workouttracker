/**
 * Golden pack — qualité analytique (R1 / R3), pas seulement anti-phrases.
 * Chaque scénario vérifie : constat, relations, comparaison, conclusion,
 * conséquence utilisateur, cohérence temporelle, anti-redondance / anti-dérobade.
 */
import { describe, expect, it } from 'vitest';
import {
  buildVolumeDecompFinding,
  buildAdherenceDowFinding,
  buildBodyWeightParallelFinding,
  buildGtgRepereCoevoFinding,
  findingDepthLevel,
  proseFromFinding
} from '../recapAnalyticalFindings';
import {
  assertFindingDepth,
  assertAnalyticalDepthPositive,
  hasDeferredReasoningPhrase
} from '../recapAnalysisDepthAssert';
import {
  buildSelectionDiagnostics,
  familiesStarvedDespiteProduction,
  boostUnderrepresentedFamilies,
  rescueStarvedFamilySlots
} from '../recapSelectionDiagnostics';

function expectDeepFinding(finding, { minLevel = 2, relations = [] } = {}) {
  expect(finding).toBeTruthy();
  const depth = assertFindingDepth(finding, minLevel);
  expect(depth.ok, JSON.stringify(depth)).toBe(true);
  expect(findingDepthLevel(finding)).toBeGreaterThanOrEqual(minLevel);
  const prose = proseFromFinding(finding);
  expect(hasDeferredReasoningPhrase(prose)).toBe(false);
  expect(assertAnalyticalDepthPositive(prose).ok).toBe(true);
  expect(assertAnalyticalDepthPositive(prose).hasImplication || minLevel < 3).toBe(true);
  relations.forEach((id) => expect(finding.relationIds || []).toContain(id));
  // Anti-redondance grossière : statement ≠ interpretation
  if (finding.interpretation) {
    expect(finding.interpretation.trim()).not.toBe(finding.statement.trim());
  }
  return prose;
}

describe('golden pack — volume C1×C2 (profondeur)', () => {
  it('avant (niveau 1) vs après (niveau ≥2 avec perf stable)', () => {
    const shallow = 'Le volume de répétitions a augmenté de 18 %.';
    expect(assertAnalyticalDepthPositive(shallow).ok).toBe(false);

    const f = buildVolumeDecompFinding({
      window: { start: '2026-09-01', end: '2026-09-30' },
      currentReps: 2360,
      previousReps: 2000,
      currentSessions: 12,
      previousSessions: 8,
      currentLen: 30,
      previousLen: 30,
      perfMomentumPct: 2,
      goal: 'muscular_defined'
    });
    const prose = expectDeepFinding(f, { minLevel: 3, relations: ['C1', 'C2'] });
    expect(f.metrics.driver).toBe('frequency');
    expect(prose).toMatch(/fréquence/i);
    expect(prose).toMatch(/stable/i);
    expect(prose).toMatch(/pas (encore )?une hausse de charge|présence|jours de travail/i);
    // Documente l’avant/après attendu
    expect(prose.length).toBeGreaterThan(shallow.length * 2);
  });
});

describe('golden pack — assiduité DOW C5', () => {
  it('conclut un trou local (mercredi) vs jours forts, avec groupes', () => {
    const f = buildAdherenceDowFinding({
      window: { start: '2026-09-01', end: '2026-09-30' },
      dayOfWeek: [
        { dow: 1, label: 'Lun', plannedDays: 4, avgCompletionPct: 88 },
        { dow: 3, label: 'Mer', plannedDays: 4, avgCompletionPct: 52 },
        { dow: 5, label: 'Ven', plannedDays: 4, avgCompletionPct: 90 }
      ],
      leastCheckedNames: ['Tractions'],
      weakDayMuscleLabels: ['dos', 'biceps'],
      strongDayMuscleLabels: ['pectoraux', 'triceps'],
      goal: 'street_skills'
    });
    const prose = expectDeepFinding(f, { minLevel: 3, relations: ['C5'] });
    expect(prose).toMatch(/Mer/i);
    expect(prose).toMatch(/Lun|Ven/i);
    expect(prose).toMatch(/dos|tirage|Tractions/i);
    expect(prose).not.toMatch(/il faudra examiner/i);
    // Conséquence concrète : prioriser le jour faible, pas ajouter du volume ailleurs
    expect(prose).toMatch(/sous-exécut|Mer|tirage|street/i);
  });
});

describe('golden pack — corps C10 sans causalité', () => {
  it('observe le parallèle poids×volume sans affirmer de cause', () => {
    const f = buildBodyWeightParallelFinding({
      window: { start: '2026-09-01', end: '2026-09-30' },
      startKg: 78.2,
      endKg: 76.5,
      deltaKg: -1.7,
      nWeightPoints: 4,
      volumeDeltaPct: 12,
      sessionsCurrent: 10,
      heightM: 1.78
    });
    const prose = expectDeepFinding(f, { minLevel: 2, relations: ['C10', 'C11'] });
    expect(prose).toMatch(/baissé|1[,.]7/i);
    expect(prose).toMatch(/pas une preuve|sans lien causal|pas.*caus/i);
    expect(f.forbidden.some((x) => /caus/i.test(x))).toBe(true);
  });
});

describe('golden pack — GTG×repère C4', () => {
  it('co-évolution hypothétique, jamais causale', () => {
    const f = buildGtgRepereCoevoFinding({
      window: { start: '2026-09-01', end: '2026-09-30' },
      exerciseLabel: 'Tractions',
      adHocDays: 5,
      adHocReps: 40,
      maxBefore: 8,
      maxAfter: 10,
      maxTouched: true
    });
    const prose = expectDeepFinding(f, { minLevel: 2, relations: ['C4'] });
    expect(f.epistemic).toBe('hypothesis');
    expect(prose).toMatch(/coexistent|coïncidence|pas une preuve/i);
    expect(prose).not.toMatch(/a causé|grâce au GTG/i);
  });
});

describe('golden pack — sélection R4 (pas d’élimination systématique)', () => {
  it('boost + rescue empêche adherence starved si candidat valide', () => {
    const pool = [
      {
        id: 'a',
        kind: 'volume_traj',
        horizon: 'short',
        weight: 90,
        text: 'volume'
      },
      {
        id: 'b',
        kind: 'performance',
        horizon: 'short',
        weight: 88,
        text: 'perf'
      },
      {
        id: 'c',
        kind: 'adherence_dow',
        horizon: 'short',
        weight: 55,
        text: 'Lun tient mieux que Mer avec écart de complétion et groupes dos.'
      }
    ];
    const boosted = boostUnderrepresentedFamilies(pool);
    expect(boosted.find((c) => c.id === 'c').weight).toBeGreaterThan(55);

    const shownFirst = [pool[0], pool[1]];
    const diag = buildSelectionDiagnostics({
      produced: pool,
      rankedOut: [pool[2]],
      shown: shownFirst
    });
    expect(familiesStarvedDespiteProduction(diag).some((s) => s.family === 'adherence')).toBe(
      true
    );

    const rescued = rescueStarvedFamilySlots(
      { short: shownFirst, medium: [], long: [] },
      pool,
      { short: 2, medium: 2, long: 2 },
      diag
    );
    expect(rescued.rescued.some((r) => r.family === 'adherence')).toBe(true);
    expect(rescued.short.some((c) => c.kind === 'adherence_dow')).toBe(true);
  });
});
