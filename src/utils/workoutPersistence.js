/**
 * Utilitaires de persistance sport (localStorage synchrone + clés legacy).
 * Le backup localStorage survit au F5 même si IndexedDB est lent ou indisponible.
 */

export const getWorkoutStorageKey = (currentUser, isAdmin) => {
  if (isAdmin) return 'main';
  if (currentUser?.id) return `user-${currentUser.id}`;
  return 'anonymous';
};

export const getWorkoutBackupKey = (storageKey) => `workoutData_backup_${storageKey}`;

const LEGACY_BACKUP_KEYS = [
  'workoutData_backup',
  'workoutData_backup_main',
  'workoutData_backup_anonymous',
];

/** Écriture synchrone — appeler à chaque modification reps / cases cochées. */
export const backupWorkoutToLocalStorage = (storageKey, data) => {
  if (!storageKey || storageKey === 'anonymous' || !data) return;
  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(getWorkoutBackupKey(storageKey), payload);
    localStorage.setItem('workoutData_backup', payload);
    localStorage.setItem(`workoutData_lastSaved_${storageKey}`, new Date().toISOString());
  } catch (e) {
    console.warn('[workoutPersistence] Backup localStorage échoué:', e);
  }
};

/** Lecture avec repli sur anciennes clés. */
export const loadWorkoutFromLocalStorage = (storageKey) => {
  const keys = [
    getWorkoutBackupKey(storageKey),
    ...LEGACY_BACKUP_KEYS,
    storageKey !== 'main' ? getWorkoutBackupKey('main') : null,
  ].filter(Boolean);

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const hasContent =
          Object.keys(parsed.checkedExercises || {}).length > 0 ||
          Object.keys(parsed.reps || {}).length > 0 ||
          Object.keys(parsed.checkedStretches || {}).length > 0;
        if (hasContent || key === getWorkoutBackupKey(storageKey)) {
          return parsed;
        }
      }
    } catch {
      // essayer clé suivante
    }
  }
  return null;
};

export const hasWorkoutContent = (data) => {
  if (!data || typeof data !== 'object') return false;
  return (
    Object.keys(data.checkedExercises || {}).length > 0 ||
    Object.keys(data.reps || {}).length > 0 ||
    Object.keys(data.checkedStretches || {}).length > 0
  );
};
