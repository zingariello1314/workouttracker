import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DAY_CONTRACT,
  classifyRecapDay,
  summarizeChannelDaySets,
  explainStrengthVsCalendarTrainingGap
} from '../recapDayContracts';
import { measureRecapWindow } from '../recapPeriodDiscoveries';
import { assertWindowMeasureConsistency } from '../recapInsightValidate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const fixturePath = path.join(
  root,
  'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'
);

function loadFixture() {
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}

describe('recapDayContracts F2', () => {
  it('union multi-canaux : une date compte une fois', () => {
    const snapshot = {
      reps: { '2026-10-10_101': '30' },
      checkedExercises: { '2026-10-10_101': true },
      enduranceData: {
        sessions: {
          running: [{ date: '2026-10-10', distance: 5, duration: '00:30:00' }]
        }
      }
    };
    const sets = summarizeChannelDaySets(snapshot, '2026-10-10', '2026-10-10', null);
    expect(sets.union).toEqual(['2026-10-10']);
    expect(sets.multi).toEqual(['2026-10-10']);
    const row = classifyRecapDay(snapshot, '2026-10-10', null);
    expect(row.flags[DAY_CONTRACT.CLASSIC_NON_GTG]).toBe(true);
    expect(row.flags[DAY_CONTRACT.ENDURANCE]).toBe(true);
    expect(row.multiChannel).toBe(true);
  });

  it('explique strengthDays > trainingDays sur fixture réelle sans forcer l’égalité', () => {
    const snap = loadFixture();
    const window = { start: '2026-10-01', end: '2026-10-30' };
    const gap = explainStrengthVsCalendarTrainingGap(snap, window, null);
    expect(gap.ok).toBe(true);
    expect(gap.counts.strengthDays).toBe(16);
    expect(gap.counts.trainingDays).toBe(12);
    expect(gap.strengthOnly).toEqual(
      expect.arrayContaining(['2026-10-01', '2026-10-03', '2026-10-06', '2026-10-15'])
    );
    expect(gap.calendarOnly).toEqual([]);
    expect(gap.methodologicallyExpected).toBe(true);
    expect(
      gap.strengthOnlyDetail.every(
        (d) =>
          d.cause === 'gtg_synced_reps_without_calendar_credit' ||
          d.cause === 'reps_fully_attributed_to_gtg_sync'
      )
    ).toBe(true);

    const m = measureRecapWindow({ snapshot: snap, window, periodId: '30d' });
    expect(m.dayContracts.strengthDays).toBe('positive_reps_days');
    expect(m.dayContracts.trainingDays).toBe('calendar_training_union_day');
    // Ne doit plus loguer un reject d’inclusion (pas de throw).
    expect(() => assertWindowMeasureConsistency(m, { label: 'test30d' })).not.toThrow();
  });

  it('séance enregistrée sans reps exclusives GTG ne compte pas calendrier', () => {
    const snap = loadFixture();
    const row = classifyRecapDay(snap, '2026-10-01', null);
    expect(row.flags[DAY_CONTRACT.POSITIVE_REPS]).toBe(true);
    expect(row.flags[DAY_CONTRACT.CALENDAR_TRAINING]).toBe(false);
    expect(row.coexistence?.gtgOnly).toBe(true);
  });
});
