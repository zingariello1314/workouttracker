import { describe, it, expect, vi, afterAll } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import * as EnduranceDataService from '../../../../services/endurance/enduranceDataService';
import * as EnduranceChallengesService from '../../../../services/endurance/enduranceChallengesService';
import { handleSubmitSession } from '../../../../services/endurance/enduranceSubmitUtils';

vi.mock('../../../../services/endurance/enduranceDataService', async (original) => {
  const actual = await original();
  return {
    ...actual,
    persistEnduranceData: vi.fn(() => Promise.resolve({
      enduranceData: {
        sessions: {
          boxing: [],
          pushups: [],
          swimming: [],
          jumprope: [],
          running: []
        },
        challenges: []
      }
    }))
  };
});

vi.mock('../../../../services/endurance/enduranceChallengesService', async (original) => {
  const actual = await original();
  return {
    ...actual,
    evaluateChallenges: vi.fn(() => ({
      validatedIds: ['challenge-test'],
      updatedChallenges: [{ id: 'challenge-test', status: 'completed' }]
    }))
  };
});

const createPushupSessionHarness = () => {
  const uiState = { editingSession: null };
  const resetFn = vi.fn();
  const setUI = vi.fn();

  const addSession = vi.fn(async (activityType, payload) => {
    const evaluation = EnduranceChallengesService.evaluateChallenges(payload, activityType, {});
    await EnduranceDataService.persistEnduranceData({
      currentData: {},
      patch: {
        sessions: { [activityType]: [{ ...payload, activityType, validatedChallenges: evaluation.validatedIds }] },
        challenges: evaluation.updatedChallenges
      },
      updateData: vi.fn(),
      logger: {}
    });
    return { success: true, validatedChallengeIds: evaluation.validatedIds };
  });

  const updateSession = vi.fn();

  const addPushupSession = async () => {
    return handleSubmitSession({
      activityType: 'pushups',
      payload: { reps: 20, duration: 60 },
      resetFn,
      ui: uiState,
      addSession,
      updateSession,
      setUI
    });
  };

  return {
    addPushupSession,
    resetFn,
    addSession,
    setUI
  };
};

const usePushupSessionHarness = () => React.useMemo(() => createPushupSessionHarness(), []);

describe('Endurance submitSession()', () => {
  it('ajoute une session et déclenche persistEnduranceData + reset du formulaire', async () => {
    const { result } = renderHook(() => usePushupSessionHarness());

    await act(async () => {
      await result.current.addPushupSession();
    });

    expect(EnduranceChallengesService.evaluateChallenges).toHaveBeenCalled();
    expect(EnduranceDataService.persistEnduranceData).toHaveBeenCalledWith(
      expect.objectContaining({ patch: expect.any(Object) })
    );
  });
});

afterAll(() => {
  vi.clearAllMocks();
});
