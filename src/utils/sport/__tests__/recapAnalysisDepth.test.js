import { describe, expect, it } from 'vitest';
import { writeThreadCard } from '../recapAnalysisDepth';
import { buildThreadDossiers, buildThreadDiscoveries } from '../recapAnalysisProofs';
import { buildPeriodComparisons } from '../recapPeriodDiscoveries';

function ymd(month, day) {
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function names(id) {
  const map = {
    1: 'Tractions',
    2: 'Pompes',
    3: 'Mollets debout',
    4: 'Oiseaux penché'
  };
  return map[id] || `Exercice ${id}`;
}

describe('writeThreadCard', () => {
  it('retourne null si le champ requis manque, sans inventer une comparaison', () => {
    const card = writeThreadCard({
      thread: 'concentration',
      sense: 'fact',
      voice: '7d',
      windowLabel: 'Ces 7 jours',
      axes: ['volume'],
      observed: { reps: 436 }
    });
    expect(card).toBeNull();
  });

  it('garde une carte volume + exercices sans comparaison temporelle', () => {
    const card = writeThreadCard({
      thread: 'concentration',
      sense: 'fact',
      voice: 'today',
      windowLabel: "Aujourd'hui",
      axes: ['volume', 'exercises', 'concentration'],
      observed: {
        reps: 186,
        sessions: 1,
        exerciseNames: ['78 Tractions'],
        peak: {
          dateLabel: '30/09/2026',
          reps: 78,
          share: 41.9,
          exerciseNames: ['78 Tractions'],
          otherDaysReps: 108
        }
      }
    });
    expect(card).not.toBeNull();
    expect(card.body).toMatch(/186/);
    expect(card.body).toMatch(/Tractions/);
    expect(card.body).not.toMatch(/jours d'avant/);
    expect(card.body).not.toMatch(/habitude/);
  });

  it('une nuit ne devient pas une habitude', () => {
    const card = writeThreadCard({
      thread: 'sleepPlacement',
      sense: 'fact',
      voice: 'today',
      windowLabel: 'Le sommeil mesuré',
      axes: ['sleep'],
      sleep: { level: 1, n: 1, bedLabel: '4 h 08', wakeLabel: '14 h 06' },
      observed: {}
    });
    expect(card.body).toMatch(/Observation/);
    expect(card.body).toMatch(/4 h 08/);
    expect(card.body).not.toMatch(/habitude/);
  });

  it('le fil continuité sans lecture ne sort pas', () => {
    expect(writeThreadCard({
      thread: 'continuity',
      sense: 'fact',
      voice: '7d',
      windowLabel: 'Ces 7 jours',
      axes: ['continuity'],
      continuity: { narrowReps: 100, wideReps: 400, share: 25 },
      observed: {}
    })).toBeNull();
  });

  it('un total seul ne devient pas une série', () => {
    const card = writeThreadCard({
      thread: 'series',
      sense: 'fact',
      voice: '7d',
      windowLabel: 'Ces 7 jours',
      axes: ['series', 'volume'],
      observed: {
        reps: 48,
        sessions: 1,
        series: { name: 'Pompes', totalOnly: true, volume: 48, bestSet: null }
      }
    });
    expect(card.body).toMatch(/48/);
    expect(card.body).toMatch(/pas une série/);
    expect(card.body).not.toMatch(/record/);
    expect(card.body).not.toMatch(/Meilleure série/);
  });
});

describe('dossiers de fenêtre', () => {
  function snapshotBetween(startMonth, endMonth, perDay) {
    const reps = {};
    const checkedExercises = {};
    const mark = (date, id, n) => {
      const key = `${date}_${id}`;
      reps[key] = String(n);
      checkedExercises[key] = true;
    };
    for (let m = startMonth; m <= endMonth; m += 1) {
      mark(ymd(m, 3), 1, perDay);
      mark(ymd(m, 10), 2, perDay);
      mark(ymd(m, 18), 3, Math.round(perDay / 2));
    }
    mark(ymd(endMonth, 26), 1, perDay);
    mark(ymd(endMonth, 27), 2, perDay);
    mark(ymd(endMonth, 28), 3, perDay);
    return {
      reps,
      checkedExercises,
      exerciseSetLogs: {
        [`${ymd(endMonth, 27)}_2`]: { sets: [{ reps: 12 }, { reps: 12 }, { reps: 10 }] }
      },
      exerciseMaxRecords: [{ exerciseId: '2', reps: 20, performanceType: 'reps' }]
    };
  }

  function bundle(period, snapshot, end) {
    const span = { '7d': 7, '30d': 30, '3m': 92, '6m': 183, '1y': 365, today: 1 }[period];
    const startDate = new Date(`${end}T12:00:00`);
    startDate.setDate(startDate.getDate() - (span - 1));
    const start = startDate.toISOString().slice(0, 10);
    const comparisons = buildPeriodComparisons({
      snapshot,
      window: { start: period === 'today' ? end : start, end },
      period,
      getExerciseNameById: (id) => names(Number(id))
    });
    return { comparisons, cards: buildThreadDiscoveries({ comparisons, snapshot, catalog: [] }) };
  }

  it('un jour à 0 ne prend pas la dernière séance pour aujourd\'hui', () => {
    const comparisons = {
      periodId: 'today',
      period: {
        totalReps: 0,
        trainingDays: 0,
        window: { start: '2026-09-30', end: '2026-09-30' },
        muscles: [],
        exercises: [],
        pushReps: 0,
        pullReps: 0
      },
      d7: { totalReps: 846, trainingDays: 4 },
      d30: { totalReps: 3467, trainingDays: 13 },
      prev30: { totalReps: 4944, trainingDays: 16 }
    };
    const catalog = [{
      date: '2026-09-29',
      totalReps: 436,
      minutes: 111,
      exercises: [{ id: '3', name: 'Mollets debout', reps: 100 }]
    }];
    const cards = buildThreadDiscoveries({
      comparisons,
      snapshot: { reps: {}, checkedExercises: {}, exerciseSetLogs: {}, exerciseMaxRecords: [] },
      catalog
    });
    const bodies = cards.map((c) => c.body).join('\n');
    expect(bodies).toMatch(/29\/09\/2026/);
    expect(bodies).toMatch(/436/);
    expect(bodies).not.toMatch(/aujourd'hui \(436/i);
    expect(bodies).not.toMatch(/pic confirmé/);
    const shares = cards.filter((c) => /représentent/.test(c.body));
    expect(shares).toHaveLength(1);
    expect(shares[0].kind).toBe('disc_th_concentration_now');
    expect(shares[0].body).toMatch(/51,5 %/);
    expect(shares[0].body).toMatch(/7 derniers jours/);
    expect(shares[0].body).not.toMatch(/aujourd'hui \(436/i);
  });

  it('7 jours : volume, fréquence, concentration et continuité si les deux côtés existent', () => {
    const snapshot = snapshotBetween(8, 9, 80);
    const { cards } = bundle('7d', snapshot, '2026-09-28');
    const rhythm = cards.find((c) => c.kind === 'disc_th_rhythm_now');
    expect(rhythm?.body || '').toMatch(/répétitions/);
    expect(rhythm?.body || '').toMatch(/séance/);
    const continuity = cards.find((c) => c.kind === 'disc_th_continuity_now');
    if (continuity) {
      expect(continuity.body).toMatch(/pic confirmé|pic relativisé|manque de recul/);
      expect(continuity.body).toMatch(/30 jours/);
    }
    const absent = writeThreadCard({
      thread: 'rhythm',
      sense: 'fact',
      voice: '7d',
      windowLabel: 'Ces 7 jours',
      axes: ['volume', 'frequency'],
      observed: { reps: 200, sessions: 3, repsPerSession: 66 }
    });
    expect(absent.body).not.toMatch(/sommeil|record|bloc /i);
  });

  it('6 mois nomme deux blocs et 1 an nomme les mois extrêmes', () => {
    const snapshot = snapshotBetween(4, 9, 100);
    const six = bundle('6m', snapshot, '2026-09-28');
    const year = bundle('1y', snapshot, '2026-09-28');
    const sixCard = six.cards.find((c) => c.kind === 'disc_th_rhythm_now');
    const yearCard = year.cards.find((c) => c.kind === 'disc_th_rhythm_now');
    expect(sixCard?.body || '').toMatch(/bloc/i);
    expect(sixCard?.body || '').not.toMatch(/mois le plus creux/);
    expect(yearCard?.body || '').toMatch(/mois le plus/);
    expect(yearCard?.body || '').toMatch(/depuis le|commencent le/i);
    expect(yearCard?.body || '').not.toMatch(/Le bloc /);
    expect(sixCard?.body).not.toBe(yearCard?.body);
  });

  it('30 jours compare à la période d\'avant, pas à lui-même', () => {
    const snapshot = snapshotBetween(8, 9, 90);
    const { comparisons, cards } = bundle('30d', snapshot, '2026-09-28');
    const dossiers = buildThreadDossiers({ comparisons, snapshot, catalog: [] });
    const rhythm = dossiers.find((d) => d.thread === 'rhythm' && d.sense === 'fact');
    expect(rhythm.comparison?.label || '').toMatch(/avant/);
    expect(rhythm.comparison?.label || '').not.toMatch(/ces 30 jours/);
    const card = cards.find((c) => c.kind === 'disc_th_rhythm_now');
    expect(card?.body || '').not.toMatch(/first30|début de la fenêtre/i);
  });

  it('une série structurée reste distincte du record déclaré', () => {
    const snapshot = snapshotBetween(9, 9, 40);
    const { cards } = bundle('30d', snapshot, '2026-09-28');
    const series = cards.find((c) => c.kind === 'disc_th_series_now');
    expect(series?.body || '').toMatch(/Meilleure série/);
    expect(series.body).toMatch(/12/);
    expect(series.body).toMatch(/record déclaré/);
    expect(series.body).toMatch(/ne le remplace pas/);
  });
});
