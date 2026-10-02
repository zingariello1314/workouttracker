import { describe, expect, it } from 'vitest';
import {
  addGtgAdHocPassage,
  buildGtgDayPlan,
  buildGtgExportJournal,
  removeGtgAdHocPassage,
  toggleGtgAdHocItem,
  toggleGtgMiniSet
} from '../gtgService';
import { mergeGtgData } from '../gtgDataMerge';
import { syncGtgDayToWorkoutData } from '../gtgWorkoutSync';
import { buildCalendarGtgDayView, gtgDayHasCompletedMiniSet } from '../../../utils/calendarGtgDay';
import { prepareSportExportBundle } from '../../../components/tabs/SettingsTab/utils/sportExportBundle';
import { buildEnduranceExportStats } from '../../../components/tabs/SettingsTab/utils/exportUtils';

const DATE = '2026-10-01';

function baseGtg() {
  return {
    config: {
      selectedIds: ['pullups', 'dips', 'pushups'],
      scheduleFrom: '08:00',
      scheduleTo: '20:00',
      intervalHours: 2,
      manualMax: { pullups: 8, dips: 12, pushups: 20 }
    },
    days: {},
    workoutSync: {}
  };
}

describe('passages GTG hors planning', () => {
  it('enregistre l’heure et les reps réelles, déjà cochées', () => {
    const next = addGtgAdHocPassage(baseGtg(), DATE, {
      time: '23:42',
      items: [
        { exerciseId: 'pullups', reps: 3 },
        { exerciseId: 'dips', reps: 6 },
        { exerciseId: 'pushups', reps: 10 },
        { exerciseId: 'pullups', reps: 0 }
      ]
    });
    const plan = buildGtgDayPlan(next, DATE, { workoutData: { enduranceData: { gtg: next } } });
    const passage = plan.slots.find((slot) => slot.adHoc);
    expect(passage.time).toBe('23:42');
    expect(passage.items.map((item) => [item.exerciseId, item.reps, item.done])).toEqual([
      ['pullups', 3, true],
      ['dips', 6, true],
      ['pushups', 10, true]
    ]);
    expect(plan.donePlannedMiniSets).toBe(0);
    expect(plan.adHocDoneReps).toBe(19);
    expect(plan.doneReps).toBe(19);
    expect(plan.progressPct).toBe(0);
  });

  it('décoche, retire, et ne perd pas le passage quand on coche un créneau prévu', () => {
    let gtg = addGtgAdHocPassage(baseGtg(), DATE, {
      time: '23:42',
      items: [{ exerciseId: 'pullups', reps: 3 }]
    });
    const id = gtg.days[DATE].adHoc[0].id;
    gtg = toggleGtgMiniSet(gtg, DATE, 0, 'dips');
    expect(gtg.days[DATE].adHoc).toHaveLength(1);

    gtg = toggleGtgAdHocItem(gtg, DATE, id, 'pullups');
    let plan = buildGtgDayPlan(gtg, DATE, {});
    expect(plan.slots.find((slot) => slot.adHoc).items[0].done).toBe(false);
    expect(plan.adHocDoneReps).toBe(0);

    gtg = toggleGtgAdHocItem(gtg, DATE, id, 'pullups');
    gtg = removeGtgAdHocPassage(gtg, DATE, id);
    plan = buildGtgDayPlan(gtg, DATE, {});
    expect(plan.slots.some((slot) => slot.adHoc)).toBe(false);
    expect(plan.donePlannedMiniSets).toBe(1);
  });

  it('alimente le journal, le calendrier et l’export avec date, heure et reps', () => {
    const gtg = addGtgAdHocPassage(baseGtg(), DATE, {
      time: '23:42',
      items: [
        { exerciseId: 'pullups', reps: 3 },
        { exerciseId: 'dips', reps: 6 },
        { exerciseId: 'pushups', reps: 10 }
      ]
    });
    const synced = syncGtgDayToWorkoutData(
      { reps: {}, checkedExercises: {}, enduranceData: { gtg } },
      gtg,
      DATE,
      {}
    );
    expect(synced.reps[`${DATE}_101`]).toBe('3');
    expect(synced.reps[`${DATE}_103`]).toBe('6');
    expect(synced.reps[`${DATE}_104`]).toBe('10');
    expect(synced.checkedExercises[`${DATE}_101`]).toBe(true);

    expect(gtgDayHasCompletedMiniSet(synced, DATE)).toBe(true);
    const view = buildCalendarGtgDayView(synced, DATE, {});
    const pull = view.exercisePlans.find((ep) => ep.exerciseId === 'pullups');
    expect(pull.slots.some((slot) => slot.time === '23:42' && slot.adHoc && slot.reps === 3 && slot.done)).toBe(
      true
    );
    expect(view.adHocDoneReps).toBe(19);

    const row = buildGtgExportJournal(gtg).find((entry) => entry.source === 'adHoc' && entry.exerciseId === 'pullups');
    expect(row).toMatchObject({
      date: DATE,
      time: '23:42',
      exerciseId: 'pullups',
      exerciseLabel: 'Tractions',
      reps: 3,
      done: true,
      source: 'adHoc'
    });

    const stats = buildEnduranceExportStats({ gtg });
    expect(stats.gtg.adHocMiniSetsDone).toBe(3);
    expect(stats.gtg.adHocRepsDone).toBe(19);
    expect(stats.gtg.entriesWithTime).toBeGreaterThan(0);

    const bundle = prepareSportExportBundle({
      workoutData: synced
    });
    expect(
      bundle.sportExport.gtgJournal.some(
        (entry) => entry.date === DATE && entry.time === '23:42' && entry.reps === 3 && entry.source === 'adHoc'
      )
    ).toBe(true);
  });

  it('fusionne les passages hors planning à l’import', () => {
    const existing = {
      config: { selectedIds: ['pullups'] },
      days: {
        [DATE]: {
          exercises: {},
          adHoc: [
            {
              id: 'ah_same',
              time: '23:42',
              items: [{ exerciseId: 'pullups', reps: 3, done: true }]
            }
          ]
        }
      }
    };
    const incoming = {
      config: { selectedIds: ['dips'] },
      days: {
        [DATE]: {
          exercises: {},
          adHoc: [
            {
              id: 'ah_same',
              time: '23:42',
              items: [{ exerciseId: 'dips', reps: 6, done: false }]
            }
          ]
        }
      }
    };
    const merged = mergeGtgData(existing, incoming);
    const items = merged.days[DATE].adHoc[0].items;
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ exerciseId: 'pullups', reps: 3, done: true }),
        expect.objectContaining({ exerciseId: 'dips', reps: 6, done: false })
      ])
    );
  });
});
