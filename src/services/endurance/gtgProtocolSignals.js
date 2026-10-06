/**
 * Signaux protocole GTG ↔ pratique / stats.
 * Aligné sur le guide Protocole (dose, RIR, signaux par mouvement).
 * @module services/endurance/gtgProtocolSignals
 */

export const GTG_DAY_FEEL = {
  easy: 'easy',
  stable: 'stable',
  drift: 'drift',
  hard: 'hard'
};

export const GTG_DAY_FEEL_ORDER = ['easy', 'stable', 'drift', 'hard'];

/**
 * Famille de mouvement pour prioriser les signaux (protocole §08).
 */
export function resolveGtgSignalFamily(exerciseId, label = '') {
  const id = String(exerciseId || '').toLowerCase();
  const name = String(label || '').toLowerCase();
  const hay = `${id} ${name}`;

  if (/muscle[\s_-]?up|muscleup/.test(hay)) return 'muscleup';
  if (/handstand|equilibre|équilibre|hs\b/.test(hay)) return 'handstand';
  if (/l[\s_-]?sit|lsit|compression/.test(hay)) return 'lsit';
  if (/explos|plyo|jump|saut|clap/.test(hay)) return 'explosive';
  if (id === 'pullups' || /traction|pull[\s_-]?up|chin/.test(hay)) return 'pullup';
  if (id === 'dips' || /\bdip/.test(hay)) return 'dip';
  if (id === 'pushups' || /pompe|push[\s_-]?up/.test(hay)) return 'pushup';
  return 'generic';
}

/** @returns {{ family: string, priority: string[] }} */
export function getGtgExerciseSignals(exerciseId, label = '') {
  const family = resolveGtgSignalFamily(exerciseId, label);
  const map = {
    pullup: ['amplitude', 'trajectory', 'speed'],
    dip: ['amplitude', 'rir', 'joints'],
    pushup: ['reps', 'rir', 'wrists'],
    muscleup: ['height', 'speed', 'transition', 'trajectory'],
    handstand: ['line', 'balance', 'control'],
    lsit: ['legHeight', 'pelvis', 'shoulders'],
    explosive: ['speed', 'height', 'power'],
    generic: ['quality', 'rir', 'recovery']
  };
  return { family, priority: map[family] || map.generic };
}

/**
 * RIR théorique si max = max du jour au même standard.
 * @returns {number|null}
 */
export function estimateGtgRir(maxReps, workingReps) {
  const max = Math.round(Number(maxReps));
  const reps = Math.round(Number(workingReps));
  if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(reps) || reps <= 0) return null;
  return Math.max(0, max - reps);
}

/**
 * % du max de reps (descriptif, pas intensité).
 */
export function estimateGtgPctOfMax(maxReps, workingReps) {
  const max = Number(maxReps);
  const reps = Number(workingReps);
  if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(reps) || reps <= 0) return null;
  return Math.round((reps / max) * 100);
}

/**
 * Zone de dose pratique (protocole §06).
 * @returns {'minimal'|'conservative'|'solid'|'demanding'|'classic'}
 */
export function classifyGtgDoseZone(maxReps, workingReps) {
  const pct = estimateGtgPctOfMax(maxReps, workingReps);
  if (pct == null) return 'conservative';
  if (workingReps <= 1) return 'minimal';
  if (pct <= 25) return 'conservative';
  if (pct <= 35) return 'solid';
  if (pct <= 45) return 'demanding';
  return 'classic';
}

/**
 * Snapshot dose pour un exercice du plan du jour.
 */
export function buildGtgExerciseDose(exerciseId, { maxReps, repsPerSet, label = '' } = {}) {
  const max = Math.round(Number(maxReps)) || 0;
  const reps = Math.round(Number(repsPerSet)) || 0;
  const rir = estimateGtgRir(max, reps);
  const pct = estimateGtgPctOfMax(max, reps);
  const zone = classifyGtgDoseZone(max, reps);
  const signals = getGtgExerciseSignals(exerciseId, label);
  return {
    exerciseId,
    label,
    maxReps: max,
    repsPerSet: reps,
    rir,
    pctOfMax: pct,
    zone,
    signals
  };
}

export function normalizeGtgDayFeel(raw) {
  const v = String(raw || '').trim();
  return GTG_DAY_FEEL_ORDER.includes(v) ? v : null;
}

/**
 * Agrège feels + doses pour le panneau stats.
 * @param {{ doses: ReturnType<typeof buildGtgExerciseDose>[], feelByDate: Record<string, string|null> }} input
 */
export function summarizeGtgProtocolTracking({ doses = [], feelByDate = {} } = {}) {
  const feelCounts = { easy: 0, stable: 0, drift: 0, hard: 0 };
  Object.values(feelByDate).forEach((f) => {
    const n = normalizeGtgDayFeel(f);
    if (n) feelCounts[n] += 1;
  });
  const loggedFeels = GTG_DAY_FEEL_ORDER.reduce((s, k) => s + feelCounts[k], 0);
  const stressFeels = feelCounts.drift + feelCounts.hard;
  const hotDoses = doses.filter(
    (d) => d.zone === 'demanding' || (d.zone === 'classic' && (d.pctOfMax || 0) >= 55)
  );
  const alerts = [];
  hotDoses.forEach((d) => {
    alerts.push({
      id: `dose-${d.exerciseId}`,
      kind: 'dose',
      exerciseId: d.exerciseId,
      label: d.label,
      zone: d.zone,
      pctOfMax: d.pctOfMax,
      rir: d.rir
    });
  });
  if (loggedFeels >= 3 && stressFeels / loggedFeels >= 0.4) {
    alerts.push({
      id: 'feel-stress',
      kind: 'feel',
      stressRatio: Math.round((stressFeels / loggedFeels) * 100),
      loggedFeels
    });
  }
  return { doses, feelCounts, loggedFeels, stressFeels, alerts, hotDoses };
}
