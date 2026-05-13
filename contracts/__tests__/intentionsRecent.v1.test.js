import { describe, it, expect } from 'vitest';
import { safeParseIntentionsRecentV1 } from '../intentionsRecent.v1.js';

describe('IntentionsRecentV1Schema', () => {
  it('accepte une liste nominale', () => {
    const payload = {
      items: [
        {
          clientMutationId: 'm1',
          intent: 'ping',
          accepted: true,
          createdAt: '2026-01-01T00:00:00+00:00'
        }
      ]
    };
    expect(safeParseIntentionsRecentV1(payload).success).toBe(true);
  });

  it('rejette items manquant', () => {
    expect(safeParseIntentionsRecentV1({ items: 'bad' }).success).toBe(false);
  });
});
