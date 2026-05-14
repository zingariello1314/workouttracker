import { describe, it, expect } from 'vitest';
import {
  safeParseWorkoutAggregateSnapshotGetV1,
  safeParseWorkoutAggregateSnapshotPutBodyV1,
  safeParseWorkoutAggregateSnapshotPutResponseV1
} from '../workoutAggregateSnapshot.v1.js';

describe('workoutAggregateSnapshot.v1', () => {
  it('parse GET', () => {
    const r = safeParseWorkoutAggregateSnapshotGetV1({
      aggregate: { checkedExercises: {}, lastSaved: '2026-01-01T00:00:00Z' },
      updatedAt: '2026-01-01T00:00:00Z'
    });
    expect(r.success).toBe(true);
  });

  it('parse PUT body', () => {
    const r = safeParseWorkoutAggregateSnapshotPutBodyV1({
      clientMutationId: 'w1',
      aggregate: { reps: { a: '1' } }
    });
    expect(r.success).toBe(true);
  });

  it('refuse clientMutationId vide', () => {
    const r = safeParseWorkoutAggregateSnapshotPutBodyV1({
      clientMutationId: '',
      aggregate: {}
    });
    expect(r.success).toBe(false);
  });

  it('parse PUT response', () => {
    const r = safeParseWorkoutAggregateSnapshotPutResponseV1({
      accepted: true,
      clientMutationId: 'w1',
      updatedAt: '2026-01-02T00:00:00Z',
      aggregate: {}
    });
    expect(r.success).toBe(true);
  });
});
