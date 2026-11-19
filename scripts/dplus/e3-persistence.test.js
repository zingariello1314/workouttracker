/**
 * Niveau 2 : vrai updateData / saveToDB / persistEnduranceData.
 * Clé isolée, deferLoad, dépôt injecté. Le profil réel n'est pas ouvert.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildWorkoutAfterEnduranceSession } from '../../src/services/endurance/enduranceSessionPersist.js';
import { persistEnduranceData } from '../../src/services/endurance/enduranceDataService.js';
import '../../src/components/tabs/TodayTab/components/GtgTodaySchedulePanel.jsx';
import '../../src/components/tabs/TodayTab/components/PushupChallengeTodayPanel.jsx';
import '../../src/components/tabs/EnduranceTab/components/GtgSessionsPanel.jsx';
import '../../src/components/tabs/EnduranceTab/components/GtgProtocolDataBanner.jsx';
import '../../src/components/tabs/EnduranceTab/components/GtgProtocolGuide.jsx';
import {
  classifySaveOutcome,
  isConfirmedSave,
  saveOutcomeNotice,
  SaveStatus
} from '../../src/services/workout/saveOutcome.js';

const state = { rows: new Map(), mode: 'ok', puts: 0, rereadThrows: false };
globalThis.__E3_REPO_STATE = state;

vi.mock('../../src/services/workout/createWorkoutRepository.js', () => ({
  createWorkoutRepository: () => ({
    async saveRawWorkoutRow(key, row) {
      const current = globalThis.__E3_REPO_STATE;
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
      const current = globalThis.__E3_REPO_STATE;
      if (current.rereadThrows || current.mode === 'reread-throws') throw new Error('READ_FAILED');
      return current.rows.get(key) || null;
    }
  })
}));

vi.mock('../../src/services/workout/workoutAggregateCloudSync.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, isWorkoutAggregateCloudSyncEnabled: () => false };
});

const { useWorkoutData } = await import('../../src/hooks/useWorkoutData.js');

const SCOPE = 'e3-synthetic-scope';

function payload(marker = 'base') {
  return {
    checkedExercises: { '2026-06-01_1': true },
    reps: { '2026-06-01_1': '10' },
    checkedStretches: {},
    enduranceData: {
      marker,
      sessions: { pushups: [{ id: 'pu_1', reps: 20 }], gtg: [{ id: 'list_1' }] },
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

beforeEach(() => {
  state.rows = new Map();
  state.mode = 'ok';
  state.puts = 0;
  state.rereadThrows = false;
  window.workoutContextCallback = undefined;
});

describe('classement sans dépôt', () => {
  it('T5 une valeur identique sans identifiant d’opération n’est pas un succès', () => {
    const outcome = classifySaveOutcome({
      operationId: 'op-nouveau',
      acked: false,
      timedOut: true,
      row: { enduranceData: { marker: 'same' }, saveOperationId: 'op-ancien' }
    });
    expect(outcome.status).toBe(SaveStatus.UNKNOWN);
    expect(outcome.reason).toBe('other-operation-stored');
    expect(saveOutcomeNotice(outcome)).not.toMatch(/enregistr/i);
    expect(isConfirmedSave(outcome)).toBe(false);
  });
});

describe('contrat opt-in sur le vrai updateData', () => {
  it('T1 écriture acquittée : l’identifiant relu confirme', async () => {
    const { result } = hook();
    let effects = 0;
    window.workoutContextCallback = () => {
      effects += 1;
    };
    const outcome = await result.current.updateData(payload('ok'), { reportOutcome: true });
    expect(outcome.status).toBe(SaveStatus.SUCCESS);
    expect(outcome.evidence.acked).toBe(true);
    expect(outcome.evidence.storedOperationId).toBe(outcome.operationId);
    expect(effects).toBe(1);
    expect(state.puts).toBe(1);
  });

  it('T2 abort avant écriture : FAILURE, saisie conservée, aucun effet', async () => {
    state.mode = 'abort-before';
    const { result } = hook();
    let effects = 0;
    window.workoutContextCallback = () => {
      effects += 1;
    };
    const draft = payload('saisie');
    const outcome = await result.current.updateData(draft, { reportOutcome: true });
    expect(outcome.status).toBe(SaveStatus.FAILURE);
    expect(effects).toBe(0);
    expect(state.puts).toBe(0);
    expect(draft.enduranceData.marker).toBe('saisie');
    expect(saveOutcomeNotice(outcome)).toMatch(/conservée/);
  });

  it('T3 timeout avant écriture : UNKNOWN, pas un échec certain', async () => {
    state.mode = 'timeout-before';
    const { result } = hook();
    const outcome = await result.current.updateData(payload('avant'), { reportOutcome: true });
    expect(outcome.status).toBe(SaveStatus.UNKNOWN);
    expect(outcome.reason).toBe('timeout-operation-unproven');
    expect(state.puts).toBe(0);
  });

  it('T4 timeout après écriture : l’identifiant relu donne SUCCESS', async () => {
    state.mode = 'timeout-after';
    const { result } = hook();
    let effects = 0;
    window.workoutContextCallback = () => {
      effects += 1;
    };
    const outcome = await result.current.updateData(payload('apres'), { reportOutcome: true });
    expect(outcome.status).toBe(SaveStatus.SUCCESS);
    expect(outcome.reason).toBe('operation-id-after-timeout');
    expect(effects).toBe(1);
    expect(state.rows.get(SCOPE).saveOperationId).toBe(outcome.operationId);
  });

  it('T5 T6 relecture conforme sans notre identifiant, puis relecture impossible', async () => {
    state.rows.set(SCOPE, payload('same'));
    state.mode = 'timeout-before';
    const { result } = hook();
    const matched = await result.current.updateData(payload('same'), { reportOutcome: true });
    expect(matched.status).toBe(SaveStatus.UNKNOWN);
    expect(matched.evidence.storedOperationId).toBeNull();

    state.mode = 'timeout-after';
    state.rereadThrows = true;
    const lost = await result.current.updateData(payload('lu'), { reportOutcome: true });
    expect(lost.status).toBe(SaveStatus.UNKNOWN);
    expect(lost.reason).toBe('reread-failed');
    expect(isConfirmedSave(lost)).toBe(false);
  });

  it('T7 deux écritures concurrentes : le perdant n’hérite pas du succès', async () => {
    const { result } = hook();
    const first = payload('A');
    first.saveOperationId = 'op-a';
    const second = payload('B');
    second.saveOperationId = 'op-b';
    await Promise.all([
      result.current.saveToDB(first, { reportOutcome: true }),
      result.current.saveToDB(second, { reportOutcome: true })
    ]);
    const storedId = state.rows.get(SCOPE).saveOperationId;
    const loser = storedId === 'op-a' ? 'op-b' : 'op-a';
    const verdict = classifySaveOutcome({
      operationId: loser,
      acked: true,
      row: state.rows.get(SCOPE)
    });
    expect(verdict.status).toBe(SaveStatus.UNKNOWN);
    expect(verdict.reason).toBe('acked-then-superseded');
    expect(state.puts).toBe(2);
  });

  it('T8 T9 T12 même payload deux fois, puis deux opérations, sans doublon de passage', async () => {
    const { result } = hook();
    const body = payload('meme');
    const first = await result.current.updateData(body, { reportOutcome: true });
    const second = await result.current.updateData(body, { reportOutcome: true });
    expect(first.status).toBe(SaveStatus.SUCCESS);
    expect(second.status).toBe(SaveStatus.SUCCESS);
    expect(state.rows.get(SCOPE).enduranceData.gtg.days['2026-06-01'].adHoc).toHaveLength(1);
    expect(state.puts).toBe(2);

    const other = await result.current.updateData(payload('autre'), { reportOutcome: true });
    expect(other.status).toBe(SaveStatus.SUCCESS);
    expect(other.operationId).not.toBe(second.operationId);
    expect(state.rows.get(SCOPE).enduranceData.marker).toBe('autre');
  });

  it('T10 T11 T18 GTG et pompes déjà écrits survivent à un payload vide', async () => {
    const { result } = hook();
    await result.current.updateData(payload('plein'), { reportOutcome: true });
    await waitFor(() => {
      expect(result.current.data?.enduranceData?.gtg?.days?.['2026-06-01']?.adHoc?.[0]?.id).toBe('ah_1');
    });
    const wiped = payload('vide');
    wiped.enduranceData = {
      ...wiped.enduranceData,
      sessions: { pushups: [], gtg: [] },
      gtg: { days: {} }
    };
    const outcome = await result.current.updateData(wiped, { reportOutcome: true });
    expect(outcome.status).toBe(SaveStatus.SUCCESS);
    const stored = state.rows.get(SCOPE).enduranceData;
    expect(stored.gtg.days['2026-06-01'].adHoc[0].id).toBe('ah_1');
    expect(stored.sessions.pushups[0].id).toBe('pu_1');
    expect(stored.sessions.gtg[0].id).toBe('list_1');
  });

  it('T13 T14 T16 UNKNOWN n’annonce pas un succès et ne lance pas l’effet', async () => {
    state.mode = 'timeout-before';
    const { result } = hook();
    let effects = 0;
    window.workoutContextCallback = () => {
      effects += 1;
    };
    const draft = payload('garde');
    const outcome = await result.current.updateData(draft, { reportOutcome: true });
    expect(outcome.status).toBe(SaveStatus.UNKNOWN);
    expect(effects).toBe(0);
    expect(isConfirmedSave(outcome)).toBe(false);
    expect(saveOutcomeNotice(outcome)).toMatch(/non confirmée/);
    expect(draft.enduranceData.marker).toBe('garde');
  });

  it('T15 la saisie reste après FAILURE', async () => {
    state.mode = 'abort-before';
    const { result } = hook();
    const draft = payload('reste');
    const outcome = await result.current.updateData(draft, { reportOutcome: true });
    expect(outcome.status).toBe(SaveStatus.FAILURE);
    expect(draft.enduranceData.gtg.days['2026-06-01'].adHoc).toHaveLength(1);
  });

  it('T17 sans opt-in le timeout après écriture reste une promesse résolue', async () => {
    const { result } = hook();
    state.mode = 'timeout-after';
    await expect(result.current.updateData(payload('legacy'))).resolves.toBeUndefined();
    expect(state.puts).toBe(1);
    expect(state.rows.get(SCOPE).saveOperationId).toBeUndefined();

    state.mode = 'abort-before';
    await expect(result.current.updateData(payload('strict'), { strict: true })).rejects.toThrow('AbortError');
  });

  it('persistEnduranceData ne change de retour que si reportOutcome est demandé', async () => {
    const { result } = hook();
    const current = { enduranceData: payload('svc').enduranceData };
    const plain = await persistEnduranceData({
      currentData: current,
      patch: { sessions: { pushups: [{ id: 'pu_2', reps: 30 }] } },
      updateData: result.current.updateData
    });
    expect(plain.saveOutcome).toBeUndefined();
    expect(plain.enduranceData.sessions.gtg[0].id).toBe('list_1');

    const reported = await persistEnduranceData({
      currentData: current,
      patch: { sessions: { pushups: [{ id: 'pu_3', reps: 40 }] } },
      updateData: result.current.updateData,
      reportOutcome: true
    });
    expect(reported.saveOutcome.status).toBe(SaveStatus.SUCCESS);
    expect(reported.data.enduranceData.sessions.pushups[0].id).toBe('pu_3');
  });

  it('deux constructions de la même séance pompes ne la dupliquent pas', async () => {
    const base = { enduranceData: { sessions: { pushups: [] }, challenges: [] } };
    const session = { id: 'pu_stable', date: '2026-06-01', count: 20, duration: 2 };
    const first = await buildWorkoutAfterEnduranceSession({
      workoutData: base,
      activityType: 'pushups',
      sessionData: session,
      mode: 'append'
    });
    const second = await buildWorkoutAfterEnduranceSession({
      workoutData: first.workoutPayload,
      activityType: 'pushups',
      sessionData: session,
      mode: 'append'
    });
    expect(second.workoutPayload.enduranceData.sessions.pushups).toHaveLength(1);
    expect(second.workoutPayload.enduranceData.sessions.pushups[0].id).toBe('pu_stable');
  });
});
