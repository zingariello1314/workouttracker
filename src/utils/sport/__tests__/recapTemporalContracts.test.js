import { describe, expect, it } from 'vitest';
import {
  WINDOW_ROLE,
  primaryWindowForPeriod,
  previousEqualLengthWindow,
  journeyHistoricalWindow,
  assertFactRoleAllowed,
  assessWindowComparability,
  todayWindowMode,
  calendarDayEvidence,
  FIXED_HISTORICAL_HORIZONS
} from '../recapTemporalContracts';
import { getRecapDateWindow, RECAP_PERIOD_SPANS } from '../recapMuscleLoadEngine';

describe('recapTemporalContracts F2', () => {
  it('getRecapDateWindow today = jour calendaire Europe/Paris', () => {
    expect(todayWindowMode().mode).toBe('calendar-day');
    const lateUtc = primaryWindowForPeriod('today', new Date('2026-11-18T23:30:00Z'));
    expect(lateUtc.start).toBe('2026-11-19');
    expect(lateUtc.end).toBe('2026-11-19');
    expect(lateUtc.spanDays).toBe(1);
    const eveningParis = primaryWindowForPeriod('today', new Date('2026-11-17T22:30:00Z'));
    expect(eveningParis.start).toBe('2026-11-17');
    expect(eveningParis.end).toBe('2026-11-17');
  });

  it('les huit périodes sont des dates inclusives Europe/Paris', () => {
    const ref = new Date('2026-11-18T15:00:00Z');
    expect(getRecapDateWindow('today', ref)).toMatchObject({
      start: '2026-11-18',
      end: '2026-11-18',
      mode: 'calendar-day',
      timeZone: 'Europe/Paris',
      partial: true
    });
    ['7d', '30d', '3m', '6m', '1y', '2y'].forEach((period) => {
      const window = getRecapDateWindow(period, ref);
      expect(window.end).toBe('2026-11-18');
      expect(window.spanDays).toBe(RECAP_PERIOD_SPANS[period]);
      expect(window.mode).toBe('inclusive-calendar');
      expect(window.timeZone).toBe('Europe/Paris');
      expect(window.partialEnd).toBe(true);
    });
    expect(getRecapDateWindow('all', ref).start).toBeNull();
    expect(calendarDayEvidence({ reps: {}, checkedExercises: {} }, '2026-11-18')).toBe('no-recording');
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
