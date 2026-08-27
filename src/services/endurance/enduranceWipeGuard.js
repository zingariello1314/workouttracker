/**
 * Garde-fous : ne jamais remplacer silencieusement sessions/défis par des tableaux vides.
 */

export const ENDURANCE_ACTIVITY_TYPES = [
  'boxing',
  'pushups',
  'gainage',
  'swimming',
  'jumprope',
  'running'
];

export function countEnduranceSessions(enduranceData) {
  const sessions = enduranceData?.sessions && typeof enduranceData.sessions === 'object'
    ? enduranceData.sessions
    : {};
  return ENDURANCE_ACTIVITY_TYPES.reduce((n, type) => {
    const list = sessions[type];
    return n + (Array.isArray(list) ? list.length : 0);
  }, 0);
}

export function isEnduranceEffectivelyEmpty(enduranceData) {
  const challenges = Array.isArray(enduranceData?.challenges) ? enduranceData.challenges.length : 0;
  return countEnduranceSessions(enduranceData) === 0 && challenges === 0;
}

/**
 * Fusionne incoming sur previous en bloquant un wipe accidentel.
 * Un type peut devenir [] seulement s’il est dans `sessionTypesTouched` (delete explicite).
 */
export function mergeEnduranceWithoutSilentWipe(previous, incoming, options = {}) {
  const prev = previous && typeof previous === 'object' ? previous : {};
  const next = incoming && typeof incoming === 'object' ? incoming : {};
  const allowWipe = options.allowWipe === true;
  const typesTouched = Array.isArray(options.sessionTypesTouched)
    ? new Set(options.sessionTypesTouched)
    : null;

  const prevSessions = prev.sessions && typeof prev.sessions === 'object' ? prev.sessions : {};
  const nextSessions = next.sessions && typeof next.sessions === 'object' ? next.sessions : null;
  const mergedSessions = {};

  ENDURANCE_ACTIVITY_TYPES.forEach((type) => {
    const prevList = Array.isArray(prevSessions[type]) ? prevSessions[type] : [];
    if (!nextSessions || !Object.prototype.hasOwnProperty.call(nextSessions, type)) {
      mergedSessions[type] = prevList;
      return;
    }
    const incomingList = Array.isArray(nextSessions[type]) ? nextSessions[type] : prevList;
    if (incomingList.length === 0 && prevList.length > 0) {
      const explicitEmpty = allowWipe || (typesTouched && typesTouched.has(type));
      mergedSessions[type] = explicitEmpty ? incomingList : prevList;
      return;
    }
    mergedSessions[type] = incomingList;
  });

  if (nextSessions) {
    Object.keys(nextSessions).forEach((type) => {
      if (ENDURANCE_ACTIVITY_TYPES.includes(type)) return;
      if (Array.isArray(nextSessions[type])) mergedSessions[type] = nextSessions[type];
    });
  }

  let challenges = Array.isArray(next.challenges) ? next.challenges : prev.challenges;
  if (
    Array.isArray(next.challenges) &&
    next.challenges.length === 0 &&
    Array.isArray(prev.challenges) &&
    prev.challenges.length > 0 &&
    !allowWipe &&
    options.allowEmptyChallenges !== true
  ) {
    challenges = prev.challenges;
  }

  return {
    ...prev,
    ...next,
    sessions: mergedSessions,
    challenges: Array.isArray(challenges) ? challenges : [],
    gtg: next.gtg !== undefined ? next.gtg : prev.gtg,
    manualDailyWalkByDate:
      next.manualDailyWalkByDate !== undefined ? next.manualDailyWalkByDate : prev.manualDailyWalkByDate,
    repWorkoutSync: next.repWorkoutSync !== undefined ? next.repWorkoutSync : prev.repWorkoutSync
  };
}

export function enduranceBackupStorageKey(storageKey) {
  return `momentum.endurance.backup.${String(storageKey || 'main')}`;
}

export function writeEnduranceLocalBackup(storageKey, enduranceData) {
  if (isEnduranceEffectivelyEmpty(enduranceData)) return;
  try {
    localStorage.setItem(
      enduranceBackupStorageKey(storageKey),
      JSON.stringify({
        savedAt: new Date().toISOString(),
        enduranceData
      })
    );
  } catch {
    /* quota / mode privé */
  }
}

export function readEnduranceLocalBackup(storageKey) {
  try {
    const raw = localStorage.getItem(enduranceBackupStorageKey(storageKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.enduranceData || null;
  } catch {
    return null;
  }
}

function readLegacyWorkoutBackupEndurance(storageKey) {
  const keys = [
    `workoutData_backup_${storageKey}`,
    'workoutData_backup'
  ];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const ed = parsed?.enduranceData || parsed?.data?.enduranceData;
      if (ed && !isEnduranceEffectivelyEmpty(ed)) return ed;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function reconstructPushupSessionsFromWorkoutMirrors(workoutData) {
  const checked = workoutData?.checkedExercises || {};
  const reps = workoutData?.reps || {};
  const byDate = new Map();
  Object.entries(checked).forEach(([key, val]) => {
    if (val !== true) return;
    if (!String(key).includes('complementary_endurance_pushups')) return;
    const date = String(key).slice(0, 10);
    const count = Math.max(0, parseInt(String(reps[key]), 10) || 0);
    if (!date || count <= 0) return;
    byDate.set(date, (byDate.get(date) || 0) + count);
  });
  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, count]) => ({
      id: `recovered_pushups_${date}_${count}`,
      date,
      time: '',
      count,
      reps: count,
      duration: 0,
      activityType: 'pushups',
      recoveredFromWorkoutMirror: true
    }));
}

/**
 * Recolle l’historique Défis > Pompes sur les coches grades, sans toucher à reps/checkedExercises.
 * Met à jour repWorkoutSync pour ne pas recompter les mêmes pompes au prochain sync.
 */
export function hydratePushupSessionsFromWorkoutMirrors(workoutData) {
  if (!workoutData || typeof workoutData !== 'object') return workoutData;
  const recovered = reconstructPushupSessionsFromWorkoutMirrors(workoutData);
  if (recovered.length === 0) return workoutData;

  const current = workoutData.enduranceData && typeof workoutData.enduranceData === 'object'
    ? workoutData.enduranceData
    : {};
  const sessions = { ...(current.sessions && typeof current.sessions === 'object' ? current.sessions : {}) };
  const existing = Array.isArray(sessions.pushups) ? sessions.pushups : [];
  const existingDates = new Set(
    existing.map((s) => String(s?.date || '').slice(0, 10)).filter(Boolean)
  );
  const toAdd = recovered.filter((s) => !existingDates.has(s.date));
  if (toAdd.length === 0) return workoutData;

  const nextSync =
    current.repWorkoutSync && typeof current.repWorkoutSync === 'object'
      ? { ...current.repWorkoutSync }
      : {};
  toAdd.forEach((session) => {
    const day = nextSync[session.date] && typeof nextSync[session.date] === 'object'
      ? { ...nextSync[session.date] }
      : {};
    const alreadyLedged = Math.max(0, Number(day.pushups) || 0);
    day.pushups = Math.max(alreadyLedged, session.count);
    nextSync[session.date] = day;
  });

  return {
    ...workoutData,
    enduranceData: {
      ...current,
      sessions: {
        ...sessions,
        pushups: [...existing, ...toAdd]
      },
      repWorkoutSync: nextSync,
      restoredFromWorkoutMirror: true,
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Si enduranceData est vide, tente backup local puis miroir reps défis pompes.
 * Les sessions pompes manquantes sont toujours recollées depuis les coches grades.
 */
export function restoreEnduranceIfWiped(workoutData, storageKey) {
  if (!workoutData || typeof workoutData !== 'object') return workoutData;
  let next = workoutData;
  const current = next.enduranceData;

  if (!isEnduranceEffectivelyEmpty(current)) {
    writeEnduranceLocalBackup(storageKey, current);
  } else {
    const backup =
      readEnduranceLocalBackup(storageKey) || readLegacyWorkoutBackupEndurance(storageKey);
    if (backup && !isEnduranceEffectivelyEmpty(backup)) {
      next = {
        ...next,
        enduranceData: {
          ...current,
          ...backup,
          restoredFromBackup: true,
          lastUpdated: new Date().toISOString()
        }
      };
    }
  }

  return hydratePushupSessionsFromWorkoutMirrors(next);
}
