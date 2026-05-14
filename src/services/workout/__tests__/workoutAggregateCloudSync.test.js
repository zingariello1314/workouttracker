import { describe, it, expect } from 'vitest';
import {
  pickNewerWorkoutRawForLoad,
  normalizeWorkoutAggregateRawForIdb
} from '../workoutAggregateCloudSync.js';

describe('workoutAggregateCloudSync', () => {
  it('pickNewer préfère le cloud si lastSaved plus récent', () => {
    const local = { id: 'user-1', lastSaved: '2026-01-01T10:00:00.000Z', reps: { a: '1' } };
    const remote = {
      aggregate: { lastSaved: '2026-01-02T10:00:00.000Z', reps: { a: '2' } },
      updatedAt: '2026-01-02T10:00:00.000Z'
    };
    const out = pickNewerWorkoutRawForLoad(local, remote, 'user-1');
    expect(out?.lastSaved).toBe('2026-01-02T10:00:00.000Z');
    expect(out?.reps?.a).toBe('2');
  });

  it('pickNewer garde le local si plus récent', () => {
    const local = { id: 'user-1', lastSaved: '2026-01-03T10:00:00.000Z', reps: { a: '9' } };
    const remote = {
      aggregate: { lastSaved: '2026-01-02T10:00:00.000Z', reps: { a: '2' } },
      updatedAt: '2026-01-02T10:00:00.000Z'
    };
    const out = pickNewerWorkoutRawForLoad(local, remote, 'user-1');
    expect(out).toBe(local);
  });

  it('pickNewer sans local prend le cloud', () => {
    const remote = {
      aggregate: { lastSaved: '2026-01-01T00:00:00.000Z', reps: {} },
      updatedAt: '2026-01-01T00:00:00.000Z'
    };
    const out = pickNewerWorkoutRawForLoad(null, remote, 'user-42');
    expect(out?.id).toBe('user-42');
  });

  it('normalizeWorkoutAggregateRawForIdb force id', () => {
    const n = normalizeWorkoutAggregateRawForIdb({ reps: { x: '1' }, lastSaved: 't' }, 'user-1');
    expect(n.id).toBe('user-1');
  });
});
