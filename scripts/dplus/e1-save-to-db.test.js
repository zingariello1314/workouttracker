/**
 * Niveau 2 : le vrai updateData / saveToDB, dépôt remplacé.
 * deferLoad empêche toute lecture de la base du profil.
 * Le comportement de production n'est pas modifié : ces tests constatent le contrat actuel
 * et appliquent le classificateur expérimental à côté.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyCaughtSaveError, reconcileUnknown, SaveIssue } from './saveOutcome.mjs';

const state = {
  rows: new Map(),
  mode: 'ok',
  puts: 0
};
globalThis.__E1_REPO_STATE = state;

vi.mock('../../src/services/workout/createWorkoutRepository.js', () => ({
  createWorkoutRepository: () => ({
    async saveRawWorkoutRow(key, row) {
      const current = globalThis.__E1_REPO_STATE;
      if (current.mode === 'abort-before' || current.mode === 'timeout-before') {
        const error = new Error(current.mode === 'abort-before' ? 'AbortError' : 'IDB_OPERATION_TIMEOUT');
        if (current.mode === 'abort-before') error.name = 'AbortError';
        throw error;
      }
      current.puts += 1;
      current.rows.set(key, row);
      if (current.mode === 'timeout-after') {
        throw new Error('IDB_OPERATION_TIMEOUT');
      }
    },
    async loadRawWorkoutRow(key) {
      if (globalThis.__E1_REPO_STATE.mode === 'reread-throws') {
        throw new Error('READ_FAILED');
      }
      return globalThis.__E1_REPO_STATE.rows.get(key) || null;
    }
  })
}));

vi.mock('../../src/services/workout/workoutAggregateCloudSync.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isWorkoutAggregateCloudSyncEnabled: () => false
  };
});

const { useWorkoutData } = await import('../../src/hooks/useWorkoutData.js');

const SCOPE = 'e1-synthetic-scope';

function payload(extra = {}) {
  return {
    checkedExercises: { '2026-06-01_1': true },
    reps: { '2026-06-01_1': '10' },
    checkedStretches: {},
    enduranceData: {
      sessions: {
        pushups: [{ id: 'pu_1', reps: 20 }],
        gtg: [{ id: 'ah_1', reps: 5 }]
      },
      challenges: [],
      gtg: { days: { '2026-06-01': { adHoc: [{ id: 'ah_1', reps: 5 }] } } }
    },
    ...extra
  };
}

function hook() {
  return renderHook(() =>
    useWorkoutData({
      storageKey: SCOPE,
      generateTestData: false,
      deferLoad: true,
      ephemeral: false
    })
  );
}

beforeEach(() => {
  state.rows = new Map();
  state.mode = 'ok';
  state.puts = 0;
});

describe('vrai saveToDB — contrat actuel et réconciliation expérimentale', () => {
  it('A1 commit réussi puis timeout : la promesse de production réussit, la relecture évite un second put', async () => {
    state.mode = 'timeout-after';
    const { result } = hook();
    await expect(result.current.updateData(payload())).resolves.toBeUndefined();
    expect(state.puts).toBe(1);
    expect(state.rows.get(SCOPE)?.enduranceData?.gtg?.days?.['2026-06-01']?.adHoc?.[0]?.id).toBe('ah_1');

    const issue = classifyCaughtSaveError(new Error('IDB_OPERATION_TIMEOUT'));
    expect(issue).toBe(SaveIssue.UNKNOWN);
    const reconciled = reconcileUnknown({
      read: () => state.rows.get(SCOPE),
      markerPresent: (row) => row?.enduranceData?.sessions?.gtg?.[0]?.id === 'ah_1'
    });
    expect(reconciled).toEqual({ issue: SaveIssue.SUCCESS, retry: false, reason: 'reread-matched' });
    expect(state.puts).toBe(1);

    state.mode = 'ok';
    await result.current.updateData(payload());
    expect(state.puts).toBe(2);
  });

  it('A2 abort avant écriture : échec confirmé, rien en base, pas de second essai automatique', async () => {
    state.mode = 'abort-before';
    const { result } = hook();
    await expect(result.current.updateData(payload(), { strict: true })).rejects.toThrow('AbortError');
    expect(state.puts).toBe(0);
    const reconciled = reconcileUnknown({
      read: () => state.rows.get(SCOPE) || null,
      markerPresent: (row) => Boolean(row)
    });
    expect(reconciled.issue).toBe(SaveIssue.FAILURE);
    expect(reconciled.retry).toBe(true);
    expect(state.rows.size).toBe(0);
  });

  it('A2 non strict : un abort avant écriture ne jette pas, et rien n’est écrit', async () => {
    state.mode = 'abort-before';
    const { result } = hook();
    await expect(result.current.updateData(payload())).resolves.toBeUndefined();
    expect(state.puts).toBe(0);
    expect(state.rows.size).toBe(0);
  });

  it('A3 relecture impossible : UNKNOWN et aucun réessai', async () => {
    state.mode = 'timeout-before';
    const { result } = hook();
    await expect(result.current.updateData(payload())).resolves.toBeUndefined();
    expect(state.puts).toBe(0);
    state.mode = 'reread-throws';
    const reconciled = reconcileUnknown({
      read: () => {
        throw new Error('READ_FAILED');
      },
      markerPresent: () => true
    });
    expect(reconciled).toEqual({ issue: SaveIssue.UNKNOWN, retry: false, reason: 'reread-failed' });
    expect(state.puts).toBe(0);
  });

  it('A4 non strict : absence d’exception alors que le timeout a empêché l’écriture', async () => {
    state.mode = 'timeout-before';
    const { result } = hook();
    let threw = false;
    try {
      await result.current.updateData(payload());
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
    expect(state.puts).toBe(0);
    expect(classifyCaughtSaveError(new Error('IDB_OPERATION_TIMEOUT'))).toBe(SaveIssue.UNKNOWN);
  });

  it('A5 succès strict et non strict écrivent une fois ; le strict propage le timeout', async () => {
    const loose = hook();
    await loose.result.current.updateData(payload());
    expect(state.puts).toBe(1);

    state.mode = 'timeout-after';
    const strict = hook();
    await expect(strict.result.current.updateData(payload(), { strict: true })).rejects.toThrow(
      'IDB_OPERATION_TIMEOUT'
    );
  });

  it('A6 une liste de pompes vide ne les efface pas sur le vrai saveToDB', async () => {
    const { result } = hook();
    await result.current.updateData(payload());
    await waitFor(() => {
      expect(result.current.data?.enduranceData?.sessions?.pushups?.[0]?.id).toBe('pu_1');
    });
    const next = payload();
    next.enduranceData = {
      ...result.current.data.enduranceData,
      sessions: {
        ...result.current.data.enduranceData.sessions,
        pushups: []
      }
    };
    await result.current.updateData(next);
    const stored = state.rows.get(SCOPE);
    expect(stored.enduranceData.sessions.pushups).toHaveLength(1);
    expect(stored.enduranceData.sessions.pushups[0].id).toBe('pu_1');
  });

  it('E2.1 saveToDB conserve un GTG dont le payload suivant est vide', async () => {
    const { result } = hook();
    await result.current.updateData(payload());
    await waitFor(() => {
      expect(result.current.data?.enduranceData?.gtg?.days?.['2026-06-01']?.adHoc?.[0]?.id).toBe('ah_1');
    });
    const wiped = payload();
    wiped.enduranceData = {
      ...result.current.data.enduranceData,
      sessions: { ...result.current.data.enduranceData.sessions, gtg: [] },
      gtg: { days: {} }
    };
    await result.current.updateData(wiped);
    const stored = state.rows.get(SCOPE);
    expect(stored.enduranceData.gtg.days['2026-06-01'].adHoc[0].id).toBe('ah_1');
    expect(stored.enduranceData.sessions.gtg[0].id).toBe('ah_1');
    expect(stored.enduranceData.sessions.pushups[0].id).toBe('pu_1');
  });
});
