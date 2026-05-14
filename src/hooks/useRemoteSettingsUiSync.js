import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  settingsRepository,
  snapshotHasMeaningfulSettingsUi,
} from '../services/settings/settingsRepository';
import {
  isSettingsSnapshotCloudSyncEnabled,
  readLocalSettingsSnapshotMarker,
  writeLocalSettingsSnapshotMarker,
  shouldApplyCloudSettingsSnapshot,
  settingsSnapshotPayloadHasMeaningfulUi,
  buildSettingsRecordForPush,
} from '../services/settings/settingsSnapshotCloudSync.js';
import { readServerTokens } from '../utils/serverAuthApi.js';
import {
  fetchMomentumApiV1SettingsSnapshot,
  putMomentumApiV1SettingsSnapshot,
} from '../services/sync/fetchMomentumApiV1.js';
import { getSettings } from '../services/swipeNavigationSettings';
import { LANGUAGES } from '../utils/translations/constants';

/**
 * Sync distante (optionnelle) des préférences UI légères : swipe + langue.
 *
 * **Chemin A (legacy)** : `VITE_USE_REMOTE_API_SETTINGS` — `/v1/settings/ui` + `userId` (voir `settingsRepository`).
 * **Chemin B (Phase 2 snapshot)** : `VITE_SETTINGS_SNAPSHOT_CLOUD_SYNC` — `GET|PUT /api/v1/settings/snapshot` + Bearer ;
 * marqueur LWW `localStorage` `momentum_settings_snapshot_lww_v1`. Si B est actif, A est ignoré pour éviter double écriture.
 *
 * Écoute `storage` pour propager les changements depuis un autre onglet.
 */
export function useRemoteSettingsUiSync() {
  const { currentUser, isAuthenticated } = useAuth();
  const { setLanguage } = useLanguage();
  const userId = isAuthenticated && currentUser ? String(currentUser.id) : '';

  const hydratedRef = useRef(false);
  const pushTimerRef = useRef(null);
  const snapshotEnabled = isSettingsSnapshotCloudSyncEnabled();

  const readStoredLanguage = () => {
    try {
      const v = localStorage.getItem('app_language');
      return v === LANGUAGES.FR || v === LANGUAGES.EN ? v : null;
    } catch {
      return null;
    }
  };

  const schedulePushLegacy = useCallback(() => {
    if (!settingsRepository.isRemoteEnabled() || !userId || !hydratedRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        const swipe = getSettings();
        const appLanguage = readStoredLanguage() || LANGUAGES.FR;
        const lang = appLanguage === LANGUAGES.EN ? LANGUAGES.EN : LANGUAGES.FR;
        await settingsRepository.saveUi(userId, { swipeNavigation: swipe, appLanguage: lang });
      } catch (e) {
        console.warn('[useRemoteSettingsUiSync] saveUi', e?.message || e);
      }
    }, 650);
  }, [userId]);

  const schedulePushSnapshot = useCallback(() => {
    if (!snapshotEnabled || !userId || !hydratedRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        const { accessToken } = readServerTokens();
        if (!accessToken) return;
        const swipe = getSettings();
        const appLanguage = readStoredLanguage() || LANGUAGES.FR;
        const lang = appLanguage === LANGUAGES.EN ? LANGUAGES.EN : LANGUAGES.FR;
        const clientMutationId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `ss-${Date.now()}`;
        const res = await putMomentumApiV1SettingsSnapshot(accessToken, {
          clientMutationId,
          settings: buildSettingsRecordForPush(swipe, lang),
        });
        if (res?.updatedAt) writeLocalSettingsSnapshotMarker(res.updatedAt);
      } catch (e) {
        console.warn('[useRemoteSettingsUiSync] snapshot push', e?.message || e);
      }
    }, 650);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      hydratedRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    if (snapshotEnabled) {
      const { accessToken } = readServerTokens();
      if (!accessToken) {
        hydratedRef.current = true;
        return undefined;
      }

      let cancelled = false;
      (async () => {
        try {
          const remote = await fetchMomentumApiV1SettingsSnapshot(accessToken);
          if (cancelled) return;

          const marker = readLocalSettingsSnapshotMarker();
          if (shouldApplyCloudSettingsSnapshot(marker, remote)) {
            const s = remote.settings || {};
            if (s.swipeNavigation && typeof s.swipeNavigation === 'object') {
              localStorage.setItem('swipeNavigationSettings', JSON.stringify(s.swipeNavigation));
              window.dispatchEvent(new CustomEvent('swipeSettingsUpdated'));
            }
            if (s.appLanguage === LANGUAGES.FR || s.appLanguage === LANGUAGES.EN) {
              const cur = readStoredLanguage();
              if (!cur || cur !== s.appLanguage) {
                await setLanguage(s.appLanguage);
              }
            }
            if (remote.updatedAt) writeLocalSettingsSnapshotMarker(remote.updatedAt);
          } else if (
            remote &&
            !String(remote.updatedAt || '').trim() &&
            !settingsSnapshotPayloadHasMeaningfulUi(remote.settings)
          ) {
            const swipe = getSettings();
            const appLanguage = readStoredLanguage() || LANGUAGES.FR;
            const lang = appLanguage === LANGUAGES.EN ? LANGUAGES.EN : LANGUAGES.FR;
            const res = await putMomentumApiV1SettingsSnapshot(accessToken, {
              clientMutationId:
                typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                  ? crypto.randomUUID()
                  : `ss-seed-${Date.now()}`,
              settings: buildSettingsRecordForPush(swipe, lang),
            });
            if (res?.updatedAt) writeLocalSettingsSnapshotMarker(res.updatedAt);
          }
        } catch (e) {
          console.warn('[useRemoteSettingsUiSync] snapshot hydrate', e?.message || e);
        } finally {
          if (!cancelled) {
            hydratedRef.current = true;
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (!settingsRepository.isRemoteEnabled()) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const remote = await settingsRepository.getUi(userId);
        if (cancelled) return;

        const meaningful = snapshotHasMeaningfulSettingsUi(remote);

        if (meaningful) {
          if (remote.swipeNavigation && typeof remote.swipeNavigation === 'object') {
            localStorage.setItem('swipeNavigationSettings', JSON.stringify(remote.swipeNavigation));
            window.dispatchEvent(new CustomEvent('swipeSettingsUpdated'));
          }
          if (remote.appLanguage === LANGUAGES.FR || remote.appLanguage === LANGUAGES.EN) {
            const cur = readStoredLanguage();
            if (!cur || cur !== remote.appLanguage) {
              await setLanguage(remote.appLanguage);
            }
          }
        } else {
          const swipe = getSettings();
          const appLanguage = readStoredLanguage() || LANGUAGES.FR;
          const lang = appLanguage === LANGUAGES.EN ? LANGUAGES.EN : LANGUAGES.FR;
          await settingsRepository.saveUi(userId, { swipeNavigation: swipe, appLanguage: lang });
        }
      } catch (e) {
        console.warn('[useRemoteSettingsUiSync] hydrate', e?.message || e);
      } finally {
        if (!cancelled) {
          hydratedRef.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, setLanguage, snapshotEnabled]);

  useEffect(() => {
    if (!userId) return undefined;
    if (!snapshotEnabled && !settingsRepository.isRemoteEnabled()) return undefined;

    const onDirty = () => {
      if (!hydratedRef.current) return;
      if (snapshotEnabled) schedulePushSnapshot();
      else schedulePushLegacy();
    };
    window.addEventListener('swipeSettingsUpdated', onDirty);
    window.addEventListener('appUiSettingsDirty', onDirty);
    const onStorage = (e) => {
      if (!hydratedRef.current) return;
      if (e.key === 'swipeNavigationSettings' || e.key === 'app_language') {
        onDirty();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('swipeSettingsUpdated', onDirty);
      window.removeEventListener('appUiSettingsDirty', onDirty);
      window.removeEventListener('storage', onStorage);
    };
  }, [userId, snapshotEnabled, schedulePushSnapshot, schedulePushLegacy]);

  return null;
}
