const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const buildPerformanceScore = (entry = {}) => {
  const type = String(entry.performanceType || '').toLowerCase();
  if (type === 'weight_reps') {
    const w = toNumberOrNull(entry.weightKg) || 0;
    const r = toNumberOrNull(entry.reps) || 0;
    return w * 1000 + r;
  }
  if (type === 'duration') {
    return toNumberOrNull(entry.durationSec) || 0;
  }
  return toNumberOrNull(entry.reps) || 0;
};

export const isCandidateBetter = (current, candidate) => {
  if (!current) return true;
  const currentType = String(current.performanceType || '').toLowerCase();
  const candidateType = String(candidate.performanceType || '').toLowerCase();
  if (currentType !== candidateType) {
    return String(candidate.recordedAt || '') > String(current.recordedAt || '');
  }
  return buildPerformanceScore(candidate) > buildPerformanceScore(current);
};

export const upsertMaxRecord = (records = [], candidate) => {
  const safeRecords = Array.isArray(records) ? records : [];
  const idx = safeRecords.findIndex((r) => String(r.exerciseId) === String(candidate.exerciseId));
  if (idx === -1) return [...safeRecords, candidate];
  const existing = safeRecords[idx];
  if (!isCandidateBetter(existing, candidate)) return safeRecords;
  const next = [...safeRecords];
  next[idx] = candidate;
  return next;
};

export const rebuildMaxRecordsFromHistory = (history = []) => {
  const safeHistory = Array.isArray(history) ? history : [];
  return safeHistory.reduce((acc, entry) => upsertMaxRecord(acc, entry), []);
};

export const applyPerformanceEntryToData = (data = {}, entry = {}, options = {}) => {
  const dateStr = String(options.dateStr || '').trim();
  const addToTodayReps = Boolean(options.addToTodayReps);
  const history = Array.isArray(data.exerciseMaxHistory) ? data.exerciseMaxHistory : [];
  const records = Array.isArray(data.exerciseMaxRecords) ? data.exerciseMaxRecords : [];

  const recordDate =
    entry.recordDate ||
    (entry.recordedAt ? String(entry.recordedAt).slice(0, 10) : new Date().toISOString().slice(0, 10));
  const savedEntry = {
    id: entry.id || `perf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
    recordDate,
    recordedAt: entry.recordedAt || new Date().toISOString()
  };

  const next = {
    ...data,
    exerciseMaxHistory: [...history, savedEntry],
    exerciseMaxRecords: upsertMaxRecord(records, savedEntry)
  };

  if (addToTodayReps && dateStr) {
    const repsRaw = toNumberOrNull(savedEntry.reps);
    const repsValue = Number.isFinite(repsRaw) ? Math.max(0, Math.round(repsRaw)) : 0;
    if (repsValue > 0) {
      const key = `${dateStr}_${savedEntry.exerciseId}`;
      const existingReps = Number(next.reps?.[key] || 0);
      next.checkedExercises = {
        ...(next.checkedExercises || {}),
        [key]: true
      };
      next.reps = {
        ...(next.reps || {}),
        [key]: String(Math.max(0, existingReps) + repsValue)
      };
      if (savedEntry.performanceType === 'weight_reps' && savedEntry.weightKg != null) {
        next.exerciseWeights = {
          ...(next.exerciseWeights || {}),
          [key]: String(savedEntry.weightKg)
        };
      }
    }
  }

  return next;
};

export const removePerformanceEntryFromData = (data = {}, entryId = '') => {
  const targetId = String(entryId || '').trim();
  if (!targetId) return data;
  const history = Array.isArray(data.exerciseMaxHistory) ? data.exerciseMaxHistory : [];
  const nextHistory = history.filter((entry) => String(entry?.id) !== targetId);
  if (nextHistory.length === history.length) return data;
  return {
    ...data,
    exerciseMaxHistory: nextHistory,
    exerciseMaxRecords: rebuildMaxRecordsFromHistory(nextHistory)
  };
};

export const getDaysSince = (isoDate) => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  const delta = Date.now() - d.getTime();
  return Math.max(0, Math.floor(delta / (1000 * 60 * 60 * 24)));
};
