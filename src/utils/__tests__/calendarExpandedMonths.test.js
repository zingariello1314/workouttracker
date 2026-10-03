import { describe, expect, it, beforeEach } from 'vitest';
import {
  calendarExpandedMonthsKey,
  isCalendarMonthExpanded,
  setCalendarMonthExpanded
} from '../calendarExpandedMonths';

describe('mois dépliés du calendrier', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mémorise les mois dépliés pour un utilisateur, pas pour un autre', () => {
    setCalendarMonthExpanded('12', '2026-5', true);
    setCalendarMonthExpanded('12', '2026-9', true);
    setCalendarMonthExpanded('12', '2026-5', false);

    expect(isCalendarMonthExpanded('12', '2026-5')).toBe(false);
    expect(isCalendarMonthExpanded('12', '2026-9')).toBe(true);
    expect(isCalendarMonthExpanded('4', '2026-9')).toBe(false);
    expect(localStorage.getItem(calendarExpandedMonthsKey('12'))).toBe(JSON.stringify(['2026-9']));
  });
});
