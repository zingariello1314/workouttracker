import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analysisEditionKey } from '../analysisEdition';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';
import { coverageForSnapshot, classifyExerciseStanding } from '../historicalOrphanExercises';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';
import { assessHistoricalPlans } from '../plannedVsPerformedAssessment';
import { checkedRepsBetween, endurancePushupsOutsideReps, reconcilePopulations } from '../populationReconciliation';
import { buildExerciseNameMap } from '../recapAdaptiveWorkerContract';
import { writeEvalArtifactFiles, EVAL_ARCHIVE_DIRS } from '../evaluation/evalArchive';

const BACKUP = 'C:/Users/zinga/.cursor/projects/c-Users-zinga-Desktop-momentum/attachments/2154474a-0603-44f8-8ebb-a86ce443fdec/momentum-sport-backup-2026-11-19.json';

function addDays(ymd, delta) {
  const date = new Date(`${ymd}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function windowFor(period, end, firstDate) {
  const spans = { today: 1, '7d': 7, '30d': 30, '3m': 92, '6m': 183, '1y': 365, '2y': 730 };
  if (period === 'all') return { start: firstDate, end };
  const span = spans[period];
  return { start: addDays(end, -(span - 1)), end };
}

describe('rejeu identité sur la sauvegarde du 19 novembre', () => {
  it.skipIf(!existsSync(BACKUP) || process.env.P4_REPLAY !== '1')(
    'résout les ids du programme dans le moteur, sans getter prérempli',
    () => {
    const backup = JSON.parse(readFileSync(BACKUP, 'utf8'));
    const snapshot = backup.data;
    expect(snapshot.exerciseDisplayNames).toBeFalsy();
    const end = '2026-11-19';
    const week = coverageForSnapshot(snapshot, windowFor('7d', end), null);
    const month = coverageForSnapshot(snapshot, windowFor('30d', end), null);
    const namedInWeek = week.orphanRows.filter((row) => {
      const standing = classifyExerciseStanding(snapshot, row.id, null);
      return standing.standing === 'identified';
    });
    expect(namedInWeek).toEqual([]);
    expect(week.identifiedReps).toBeGreaterThan(600);
    expect(week.orphanReps).toBeLessThan(week.identifiedReps);
    console.log('WEEK', week.identifiedReps, week.orphanReps, week.identifiedExercises, week.orphanExercises);
    console.log('MONTH', month.identifiedReps, month.orphanReps, month.identifiedExercises, month.orphanExercises);
    console.log('MONTH ORPHANS', month.orphanRows.slice().sort((a, b) => b.reps - a.reps).slice(0, 25));
    const map = buildExerciseNameMap(snapshot, null);
    const scheduled = Object.entries(map).filter(([id, name]) => /^\d+$/.test(id) && name && !/^Exercice/i.test(name));
    expect(scheduled.length).toBeGreaterThan(10);

    const dates = Object.keys(snapshot.reps || {})
      .map((key) => key.slice(0, 10))
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort();
    const firstDate = dates[0];
    const periods = ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all'];
    const rows = [];
    for (const period of periods) {
      const t0 = Date.now();
      const bundle = buildPeriodDiscoveryBundle({
        snapshot,
        period,
        window: windowFor(period, end, firstDate),
        getExerciseNameById: null
      });
      const selected = bundle.selected || [];
      const dropped = bundle.dropped || [];
      const accessible = bundle.accessibleCatalog?.deferred || [];
      const text = [...selected, ...accessible].map((row) => `${row.title || ''} ${row.body || ''}`).join('\n');
      rows.push({
        period,
        ms: Date.now() - t0,
        produced: (bundle.all || []).length,
        selected: selected.length,
        accessible: accessible.length,
        dropped: dropped.length,
        factual: dropped.filter((row) => row.reason === 'rejected_factual' || row.admission?.admissible === false).length,
        unnamedEmergence: (bundle.all || []).filter(
          (row) => row.kind === 'disc_emergence' && /un mouvement|Exercice\s*#?\s*\d+/i.test(`${row.title} ${row.body}`)
        ).length,
        portion: /portion dans la fenêtre/i.test(text),
        examples: selected.slice(0, 3).map((row) => row.title).filter(Boolean),
        program: [...selected, ...accessible]
          .filter((row) => row.kind === 'disc_program_practice')
          .map((row) => ({ title: row.title, body: row.body, lineage: row.lineage }))
          .slice(0, 2),
        duration: [...selected, ...accessible]
          .filter((row) => /activité enregistrée|hors course|kcal actives/i.test(`${row.title} ${row.body}`))
          .map((row) => row.title)
          .slice(0, 4),
        grammar: /de ta jambes|de ta pectoraux/i.test(text),
        p6: bundle.p6?.counters || null,
        views: bundle.p6?.views || null,
        comparison: [...selected, ...accessible]
          .filter((row) => row.kind === 'session_work_comparison')
          .map((row) => row.body)
          .slice(0, 1),
        singleSession: [...selected, ...accessible]
          .filter((row) => /une seule séance|une séance/i.test(`${row.title || ''} ${row.body || ''}`))
          .map((row) => row.title)
          .slice(0, 6)
      });
    }
    const weekRow = rows.find((row) => row.period === '7d');
    const half = rows.find((row) => row.period === '6m');
    expect(weekRow.unnamedEmergence).toBe(0);
    expect(half.unnamedEmergence).toBe(0);
    expect(half.portion).toBe(false);
    expect(analysisEditionKey()).toMatch(/editorial=p6-sovereign-v4/);
    expect(analysisEditionKey()).toMatch(/identity=program-schedule-v1/);
    expect(weekRow.grammar).toBe(false);
    expect(weekRow.p6.reconciled).toBe(true);
    const checkedBetween = (start, end) => {
      let total = 0;
      Object.entries(snapshot.reps || {}).forEach(([key, value]) => {
        const date = key.slice(0, 10);
        if (date < start || date > end) return;
        if (snapshot.checkedExercises?.[key] !== true) return;
        const count = parseInt(value, 10);
        if (count > 0) total += count;
      });
      return total;
    };
    const plans = assessHistoricalPlans(snapshot, windowFor('30d', end), end);
    const executedAt = new Date().toISOString();
    const fingerprint = snapshotFingerprint(snapshot);
    const replay = {
      schema: 'momentum.p6Replay.v1',
      executedAt,
      edition: analysisEditionKey(),
      fingerprint,
      dataFingerprint: fingerprint,
      snapshotRef: {
        path: BACKUP,
        endDate: end,
        label: 'momentum-sport-backup-2026-11-19'
      },
      periods: rows,
      counters: {
        week: weekRow?.p6 || null,
        byPeriod: Object.fromEntries(rows.map((row) => [row.period, row.p6]))
      },
      editorialDecisions: {
        views: Object.fromEntries(rows.map((row) => [row.period, row.views])),
        examples: Object.fromEntries(rows.map((row) => [row.period, row.examples]))
      },
      issues: {
        unnamedEmergence: Object.fromEntries(rows.map((row) => [row.period, row.unnamedEmergence])),
        grammar: Object.fromEntries(rows.map((row) => [row.period, row.grammar])),
        portion: Object.fromEntries(rows.map((row) => [row.period, row.portion]))
      },
      timings: Object.fromEntries(rows.map((row) => [row.period, row.ms])),
      week: {
        totalReps: week.totalReps,
        identifiedReps: week.identifiedReps,
        orphanReps: week.orphanReps,
        identifiedExercises: week.identifiedExercises,
        orphanExercises: week.orphanExercises,
        orphanRows: week.orphanRows
      },
      month: {
        totalReps: month.totalReps,
        identifiedReps: month.identifiedReps,
        orphanReps: month.orphanReps,
        identifiedExercises: month.identifiedExercises,
        orphanExercises: month.orphanExercises,
        topOrphans: month.orphanRows.slice().sort((a, b) => b.reps - a.reps).slice(0, 20)
      },
      rows,
      populations: {
        octoberCheckedReps: checkedRepsBetween(snapshot, '2026-10-01', '2026-10-31'),
        octoberEnduranceOutsideReps: endurancePushupsOutsideReps(snapshot, '2026-10-01', '2026-10-31'),
        october: reconcilePopulations([
          {
            id: 'checked_reps',
            value: checkedRepsBetween(snapshot, '2026-10-01', '2026-10-31'),
            definition: 'répétitions cochées dans reps'
          },
          {
            id: 'checked_plus_endurance',
            value:
              checkedRepsBetween(snapshot, '2026-10-01', '2026-10-31') +
              endurancePushupsOutsideReps(snapshot, '2026-10-01', '2026-10-31').reps,
            definition: 'répétitions cochées plus pompes d’endurance absentes de reps',
            records: endurancePushupsOutsideReps(snapshot, '2026-10-01', '2026-10-31').records
          }
        ]),
        sixMonthCheckedReps: checkedRepsBetween(snapshot, windowFor('6m', end).start, end),
        sixMonthEnduranceOutsideReps: endurancePushupsOutsideReps(
          snapshot,
          windowFor('6m', end).start,
          end
        ),
        legacyCheckedOctober: checkedBetween('2026-10-01', '2026-10-31')
      },
      programPlans30d: {
        days: plans.length,
        historical: plans.filter((row) => row.planProvenance === 'historical_snapshot' && !row.abstained).length,
        reconstructed: plans.filter((row) => row.planProvenance === 'reconstructed').length,
        abstained: plans.filter((row) => row.abstained).map((row) => ({ date: row.date, reason: row.reason })).slice(0, 12)
      }
    };
    const written = writeEvalArtifactFiles(fs, path, {
      executedAt,
      edition: analysisEditionKey(),
      fingerprint,
      snapshotRef: replay.snapshotRef,
      replay,
      notes: [
        `Emplacement stable : ${EVAL_ARCHIVE_DIRS.root}/replays/`,
        'Les fichiers *-latest.json sont écrasés ; les fichiers datés sont conservés pour comparaison.'
      ]
    });
    expect(written.written.some((p) => /p6-replay-latest\.json$/.test(p.replace(/\\/g, '/')))).toBe(true);
  }, 180000);
});
