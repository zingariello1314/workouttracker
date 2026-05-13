import { describe, it, expect } from 'vitest';
import { safeParseServerTimeV1 } from '../serverTime.v1.js';

describe('ServerTimeV1Schema', () => {
  it('accepte un ISO UTC', () => {
    const r = safeParseServerTimeV1({ serverTime: '2026-01-15T12:00:00.000Z' });
    expect(r.success).toBe(true);
  });

  it('rejette une chaîne non datetime', () => {
    expect(safeParseServerTimeV1({ serverTime: 'hier' }).success).toBe(false);
  });
});
