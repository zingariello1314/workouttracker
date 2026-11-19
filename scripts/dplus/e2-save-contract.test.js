/**
 * Contrat proposé, appliqué à côté du vrai updateData.
 * Le hook de production n'est pas modifié. Clé isolée, deferLoad, dépôt injecté.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyObservedSave, SaveIssue } from './saveOutcome.mjs';

const state = {
  rows: new Map(),
  mode: 'ok',
  puts: 0
};
globalThis.__E2_REPO_STATE = state;

vi.mock('../../src/services/workout/createWorkoutRepository.js', () => ({
  createWorkoutRepository: () => ({
    async saveRawWorkoutRow(key, row) {
      const current = globalThis.__E2_REPO_STATE;
      if (current.mode === 'abort-before' || current.mode === 'timeout-before') {
        const error = new Error(current.mode === 'abort-before' ? 'AbortError' : 'IDB_OPERATION_TIMEOUT');
        if (current.mode === 'abort-before') error.name = 'AbortError';
        throw error;
      }
      current.puts += 1;
      current.rows.set(key, row);
      if (current.mode === 'timeout-after' || current.mode === 'response-lost') {
        throw new Error('IDB_OPERATION_TIMEOUT');
      }
    },
    async loadRawWorkoutRow(key) {
      if (globalThis.__E2_REPO_STATE.mode === 'reread-throws') {
        throw new Error('READ_FAILED');
      }
      return globalThis.__E2_REPO_STATE.rows.get(key) || null;
    }
  })
}));

vi.mock('../../src/services/workout/workoutAggregateCloudSync.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, isWorkoutAggregateCloudSyncEnabled: () => false };
});

const { useWorkoutData } = await import('../../src/hooks/useWorkoutData.js');

const SCOPE = 'e2-synthetic-scope';

function payload(note = 'base') {
  return {
    checkedExercises: { '2026-06-01_1': true },
    reps: { '2026-06-01_1': '10' },
    checkedStretches: {},
    enduranceData: {
      marker: note,
      sessions: { pushups: [{ id: 'pu_1', reps: 20 }] },
      challenges: [],
      gtg: { days: { '2026-06-01': { adHoc: [{ id: 'ah_1', reps: 5 }] } } }
    }
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

function decide({ ack, timedOut, aborted, note, baseMatchedExpected = false, operationIdSeen = () => false }) {
  return classifyObservedSave({
    ack,
    timedOut,
    aborted,
    baseMatchedExpected,
    read: () => {
      if (state.mode === 'reread-throws') throw new Error('READ_FAILED');
      return state.rows.get(SCOPE) || null;
    },
    expected: (row) => row?.enduranceData?.marker === note,
    operationIdSeen
  });
}

beforeEach(() => {
  state.rows = new Map();
  state.mode = 'ok';
  state.puts = 0;
});

describe('contrat proposé sur le vrai updateData', () => {
  it('commit réussi : ack et relecture, effets seulement ensuite', async () => {
    const { result } = hook();
    let effects = 0;
    await result.current.updateData(payload('ok'));
    const outcome = decide({ ack: true, note: 'ok' });
    expect(outcome.issue).toBe(SaveIssue.SUCCESS);
    expect(outcome.provenOperation).toBe(false);
    if (outcome.businessEffects) effects += 1;
    expect(effects).toBe(1);
    expect(state.puts).toBe(1);
    expect(state.rows.get(SCOPE).enduranceData.marker).toBe('ok');
  });

  it('abort confirmé : rien écrit, saisie conservée, pas d’effet', async () => {
    state.mode = 'abort-before';
    const { result } = hook();
    const draft = payload('saisie');
    await expect(result.current.updateData(draft, { strict: true })).rejects.toThrow('AbortError');
    const outcome = decide({ aborted: true, note: 'saisie' });
    expect(outcome.issue).toBe(SaveIssue.FAILURE);
    expect(outcome.businessEffects).toBe(false);
    expect(outcome.sameOperationId).toBe(true);
    expect(state.puts).toBe(0);
    expect(draft.enduranceData.marker).toBe('saisie');
  });

  it('timeout avant commit : la promesse non stricte passe, la valeur est absente', async () => {
    state.mode = 'timeout-before';
    const { result } = hook();
    await expect(result.current.updateData(payload('avant'))).resolves.toBeUndefined();
    const outcome = decide({ timedOut: true, note: 'avant' });
    expect(outcome).toMatchObject({ issue: SaveIssue.FAILURE, retry: true, businessEffects: false });
    expect(state.puts).toBe(0);
  });

  it('timeout après commit : la donnée est là, l’opération reste indéterminée sans identifiant', async () => {
    state.mode = 'timeout-after';
    const { result } = hook();
    await expect(result.current.updateData(payload('apres'), { strict: true })).rejects.toThrow(
      'IDB_OPERATION_TIMEOUT'
    );
    const outcome = decide({ timedOut: true, note: 'apres' });
    expect(outcome.issue).toBe(SaveIssue.UNKNOWN);
    expect(outcome.retry).toBe(false);
    expect(outcome.businessEffects).toBe(false);
    expect(state.rows.get(SCOPE).enduranceData.marker).toBe('apres');
    expect(state.puts).toBe(1);
  });

  it('réponse perdue : même classement que le timeout après commit', async () => {
    state.mode = 'response-lost';
    const { result } = hook();
    await expect(result.current.updateData(payload('perdue'))).resolves.toBeUndefined();
    const outcome = decide({ timedOut: true, note: 'perdue' });
    expect(outcome.reason).toBe('timeout-value-present-operation-unproven');
    expect(state.puts).toBe(1);
  });

  it('relecture impossible : UNKNOWN, aucun réessai', async () => {
    state.mode = 'timeout-after';
    const { result } = hook();
    await expect(result.current.updateData(payload('lu'), { strict: true })).rejects.toThrow();
    state.mode = 'reread-throws';
    const outcome = decide({ timedOut: true, note: 'lu' });
    expect(outcome).toMatchObject({ issue: SaveIssue.UNKNOWN, retry: false, reason: 'reread-failed' });
  });

  it('deux écritures concurrentes : la valeur perdante n’est pas un succès', async () => {
    const { result } = hook();
    const first = payload('A');
    const second = payload('B');
    await Promise.all([
      result.current.saveToDB(first),
      result.current.saveToDB(second)
    ]);
    expect(state.puts).toBe(2);
    const stored = state.rows.get(SCOPE).enduranceData.marker;
    const loser = stored === 'A' ? 'B' : 'A';
    const winner = decide({ ack: true, note: stored });
    const lost = decide({ ack: true, note: loser });
    expect(winner.issue).toBe(SaveIssue.SUCCESS);
    expect(lost).toMatchObject({ issue: SaveIssue.UNKNOWN, reason: 'ack-then-superseded', businessEffects: false });
  });

  it('réessai du même payload : le remplacement de ligne ne duplique pas le passage', async () => {
    const { result } = hook();
    const body = payload('meme');
    await result.current.updateData(body);
    await result.current.updateData(body);
    expect(state.puts).toBe(2);
    expect(state.rows.get(SCOPE).enduranceData.gtg.days['2026-06-01'].adHoc).toHaveLength(1);
    const outcome = decide({ ack: true, note: 'meme', baseMatchedExpected: true });
    expect(outcome.issue).toBe(SaveIssue.SUCCESS);
    expect(outcome.provenOperation).toBe(false);
  });

  it('identifiant déjà présent : un timeout ne devient pas une preuve', async () => {
    const { result } = hook();
    const body = payload('id');
    body.enduranceData = { ...body.enduranceData, operationId: 'op-1' };
    await result.current.updateData(body);
    state.mode = 'timeout-after';
    await expect(result.current.updateData(body, { strict: true })).rejects.toThrow('IDB_OPERATION_TIMEOUT');
    const reused = decide({
      timedOut: true,
      note: 'id',
      baseMatchedExpected: true,
      operationIdSeen: () => false
    });
    expect(reused.issue).toBe(SaveIssue.UNKNOWN);
    expect(reused.reason).toBe('timeout-same-value-unproven');

    state.rows.clear();
    state.mode = 'timeout-after';
    state.puts = 0;
    const fresh = payload('neuf');
    fresh.enduranceData = { ...fresh.enduranceData, operationId: 'op-2' };
    await expect(result.current.updateData(fresh, { strict: true })).rejects.toThrow();
    const introduced = decide({
      timedOut: true,
      note: 'neuf',
      operationIdSeen: (row) => row?.enduranceData?.operationId === 'op-2'
    });
    expect(introduced.issue).toBe(SaveIssue.SUCCESS);
    expect(introduced.provenOperation).toBe(true);
  });

  it('strict et non strict : le timeout après commit écrit dans les deux cas', async () => {
    const loose = hook();
    state.mode = 'timeout-after';
    await expect(loose.result.current.updateData(payload('loose'))).resolves.toBeUndefined();
    expect(state.puts).toBe(1);
    const strict = hook();
    await expect(strict.result.current.updateData(payload('strict'), { strict: true })).rejects.toThrow(
      'IDB_OPERATION_TIMEOUT'
    );
    expect(state.puts).toBe(2);
    expect(state.rows.get(SCOPE).enduranceData.marker).toBe('strict');
  });

  it('reactOnly n’écrit pas', async () => {
    const { result } = hook();
    await result.current.updateData({ ...payload('memoire'), note: 'memoire' }, { reactOnly: true });
    expect(state.puts).toBe(0);
    expect(state.rows.size).toBe(0);
    await waitFor(() => {
      expect(result.current.data?.note).toBe('memoire');
    });
  });

  it('UNKNOWN ne déclenche pas l’effet métier et garde la saisie', async () => {
    state.mode = 'timeout-after';
    const { result } = hook();
    const draft = payload('garde');
    let effects = 0;
    await expect(result.current.updateData(draft, { strict: true })).rejects.toThrow();
    const outcome = decide({ timedOut: true, note: 'garde' });
    if (outcome.issue === SaveIssue.SUCCESS) effects += 1;
    expect(effects).toBe(0);
    expect(draft.enduranceData.marker).toBe('garde');
    expect(state.rows.get(SCOPE).enduranceData.marker).toBe('garde');
  });
});
