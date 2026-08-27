const TODAY_API_BASE = '/v1/today';

const isBrowser = typeof window !== 'undefined';

const getTodayRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_TODAY || '').toLowerCase();
  if (fromEnv === 'true') return true;
  const fromLocalStorage = String(localStorage.getItem('USE_REMOTE_API_TODAY') || '').toLowerCase();
  return fromLocalStorage === 'true';
};

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const toIsoDate = (value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value || '').trim();
  return isIsoDate(s) ? s : null;
};

const parseExerciseIdFromStorageKey = (dateStr, key) => {
  if (typeof key !== 'string' || !key.startsWith(`${dateStr}_`)) return null;
  return key.slice(dateStr.length + 1);
};

const fetchJson = async (url, init = {}) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const msg = body?.detail || body?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  return body;
};

const syncDebugState = {
  enabled: getTodayRemoteFlag(),
  lastOperation: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastError: null,
};

const markSyncSuccess = (operation) => {
  syncDebugState.enabled = getTodayRemoteFlag();
  syncDebugState.lastOperation = operation;
  syncDebugState.lastSuccessAt = new Date().toISOString();
  syncDebugState.lastError = null;
};

const markSyncFailure = (operation, error) => {
  syncDebugState.enabled = getTodayRemoteFlag();
  syncDebugState.lastOperation = operation;
  syncDebugState.lastErrorAt = new Date().toISOString();
  syncDebugState.lastError = error?.message || String(error || 'Unknown error');
};

const collectDayScopedEntries = (obj, dateStr) => {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (typeof k === 'string' && k.startsWith(`${dateStr}_`)) {
      out[k] = v;
    }
  });
  return out;
};

const normalizeRemoteTodayPayload = (dateStr, remoteDay) => {
  const payload = remoteDay && typeof remoteDay === 'object' ? remoteDay : {};
  /** Si false : réponse « gabarit » sans ligne en base — ne jamais écraser l’état local du jour. */
  const serverDayPersisted = payload.serverDayPersisted === true;
  const exerciseStates = payload.exerciseStates && typeof payload.exerciseStates === 'object'
    ? payload.exerciseStates
    : {};
  const checkedExercises = {};
  const reps = {};
  const exerciseWeights = {};
  const checkedStretches = {};

  Object.entries(exerciseStates).forEach(([exerciseId, state]) => {
    const key = `${dateStr}_${exerciseId}`;
    checkedExercises[key] = Boolean(state?.checked);
    reps[key] = String(state?.reps ?? '');
    exerciseWeights[key] = String(state?.weight ?? '');
  });

  const stretchStates = payload.stretchStates && typeof payload.stretchStates === 'object'
    ? payload.stretchStates
    : {};
  Object.entries(stretchStates).forEach(([stretchId, state]) => {
    const key = `${dateStr}_${stretchId}`;
    checkedStretches[key] = Boolean(state?.checked);
  });

  const variations = payload.dailyVariations && typeof payload.dailyVariations === 'object'
    ? payload.dailyVariations
    : {};

  const suppressedExercises = Array.isArray(variations.suppressedExercises)
    ? variations.suppressedExercises
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x))
    : [];

  const additionalExercises = Array.isArray(variations.additionalExercises)
    ? variations.additionalExercises
    : [];

  const normalizedVariation = {
    date: dateStr,
    suppressedExercises,
    additionalExercises,
    lastModifiedAt: payload.updatedAt ? new Date(payload.updatedAt).toISOString() : new Date().toISOString(),
    modificationCount: 0,
    version: '1.0',
    schemaVersion: 1,
    lastExceptionalIdCounter: additionalExercises.length,
  };

  const justification = payload.dayJustification && typeof payload.dayJustification === 'object'
    ? {
      reason: String(payload.dayJustification.reason || ''),
      note: String(payload.dayJustification.note || ''),
      createdAt: payload.dayJustification.updatedAt
        ? new Date(payload.dayJustification.updatedAt).toISOString()
        : new Date().toISOString(),
      updatedAt: payload.dayJustification.updatedAt
        ? new Date(payload.dayJustification.updatedAt).toISOString()
        : new Date().toISOString(),
    }
    : null;

  const sessionFeedback = payload.sessionFeedback && typeof payload.sessionFeedback === 'object'
    ? payload.sessionFeedback
    : null;

  const completedChallengeIds = Array.isArray(payload.completedChallengeIds)
    ? payload.completedChallengeIds.map((x) => String(x)).filter(Boolean)
    : [];

  return {
    serverDayPersisted,
    checkedExercises,
    reps,
    exerciseWeights,
    checkedStretches,
    completedChallengeIds,
    dailyVariation:
      normalizedVariation.suppressedExercises.length > 0 ||
      normalizedVariation.additionalExercises.length > 0
        ? normalizedVariation
        : null,
    dayJustification: justification,
    sessionFeedback,
  };
};

export const todayRepository = {
  isRemoteEnabled() {
    return getTodayRemoteFlag();
  },

  getSyncDebugSnapshot() {
    return { ...syncDebugState, enabled: getTodayRemoteFlag() };
  },

  async getToday(dateInput) {
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    try {
      const payload = await fetchJson(`${TODAY_API_BASE}/${dateStr}`);
      markSyncSuccess('read_today');
      return payload;
    } catch (error) {
      markSyncFailure('read_today', error);
      throw error;
    }
  },

  async getTodayRange(fromDateInput, toDateInput) {
    const fromDate = toIsoDate(fromDateInput);
    const toDate = toIsoDate(toDateInput);
    if (!fromDate || !toDate) throw new Error('Dates invalides');
    try {
      const payload = await fetchJson(
        `${TODAY_API_BASE}/range?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`
      );
      markSyncSuccess('read_today_range');
      return payload;
    } catch (error) {
      markSyncFailure('read_today_range', error);
      throw error;
    }
  },

  applyRemoteTodayToWorkoutData(baseData, dateInput, remoteDay) {
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    const safeBase = baseData && typeof baseData === 'object' ? baseData : {};
    const normalized = normalizeRemoteTodayPayload(dateStr, remoteDay);

    if (!normalized.serverDayPersisted) {
      return safeBase;
    }

    const checked = { ...(safeBase.checkedExercises || {}) };
    const dayChecked = collectDayScopedEntries(checked, dateStr);
    Object.keys(dayChecked).forEach((k) => delete checked[k]);
    Object.assign(checked, normalized.checkedExercises);

    const reps = { ...(safeBase.reps || {}) };
    const dayReps = collectDayScopedEntries(reps, dateStr);
    Object.keys(dayReps).forEach((k) => delete reps[k]);
    Object.assign(reps, normalized.reps);

    const weights = { ...(safeBase.exerciseWeights || {}) };
    const dayWeights = collectDayScopedEntries(weights, dateStr);
    Object.keys(dayWeights).forEach((k) => delete weights[k]);
    Object.assign(weights, normalized.exerciseWeights);

    const stretches = { ...(safeBase.checkedStretches || {}) };
    const dayStretches = collectDayScopedEntries(stretches, dateStr);
    Object.keys(dayStretches).forEach((k) => delete stretches[k]);
    Object.assign(stretches, normalized.checkedStretches);

    const nextDailyVariations = { ...(safeBase.dailyVariations || {}) };
    if (normalized.dailyVariation) {
      nextDailyVariations[dateStr] = normalized.dailyVariation;
    } else {
      delete nextDailyVariations[dateStr];
    }

    const nextDayJustifications = { ...(safeBase.dayJustifications || {}) };
    if (normalized.dayJustification?.reason) {
      nextDayJustifications[dateStr] = normalized.dayJustification;
    }
    // Ne pas supprimer une justification calendrier si le payload Aujourd’hui n’en contient pas.

    const nextSessionFeedbacks = { ...(safeBase.sessionFeedbacks || {}) };
    if (normalized.sessionFeedback) {
      nextSessionFeedbacks[dateStr] = normalized.sessionFeedback;
    } else {
      delete nextSessionFeedbacks[dateStr];
    }

    const currentEndurance = safeBase.enduranceData && typeof safeBase.enduranceData === 'object'
      ? safeBase.enduranceData
      : { sessions: {}, challenges: [] };
    const baseChallenges = Array.isArray(currentEndurance.challenges) ? currentEndurance.challenges : [];
    const completedSet = new Set(normalized.completedChallengeIds || []);
    const nextChallenges = baseChallenges.map((challenge) => {
      const cid = String(challenge?.id ?? '');
      if (!completedSet.has(cid)) return challenge;
      if (challenge?.type === 'recurrent') {
        return {
          ...challenge,
          status: 'active',
          lastCompletedDate: dateStr,
        };
      }
      return {
        ...challenge,
        status: 'completed',
        completedAt: challenge?.completedAt || new Date().toISOString(),
      };
    });

    return {
      ...safeBase,
      checkedExercises: checked,
      reps,
      exerciseWeights: weights,
      checkedStretches: stretches,
      dailyVariations: nextDailyVariations,
      dayJustifications: nextDayJustifications,
      sessionFeedbacks: nextSessionFeedbacks,
      enduranceData: {
        ...currentEndurance,
        challenges: nextChallenges,
      },
    };
  },

  applyRemoteTodayRangeToWorkoutData(baseData, daysByDate) {
    const safeDays = daysByDate && typeof daysByDate === 'object' ? daysByDate : {};
    return Object.entries(safeDays).reduce((acc, [dateStr, payload]) => {
      return this.applyRemoteTodayToWorkoutData(acc, dateStr, payload);
    }, baseData);
  },

  async syncExerciseStatesForDate(dateInput, workoutData) {
    if (!getTodayRemoteFlag()) return { skipped: true };
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    const checked = workoutData?.checkedExercises || {};
    const reps = workoutData?.reps || {};
    const weights = workoutData?.exerciseWeights || {};
    const ids = new Set();

    Object.keys(checked).forEach((key) => {
      const exId = parseExerciseIdFromStorageKey(dateStr, key);
      if (exId) ids.add(exId);
    });
    Object.keys(reps).forEach((key) => {
      const exId = parseExerciseIdFromStorageKey(dateStr, key);
      if (exId) ids.add(exId);
    });
    Object.keys(weights).forEach((key) => {
      const exId = parseExerciseIdFromStorageKey(dateStr, key);
      if (exId) ids.add(exId);
    });

    const operations = Array.from(ids).map(async (exerciseId) => {
      const storageKey = `${dateStr}_${exerciseId}`;
      return fetchJson(`${TODAY_API_BASE}/${dateStr}/exercises/${encodeURIComponent(exerciseId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          checked: Boolean(checked[storageKey]),
          reps: String(reps[storageKey] ?? ''),
          weight: String(weights[storageKey] ?? ''),
          operationId: `sync_${dateStr}_${exerciseId}_${Date.now()}`,
        }),
      });
    });

    const settled = await Promise.allSettled(operations);
    const failed = settled.filter((x) => x.status === 'rejected');
    if (failed.length > 0) {
      markSyncFailure('write_exercises', new Error(`${failed.length} sync exercise(s) failed`));
    } else {
      markSyncSuccess('write_exercises');
    }
    return {
      synced: settled.length - failed.length,
      failed: failed.length,
    };
  },

  async saveDayJustification(dateInput, justification) {
    if (!getTodayRemoteFlag()) return { skipped: true };
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    try {
      const res = await fetchJson(`${TODAY_API_BASE}/${dateStr}/justification`, {
        method: 'POST',
        body: JSON.stringify({
          reason: justification?.reason || '',
          note: justification?.note || '',
          operationId: `justification_${dateStr}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_justification');
      return res;
    } catch (error) {
      markSyncFailure('write_justification', error);
      throw error;
    }
  },

  async saveSessionFeedback(dateInput, feedbackPayload) {
    if (!getTodayRemoteFlag()) return { skipped: true };
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    try {
      const res = await fetchJson(`${TODAY_API_BASE}/${dateStr}/session-feedback`, {
        method: 'POST',
        body: JSON.stringify({
          ...feedbackPayload,
          operationId: `feedback_${dateStr}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_session_feedback');
      return res;
    } catch (error) {
      markSyncFailure('write_session_feedback', error);
      throw error;
    }
  },

  async suppressExercise(dateInput, exerciseId) {
    if (!getTodayRemoteFlag()) return { skipped: true };
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    try {
      const res = await fetchJson(`${TODAY_API_BASE}/${dateStr}/variations/suppress`, {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: String(exerciseId),
          operationId: `variation_suppress_${dateStr}_${exerciseId}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_variation_suppress');
      return res;
    } catch (error) {
      markSyncFailure('write_variation_suppress', error);
      throw error;
    }
  },

  async syncStretchStatesForDate(dateInput, workoutData) {
    if (!getTodayRemoteFlag()) return { skipped: true };
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    const checkedStretches = workoutData?.checkedStretches || {};
    const stretchKeys = Object.keys(checkedStretches).filter((k) => k.startsWith(`${dateStr}_`));
    const operations = stretchKeys.map(async (key) => {
      const stretchId = key.slice(dateStr.length + 1);
      return fetchJson(`${TODAY_API_BASE}/${dateStr}/stretches/${encodeURIComponent(stretchId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          checked: Boolean(checkedStretches[key]),
          operationId: `stretch_${dateStr}_${stretchId}_${Date.now()}`,
        }),
      });
    });
    const settled = await Promise.allSettled(operations);
    const failed = settled.filter((x) => x.status === 'rejected');
    if (failed.length > 0) {
      markSyncFailure('write_stretches', new Error(`${failed.length} sync stretch(es) failed`));
    } else {
      markSyncSuccess('write_stretches');
    }
    return { synced: settled.length - failed.length, failed: failed.length };
  },

  async restoreExercise(dateInput, exerciseId) {
    if (!getTodayRemoteFlag()) return { skipped: true };
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    try {
      const res = await fetchJson(`${TODAY_API_BASE}/${dateStr}/variations/restore`, {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: String(exerciseId),
          operationId: `variation_restore_${dateStr}_${exerciseId}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_variation_restore');
      return res;
    } catch (error) {
      markSyncFailure('write_variation_restore', error);
      throw error;
    }
  },

  async upsertExceptionalExercise(dateInput, exercisePayload) {
    if (!getTodayRemoteFlag()) return { skipped: true };
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    try {
      const res = await fetchJson(`${TODAY_API_BASE}/${dateStr}/variations/exceptional`, {
        method: 'POST',
        body: JSON.stringify({
          exercise: exercisePayload,
          operationId: `variation_exceptional_${dateStr}_${exercisePayload?.id || 'unknown'}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_variation_exceptional');
      return res;
    } catch (error) {
      markSyncFailure('write_variation_exceptional', error);
      throw error;
    }
  },

  async deleteExceptionalExercise(dateInput, exerciseId) {
    if (!getTodayRemoteFlag()) return { skipped: true };
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    try {
      const res = await fetchJson(
        `${TODAY_API_BASE}/${dateStr}/variations/exceptional/${encodeURIComponent(String(exerciseId))}`,
        { method: 'DELETE' }
      );
      markSyncSuccess('delete_variation_exceptional');
      return res;
    } catch (error) {
      markSyncFailure('delete_variation_exceptional', error);
      throw error;
    }
  },

  async saveChallengeCompletion(dateInput, challengeId) {
    if (!getTodayRemoteFlag()) return { skipped: true };
    const dateStr = toIsoDate(dateInput);
    if (!dateStr) throw new Error('Date invalide');
    try {
      const res = await fetchJson(`${TODAY_API_BASE}/${dateStr}/challenges/complete`, {
        method: 'POST',
        body: JSON.stringify({
          challengeId: String(challengeId),
          operationId: `challenge_complete_${dateStr}_${challengeId}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_challenge_complete');
      return res;
    } catch (error) {
      markSyncFailure('write_challenge_complete', error);
      throw error;
    }
  },
};

