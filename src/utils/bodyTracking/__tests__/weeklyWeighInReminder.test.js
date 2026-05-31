import { describe, it, expect } from 'vitest';
import {
  computeWeeklyWeighInReminder,
  lastDueWeighInDate,
  weighInReminderTitleFr
} from '../weeklyWeighInReminder';

describe('weeklyWeighInReminder', () => {
  it('affiche le jour dû (dimanche)', () => {
    const r = computeWeeklyWeighInReminder({
      weeklyWeighInDay: 0,
      viewDate: new Date(2026, 4, 31),
      progressEntries: []
    });
    expect(r.show).toBe(true);
    expect(r.daysOverdue).toBe(0);
    expect(r.dueDateYmd).toBe('2026-05-31');
  });

  it('compte les jours de retard', () => {
    const r = computeWeeklyWeighInReminder({
      weeklyWeighInDay: 0,
      viewDate: new Date(2026, 5, 2),
      progressEntries: []
    });
    expect(r.show).toBe(true);
    expect(r.daysOverdue).toBe(2);
    expect(weighInReminderTitleFr(2)).toMatch(/2 jours/);
  });

  it('masque si impédance dans la fenêtre', () => {
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
});
