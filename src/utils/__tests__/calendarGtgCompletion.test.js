import { describe, expect, it } from 'vitest';
import { addGtgAdHocPassage, buildGtgDayPlan } from '../../services/endurance/gtgService';
import { computeGtgQuotaCompletion } from '../calendarGtgCompletion';
import {
  layoutOrderFromSections,
  normalizeCalendarMonthTileLayout,
  orderedCalendarMonthSections
} from '../calendarMonthTileLayout';

const DATE = '2026-10-03';

function baseGtg() {
  return {
    config: {
      selectedIds: ['pullups', 'pushups'],
      scheduleFrom: '08:00',
      scheduleTo: '16:00',
      intervalHours: 2,
      manualMax: { pullups: 8, pushups: 10 }
    },
    days: {},
    workoutSync: {}
  };
}

describe('complétion GTG pour la couleur du calendrier', () => {
  it('compte 100 % quand les créneaux sur mesure égalent le planning en nombre et en reps', () => {
    let gtg = baseGtg();
    const preview = buildGtgDayPlan(gtg, DATE, { workoutData: { enduranceData: { gtg } } });
    const planned = preview.slots.filter((slot) => !slot.adHoc);
    expect(planned.length).toBeGreaterThan(1);

    planned.forEach((slot, index) => {
      gtg = addGtgAdHocPassage(gtg, DATE, {
        time: `06:${String(index).padStart(2, '0')}`,
        items: slot.items.map((item) => ({ exerciseId: item.exerciseId, reps: item.reps }))
      });
    });

    const plan = buildGtgDayPlan(gtg, DATE, { workoutData: { enduranceData: { gtg } } });
    const quota = computeGtgQuotaCompletion(plan);
    expect(plan.donePlannedMiniSets).toBe(0);
    expect(plan.progressPct).toBe(0);
    expect(quota.seriesRatio).toBe(1);
    expect(quota.repsRatio).toBe(1);
    expect(quota.completion01).toBe(1);
  });

  it('reste partiel si un seul créneau sur mesure est fait', () => {
    let gtg = baseGtg();
    const preview = buildGtgDayPlan(gtg, DATE, { workoutData: { enduranceData: { gtg } } });
    const first = preview.slots.find((slot) => !slot.adHoc);
    gtg = addGtgAdHocPassage(gtg, DATE, {
      time: '06:15',
      items: first.items.map((item) => ({ exerciseId: item.exerciseId, reps: item.reps }))
    });
    const plan = buildGtgDayPlan(gtg, DATE, { workoutData: { enduranceData: { gtg } } });
    const quota = computeGtgQuotaCompletion(plan);
    expect(quota.completion01).toBeGreaterThan(0);
    expect(quota.completion01).toBeLessThan(0.5);
  });
});

describe('blocs du mois', () => {
  it('réaffiche un bloc retiré sans date de départ, et ajoute les nouveaux à la fin', () => {
    const layout = normalizeCalendarMonthTileLayout({
      order: ['running', 'training'],
      hidden: ['running']
    });
    expect(layout.order[0]).toBe('running');
    expect(layout.order[1]).toBe('training');
    expect(layout.order).toContain('weekReps');
    expect(layout.order).toContain('activityKcal');
    expect(layout.hidden).toEqual(['running']);
    const shown = layout.order.filter((id) => !layout.hidden.includes(id));
    expect(shown[0]).toBe('training');
    expect(shown).toContain('weekKm');
  });

  it('regroupe les blocs dans l’ordre des sections de la carte', () => {
    const layout = normalizeCalendarMonthTileLayout({
      order: ['steps', 'training', 'weekReps', 'highlights', 'running', 'weekKm'],
      hidden: []
    });
    const sections = orderedCalendarMonthSections(layout).map((section) => section.id);
    expect(sections.slice(0, 3)).toEqual(['steps', 'training', 'running']);
    const flipped = [...orderedCalendarMonthSections(layout)].reverse();
    const order = layoutOrderFromSections(flipped, layout);
    expect(order[0]).toBe('recovery');
    expect(order.indexOf('steps')).toBeGreaterThan(order.indexOf('training'));
  });
});
