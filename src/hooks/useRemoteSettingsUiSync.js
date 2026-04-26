import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  settingsRepository,
  snapshotHasMeaningfulSettingsUi,
} from '../services/settings/settingsRepository';
import { getSettings } from '../services/swipeNavigationSettings';
import { LANGUAGES } from '../utils/translations/constants';

/**
 * Sync distante (optionnelle) des préférences UI légères : swipe + langue.
 * Flag : VITE_USE_REMOTE_API_SETTINGS (override localStorage USE_REMOTE_API_SETTINGS).
 *
 * Prière / `quietquest_app_state` : voir `VITE_USE_REMOTE_API_QUESTS` (snapshot quêtes).
 * Écoute `storage` pour propager les changements depuis un autre onglet vers le backend.
 */
export function useRemoteSettingsUiSync() {
  const { currentUser, isAuthenticated } = useAuth();
  const { setLanguage } = useLanguage();
  const userId = isAuthenticated && currentUser ? String(currentUser.id) : '';

  const hydratedRef = useRef(false);
  const pushTimerRef = useRef(null);

  const readStoredLanguage = () => {
    try {
      const v = localStorage.getItem('app_language');
      return v === LANGUAGES.FR || v === LANGUAGES.EN ? v : null;
    } catch {
      return null;
    }
  };

  const schedulePush = useCallback(() => {
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

  useEffect(() => {
    if (!userId) {
      hydratedRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (!settingsRepository.isRemoteEnabled() || !userId) return undefined;

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
  }, [userId, setLanguage]);

  useEffect(() => {
    if (!settingsRepository.isRemoteEnabled() || !userId) return undefined;
    const onDirty = () => {
      if (!hydratedRef.current) return;
      schedulePush();
    };
    window.addEventListener('swipeSettingsUpdated', onDirty);
    window.addEventListener('appUiSettingsDirty', onDirty);
    const onStorage = (e) => {
      if (!hydratedRef.current) return;
      if (e.key === 'swipeNavigationSettings' || e.key === 'app_language') {
        schedulePush();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('swipeSettingsUpdated', onDirty);
      window.removeEventListener('appUiSettingsDirty', onDirty);
      window.removeEventListener('storage', onStorage);
    };
  }, [userId, schedulePush]);
}
