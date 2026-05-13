import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enqueueIntentionOutbox,
  listIntentionOutbox,
  flushIntentionsOutbox,
  removeIntentionFromOutbox
} from '../intentionsOutbox.js';

const KEY = 'momentum_phase3_intentions_outbox_v1';

describe('phase3 intentionsOutbox', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(KEY);
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
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
        })
      )
    );
  });

  it('enqueue déduplique par clientMutationId', () => {
    enqueueIntentionOutbox({ clientMutationId: 'a', intent: 'x', payload: {} });
    enqueueIntentionOutbox({ clientMutationId: 'a', intent: 'y', payload: { k: 1 } });
    const items = listIntentionOutbox();
    expect(items).toHaveLength(1);
    expect(items[0].intent).toBe('y');
  });

  it('flush envoie et vide la file si API OK', async () => {
    enqueueIntentionOutbox({ clientMutationId: 'm1', intent: 'ping', payload: {} });
    const r = await flushIntentionsOutbox('tok');
    expect(r.sent).toBeGreaterThanOrEqual(1);
    expect(listIntentionOutbox().length).toBe(0);
  });

  it('removeIntentionFromOutbox retire une entrée', () => {
    enqueueIntentionOutbox({ clientMutationId: 'z', intent: 'a', payload: {} });
    removeIntentionFromOutbox('z');
    expect(listIntentionOutbox()).toHaveLength(0);
  });
});
