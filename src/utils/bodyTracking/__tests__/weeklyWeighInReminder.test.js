import { describe, it, expect } from 'vitest';
import {
  computeWeeklyWeighInReminder,
  lastDueWeighInDate,
  mondayOfWeek,
  weighInReminderTitleFr
} from '../weeklyWeighInReminder';

describe('weeklyWeighInReminder', () => {
  it('affiche le jour dû (dimanche) — legacy', () => {
    const r = computeWeeklyWeighInReminder({
      weeklyWeighInDay: 0,
      viewDate: new Date(2026, 4, 31),
      progressEntries: []
    });
    expect(r.show).toBe(true);
    expect(r.daysOverdue).toBe(0);
    expect(r.dueDateYmd).toBe('2026-05-31');
  });

  it('compte les jours de retard — legacy', () => {
    const r = computeWeeklyWeighInReminder({
      weeklyWeighInDay: 0,
      viewDate: new Date(2026, 5, 2),
      progressEntries: []
    });
    expect(r.show).toBe(true);
    expect(r.daysOverdue).toBe(2);
    expect(weighInReminderTitleFr(2)).toMatch(/2 jours/);
  });

  it('masque si impédance dans la fenêtre — legacy', () => {
    const r = computeWeeklyWeighInReminder({
      weeklyWeighInDay: 0,
      viewDate: new Date(2026, 5, 3),
      progressEntries: [{ type: 'impedance', date: '2026-06-01' }]
    });
    expect(r.show).toBe(false);
  });

  it('lastDueWeighInDate retourne le dimanche précédent', () => {
    const d = lastDueWeighInDate(new Date(2026, 5, 3), 0);
    expect(d.getDay()).toBe(0);
    expect(d.getDate()).toBe(31);
    expect(d.getMonth()).toBe(4);
  });

  it('régime 2×/semaine : reste des pesées jusqu’au quota', () => {
    const prefs = {
      weighInAnchorDate: '2026-06-01',
      weighInsPerWeek: 2,
      weighInWeekdays: [1, 4]
    };
    const wed = computeWeeklyWeighInReminder({
      prefs,
      viewDate: new Date(2026, 5, 3),
      progressEntries: []
    });
    expect(mondayOfWeek(new Date(2026, 5, 3)).getDate()).toBe(1);
    expect(wed.show).toBe(true);
    expect(wed.remaining).toBe(2);
    expect(wed.isDueToday).toBe(false);

    const afterOne = computeWeeklyWeighInReminder({
      prefs,
      viewDate: new Date(2026, 5, 4),
      progressEntries: [{ type: 'impedance', date: '2026-06-01' }]
    });
    expect(afterOne.remaining).toBe(1);
    expect(afterOne.show).toBe(true);
    expect(afterOne.isDueToday).toBe(true);

    const done = computeWeeklyWeighInReminder({
      prefs,
      viewDate: new Date(2026, 5, 5),
      progressEntries: [
        { type: 'impedance', date: '2026-06-01' },
        { type: 'impedance', date: '2026-06-04' }
      ]
    });
    expect(done.show).toBe(false);
    expect(done.remaining).toBe(0);
  });

  it('masque avant la date d’ancrage du régime', () => {
    const r = computeWeeklyWeighInReminder({
      prefs: { weighInAnchorDate: '2026-06-10', weighInsPerWeek: 1, weighInWeekdays: [3] },
      viewDate: new Date(2026, 5, 3),
      progressEntries: []
    });
    expect(r.show).toBe(false);
  });
});
