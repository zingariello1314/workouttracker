const EXERCISES_API_BASE = '/v1/exercises';

const isBrowser = typeof window !== 'undefined';

const getExercisesRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_EXERCISES || '').toLowerCase();
  if (fromEnv === 'true') return true;
  const fromLocalStorage = String(localStorage.getItem('USE_REMOTE_API_EXERCISES') || '').toLowerCase();
  return fromLocalStorage === 'true';
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
  enabled: getExercisesRemoteFlag(),
  lastOperation: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastError: null,
};

const markSyncSuccess = (operation) => {
  syncDebugState.enabled = getExercisesRemoteFlag();
  syncDebugState.lastOperation = operation;
  syncDebugState.lastSuccessAt = new Date().toISOString();
  syncDebugState.lastError = null;
};

const markSyncFailure = (operation, error) => {
  syncDebugState.enabled = getExercisesRemoteFlag();
  syncDebugState.lastOperation = operation;
  syncDebugState.lastErrorAt = new Date().toISOString();
  syncDebugState.lastError = error?.message || String(error || 'Unknown error');
};

const toFiniteCoeffOrNull = (value) => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0.05) return null;
  return parsed;
};

const sanitizePerceived = (value) => {
  const payload = value && typeof value === 'object' ? value : {};
  const clamp = (v) => Math.max(0, Math.min(10, Number(v) || 0));
  const difficulty = clamp(payload.difficulty);
  const enjoyment = clamp(payload.enjoyment);
  const recovery = clamp(payload.recovery);
  if (difficulty === 0 && enjoyment === 0 && recovery === 0) return null;
  return { difficulty, enjoyment, recovery };
};

export const exercisesRepository = {
  isRemoteEnabled() {
    return getExercisesRemoteFlag();
  },

  getSyncDebugSnapshot() {
    return { ...syncDebugState, enabled: getExercisesRemoteFlag() };
  },

  async getPreferences() {
    try {
      const payload = await fetchJson(`${EXERCISES_API_BASE}/preferences`);
      markSyncSuccess('read_exercises_preferences');
      return payload;
    } catch (error) {
      markSyncFailure('read_exercises_preferences', error);
      throw error;
    }
  },

  applyRemotePreferencesToWorkoutData(baseData, remotePayload) {
    const safeBase = baseData && typeof baseData === 'object' ? baseData : {};
    const payload = remotePayload && typeof remotePayload === 'object' ? remotePayload : {};
    const coeffs = payload.exerciseIntensityCoeffs && typeof payload.exerciseIntensityCoeffs === 'object'
      ? payload.exerciseIntensityCoeffs
      : {};
    const ratings = payload.exercisePerceivedRatings && typeof payload.exercisePerceivedRatings === 'object'
      ? payload.exercisePerceivedRatings
      : {};
    const notes = payload.exercisePersonalNotes && typeof payload.exercisePersonalNotes === 'object'
      ? payload.exercisePersonalNotes
      : {};

    return {
      ...safeBase,
      exerciseIntensityCoeffs: { ...coeffs },
      exercisePerceivedRatings: { ...ratings },
      exercisePersonalNotes: { ...notes },
    };
  },

  async saveIntensityCoeff(exerciseId, coeffValue) {
    if (!getExercisesRemoteFlag()) return { skipped: true };
    const exId = String(exerciseId || '').trim();
    if (!exId) throw new Error('exerciseId invalide');
    const coeff = toFiniteCoeffOrNull(coeffValue);
    try {
      const res = await fetchJson(`${EXERCISES_API_BASE}/${encodeURIComponent(exId)}/coeff`, {
        method: 'PUT',
        body: JSON.stringify({
          value: coeff,
          operationId: `ex_coeff_${exId}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_exercises_coeff');
      return res;
    } catch (error) {
      markSyncFailure('write_exercises_coeff', error);
      throw error;
    }
  },

  async savePerceivedRatings(exerciseId, perceivedPayload) {
    if (!getExercisesRemoteFlag()) return { skipped: true };
    const exId = String(exerciseId || '').trim();
    if (!exId) throw new Error('exerciseId invalide');
    const ratings = sanitizePerceived(perceivedPayload);
    try {
      const res = await fetchJson(`${EXERCISES_API_BASE}/${encodeURIComponent(exId)}/perceived`, {
        method: 'PUT',
        body: JSON.stringify({
          value: ratings,
          operationId: `ex_perceived_${exId}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_exercises_perceived');
      return res;
    } catch (error) {
      markSyncFailure('write_exercises_perceived', error);
      throw error;
    }
  },

  async savePersonalNote(exerciseId, noteValue) {
    if (!getExercisesRemoteFlag()) return { skipped: true };
    const exId = String(exerciseId || '').trim();
    if (!exId) throw new Error('exerciseId invalide');
    const note = String(noteValue || '').trim();
    try {
      const res = await fetchJson(`${EXERCISES_API_BASE}/${encodeURIComponent(exId)}/notes`, {
        method: 'PUT',
        body: JSON.stringify({
          value: note || null,
          operationId: `ex_note_${exId}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_exercises_notes');
      return res;
    } catch (error) {
      markSyncFailure('write_exercises_notes', error);
      throw error;
    }
  },
};

