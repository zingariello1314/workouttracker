import { describe, it, expect } from 'vitest';
import { MutationEnvelopeV1Schema, safeParseMutationEnvelopeV1 } from '../mutationEnvelope.v1.js';

describe('MutationEnvelopeV1', () => {
  it('accepte un corps minimal valide', () => {
    const r = safeParseMutationEnvelopeV1({
      clientMutationId: 'm1',
      intent: 'workout.save_state',
      payload: { foo: 1 }
    });
    expect(r.success).toBe(true);
    expect(r.data.clientMutationId).toBe('m1');
    expect(r.data.intent).toBe('workout.save_state');
  });

  it('rejette clientMutationId vide', () => {
    const r = MutationEnvelopeV1Schema.safeParse({
      clientMutationId: '',
      intent: 'x'
    });
    expect(r.success).toBe(false);
  });
});
