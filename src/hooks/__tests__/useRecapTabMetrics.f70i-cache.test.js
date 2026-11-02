import { describe, expect, it } from 'vitest';
import {
  countInsightCards,
  resolveWorkoutCachePolicy
} from '../useRecapTabMetrics.js';

describe('F7.0i — politique cache workout / publication', () => {
  it('refuse un bundle d’une autre période (miss)', () => {
    expect(
      resolveWorkoutCachePolicy({
        stalePeriod: '30d',
        requestedPeriod: '1y',
        staleFullKey: 'a|g1',
        requestedFullKey: 'b|g1',
        pending: false,
        ready: true
      })
    ).toBe('miss');
  });

  it('ready seulement si fullKey identique', () => {
    expect(
      resolveWorkoutCachePolicy({
        stalePeriod: '30d',
        requestedPeriod: '30d',
        staleFullKey: 'wk|garmin:10',
        requestedFullKey: 'wk|garmin:10',
        pending: false,
        ready: true
      })
    ).toBe('ready');
  });

  it('refresh si fullKey diverge (Garmin / révision) — cause du 3→17', () => {
    expect(
      resolveWorkoutCachePolicy({
        stalePeriod: '30d',
        requestedPeriod: '30d',
        staleFullKey: 'wk|garmin:partial',
        requestedFullKey: 'wk|garmin:full',
        pending: false,
        ready: true
      })
    ).toBe('refresh');
  });

  it('refresh si pending', () => {
    expect(
      resolveWorkoutCachePolicy({
        stalePeriod: '30d',
        requestedPeriod: '30d',
        staleFullKey: 'wk|g',
        requestedFullKey: 'wk|g',
        pending: true,
        ready: true
      })
    ).toBe('refresh');
  });

  it('countInsightCards additionne les trois colonnes', () => {
    expect(
      countInsightCards({
        shortTerm: [{ title: 'a' }, { title: 'b' }],
        mediumTerm: [{ title: 'c' }],
        longTerm: []
      })
    ).toBe(3);
  });
});
