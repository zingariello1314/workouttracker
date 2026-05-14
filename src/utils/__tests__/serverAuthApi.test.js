import { describe, it, expect } from 'vitest';
import { shouldDiscardServerTokensAfterFailedRefresh } from '../serverAuthApi.js';

describe('serverAuthApi', () => {
  it('shouldDiscardServerTokensAfterFailedRefresh : vrai pour 400/401/403', () => {
    expect(shouldDiscardServerTokensAfterFailedRefresh({ status: 401 })).toBe(true);
    expect(shouldDiscardServerTokensAfterFailedRefresh({ status: 400 })).toBe(true);
    expect(shouldDiscardServerTokensAfterFailedRefresh({ status: 403 })).toBe(true);
  });

  it('shouldDiscardServerTokensAfterFailedRefresh : faux sans status (réseau)', () => {
    expect(shouldDiscardServerTokensAfterFailedRefresh(new Error('Failed to fetch'))).toBe(false);
    expect(shouldDiscardServerTokensAfterFailedRefresh(null)).toBe(false);
  });

  it('shouldDiscardServerTokensAfterFailedRefresh : faux pour 5xx', () => {
    expect(shouldDiscardServerTokensAfterFailedRefresh({ status: 502 })).toBe(false);
    expect(shouldDiscardServerTokensAfterFailedRefresh({ status: 404 })).toBe(false);
  });
});
