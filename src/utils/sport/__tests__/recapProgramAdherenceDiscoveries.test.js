import { describe, expect, it } from 'vitest';
import {
  buildAdherenceFindingsFromMatrix,
  buildFrequencyProgressFindings,
  buildProgramAdherenceDiscoveries,
  composeProgramAdherenceDiscoveries,
  resolveExerciseIdentityLinks
} from '../recapProgramAdherenceDiscoveries.js';
import { buildPlanRealizationMatrix } from '../recapProgramAdherenceProgression.js';
import {
  buildDayPlanSnapshotFromExercises,
  withDayPlanSnapshot
} from '../../calendarDayPlanSnapshot.js';
import { claimFromCandidate } from '../recapNarrativeClaims.js';
import { natureForKind } from '../recapInsightNature.js';
import { filterValidInsights } from '../recapInsightValidate.js';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries.js';

const W = { start: '2026-10-01', end: '2026-10-30' };

function snapDay(data, dateStr, exercises, programId = 'prog1') {
  return withDayPlanSnapshot(
    data,
    dateStr,
    buildDayPlanSnapshotFromExercises({ dateStr, exercises, programId })
  );
}

function seedChecked(data, dateStr, ids, reps = '30') {
  const next = {
    ...data,
    checkedExercises: { ...(data.checkedExercises || {}) },
    reps: { ...(data.reps || {}) }
  };
  for (const id of ids) {
    next.checkedExercises[`${dateStr}_${id}`] = true;
    next.reps[`${dateStr}_${id}`] = reps;
  }
  return next;
}

const EX = [
  { id: 101, originalId: 'exo_a', name: 'Tractions', series: '4×5' },
  { id: 104, originalId: 'exo_p', name: 'Pompes', series: '4×15' },
  { id: 103, originalId: 'exo_d', name: 'Dips', series: '4×8' }
];

describe('resolveExerciseIdentityLinks', () => {
  it('mappe pullups → 101 avec confiance certain', () => {
    const link = resolveExerciseIdentityLinks({ gtgId: 'pullups' });
    expect(link.confidence).toBe('certain');
    expect(link.storageIds).toContain('101');
  });

  it('id GTG inconnu sans catalogue → uncertain / fallback', () => {
    const link = resolveExerciseIdentityLinks({ gtgId: 'unknown_move_xyz' });
    expect(['uncertain', 'probable']).toContain(link.confidence);
    expect(link.reasons.some((r) => /unmapped|fallback|failed|canonical/i.test(r))).toBe(true);
  });

  it('ids classiques seuls → certain', () => {
    const link = resolveExerciseIdentityLinks({ storageId: 501, originalId: 'custom_a' });
    expect(link.confidence).toBe('certain');
    expect(link.storageIds).toEqual(expect.arrayContaining(['501', 'custom_a']));
  });
});

describe('axe A — adhérence (fixtures snapshot)', () => {
  it('snapshots insuffisants → finding impossible, pas de taux', () => {
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    data = seedChecked(data, '2026-10-01', [101, 104]);
    data = snapDay(data, '2026-10-01', EX);
    const matrix = buildPlanRealizationMatrix({ workoutData: data, window: W });
    const pack = buildAdherenceFindingsFromMatrix(matrix);
    expect(pack.findings.some((f) => f.kind === 'plan_data_insufficient')).toBe(true);
    expect(pack.findings.some((f) => f.kind === 'plan_follow_rate')).toBe(false);
  });

  it('adhérence initiale vs ajustée avec suppressions', () => {
    const dates = ['2026-10-01', '2026-10-03', '2026-10-06', '2026-10-08'];
    let data = {
      checkedExercises: {},
      reps: {},
      dailyVariations: {},
      calendarDayPlanSnapshots: {}
    };
    for (const d of dates) {
      data = seedChecked(data, d, [101, 104]); // dips non faits
      data = snapDay(data, d, EX);
      if (d === '2026-10-08') {
        data = {
          ...data,
          dailyVariations: {
            ...data.dailyVariations,
            [d]: { suppressedExercises: [103], additionalExercises: [] }
          }
        };
        // re-snap after variation? suppression is dailyVariations; matrix reads it
      }
    }
    // Ensure suppression day still has snapshot
    data = snapDay(data, '2026-10-08', EX);

    const cards = buildProgramAdherenceDiscoveries({
      snapshot: data,
      window: { start: '2026-10-01', end: '2026-10-10' }
    });
    const rate = cards.find((c) => c.kind === 'disc_plan_follow_rate');
    expect(rate).toBeTruthy();
    expect(rate.metrics.adjustedPlannedSlots).toBeLessThan(rate.metrics.initialPlannedSlots);
    expect(rate.metrics.suppressedSlots).toBeGreaterThanOrEqual(1);
    expect(rate.body).not.toMatch(/oubli|abandon/i);
    expect(rate.body).toMatch(/ajusté|figé/i);
  });

  it('écart récurrent non réalisé — sans mot oublié/abandonné', () => {
    const dates = ['2026-10-01', '2026-10-03', '2026-10-06', '2026-10-08', '2026-10-10'];
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    for (const d of dates) {
      data = seedChecked(data, d, [101, 104]); // 103 never
      data = snapDay(data, d, EX);
    }
    const cards = buildProgramAdherenceDiscoveries({
      snapshot: data,
      window: { start: '2026-10-01', end: '2026-10-12' }
    });
    const skip = cards.find((c) => c.kind === 'disc_plan_recurring_skip');
    expect(skip).toBeTruthy();
    expect(skip.title + skip.body).toMatch(/Dips/);
    expect(skip.title + skip.body).not.toMatch(/\boubli|\babandon/i);
  });

  it('reconstruct sans plan → data insufficient, pas de taux inventé', () => {
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) {
      data = seedChecked(data, d, [101]);
    }
    const cards = buildProgramAdherenceDiscoveries({ snapshot: data, window: W });
    expect(cards.some((c) => c.kind === 'disc_plan_data_insufficient')).toBe(true);
    expect(cards.some((c) => c.kind === 'disc_plan_follow_rate')).toBe(false);
  });
});

describe('axe B — fréquence × progression', () => {
  it('progression avec fréquence élevée vs faible (fixtures trajectoire)', () => {
    // High freq rising: many sessions increasing reps
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    const highDates = [];
    for (let i = 1; i <= 12; i++) {
      const d = `2026-10-${String(i).padStart(2, '0')}`;
      highDates.push(d);
      const reps = String(20 + i * 2);
      data = seedChecked(data, d, [101], reps);
    }
    // Low freq rising: few sessions but clear rise
    data = seedChecked(data, '2026-10-02', [104], '20');
    data = seedChecked(data, '2026-10-16', [104], '28');
    data = seedChecked(data, '2026-10-28', [104], '36');

    const pack = buildFrequencyProgressFindings({
      snapshot: data,
      window: W,
      getExerciseNameById: (id) => (String(id) === '101' ? 'Tractions' : String(id) === '104' ? 'Pompes' : `Ex ${id}`)
    });
    const kinds = pack.findings.map((f) => f.kind);
    // At least one progress-related finding when trajectories ok
    const meaningful = pack.findings.filter((f) =>
      ['freq_progress_high', 'freq_progress_low', 'freq_high_no_progress', 'freq_decline_with_low_exposure'].includes(
        f.kind
      )
    );
    expect(meaningful.length).toBeGreaterThanOrEqual(1);
    expect(kinds.includes('freq_progress_unevaluable') || meaningful.length >= 1).toBe(true);
  });

  it('distingue jours exposition, séances classiques et volume dans les metrics', () => {
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    for (const d of ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22']) {
      data = seedChecked(data, d, [101], '40');
    }
    const pack = buildFrequencyProgressFindings({
      snapshot: data,
      window: W,
      getExerciseNameById: () => 'Tractions'
    });
    const row = pack.exerciseRows.find((r) => r.exerciseId === '101');
    expect(row).toBeTruthy();
    expect(row.classicSessionCount).toBe(4);
    expect(row.exposureDayCount).toBe(4);
    expect(row.volumeReps).toBe(160);
    expect(row.sessionsPerWeek).toBeGreaterThan(0);
  });
});

describe('rédaction, claims, validation, coexistence', () => {
  it('claims topics programme.* distincts de exercice.fenetre', () => {
    const claim = claimFromCandidate({
      id: 'disc_plan_follow_rate',
      kind: 'disc_plan_follow_rate',
      interpretation: { context: { kind: 'disc_plan_follow_rate' } },
      nature: 'trajectory',
      metrics: { adjustedRateFull: 0.5 }
    });
    expect(claim.topic).toBe('programme.adherence');
    const freq = claimFromCandidate({
      id: 'disc_freq_progress_low',
      kind: 'disc_freq_progress_low',
      interpretation: { context: { kind: 'disc_freq_progress_low' } },
      nature: 'trajectory',
      metrics: { exerciseId: '101', name: 'Tractions', exposureDayCount: 3, primaryStory: 'net_rise' }
    });
    expect(freq.topic).toBe('programme.freq_progress');
  });

  it('natures trajectory pour kinds P3.1', () => {
    expect(natureForKind('disc_plan_data_insufficient')).toBe('trajectory');
    expect(natureForKind('disc_freq_progress_low')).toBe('trajectory');
  });

  it('pas d’id technique dans les textes validés', () => {
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    for (const d of ['2026-10-01', '2026-10-03', '2026-10-06', '2026-10-08']) {
      data = seedChecked(data, d, [101]);
      data = snapDay(data, d, [EX[0], EX[1]]);
    }
    const cards = buildProgramAdherenceDiscoveries({
      snapshot: data,
      window: { start: '2026-10-01', end: '2026-10-10' },
      getExerciseNameById: (id) => (String(id) === '101' ? 'Tractions' : 'Pompes')
    });
    const validated = filterValidInsights(cards, { voiceKey: 'month' });
    for (const c of validated) {
      expect(c.title + c.body).not.toMatch(/\[\s*id\s+/i);
      expect(c.title + c.body).not.toMatch(/\braw_exercise_id\b/);
    }
  });

  it('coexiste avec disc_exercise_progress dans le bundle (kinds distincts)', () => {
    let data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    // Enough volume for period discoveries + progress
    for (let i = 1; i <= 20; i++) {
      const d = `2026-10-${String(((i % 28) + 1)).padStart(2, '0')}`;
      data = seedChecked(data, d, [101, 104], String(25 + i));
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot: data,
      window: W,
      period: '30d',
      getExerciseNameById: (id) => (String(id) === '101' ? 'Tractions' : 'Pompes')
    });
    const allKinds = new Set((bundle.all || []).map((d) => d.kind));
    // Sur fenêtre sans snapshot : au minimum data_insufficient produit
    expect(allKinds.has('disc_plan_data_insufficient')).toBe(true);
    // Pas de collision de kind avec progress
    expect(allKinds.has('disc_plan_follow_rate')).toBe(false);
  });
});

describe('compose — prose structurée', () => {
  it('annonce constat + chiffres + limite', () => {
    const cards = composeProgramAdherenceDiscoveries(
      {
        findings: [
          {
            kind: 'plan_data_insufficient',
            metrics: { snapshotDayCount: 0, reconstructDayCount: 15, minRequired: 3 }
          }
        ]
      },
      { findings: [] }
    );
    expect(cards[0].body).toMatch(/aucun jour|plan figé|snapshot/i);
    expect(cards[0].body).toMatch(/taux|adhérence/i);
    expect(cards[0].contentClass).toBe('methodology_limit');
    expect(cards[0].weights.importance).toBeLessThan(0.5);
  });

  it('cite early/late et volume sans affirmer de cause', () => {
    const cards = composeProgramAdherenceDiscoveries(
      { findings: [] },
      {
        findings: [
          {
            kind: 'freq_decline_with_low_exposure',
            metrics: {
              exerciseId: '202',
              name: 'Pompes inclinées sur support',
              exposureDayCount: 3,
              classicSessionCount: 3,
              gtgExposureDays: 0,
              volumeReps: 120,
              sessionsPerWeek: 0.7,
              freqBand: 'low',
              primaryStory: 'net_decline',
              earlyMean: 52,
              lateMean: 40,
              interpretingWithHistory: true,
              plannedFreqUsable: false,
              trajectoryOk: true
            }
          }
        ]
      }
    );
    expect(cards[0].body).toMatch(/120/);
    expect(cards[0].body).toMatch(/52/);
    expect(cards[0].body).toMatch(/40/);
    expect(cards[0].body).toMatch(/aucune relation causale/i);
    expect(cards[0].body).not.toMatch(/parce que la fréquence/i);
  });
});
