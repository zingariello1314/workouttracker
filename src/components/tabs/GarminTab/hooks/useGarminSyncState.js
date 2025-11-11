/**
 * Hook d'état pour la synchronisation Garmin.
 */

import { useState, useMemo, useEffect } from 'react';

import { CACHE_TTL_MS } from '../constants';

const IS_DEV = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;

const createFrontendCache = () => ({
  data: null,
  timestamp: 0,
  ttl: CACHE_TTL_MS,
  cacheKey: null,
  serverResponse: null
});

export const useGarminSyncState = () => {
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState(null);
  const [lastSourceMeta, setLastSourceMeta] = useState(null);

  useEffect(() => {
    if (IS_DEV) {
      // eslint-disable-next-line no-console
      console.info('[useGarminSyncState] loading =>', loading);
    }
  }, [loading]);

  const frontendCache = useMemo(() => createFrontendCache(), []);

  const clearFrontendCache = () => {
    frontendCache.data = null;
    frontendCache.timestamp = 0;
    frontendCache.cacheKey = null;
    frontendCache.serverResponse = null;
  };

  return {
    loading,
    setLoading,
    baseUrl,
    setBaseUrl,
    frontendCache,
    clearFrontendCache,
    lastSourceMeta,
    setLastSourceMeta
  };
};
