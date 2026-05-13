import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchMomentumApiV1UserProfile,
  postMomentumApiV1IntentionsMutation,
  fetchMomentumApiV1IntentionsRecent,
  postMomentumApiV1XpPortVerify,
  fetchMomentumApiV1ServerTime
} from '../fetchMomentumApiV1.js';

describe('fetchMomentumApiV1 (Phase 2)', () => {
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.fetch = origFetch;
  });

  it('fetchMomentumApiV1UserProfile envoie Bearer et parse le profil', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'u1',
          username: 'alice',
          displayName: 'alice',
          role: 'user',
          updatedAt: '2026-01-01T12:00:00.000Z'
        })
    });
    const profile = await fetchMomentumApiV1UserProfile('tok');
    expect(profile).not.toBeNull();
    expect(profile?.username).toBe('alice');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/user-profile$/),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok' })
      })
    );
  });

  it('fetchMomentumApiV1UserProfile retourne null sans token', async () => {
    const profile = await fetchMomentumApiV1UserProfile('');
    expect(profile).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('postMomentumApiV1IntentionsMutation envoie le corps validé', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          accepted: true,
          clientMutationId: 'm1',
          intent: 'ping',
          userId: 'u',
          phase: 2,
          note: 'ok'
        })
    });
    const out = await postMomentumApiV1IntentionsMutation('tok', {
      clientMutationId: 'm1',
      intent: 'ping',
      payload: {}
    });
    expect(out?.accepted).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/intentions\/mutation$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          clientMutationId: 'm1',
          intent: 'ping',
          payload: {}
        })
      })
    );
  });

  it('postMomentumApiV1IntentionsMutation retourne null si enveloppe invalide', async () => {
    const out = await postMomentumApiV1IntentionsMutation('tok', {
      clientMutationId: '',
      intent: 'x'
    });
    expect(out).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fetchMomentumApiV1IntentionsRecent parse la réponse', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              clientMutationId: 'a',
              intent: 'x',
              accepted: true,
              createdAt: '2026-01-01T00:00:00+00:00'
            }
          ]
        })
    });
    const data = await fetchMomentumApiV1IntentionsRecent('tok', 10);
    expect(data?.items).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/intentions\/recent\?limit=10$/),
      expect.any(Object)
    );
  });

  it('postMomentumApiV1XpPortVerify parse la réponse contrat', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          nutritionFoodItems: 0,
          nutritionFoodXp: 0,
          clientNutritionFoodXpMatch: null,
          booksStreakBonusXp: null,
          sportXpReferenceTenRepsTwoStarBodyweight: 1
        })
    });
    const out = await postMomentumApiV1XpPortVerify('tok', { meals: [] });
    expect(out?.nutritionFoodItems).toBe(0);
    expect(out?.sportXpReferenceTenRepsTwoStarBodyweight).toBe(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/xp\/port-verify$/),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetchMomentumApiV1ServerTime parse serverTime', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ serverTime: '2026-06-01T10:00:00.000Z' })
    });
    const t = await fetchMomentumApiV1ServerTime();
    expect(t?.serverTime).toMatch(/^2026-06-01/);
  });
});
