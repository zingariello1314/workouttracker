import { snapshotHasMeaningfulSettingsUi } from './settingsRepository.js';

const MARKER_KEY = 'momentum_settings_snapshot_lww_v1';

export function isSettingsSnapshotCloudSyncEnabled() {
  const v = String(import.meta.env?.VITE_SETTINGS_SNAPSHOT_CLOUD_SYNC || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** @returns {{ updatedAt: string } | null} */
export function readLocalSettingsSnapshotMarker() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MARKER_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (j && typeof j.updatedAt === 'string' && j.updatedAt.trim()) return { updatedAt: j.updatedAt.trim() };
  } catch {
    /* ignore */
  }
  return null;
}

/** @param {string} updatedAt — typiquement `updatedAt` renvoyé par GET/PUT snapshot. */
export function writeLocalSettingsSnapshotMarker(updatedAt) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MARKER_KEY, JSON.stringify({ updatedAt: String(updatedAt || '').trim() }));
  } catch {
    /* quota */
  }
}

/**
 * @param {Record<string, unknown>} settings — sous-objet `settings` du GET snapshot.
 */
export function settingsSnapshotPayloadHasMeaningfulUi(settings) {
  if (!settings || typeof settings !== 'object') return false;
  return snapshotHasMeaningfulSettingsUi({
    swipeNavigation: settings.swipeNavigation,
    appLanguage: settings.appLanguage
  });
}

/**
 * @param {{ updatedAt?: string } | null} marker
 * @param {import('../../../contracts/settingsSnapshot.v1.js').SettingsSnapshotGetV1 | null} remoteGet
 */
export function shouldApplyCloudSettingsSnapshot(marker, remoteGet) {
  if (!remoteGet || typeof remoteGet !== 'object') return false;
  const cloudTs = String(remoteGet.updatedAt || '').trim();
  if (!cloudTs) return false;
  const inner = remoteGet.settings && typeof remoteGet.settings === 'object' ? remoteGet.settings : {};
  if (!settingsSnapshotPayloadHasMeaningfulUi(inner)) return false;
  const localTs = String(marker?.updatedAt || '').trim();
  if (!localTs) return true;
  return cloudTs > localTs;
}

/**
 * Corps `settings` minimal pour PUT (swipe + langue UI).
 *
 * @param {Record<string, unknown>} swipeNavigation
 * @param {string} appLanguage — `fr` | `en`
 */
export function buildSettingsRecordForPush(swipeNavigation, appLanguage) {
  const swipe =
    swipeNavigation && typeof swipeNavigation === 'object' ? { ...swipeNavigation } : {};
  const lang = appLanguage === 'en' ? 'en' : 'fr';
  return { swipeNavigation: swipe, appLanguage: lang };
}
