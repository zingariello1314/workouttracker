import { useState, useRef, useCallback, useEffect } from 'react';
import logger from '../../../../utils/logger';
import { getAutoSyncSettings, saveAutoSyncSettings } from './useAutoSync';

const log = logger.hook('useAutoSyncSettings');

/**
 * Hook utilitaire pour gérer l'état des paramètres de synchronisation automatique.
 * Centralise lecture/écriture localStorage avec auto-save débouncé.
 *
 * @param {number} autoSaveDelayMs - délai avant persistance automatique (par défaut 500ms)
 * @returns {{
 *   settings: Object,
 *   updateSettings: (updates: Object) => void,
 *   replaceSettings: (nextSettings: Object) => void,
 *   resetSettings: () => void,
 *   persistSettings: () => void,
 *   isDirty: boolean
 * }}
 */
export function useAutoSyncSettings(autoSaveDelayMs = 500) {
  const [settings, setSettings] = useState(() => getAutoSyncSettings());
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  const clearPendingSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  }, []);

  const scheduleSave = useCallback(
    (nextSettings) => {
      clearPendingSave();
      setIsDirty(true);
      autoSaveTimeoutRef.current = setTimeout(() => {
        try {
          saveAutoSyncSettings(nextSettings);
          setIsDirty(false);
        } catch (error) {
          log.error('Erreur lors de la sauvegarde auto-sync:', error);
        } finally {
          autoSaveTimeoutRef.current = null;
        }
      }, autoSaveDelayMs);
    },
    [autoSaveDelayMs, clearPendingSave]
  );

  const updateSettings = useCallback(
    (updates) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const replaceSettings = useCallback(
    (nextSettings) => {
      setSettings(nextSettings);
      scheduleSave(nextSettings);
    },
    [scheduleSave]
  );

  const persistSettings = useCallback(() => {
    clearPendingSave();
    try {
      saveAutoSyncSettings(settings);
      setIsDirty(false);
    } catch (error) {
      log.error('Erreur lors de la persistance auto-sync:', error);
    }
  }, [settings, clearPendingSave]);

  const resetSettings = useCallback(() => {
    clearPendingSave();
    const fresh = getAutoSyncSettings();
    setSettings(fresh);
    setIsDirty(false);
  }, [clearPendingSave]);

  useEffect(() => {
    return () => {
      clearPendingSave();
    };
  }, [clearPendingSave]);

  return {
    settings,
    updateSettings,
    replaceSettings,
    resetSettings,
    persistSettings,
    isDirty
  };
}

export default useAutoSyncSettings;

