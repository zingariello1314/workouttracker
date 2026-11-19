import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildExerciseTrajectory } from '../exerciseTrajectoryAnalysis';
import { runExerciseFormatConsolidationShadow } from '../exerciseFormatConsolidation';

const BACKUP = 'C:/Users/zinga/Downloads/momentum-sport-backup-2026-11-18.json';

function addDays(ymd, days) {
  const date = new Date(`${ymd}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe('consolidation sur la sauvegarde du 18 novembre', () => {
  it('qualifie les exercices admissibles sur huit périodes, sans écrire', () => {
    if (!fs.existsSync(BACKUP)) return;
    const backup = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
    const snapshot = {
      reps: backup.data.reps,
      checkedExercises: backup.data.checkedExercises,
      exerciseSetLogs: backup.data.exerciseSetLogs,
      exerciseWeights: backup.data.exerciseWeights
    };
    const names = new Map();
    for (const day of Object.values(backup.sportExport?.dailyJournal || {})) {
      for (const exercise of day.exercises || []) {
        if (exercise?.id && exercise?.name) names.set(String(exercise.id), exercise.name);
      }
    }
    const end = '2026-11-18';
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
    const summary = [];
    for (const [period, start, windowEnd] of periods) {
      const t0 = Date.now();
      const out = runExerciseFormatConsolidationShadow({
        snapshot,
        window: { start, end: windowEnd },
        period,
        getExerciseNameById: (id) => names.get(String(id)) || ''
      });
      const published = out.phenomena.filter((row) => row.publish);
      summary.push({
        period,
        window: `${start} → ${windowEnd}`,
        published: published.length,
        abstained: out.abstentions.length,
        priority: published.filter((row) => row.newPriorityCard).length,
        confirmed: published.filter((row) => row.transition === 'confirmed' || row.newPriorityCard === false).length,
        ms: Date.now() - t0,
        timing: out.timing,
        states: published.reduce((acc, row) => {
          acc[row.state] = (acc[row.state] || 0) + 1;
          return acc;
        }, {}),
        examples: published.slice(0, 6).map((row) => ({
          id: row.exerciseId,
          name: row.exerciseName,
          state: row.state,
          priorShape: row.priorShape,
          transition: row.transition,
          priority: row.newPriorityCard,
          level: row.level,
          support: row.supportCount,
          dates: row.claimEvidenceDates,
          limits: (row.limits || []).slice(0, 2),
          prose: row.prose
        }))
      });
    }
    const week = summary.find((row) => row.period === '30d');
    expect(week.published + week.abstained).toBeGreaterThan(0);
    const interesting = summary.flatMap((row) =>
      row.examples.map((example) => ({ period: row.period, ...example }))
    );
    for (const example of interesting.slice(0, 6)) {
      const trajectory = buildExerciseTrajectory({
        snapshot,
        exerciseId: example.id,
        exerciseName: example.name,
        window: { start: '2026-10-20', end }
      });
      const sessions = trajectory.sessions?.lifetime || [];
      example.recorded = sessions.filter((session) => session.setsTrusted).length;
      example.reconstructed = sessions.filter((session) => session.setsTrusted === false).length;
    }
    expect(summary).toHaveLength(8);
    expect(summary.every((row) => row.published + row.abstained > 0)).toBe(true);
  }, 180000);
});
