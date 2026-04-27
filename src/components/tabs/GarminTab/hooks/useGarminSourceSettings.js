import { useCallback, useEffect, useMemo, useState } from 'react';
import { getGarminScope } from '../../../../hooks/garminDataUtils';
import { decryptSecretString, encryptSecretString } from '../../../../utils/secureProfileSecrets';

const STORAGE_VERSION = 'v1';
const STORAGE_PREFIX = `garmin_source_settings_${STORAGE_VERSION}`;

const createEmptyState = () => ({
  sources: [],
  activeSourceId: null
});

const safeParse = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createEmptyState();
    return {
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      activeSourceId: parsed.activeSourceId || null
    };
  } catch {
    return createEmptyState();
  }
};

const buildStorageKey = () => `${STORAGE_PREFIX}_${getGarminScope()}`;

const nowIso = () => new Date().toISOString();

const newId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const sanitizeSource = (source) => ({
  id: source.id || newId('src'),
  label: (source.label || '').trim() || 'Source Garmin',
  email: (source.email || '').trim(),
  password: source.password || '',
  tokenNamespace: (source.tokenNamespace || '').trim(),
  watches: Array.isArray(source.watches)
    ? source.watches.map((watch) => ({
        id: watch.id || newId('watch'),
        label: (watch.label || '').trim() || 'Montre',
        deviceId: (watch.deviceId || '').trim(),
        enabled: watch.enabled !== false
      }))
    : [],
  createdAt: source.createdAt || nowIso(),
  updatedAt: nowIso()
});

const decryptSourceSecrets = async (source) => {
  const normalized = sanitizeSource(source || {});
  return {
    ...normalized,
    password: await decryptSecretString(normalized.password || '')
  };
};

const decryptStateSecrets = async (rawState) => {
  const safeState = safeParse(JSON.stringify(rawState || createEmptyState()));
  const decryptedSources = await Promise.all(
    (safeState.sources || []).map((source) => decryptSourceSecrets(source))
  );
  return {
    sources: decryptedSources,
    activeSourceId: safeState.activeSourceId || null
  };
};

const encryptSourceSecrets = async (source) => {
  const normalized = sanitizeSource(source || {});
  return {
    ...normalized,
    password: await encryptSecretString(normalized.password || '')
  };
};

const encryptStateSecrets = async (rawState) => {
  const safeState = safeParse(JSON.stringify(rawState || createEmptyState()));
  const encryptedSources = await Promise.all(
    (safeState.sources || []).map((source) => encryptSourceSecrets(source))
  );
  return {
    sources: encryptedSources,
    activeSourceId: safeState.activeSourceId || null
  };
};

export function useGarminSourceSettings(options = {}) {
  const {
    currentUser = null,
    isAuthenticated = false,
    isAdmin = false
  } = options;
  const canManageSources = Boolean(isAuthenticated);
  const storageKey = useMemo(() => buildStorageKey(), [isAuthenticated, isAdmin, currentUser?.id]);
  const [state, setState] = useState(() => {
    if (typeof localStorage === 'undefined') return createEmptyState();
    if (!canManageSources) return createEmptyState();
    return safeParse(localStorage.getItem(storageKey));
  });

  const persistState = useCallback((nextState) => {
    if (!canManageSources) return;
    setState(nextState);
    void (async () => {
      try {
        const encryptedState = await encryptStateSecrets(nextState);
        localStorage.setItem(storageKey, JSON.stringify(encryptedState));
      } catch {
        // Ignore localStorage quota errors.
      }
    })();
  }, [canManageSources, storageKey]);

  useEffect(() => {
    if (canManageSources) return;
    setState(createEmptyState());
  }, [canManageSources]);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    if (!canManageSources) return;
    let cancelled = false;
    void (async () => {
      const raw = safeParse(localStorage.getItem(storageKey));
      const decrypted = await decryptStateSecrets(raw);
      if (cancelled) return;
      setState(decrypted);
      try {
        const reEncrypted = await encryptStateSecrets(decrypted);
        localStorage.setItem(storageKey, JSON.stringify(reEncrypted));
      } catch {
        // best effort only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canManageSources, storageKey]);

  const addSource = useCallback(
    ({ label, email, password, tokenNamespace }) => {
      if (!canManageSources) return null;
      const source = sanitizeSource({
        label,
        email,
        password,
        tokenNamespace
      });
      const nextState = {
        ...state,
        sources: [source, ...state.sources],
        activeSourceId: state.activeSourceId || source.id
      };
      persistState(nextState);
      return source;
    },
    [persistState, state]
  );

  const removeSource = useCallback(
    (sourceId) => {
      if (!canManageSources) return;
      const remaining = state.sources.filter((source) => source.id !== sourceId);
      const nextActive =
        state.activeSourceId === sourceId ? remaining[0]?.id || null : state.activeSourceId;
      persistState({
        sources: remaining,
        activeSourceId: nextActive
      });
    },
    [canManageSources, persistState, state.activeSourceId, state.sources]
  );

  const updateSource = useCallback(
    (sourceId, updates) => {
      if (!canManageSources) return;
      const nextSources = state.sources.map((source) => {
        if (source.id !== sourceId) return source;
        return sanitizeSource({
          ...source,
          ...updates,
          id: source.id,
          watches: updates.watches ?? source.watches,
          createdAt: source.createdAt
        });
      });
      persistState({
        ...state,
        sources: nextSources
      });
    },
    [canManageSources, persistState, state]
  );

  const setActiveSourceId = useCallback(
    (sourceId) => {
      if (!canManageSources) return;
      persistState({
        ...state,
        activeSourceId: sourceId
      });
    },
    [canManageSources, persistState, state]
  );

  const addWatchToSource = useCallback(
    (sourceId, watch) => {
      if (!canManageSources) return;
      const nextSources = state.sources.map((source) => {
        if (source.id !== sourceId) return source;
        const nextWatch = {
          id: newId('watch'),
          label: (watch.label || '').trim() || 'Montre',
          deviceId: (watch.deviceId || '').trim(),
          enabled: true
        };
        return {
          ...source,
          watches: [nextWatch, ...(source.watches || [])],
          updatedAt: nowIso()
        };
      });
      persistState({
        ...state,
        sources: nextSources
      });
    },
    [canManageSources, persistState, state]
  );

  const removeWatchFromSource = useCallback(
    (sourceId, watchId) => {
      if (!canManageSources) return;
      const nextSources = state.sources.map((source) => {
        if (source.id !== sourceId) return source;
        return {
          ...source,
          watches: (source.watches || []).filter((watch) => watch.id !== watchId),
          updatedAt: nowIso()
        };
      });
      persistState({
        ...state,
        sources: nextSources
      });
    },
    [canManageSources, persistState, state]
  );

  const toggleWatchEnabled = useCallback(
    (sourceId, watchId) => {
      if (!canManageSources) return;
      const nextSources = state.sources.map((source) => {
        if (source.id !== sourceId) return source;
        return {
          ...source,
          watches: (source.watches || []).map((watch) =>
            watch.id === watchId ? { ...watch, enabled: !watch.enabled } : watch
          ),
          updatedAt: nowIso()
        };
      });
      persistState({
        ...state,
        sources: nextSources
      });
    },
    [canManageSources, persistState, state]
  );

  const activeSource = useMemo(
    () => state.sources.find((source) => source.id === state.activeSourceId) || null,
    [state.activeSourceId, state.sources]
  );

  useEffect(() => {
    if (!Array.isArray(state.sources) || state.sources.length === 0) return;

    const activeStillValid = state.activeSourceId
      ? state.sources.some((source) => source.id === state.activeSourceId)
      : false;

    if (activeStillValid) return;
    persistState({
      ...state,
      activeSourceId: state.sources[0].id
    });
  }, [persistState, state]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    if (!Array.isArray(state.sources) || state.sources.length === 0) return;
    if (state.activeSourceId) return;

    const userEmail = String(currentUser?.email || '').trim().toLowerCase();
    const preferred = userEmail
      ? state.sources.find((source) => String(source.email || '').trim().toLowerCase() === userEmail)
      : null;
    const fallback = preferred || state.sources[0];
    if (!fallback?.id) return;

    persistState({
      ...state,
      activeSourceId: fallback.id
    });
  }, [currentUser?.email, isAdmin, isAuthenticated, persistState, state]);

  const activeDeviceIds = useMemo(() => {
    if (!activeSource?.watches?.length) return [];
    return activeSource.watches
      .filter((watch) => watch.enabled && watch.deviceId)
      .map((watch) => watch.deviceId);
  }, [activeSource]);

  const buildPayload = useCallback(() => {
    if (!canManageSources) return null;
    if (!activeSource?.email || !activeSource?.password) return null;
    return {
      garminAuth: {
        profileId: activeSource.id,
        label: activeSource.label,
        email: activeSource.email,
        password: activeSource.password,
        tokenNamespace: activeSource.tokenNamespace || activeSource.id
      },
      deviceIds: activeDeviceIds
    };
  }, [activeDeviceIds, activeSource, canManageSources]);

  const buildSyncRequest = useCallback(
    (request = {}) => {
      const payload = buildPayload();
      if (!payload) return request;
      return {
        ...request,
        payload: {
          ...(request.payload || {}),
          ...payload
        }
      };
    },
    [buildPayload]
  );

  return {
    state,
    sources: state.sources,
    activeSourceId: state.activeSourceId,
    activeSource,
    addSource,
    removeSource,
    updateSource,
    setActiveSourceId,
    addWatchToSource,
    removeWatchFromSource,
    toggleWatchEnabled,
    buildPayload,
    buildSyncRequest
  };
}

export default useGarminSourceSettings;
