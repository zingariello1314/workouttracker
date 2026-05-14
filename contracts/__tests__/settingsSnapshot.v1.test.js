import { describe, it, expect } from 'vitest';
import {
  safeParseSettingsSnapshotGetV1,
  safeParseSettingsSnapshotPutBodyV1,
  safeParseSettingsSnapshotPutResponseV1
} from '../settingsSnapshot.v1.js';

describe('settingsSnapshot.v1', () => {
  it('parse GET snapshot', () => {
    const r = safeParseSettingsSnapshotGetV1({ settings: { theme: 'dark' }, updatedAt: '2026-01-01T00:00:00Z' });
    expect(r.success).toBe(true);
    expect(r.data.settings.theme).toBe('dark');
  });

  it('parse PUT body', () => {
    const r = safeParseSettingsSnapshotPutBodyV1({ clientMutationId: 'a1', settings: { x: 1 } });
    expect(r.success).toBe(true);
  });

  it('parse PUT response', () => {
    const r = safeParseSettingsSnapshotPutResponseV1({
      accepted: true,
      clientMutationId: 'a1',
      updatedAt: '2026-01-01T00:00:00Z',
      settings: { x: 1 }
    });
    expect(r.success).toBe(true);
  });
});
