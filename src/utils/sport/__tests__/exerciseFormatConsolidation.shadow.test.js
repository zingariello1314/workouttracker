import { describe, expect, it } from 'vitest';
import { buildExerciseTrajectory } from '../exerciseTrajectoryAnalysis';
import {
  CONSOLIDATION_STATE,
  replayFormatConsolidationEditions,
  runExerciseFormatConsolidationShadow
} from '../exerciseFormatConsolidation';
import { MEMORY_TRANSITION } from '../editorialLedgerContract';

function snapshot(rows, extra = {}) {
  const reps = {};
  const checkedExercises = {};
  for (const [date, id, total] of rows) {
    const key = `${date}_${id}`;
    reps[key] = String(total);
    checkedExercises[key] = true;
  }
  return {
    reps,
    checkedExercises,
    exerciseSetLogs: extra.logs || {},
    exerciseWeights: extra.weights || {}
  };
}

const names = (id) =>
  ({
    tirage: 'Tirage horizontal',
    squat: 'Squat gobelet',
    homA: 'Élévation latérale',
    homB: 'Élévation latérale'
  })[id] || id;

describe('shadow — consolidation de format, corpus indépendant', () => {
  const window = { start: '2026-01-01', end: '2026-03-15' };

  it('reconnaît un niveau répété après une phase irrégulière et une interruption', () => {
    const data = snapshot([
      ['2026-01-05', 'tirage', 28],
      ['2026-01-12', 'tirage', 18],
      ['2026-01-19', 'tirage', 34],
      ['2026-01-26', 'tirage', 34],
      ['2026-02-02', 'tirage', 33],
      ['2026-03-10', 'tirage', 34]
    ]);
    const old = buildExerciseTrajectory({
      snapshot: data,
      exerciseId: 'tirage',
      exerciseName: 'Tirage horizontal',
      window
    });
    const shadow = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window,
      period: '3m',
      getExerciseNameById: names
    });
    const row = shadow.phenomena.find((p) => p.exerciseId === 'tirage');
    expect(row.state).toBe(CONSOLIDATION_STATE.RESUMED_LEVEL);
    expect(row.level).toBe(34);
    expect(row.gap.days).toBeGreaterThanOrEqual(21);
    expect(row.prose).toMatch(/Tirage horizontal/);
    expect(row.prose).toMatch(/34/);
    expect(row.prose).toMatch(/pas une performance isolée/);
    expect(row.formulation).toBe(row.prose);
    expect(row.interpretation).toBe(row.state);
    expect(Array.isArray(row.fact)).toBe(true);
    expect(old.shape.kind).not.toBe(CONSOLIDATION_STATE.RESUMED_LEVEL);
    expect(shadow.replacesVisibleEngine).toBe(false);
    expect(shadow.ms).toBeLessThan(2000);
  });

  it('refuse un record isolé, une forte variabilité, un historique court et un format différent', () => {
    const data = snapshot(
      [
        ['2026-01-05', 'solo', 20],
        ['2026-01-12', 'solo', 21],
        ['2026-01-19', 'solo', 20],
        ['2026-01-26', 'solo', 48],
        ['2026-01-05', 'bruit', 12],
        ['2026-01-12', 'bruit', 40],
        ['2026-01-19', 'bruit', 14],
        ['2026-01-26', 'bruit', 42],
        ['2026-02-01', 'rare', 20],
        ['2026-02-20', 'rare', 22],
        ['2026-02-01', 'fmt', 36],
        ['2026-02-08', 'fmt', 36],
        ['2026-02-15', 'fmt', 36],
        ['2026-02-22', 'fmt', 36]
      ],
      {
        logs: {
          '2026-02-01_fmt': { sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }] },
          '2026-02-08_fmt': { sets: [{ reps: 9 }, { reps: 9 }, { reps: 9 }, { reps: 9 }] },
          '2026-02-15_fmt': { sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }] },
          '2026-02-22_fmt': { sets: [{ reps: 9 }, { reps: 9 }, { reps: 9 }, { reps: 9 }] }
        }
      }
    );
    const shadow = runExerciseFormatConsolidationShadow({ snapshot: data, window, period: '30d' });
    const byId = Object.fromEntries(shadow.abstentions.map((a) => [a.exerciseId, a]));
    expect(byId.solo.state).toBe(CONSOLIDATION_STATE.ISOLATED_RECORD);
    expect(byId.bruit.state).toBe(CONSOLIDATION_STATE.HIGH_VARIABILITY);
    expect(byId.rare.state).toBe(CONSOLIDATION_STATE.INSUFFICIENT);
    expect(byId.fmt.state).toBe(CONSOLIDATION_STATE.FORMAT_SHIFT);
    expect(shadow.phenomena.find((p) => p.exerciseId === 'fmt')).toBeUndefined();
  });

  it('lit une hausse de charge à répétitions stables comme une transformation, pas comme une consolidation', () => {
    const data = snapshot(
      [
        ['2026-01-06', 'squat', 30],
        ['2026-01-13', 'squat', 30],
        ['2026-01-20', 'squat', 30],
        ['2026-01-27', 'squat', 30]
      ],
      {
        weights: {
          '2026-01-06_squat': '16',
          '2026-01-13_squat': '16',
          '2026-01-20_squat': '18',
          '2026-01-27_squat': '20'
        }
      }
    );
    const shadow = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window,
      period: '30d',
      getExerciseNameById: names
    });
    const row = shadow.phenomena.find((p) => p.exerciseId === 'squat');
    expect(row.state).toBe(CONSOLIDATION_STATE.LOAD_PROGRESSION);
    expect(row.prose).toMatch(/charge enregistrée/);
    expect(row.limits.join(' ')).toMatch(/aucune charge|charge/);
  });

  it('une septième séance identique confirme sans nouvelle carte prioritaire', () => {
    const rows = [
      ['2026-01-05', 'tirage', 20],
      ['2026-01-12', 'tirage', 34],
      ['2026-01-19', 'tirage', 34],
      ['2026-01-26', 'tirage', 34],
      ['2026-02-02', 'tirage', 34],
      ['2026-02-09', 'tirage', 34]
    ];
    const first = runExerciseFormatConsolidationShadow({
      snapshot: snapshot(rows),
      window,
      period: '3m',
      getExerciseNameById: names
    });
    const second = runExerciseFormatConsolidationShadow({
      snapshot: snapshot([...rows, ['2026-02-16', 'tirage', 34]]),
      window,
      period: '3m',
      getExerciseNameById: names,
      priorLedger: first.ledger
    });
    const row = second.phenomena.find((p) => p.exerciseId === 'tirage');
    expect(row.transition).toBe(MEMORY_TRANSITION.CONFIRMED);
    expect(row.newPriorityCard).toBe(false);
  });

  it('sépare deux exercices homonymes et n’invente pas de séance hors fenêtre', () => {
    const data = snapshot([
      ['2026-01-05', 'homA', 18],
      ['2026-01-12', 'homA', 24],
      ['2026-01-19', 'homA', 24],
      ['2026-01-26', 'homA', 24],
      ['2026-01-05', 'homB', 10],
      ['2026-01-12', 'homB', 10],
      ['2026-01-19', 'homB', 16],
      ['2026-01-26', 'homB', 16],
      ['2026-02-02', 'homB', 16]
    ]);
    const shadow = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window: { start: '2026-04-01', end: '2026-04-07' },
      period: '7d',
      getExerciseNameById: names
    });
    expect(shadow.phenomena).toHaveLength(0);
    expect(shadow.abstentions.every((a) => a.limits?.[0]?.includes('fenêtre'))).toBe(true);
    const inside = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window,
      period: '30d',
      getExerciseNameById: names
    });
    const ids = inside.phenomena.map((p) => p.phenomenonId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(inside.phenomena.map((p) => p.exerciseId).sort()).toEqual(['homA', 'homB']);
  });

  it('qualifie une progression initiale, un maintien et un recul sans les confondre', () => {
    const rise = runExerciseFormatConsolidationShadow({
      snapshot: snapshot([
        ['2026-01-05', 'montee', 12],
        ['2026-01-12', 'montee', 18],
        ['2026-01-19', 'montee', 24],
        ['2026-01-26', 'montee', 31]
      ]),
      window,
      period: '30d'
    });
    const held = runExerciseFormatConsolidationShadow({
      snapshot: snapshot([
        ['2026-01-05', 'tenu', 22],
        ['2026-01-12', 'tenu', 22],
        ['2026-01-19', 'tenu', 23],
        ['2026-01-26', 'tenu', 22]
      ]),
      window,
      period: '30d'
    });
    const drop = runExerciseFormatConsolidationShadow({
      snapshot: snapshot([
        ['2026-01-05', 'chute', 30],
        ['2026-01-12', 'chute', 30],
        ['2026-01-19', 'chute', 30],
        ['2026-01-26', 'chute', 14]
      ]),
      window,
      period: '30d'
    });
    expect(rise.abstentions.find((a) => a.exerciseId === 'montee').state).toBe(
      CONSOLIDATION_STATE.INITIAL_PROGRESSION
    );
    expect(held.phenomena.find((p) => p.exerciseId === 'tenu').state).toBe(
      CONSOLIDATION_STATE.MAINTAINED
    );
    expect(drop.phenomena.find((p) => p.exerciseId === 'chute').state).toBe(
      CONSOLIDATION_STATE.DECLINE
    );
  });

  it('change la question selon l’horizon quand la fenêtre contient une séance', () => {
    const data = snapshot([
      ['2026-01-05', 'tirage', 18],
      ['2026-01-12', 'tirage', 34],
      ['2026-01-19', 'tirage', 34],
      ['2026-01-26', 'tirage', 34],
      ['2026-03-10', 'tirage', 34]
    ]);
    const week = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window: { start: '2026-03-04', end: '2026-03-10' },
      period: '7d',
      getExerciseNameById: names
    });
    const halfYear = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window: { start: '2025-09-10', end: '2026-03-10' },
      period: '6m',
      getExerciseNameById: names
    });
    expect(week.phenomena[0].prose).toMatch(/ces 7 jours/);
    expect(halfYear.phenomena[0].prose).toMatch(/6 mois/);
    expect(week.phenomena[0].prose).not.toBe(halfYear.phenomena[0].prose);
    expect(week.phenomena[0].comparator.question).toMatch(/semaine/);
    expect(halfYear.phenomena[0].comparator.question).toMatch(/blocs/);
    expect(week.phenomena[0].comparator.question).not.toBe(halfYear.phenomena[0].comparator.question);
    expect(week.phenomena[0].claimEvidenceDates).toEqual(['2026-03-10']);
    expect(halfYear.phenomena[0].claimEvidenceDates).toContain('2026-01-26');
    expect(week.phenomena[0].comparator.maximizedPercent).toBe(false);
    expect(week.phenomena[0].timing || week.timing.trajectoryMs).toBeGreaterThanOrEqual(0);
    expect(week.timing.qualifyMs).toBeGreaterThanOrEqual(0);
    expect(week.persisted).toBe(false);
  });

  it('ne répète pas la même phrase sur un horizon sans ancrage', () => {
    const data = snapshot([
      ['2026-01-05', 'tirage', 18],
      ['2026-01-12', 'tirage', 34],
      ['2026-01-19', 'tirage', 34],
      ['2026-01-26', 'tirage', 34]
    ]);
    const month = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window,
      period: '30d',
      getExerciseNameById: names
    });
    const today = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window: { start: '2026-03-01', end: '2026-03-01' },
      period: 'today',
      getExerciseNameById: names
    });
    expect(month.phenomena[0].prose).toMatch(/30 jours/);
    expect(today.phenomena).toHaveLength(0);
  });

  it('refuse le même total quand le format de séries change, et une seule reproduction', () => {
    const formats = snapshot(
      [
        ['2026-04-01', 'gainage', 40],
        ['2026-04-08', 'gainage', 40],
        ['2026-04-15', 'gainage', 40],
        ['2026-04-22', 'gainage', 40]
      ],
      {
        logs: {
          '2026-04-01_gainage': { sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }, { reps: 10 }] },
          '2026-04-08_gainage': { sets: [{ reps: 20 }, { reps: 20 }] },
          '2026-04-15_gainage': { sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }, { reps: 10 }] },
          '2026-04-22_gainage': { sets: [{ reps: 20 }, { reps: 20 }] }
        }
      }
    );
    const once = snapshot([
      ['2026-04-01', 'presse', 22],
      ['2026-04-08', 'presse', 24],
      ['2026-04-15', 'presse', 40],
      ['2026-04-22', 'presse', 40]
    ]);
    const out = runExerciseFormatConsolidationShadow({
      snapshot: {
        reps: { ...formats.reps, ...once.reps },
        checkedExercises: { ...formats.checkedExercises, ...once.checkedExercises },
        exerciseSetLogs: formats.exerciseSetLogs
      },
      window: { start: '2026-04-01', end: '2026-04-30' },
      period: '30d'
    });
    expect(out.abstentions.find((a) => a.exerciseId === 'gainage').state).toBe(
      CONSOLIDATION_STATE.FORMAT_SHIFT
    );
    expect(out.abstentions.find((a) => a.exerciseId === 'presse').state).toBe(
      CONSOLIDATION_STATE.CONFIRMATION
    );
    expect(out.abstentions.find((a) => a.exerciseId === 'presse').comparator.forbiddenConclusions).toContain(
      'consolidation durable'
    );
  });

  it('fait évoluer la mémoire sur des éditions successives, sans carte nouvelle à la simple répétition', () => {
    const window = { start: '2026-01-01', end: '2026-05-01' };
    const base = [
      ['2026-01-06', 'mollet', 14],
      ['2026-01-13', 'mollet', 18]
    ];
    const frames = [
      base,
      [...base, ['2026-01-20', 'mollet', 26]],
      [...base, ['2026-01-20', 'mollet', 26], ['2026-01-27', 'mollet', 26]],
      [...base, ['2026-01-20', 'mollet', 26], ['2026-01-27', 'mollet', 26], ['2026-02-03', 'mollet', 26]],
      [
        ...base,
        ['2026-01-20', 'mollet', 26],
        ['2026-01-27', 'mollet', 26],
        ['2026-02-03', 'mollet', 26],
        ['2026-02-10', 'mollet', 26]
      ]
    ].map((rows) => ({ snapshot: snapshot(rows) }));
    const editions = replayFormatConsolidationEditions({ frames, window, period: '3m' });
    const states = editions.map(
      (e) =>
        [...e.phenomena, ...e.abstentions].find((r) => r.exerciseId === 'mollet')?.state
    );
    expect(states[2]).toBe(CONSOLIDATION_STATE.CONFIRMATION);
    expect(states[3]).toBe(CONSOLIDATION_STATE.CONSOLIDATION);
    const repeated = [...editions[4].phenomena, ...editions[4].abstentions].find(
      (r) => r.exerciseId === 'mollet'
    );
    expect(repeated.transition).toBe(MEMORY_TRANSITION.CONFIRMED);
    expect(repeated.newPriorityCard).toBe(false);
    expect(editions[4].persisted).toBe(false);
  });

  it('masque une séance future à la date simulée et sépare le coût du détecteur', () => {
    const data = snapshot([
      ['2026-01-05', 'step', 18],
      ['2026-01-12', 'step', 30],
      ['2026-01-19', 'step', 30],
      ['2026-01-26', 'step', 30],
      ['2026-03-02', 'step', 12],
      ['2026-01-05', 'farmer', 8],
      ['2026-01-19', 'farmer', 21],
      ['2026-02-02', 'farmer', 9],
      ['2026-02-16', 'farmer', 24]
    ]);
    const early = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window: { start: '2026-01-01', end: '2026-04-01' },
      period: '3m',
      asOf: '2026-01-31'
    });
    const later = runExerciseFormatConsolidationShadow({
      snapshot: data,
      window: { start: '2026-01-01', end: '2026-04-01' },
      period: '3m'
    });
    expect(
      [...early.phenomena, ...early.abstentions].find((r) => r.exerciseId === 'step').state
    ).toBe(CONSOLIDATION_STATE.CONSOLIDATION);
    expect(
      [...later.phenomena, ...later.abstentions].find((r) => r.exerciseId === 'step').state
    ).toBe(CONSOLIDATION_STATE.DECLINE);
    expect(
      [...later.phenomena, ...later.abstentions].find((r) => r.exerciseId === 'farmer').publish
    ).not.toBe(true);
    expect(later.timing.trajectoryMs).toBeGreaterThanOrEqual(later.timing.qualifyMs);
  });
});
