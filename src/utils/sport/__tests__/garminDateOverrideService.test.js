import { describe, expect, it } from 'vitest';
import {
  buildAggregateWithGarminDateOverride,
  buildAggregateWithSessionLogicalDate,
  describeSessionCalendarDates
} from '../../../services/sport/GarminDateOverrideService';

describe('GarminDateOverrideService', () => {
  it('persiste override par garminId', () => {
    const base = { garminActivityDateOverrides: {} };
    const next = buildAggregateWithGarminDateOverride(base, {
      garminId: 'g99',
      logicalDate: '2026-06-02'
    });
    expect(next.garminActivityDateOverrides.g99.logicalDate).toBe('2026-06-02');
  });

  it('logicalDate sur session endurance', () => {
    const base = {
      enduranceData: {
        sessions: {
          running: [{ id: 'r1', date: '2026-06-03', distance: 5 }]
        }
      }
    };
    const next = buildAggregateWithSessionLogicalDate(base, {
      sessionId: 'r1',
      activityType: 'running',
      logicalDate: '2026-06-01'
    });
    expect(next.enduranceData.sessions.running[0].logicalDate).toBe('2026-06-01');
  });

  it('describeSessionCalendarDates détecte réaffectation', () => {
    const agg = {
      garminActivityDateOverrides: { g1: { logicalDate: '2026-06-01' } }
    };
    const d = describeSessionCalendarDates({ date: '2026-06-03', garminId: 'g1' }, agg);
    expect(d.isReassigned).toBe(true);
    expect(d.logicalDate).toBe('2026-06-01');
    expect(d.recordedDate).toBe('2026-06-03');
  });
});
