import { describe, expect, it } from 'vitest';
import {
  buildKmByDateFromRows,
  computeRunningVolumeTotals,
  filterSessionsForRunningVolume,
  mergeRunningSessionsWithGarmin,
  sumRunningKmFromRows
} from '../runningVolumeTruth';
import { buildRunningSessionRows } from '../runningCardioStatsAnalytics';

const garminA = {
  garminId: 'g1',
  date: '2026-01-10',
  distance: 5200,
  duration: 1800,
  activityType: 'running'
};

const garminB = {
  garminId: 'g2',
  date: '2026-01-12',
  distance: 8000,
  duration: 2700,
  activityType: 'running'
};

describe('runningVolumeTruth', () => {
  it('somme enrichie = répartition (session sans distance + Garmin)', () => {
    const sessions = [
      { id: 'g1', garminId: 'g1', date: '2026-01-10', duration: '30:00', source: 'garmin' },
      { id: 'local1', date: '2026-01-11', distance: 5, duration: '28:00' }
    ];
    const garminById = new Map([
      ['g1', garminA],
      ['g2', garminB]
    ]);
    const merged = mergeRunningSessionsWithGarmin(sessions, garminById);
    const vol = computeRunningVolumeTotals(merged, garminById, { period: 'all' });
    const rows = buildRunningSessionRows(merged, garminById);
    expect(vol.totalKm).toBe(sumRunningKmFromRows(rows));
    expect(vol.totalKm).toBeCloseTo(5.2 + 5 + 8, 1);
    expect(vol.sessionCount).toBe(3);
  });

  it('filtre période 7j cohérent entre sessions et rows', () => {
    const now = new Date('2026-01-15T12:00:00');
    const sessions = [
      { id: '1', date: '2026-01-14', distance: 4, duration: '24:00' },
      { id: '2', date: '2025-12-01', distance: 10, duration: '50:00' }
    ];
    const vol = computeRunningVolumeTotals(sessions, null, { period: '7', now });
    expect(vol.totalKm).toBe(4);
    expect(vol.sessionCount).toBe(1);
    expect(filterSessionsForRunningVolume(sessions, null, { period: '7', now })).toHaveLength(1);
  });

  it('buildKmByDateFromRows agrège par jour', () => {
    const rows = [
      { date: '2026-01-01', dist: 3.5 },
      { date: '2026-01-01', dist: 2 },
      { date: '2026-01-02', dist: 6 }
    ];
    const map = buildKmByDateFromRows(rows);
    expect(map.get('2026-01-01')).toBeCloseTo(5.5, 2);
    expect(map.get('2026-01-02')).toBe(6);
  });
});
