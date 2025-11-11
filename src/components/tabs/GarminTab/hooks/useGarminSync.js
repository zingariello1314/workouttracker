/**
 * ✅ PHASE 1.2 : Hook pour gérer la synchronisation Garmin
 *
 * Ce hook délègue toutes les opérations aux modules spécialisés :
 * - `useGarminSyncState` : état React (loading, baseUrl, cache mémoire)
 * - `useGarminSyncActions` : orchestration métier (orchestrateur + services)
 */

import { useMemo } from 'react';
import { useGarminData } from '../../../../hooks/useGarminData';
import logger from '../../../../utils/logger';
import { useGarminSyncState } from './useGarminSyncState';
import { useGarminSyncActions } from './useGarminSyncActions';

const log = logger.hook('useGarminSync');

export function useGarminSync(setGarminData, setStatus, importToEndurance, options = {}) {
  const state = useGarminSyncState();

  const dataDeps = useGarminData();

  const actions = useGarminSyncActions({
    state,
    data: {
      ...dataDeps,
      setGarminData
    },
    setStatus,
    importToEndurance,
    options
  });

  return useMemo(() => ({
    syncNow: actions.syncNow,
    backfill: actions.backfill,
    fetchStatus: actions.fetchStatus,
    loading: state.loading,
    baseUrl: state.baseUrl,
    clearCache: state.clearFrontendCache,
    cacheMeta: state.lastSourceMeta,
    resetCircuit: actions.resetCircuit
  }), [actions, state.loading, state.baseUrl, state.clearFrontendCache, state.lastSourceMeta]);
}
