import { describe, it, expect } from 'vitest';
import {
  pickNewerWorkoutRawForLoad,
  normalizeWorkoutAggregateRawForIdb,
  mergeCloudWinningRowOverLocal
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

  it('pickNewer cloud plus récent garde les reps / coches présents seulement en local', () => {
    const local = {
      id: 'user-1',
      lastSaved: '2026-01-01T10:00:00.000Z',
      reps: { onlyLocal: '5', shared: '1' },
      checkedExercises: { day_x: true }
    };
    const remote = {
      aggregate: {
        lastSaved: '2026-01-02T10:00:00.000Z',
        reps: { shared: '2' },
        checkedExercises: {}
      },
      updatedAt: '2026-01-02T10:00:00.000Z'
    };
    const out = pickNewerWorkoutRawForLoad(local, remote, 'user-1');
    expect(out?.reps?.onlyLocal).toBe('5');
    expect(out?.reps?.shared).toBe('2');
    expect(out?.checkedExercises?.day_x).toBe(true);
  });

  it('mergeCloudWinningRowOverLocal fusionne exerciseSetWeights par exercice', () => {
    const local = {
      id: 'u',
      exerciseSetWeights: { ex1: { s0: '10' }, ex2: { s0: '1' } }
    };
    const cloud = {
      id: 'u',
      lastSaved: '2026-01-03T00:00:00.000Z',
      exerciseSetWeights: { ex1: { s0: '12', s1: '8' } }
    };
    const out = mergeCloudWinningRowOverLocal(local, cloud, 'u');
    expect(out.exerciseSetWeights.ex1.s0).toBe('12');
    expect(out.exerciseSetWeights.ex1.s1).toBe('8');
    expect(out.exerciseSetWeights.ex2.s0).toBe('1');
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

  it('pickNewer garde le local si l’agrégat cloud n’a pas de lastSaved (ignore updatedAt serveur)', () => {
    const local = {
      id: 'main',
      lastSaved: '2026-01-01T10:00:00.000Z',
      reps: { '2026-05-14_101': '10' },
      checkedExercises: { '2026-05-14_101': true }
    };
    const remote = {
      aggregate: { weekVariant: 'A' },
      updatedAt: '2099-12-31T23:59:59.000Z'
    };
    const out = pickNewerWorkoutRawForLoad(local, remote, 'main');
    expect(out).toBe(local);
  });

  it('pickNewer sans local accepte un cloud sans lastSaved (première hydratation)', () => {
    const remote = {
      aggregate: { weekVariant: 'B', reps: {} },
      updatedAt: '2026-01-01T00:00:00.000Z'
    };
    const out = pickNewerWorkoutRawForLoad(null, remote, 'user-7');
    expect(out?.id).toBe('user-7');
    expect(out?.weekVariant).toBe('B');
  });

  it('normalizeWorkoutAggregateRawForIdb force id', () => {
    const n = normalizeWorkoutAggregateRawForIdb({ reps: { x: '1' }, lastSaved: 't' }, 'user-1');
    expect(n.id).toBe('user-1');
  });
});
