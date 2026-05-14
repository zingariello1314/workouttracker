import { describe, it, expect } from 'vitest';
import {
  shouldApplyCloudSettingsSnapshot,
  settingsSnapshotPayloadHasMeaningfulUi,
  buildSettingsRecordForPush
} from './settingsSnapshotCloudSync.js';

describe('settingsSnapshotCloudSync', () => {
  it('shouldApplyCloudSettingsSnapshot refuse sans remote valide', () => {
    expect(shouldApplyCloudSettingsSnapshot(null, null)).toBe(false);
    expect(shouldApplyCloudSettingsSnapshot({ updatedAt: '2026-01-02T00:00:00Z' }, {})).toBe(false);
  });

  it('shouldApplyCloudSettingsSnapshot refuse si settings vides', () => {
    const remote = { updatedAt: '2026-01-02T00:00:00Z', settings: {} };
    expect(shouldApplyCloudSettingsSnapshot(null, remote)).toBe(false);
  });

  it('shouldApplyCloudSettingsSnapshot accepte si langue présente', () => {
    const remote = { updatedAt: '2026-01-02T00:00:00Z', settings: { appLanguage: 'en' } };
    expect(shouldApplyCloudSettingsSnapshot(null, remote)).toBe(true);
    expect(shouldApplyCloudSettingsSnapshot({ updatedAt: '2026-01-01T00:00:00Z' }, remote)).toBe(true);
    expect(shouldApplyCloudSettingsSnapshot({ updatedAt: '2026-01-03T00:00:00Z' }, remote)).toBe(false);
  });

  it('buildSettingsRecordForPush normalise langue et copie swipe', () => {
    expect(buildSettingsRecordForPush({ a: 1 }, 'en')).toEqual({
      swipeNavigation: { a: 1 },
      appLanguage: 'en'
    });
    expect(buildSettingsRecordForPush(null, 'xx')).toEqual({
      swipeNavigation: {},
      appLanguage: 'fr'
    });
  });

  it('settingsSnapshotPayloadHasMeaningfulUi détecte swipe ou langue', () => {
    expect(settingsSnapshotPayloadHasMeaningfulUi(null)).toBe(false);
    expect(settingsSnapshotPayloadHasMeaningfulUi({ swipeNavigation: { x: 1 } })).toBe(true);
    expect(settingsSnapshotPayloadHasMeaningfulUi({ appLanguage: 'fr' })).toBe(true);
  });
});
