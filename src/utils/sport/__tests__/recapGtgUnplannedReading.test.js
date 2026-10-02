import { describe, expect, it } from 'vitest';
import { buildGtgUnplannedDiscoveries } from '../recapGtgUnplannedReading';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';

function snapshot(gtg, extra = {}) {
  return {
    enduranceData: { gtg },
    exerciseMaxHistory: extra.exerciseMaxHistory || [],
    reps: {},
    checkedExercises: {}
  };
}

function gtgWith(days, config = {}) {
  return {
    config: {
      selectedIds: ['pullups'],
      scheduleFrom: '08:00',
      scheduleTo: '20:00',
      intervalHours: 2,
      manualMax: { pullups: 8 },
      ...config
    },
    days,
    workoutSync: {}
  };
}

describe('lectures GTG hors planning', () => {
  it('ne dit rien s’il n’y a aucun passage hors planning', () => {
    const cards = buildGtgUnplannedDiscoveries({
      snapshot: snapshot(
        gtgWith({
          '2026-09-28': { exercises: { pullups: { slots: { 0: { done: true } } } } }
        })
      ),
      window: { start: '2026-09-22', end: '2026-09-28' }
    });
    expect(cards).toEqual([]);
  });

  it('juge un passage de 23 h 42 qui est la seule pratique du jour', () => {
    const cards = buildGtgUnplannedDiscoveries({
      snapshot: snapshot(
        gtgWith({
          '2026-09-28': {
            exercises: {},
            adHoc: [
              {
                id: 'ah_night',
                time: '23:42',
                items: [{ exerciseId: 'pullups', reps: 3, done: true }]
              }
            ]
          }
        })
      ),
      window: { start: '2026-09-28', end: '2026-09-28' }
    });
    const now = cards.find((card) => card.kind === 'disc_gtg_unplanned_now');
    expect(now.title).toMatch(/23 h 42/);
    expect(now.title).toMatch(/ne tient que par le passage/);
    expect(now.body).toMatch(/zone facile/);
    expect(now.metrics.role).toBe('only');
  });

  it('reconnaît un rattrapage, et un passage collé à un créneau déjà fait', () => {
    const catchup = buildGtgUnplannedDiscoveries({
      snapshot: snapshot(
        gtgWith({
          '2026-09-28': {
            exercises: { pullups: { slots: { 0: { done: true } } } },
            adHoc: [
              {
                id: 'ah_catch',
                time: '21:30',
                items: [{ exerciseId: 'pullups', reps: 3, done: true }]
              }
            ]
          }
        })
      ),
      window: { start: '2026-09-28', end: '2026-09-28' }
    });
    expect(catchup.find((card) => card.kind === 'disc_gtg_unplanned_now').metrics.role).toBe('catchup');

    const stacked = buildGtgUnplannedDiscoveries({
      snapshot: snapshot(
        gtgWith(
          {
            '2026-09-28': {
              exercises: { pullups: { slots: { 1: { done: true } } } },
              adHoc: [
                {
                  id: 'ah_stack',
                  time: '23:42',
                  items: [{ exerciseId: 'pullups', reps: 3, done: true }]
                }
              ]
            }
          },
          {
            perExercise: {
              pullups: { slotMode: 'manual', slotTimes: ['20:00', '23:30'], scheduleFrom: '20:00', scheduleTo: '23:30' }
            }
          }
        )
      ),
      window: { start: '2026-09-28', end: '2026-09-28' }
    });
    const card = stacked.find((item) => item.kind === 'disc_gtg_unplanned_now');
    expect(card.metrics.role).toBe('stacked');
    expect(card.body).toMatch(/demi-heure/);
  });

  it('voit la continuité des jours qui sinon seraient vides', () => {
    const days = {};
    ['2026-09-26', '2026-09-27', '2026-09-28'].forEach((date, index) => {
      days[date] = {
        exercises: {},
        adHoc: [
          {
            id: `ah_${index}`,
            time: '23:42',
            items: [{ exerciseId: 'pullups', reps: 3, done: true }]
          }
        ]
      };
    });
    const cards = buildGtgUnplannedDiscoveries({
      snapshot: snapshot(gtgWith(days)),
      window: { start: '2026-09-22', end: '2026-09-28' }
    });
    const continuity = cards.find((card) => card.kind === 'disc_gtg_unplanned_role');
    expect(continuity).toBeTruthy();
    expect(continuity.body).toMatch(/sans Grease the Groove|apparaissent/i);
    expect(continuity.metrics.gapDays).toBe(3);
  });

  it('relie un doublement du max depuis le début du GTG, au-delà de la fenêtre', () => {
    const cards = buildGtgUnplannedDiscoveries({
      snapshot: snapshot(
        gtgWith({
          '2026-08-01': {
            exercises: { pullups: { slots: { 0: { done: true } } } }
          },
          '2026-09-14': {
            exercises: {},
            adHoc: [
              {
                id: 'ah_late',
                time: '23:42',
                items: [{ exerciseId: 'pullups', reps: 4, done: true }]
              }
            ]
          }
        }),
        {
          exerciseMaxHistory: [
            { exerciseId: '101', reps: 4, recordDate: '2026-08-01', source: 'gtg' },
            { exerciseId: '101', reps: 8, recordDate: '2026-09-10', source: 'gtg' }
          ]
        }
      ),
      window: { start: '2026-09-08', end: '2026-09-14' }
    });
    const journey = cards.find((card) => card.kind === 'disc_gtg_unplanned_progress');
    expect(journey).toBeTruthy();
    expect(journey.title.toLowerCase()).toMatch(/doubl/);
    expect(journey.body).toMatch(/01\/08\/2026/);
    expect(journey.body).toMatch(/10\/09\/2026/);
    expect(journey.body).toMatch(/23 h|après 21 h/);
    expect(journey.metrics.ratio).toBe(2);
  });

  it('entre dans les cartes retenues du récap du jour', () => {
    const bundle = buildPeriodDiscoveryBundle({
      snapshot: snapshot(
        gtgWith({
          '2026-09-28': {
            exercises: {},
            adHoc: [
              {
                id: 'ah_night',
                time: '23:42',
                items: [{ exerciseId: 'pullups', reps: 3, done: true }]
              }
            ]
          }
        })
      ),
      window: { start: '2026-09-28', end: '2026-09-28' },
      period: 'today'
    });
    expect(bundle.selected.some((card) => card.kind === 'disc_gtg_unplanned_now')).toBe(true);
  });
});
