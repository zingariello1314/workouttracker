import { describe, expect, it } from 'vitest';
import {
  resolveSessionCalendarDate,
  resolveGarminActivityCalendarDate,
  readGarminActivityDateOverrides
} from '../../sessionCalendarDate';

describe('sessionCalendarDate', () => {
  const overrides = {
    g42: { logicalDate: '2026-06-02', updatedAt: '2026-06-03T10:00:00Z' }
  };

  it('session.logicalDate prioritaire', () => {
    expect(
      resolveSessionCalendarDate({ date: '2026-06-03', logicalDate: '2026-06-01', garminId: 'g1' }, overrides)
    ).toBe('2026-06-01');
  });

  it('override global si pas de logicalDate sur session', () => {
    expect(resolveSessionCalendarDate({ date: '2026-06-03', garminId: 'g42' }, overrides)).toBe('2026-06-02');
  });

  it('fallback sur date enregistrée', () => {
    expect(resolveSessionCalendarDate({ date: '2026-06-05T08:00:00', id: 'local1' }, {})).toBe('2026-06-05');
  });

  it('resolveGarminActivityCalendarDate avec override', () => {
    expect(
      resolveGarminActivityCalendarDate(
        { garminId: 'g42', date: '2026-06-03', startTimeLocal: '2026-06-03 20:22:00' },
        overrides
      )
    ).toBe('2026-06-02');
  });

  it('readGarminActivityDateOverrides lit racine ou enduranceData', () => {
    expect(readGarminActivityDateOverrides({ garminActivityDateOverrides: { a: { logicalDate: '2026-01-01' } } })).toEqual({
      a: { logicalDate: '2026-01-01' }
    });
    expect(
      readGarminActivityDateOverrides({
        enduranceData: { garminActivityDateOverrides: { b: { logicalDate: '2026-02-01' } } }
      }).b
    ).toEqual({ logicalDate: '2026-02-01' });
  });
});
