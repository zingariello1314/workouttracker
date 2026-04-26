import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { NAV_PREFERENCE_KEYS } from '../constants/navPreferenceKeys';
import {
  navPrefsRepository,
  navPrefsSnapshotHasData,
  readNavPrefsFromLocalStorage,
} from '../services/navigation/navPrefsRepository';

/**
 * Sync optionnelle des clés localStorage listées dans `navPreferenceKeys.js`.
 * Flag : VITE_USE_REMOTE_API_NAV_PREFS (override USE_REMOTE_API_NAV_PREFS).
 */
export function useRemoteNavPreferencesSync() {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = isAuthenticated && currentUser ? String(currentUser.id) : '';

  const hydratedRef = useRef(false);
  const pushTimerRef = useRef(null);

  const applyEntriesToLocal = useCallback((entries) => {
    if (!entries || typeof entries !== 'object') return;
    for (const key of NAV_PREFERENCE_KEYS) {
      const v = entries[key];
      if (v == null || v === '') continue;
      const str = String(v);
      try {
        const prev = localStorage.getItem(key);
        if (prev === str) continue;
        localStorage.setItem(key, str);
        window.dispatchEvent(new CustomEvent('navStorageKeyUpdated', { detail: { key, value: str } }));
      } catch (e) {
        console.warn('[useRemoteNavPreferencesSync] setItem', key, e?.message || e);
      }
    }
  }, []);

  const schedulePush = useCallback(() => {
    if (!navPrefsRepository.isRemoteEnabled() || !userId || !hydratedRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        const entries = readNavPrefsFromLocalStorage();
        await navPrefsRepository.save(userId, entries);
      } catch (e) {
        console.warn('[useRemoteNavPreferencesSync] save', e?.message || e);
      }
    }, 700);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      hydratedRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (!navPrefsRepository.isRemoteEnabled() || !userId) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const remote = await navPrefsRepository.get(userId);
        if (cancelled) return;

        if (navPrefsSnapshotHasData(remote)) {
          applyEntriesToLocal(remote.entries || {});
        } else {
          const local = readNavPrefsFromLocalStorage();
          if (Object.keys(local).length > 0) {
            await navPrefsRepository.save(userId, local);
          }
        }
      } catch (e) {
        console.warn('[useRemoteNavPreferencesSync] hydrate', e?.message || e);
      } finally {
        if (!cancelled) hydratedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, applyEntriesToLocal]);

  useEffect(() => {
    if (!navPrefsRepository.isRemoteEnabled() || !userId) return undefined;

    const onDirty = () => {
      if (!hydratedRef.current) return;
      schedulePush();
    };

    window.addEventListener('navPrefsDirty', onDirty);
    const onStorage = (e) => {
      if (!hydratedRef.current) return;
      if (e.key && NAV_PREFERENCE_KEYS.includes(e.key)) schedulePush();
    };
    window.addEventListener('storage', onStorage);

    const onVis = () => {
      if (document.visibilityState === 'hidden') onDirty();
    };
    document.addEventListener('visibilitychange', onVis);

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') onDirty();
    }, 90_000);

    return () => {
      window.removeEventListener('navPrefsDirty', onDirty);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(interval);
    };
  }, [userId, schedulePush]);
}
