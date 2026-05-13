import { describe, it, expect } from 'vitest';
import { safeParseIntentionMutationResponseV1 } from '../intentionMutationResponse.v1.js';

describe('IntentionMutationResponseV1Schema', () => {
  it('accepte une réponse nominale', () => {
    const r = safeParseIntentionMutationResponseV1({
      accepted: true,
      clientMutationId: 'x',
      intent: 'ping',
      userId: 'u1',
      phase: 2,
      note: 'ok'
    });
    expect(r.success).toBe(true);
  });

  it('accepte idempotentReplay', () => {
    const r = safeParseIntentionMutationResponseV1({
      accepted: true,
      clientMutationId: 'x',
      intent: 'ping',
      idempotentReplay: true
    });
    expect(r.success).toBe(true);
  });

  it('rejette sans clientMutationId', () => {
    expect(safeParseIntentionMutationResponseV1({ intent: 'x' }).success).toBe(false);
  });
});
