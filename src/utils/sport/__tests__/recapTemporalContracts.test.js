import { describe, expect, it } from 'vitest';
import {
  WINDOW_ROLE,
  primaryWindowForPeriod,
  previousEqualLengthWindow,
  journeyHistoricalWindow,
  assertFactRoleAllowed,
  assessWindowComparability,
  todayWindowMode,
  FIXED_HISTORICAL_HORIZONS
} from '../recapTemporalContracts';

describe('recapTemporalContracts F2', () => {
  it('getRecapDateWindow today = rolling-24h', () => {
    expect(todayWindowMode().mode).toBe('rolling-24h');
    const w = primaryWindowForPeriod('today', new Date('2026-11-01T15:00:00'));
    expect(w.role).toBe(WINDOW_ROLE.PRIMARY);
    expect(w.end).toBe('2026-11-01');
    expect(w.start).toBeTruthy();
  });

  it('7d / 30d / 3m ont des spanDays cohérents', () => {
    const ref = new Date('2026-10-30T12:00:00');
    expect(primaryWindowForPeriod('7d', ref).spanDays).toBe(7);
    expect(primaryWindowForPeriod('30d', ref).spanDays).toBe(30);
    expect(primaryWindowForPeriod('3m', ref).spanDays).toBe(92);
  });

  it('période précédente de même durée', () => {
    const primary = { start: '2026-10-01', end: '2026-10-30', spanDays: 30 };
    const prev = previousEqualLengthWindow(primary);
    expect(prev.end).toBe('2026-09-30');
    expect(prev.spanDays).toBe(30);
    expect(prev.role).toBe(WINDOW_ROLE.COMPARISON);
  });

  it('journey 91j est HISTORICAL, pas primary', () => {
    const j = journeyHistoricalWindow('2026-10-30');
    expect(j.role).toBe(WINDOW_ROLE.HISTORICAL);
    expect(j.spanDays).toBe(FIXED_HISTORICAL_HORIZONS.JOURNEY_CONTEXT_DAYS + 1);
    expect(j.reason).toMatch(/parcours/i);
  });

  it('fait hors primary sans rôle historique → refus', () => {
    const primary = { start: '2026-10-24', end: '2026-10-30' };
    expect(assertFactRoleAllowed('2026-10-20', primary, WINDOW_ROLE.PRIMARY).ok).toBe(false);
    expect(assertFactRoleAllowed('2026-10-20', primary, WINDOW_ROLE.HISTORICAL).ok).toBe(true);
    expect(assertFactRoleAllowed('2026-10-25', primary, WINDOW_ROLE.PRIMARY).ok).toBe(true);
  });

  it('comparabilité signale durées inégales', () => {
    const a = { start: '2026-10-24', end: '2026-10-30', spanDays: 7 };
    const b = { start: '2026-10-01', end: '2026-10-30', spanDays: 30 };
    const c = assessWindowComparability(a, b);
    expect(c.equalCalendarLength).toBe(false);
    expect(c.comparableAsEqualLength).toBe(false);
  });

  it('Toujours (all) n’a pas de start — pas de previous equal length', () => {
    const w = primaryWindowForPeriod('all', new Date('2026-10-30T12:00:00'));
    expect(w.start).toBeNull();
    expect(previousEqualLengthWindow(w)).toBeNull();
  });
});
