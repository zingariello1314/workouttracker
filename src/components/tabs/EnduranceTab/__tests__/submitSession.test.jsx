import { describe, it, expect, vi, afterAll } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import * as EnduranceDataService from '../../../services/endurance/enduranceDataService';
import * as EnduranceChallengesService from '../../../services/endurance/enduranceChallengesService';
import EnduranceTab from '../EnduranceTab.jsx';

vi.mock('../../../services/endurance/enduranceDataService', async (original) => {
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

vi.mock('../../../services/endurance/enduranceChallengesService', async (original) => {
  const actual = await original();
  return {
    ...actual,
    evaluateChallenges: vi.fn(() => ({
      validatedIds: ['challenge-test'],
      updatedChallenges: [{ id: 'challenge-test', status: 'completed' }]
    }))
  };
});

describe('EnduranceTab submitSession()', () => {
  it('ajoute une session et déclenche persistEnduranceData + reset du formulaire', async () => {
    const { result } = renderHook(() => EnduranceTab());

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
