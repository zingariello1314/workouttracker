import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildMonthlyVolumeArcDiscoveries } from '../monthlyVolumeArcDiscoveries';
import { countStrengthTrainingDaysInRange, countTrainingDaysInRange } from '../recapTrainingDayTruth';
import { buildAdaptiveRecapInsights } from '../recapAdaptiveInsights';
import { buildSessionWorkProfiles } from '../sessionWorkProfile';
import {
  decomposeExerciseMix,
  symmetricDecomposition
} from '../volumeChangeDecomposition';
import { attributeShare, ledgerConservation, muscleWindowRelation } from '../muscleExposureLedger';
import { buildVolumeDecompFinding, proseFromFinding } from '../recapAnalyticalFindings';
import { accessibleConclusions, buildAccessibleReserve } from '../analyticalMemory';
import { finalizePublishedInsight } from '../recapInsightValidate';

describe('décomposition symétrique du volume', () => {
  it('une hausse due seulement à la fréquence laisse le contenu à zéro', () => {
    const split = symmetricDecomposition({ sessions: 8, reps: 800 }, { sessions: 12, reps: 1200 });
    expect(split.ok).toBe(true);
    expect(split.content).toBeCloseTo(0, 6);
    expect(split.frequency).toBeCloseTo(400, 6);
    expect(split.frequency + split.content).toBeCloseTo(split.observed, 6);
  });

  it('une hausse due seulement au contenu laisse la fréquence à zéro', () => {
    const split = symmetricDecomposition({ sessions: 10, reps: 1000 }, { sessions: 10, reps: 1500 });
    expect(split.frequency).toBeCloseTo(0, 6);
    expect(split.content).toBeCloseTo(500, 6);
  });

  it('une hausse de total malgré une baisse de fréquence reste cohérente', () => {
    const split = symmetricDecomposition({ sessions: 16, reps: 4366 }, { sessions: 15, reps: 5355 });
    expect(split.volumePct).toBeGreaterThan(20);
    expect(split.frequency).toBeLessThan(0);
    expect(split.content).toBeGreaterThan(0);
    expect(split.frequency + split.content).toBeCloseTo(split.observed, 5);
  });

  it('sépare les exercices ajoutés, retirés et communs, y compris les homonymes', () => {
    const mix = decomposeExerciseMix(
      { a: 100, b: 40, c: 30 },
      { a: 180, d: 50 },
      { a: 'Dips', b: 'Relevés de genoux', c: 'Relevés de genoux', d: 'Curl' }
    );
    expect(mix.common).toBe(80);
    expect(mix.added).toBe(50);
    expect(mix.removed).toBe(70);
    expect(mix.common + mix.added - mix.removed).toBe(60);
    const homonym = mix.movers.find((row) => String(row.name).includes('('));
    expect(homonym?.name).toMatch(/Relevés de genoux \(/);
  });
});

describe('profil de séance', () => {
  it('ne transforme pas une série reconstruite en format exécuté et n’invente pas une charge nulle', () => {
    const snapshot = {
      reps: { '2026-11-01_12': 36, '2026-11-02_12': 30 },
      checkedExercises: { '2026-11-01_12': true, '2026-11-02_12': true },
      exerciseSetLogs: {
        '2026-11-01_12': {
          sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
          inference: { method: 'prescription' }
        }
      }
    };
    const profile = buildSessionWorkProfiles(snapshot, { start: '2026-11-01', end: '2026-11-02' }, () => 'Dips');
    expect(profile.strengthDayCount).toBe(2);
    expect(profile.days[0].exercises[0].setsRecorded).toBe(false);
    expect(profile.days[0].exercises[0].setSource).toMatch(/reconstructed|absent|structured/);
    expect(profile.days[0].exercises[0].setCount).toBeNull();
    expect(profile.days[0].exercises[0].load).toEqual(
      expect.objectContaining({ recorded: false, value: null })
    );
    expect(profile.recordedSetCoverage).toBe(0);
  });
});

describe('attribution musculaire', () => {
  it('refuse d’annoncer 966 contre 252 comme une concentration de 383 %', () => {
    const inverted = attributeShare({ part: 966, whole: 252 });
    expect(inverted.ok).toBe(false);
    const relation = muscleWindowRelation({ periodReps: 966, referenceReps: 252, periodDays: 180 });
    expect(relation.ok).toBe(true);
    expect(relation.role).toBe('recent_month_inside_period');
    expect(relation.sharePct).toBeCloseTo(26.09, 1);
    expect(relation.sharePct).toBeLessThanOrEqual(100);
  });

  it('conserve la somme des répétitions attribuées', () => {
    const check = ledgerConservation([{ reps: 40 }, { reps: 60 }], 100);
    expect(check.ok).toBe(true);
    expect(ledgerConservation([{ reps: 40 }, { reps: 10 }], 100).ok).toBe(false);
  });
});

describe('lecture publiée', () => {
  it('nomme les mouvements et la population de jours dans la décomposition consommée', () => {
    const finding = buildVolumeDecompFinding({
      window: { start: '2026-10-21', end: '2026-11-19' },
      currentReps: 5355,
      previousReps: 4366,
      currentSessions: 15,
      previousSessions: 16,
      currentLen: 30,
      previousLen: 30,
      exerciseBefore: { dips: 400, curl: 200 },
      exerciseAfter: { dips: 900, row: 150 },
      exerciseNames: { dips: 'Dips', curl: 'Curl', row: 'Rowing' },
      calendarDays: 16,
      strengthDays: 15,
      setCoverage: 0.2
    });
    const prose = proseFromFinding(finding);
    expect(prose).toMatch(/Dips/);
    expect(prose).toMatch(/15 jours/);
    expect(prose).toMatch(/séries réellement enregistrées/);
    expect(prose).not.toMatch(/progression de force/i);
    expect(finding.metrics.frequencyContribution).toBeLessThan(0);
    expect(finding.metrics.contentContribution).toBeGreaterThan(0);
  });

  it('ne compte dans la réserve que les conclusions consultables, avec leur texte', () => {
    const reserve = buildAccessibleReserve({
      period: '30d',
      shownIds: [],
      valid: [
        { id: 'relation.reading.medium.volume', title: 'Le contenu des séances explique la hausse', body: 'Les dips portent l’essentiel.', evidence: '15 jours', selectionTrace: { reason: 'column_cap' } },
        { id: 'relation.reading.medium.raw', title: 'relation.reading.medium.raw', body: 'Identifiant seul.' },
        { id: 'kept', title: 'Octobre remonte par le contenu des jours actifs', body: 'Les jours restent à 12.', evidence: 'juin à octobre' }
      ]
    });
    const visible = accessibleConclusions(reserve);
    expect(visible).toHaveLength(2);
    expect(visible.every((item) => item.title && item.body)).toBe(true);
    expect(visible.some((item) => /relation\.reading/.test(item.title))).toBe(false);
    expect(finalizePublishedInsight({ title: 'relation.reading.medium.volume', body: 'Texte.' }).ok).toBe(false);
  });
});

const BACKUP = 'C:/Users/zinga/Downloads/momentum-sport-backup-2026-11-18.json';

function addDays(ymd, days) {
  const date = new Date(`${ymd}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe('rejeu P3 sur la sauvegarde du 18 novembre', () => {
  it('décompose le volume réel et les mois intermédiaires sans écrire', () => {
    if (!fs.existsSync(BACKUP)) return;
    const backup = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
    const snapshot = {
      reps: backup.data.reps,
      checkedExercises: backup.data.checkedExercises,
      exerciseSetLogs: backup.data.exerciseSetLogs,
      exerciseWeights: backup.data.exerciseWeights,
      enduranceData: backup.data.enduranceData
    };
    const names = new Map();
    for (const day of Object.values(backup.sportExport?.dailyJournal || {})) {
      for (const exercise of day.exercises || []) {
        if (exercise?.id && exercise?.name) names.set(String(exercise.id), exercise.name);
      }
    }
    const nameOf = (id) => names.get(String(id)) || '';
    const end = '2026-11-18';
    const currentWindow = { start: addDays(end, -29), end };
    const previousWindow = { start: addDays(end, -59), end: addDays(end, -30) };
    const current = buildSessionWorkProfiles(snapshot, currentWindow, nameOf);
    const previous = buildSessionWorkProfiles(snapshot, previousWindow, nameOf);
    const split = symmetricDecomposition(
      { sessions: previous.strengthDayCount, reps: previous.reps },
      { sessions: current.strengthDayCount, reps: current.reps }
    );
    expect(split.ok).toBe(true);
    expect(Math.abs(split.residual)).toBeLessThan(0.01);
    const repsByDate = {};
    Object.entries(snapshot.reps || {}).forEach(([key, value]) => {
      if (snapshot.checkedExercises?.[key] !== true) return;
      const date = key.slice(0, 10);
      const reps = parseInt(String(value), 10) || 0;
      if (reps > 0) repsByDate[date] = (repsByDate[date] || 0) + reps;
    });
    const arcs = buildMonthlyVolumeArcDiscoveries(repsByDate, { windowEndYmd: end, snapshot });
    const arc = arcs[0];
    if (arc?.body) {
      expect(arc.body).toMatch(/jours actifs|répétitions liées/);
    }
    const periods = [
      ['today', end, end],
      ['7d', addDays(end, -6), end],
      ['30d', addDays(end, -29), end],
      ['3m', addDays(end, -89), end],
      ['6m', addDays(end, -181), end],
      ['1y', addDays(end, -364), end],
      ['2y', addDays(end, -729), end],
      ['all', '2020-01-01', end]
    ];
    const table = periods.map(([period, start, windowEnd]) => {
      const t0 = Date.now();
      const result = buildAdaptiveRecapInsights({
        snapshot,
        window: { start, end: windowEnd },
        period,
        getExerciseNameById: nameOf,
        collectDiagnostic: true,
        persistHistory: false,
        insightHistory: { entries: [] }
      });
      const cards = [
        ...(result.insights?.shortTerm || []),
        ...(result.insights?.mediumTerm || []),
        ...(result.insights?.longTerm || [])
      ];
      const reserve = result.insights?.accessibleReserve || [];
      return {
        period,
        cards: cards.length,
        reserve: reserve.filter((item) => item.disposition === 'valid_reserved' || item.disposition === 'demoted_priority').length,
        rejected: reserve.filter((item) => item.disposition === 'rejected_factual').length,
        merged: reserve.filter((item) => item.disposition === 'merged').length,
        ms: Date.now() - t0,
        titles: cards.map((card) => card.title).slice(0, 4)
      };
    });
    const replay = {
      window: currentWindow,
      previous: previousWindow,
      currentDays: current.strengthDayCount,
      previousDays: previous.strengthDayCount,
      currentReps: current.reps,
      previousReps: previous.reps,
      calendar30: countTrainingDaysInRange(snapshot, currentWindow.start, currentWindow.end),
      strength30: countStrengthTrainingDaysInRange(snapshot, currentWindow.start, currentWindow.end),
      calendar6m: countTrainingDaysInRange(snapshot, addDays(end, -181), end),
      strength6m: countStrengthTrainingDaysInRange(snapshot, addDays(end, -181), end),
      split: {
        frequency: Math.round(split.frequency),
        content: Math.round(split.content),
        observed: Math.round(split.observed),
        volumePct: Math.round(split.volumePct * 10) / 10
      },
      movers: decomposeExerciseMix(previous.repsByExercise, current.repsByExercise, { ...previous.names, ...current.names }).movers,
      arc: arc ? { title: arc.title, body: arc.body } : null,
      table
    };
    expect(replay.split.frequency + replay.split.content).toBe(replay.split.observed);
    expect(replay.calendar6m).not.toBe(replay.strength6m);
    expect(table).toHaveLength(8);
    expect(table.every((row) => row.ms < 30000)).toBe(true);
  }, 180000);
});
