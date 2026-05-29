/**
 * Fallback doux après séance manquée : allège la prochaine séance prévue (P2 SPEC).
 */

const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function ymdFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function scheduleDayForYmd(schedule, ymd) {
  const dow = new Date(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(5, 7)) - 1,
    Number(ymd.slice(8, 10))
  ).getDay();
  return schedule?.[DAY_NAMES_FR[dow]] || null;
}

/**
 * Hier était-il un jour actif sans coches ?
 */
export function wasYesterdayMissed(snapshot, schedule, sessionYmd) {
  if (!schedule) return false;
  const d = new Date(
    Number(sessionYmd.slice(0, 4)),
    Number(sessionYmd.slice(5, 7)) - 1,
    Number(sessionYmd.slice(8, 10))
  );
  d.setDate(d.getDate() - 1);
  const ymd = ymdFromDate(d);
  const daySched = scheduleDayForYmd(schedule, ymd);
  if (!daySched?.active) return false;
  const any = Object.keys(snapshot?.checkedExercises || {}).some(
    (k) => k.startsWith(`${ymd}_`) && snapshot.checkedExercises[k]
  );
  return !any;
}

/**
 * @returns {{ factor: number, note: string|null }}
 */
export function resolveMissedSessionFallback(snapshot, schedule, sessionYmd) {
  if (!wasYesterdayMissed(snapshot, schedule, sessionYmd)) {
    return { factor: 1, note: null };
  }
  return {
    factor: 0.85,
    note: 'Séance d’hier non réalisée : volume du jour réduit (~15 %) pour reprendre sans surcharge.'
  };
}
