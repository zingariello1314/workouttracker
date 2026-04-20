/**
 * Charge d'entraînement pondérée (reps × coefficient) pour le calendrier et l'historique.
 * Les coefficients par défaut sont heuristiques ; l'utilisateur peut surcharger par id d'exercice.
 *
 * @module trainingLoadUtils
 */

import { isMockEnduranceSession, parseDurationToMinutes } from './calendarUtils';

/**
 * Infère un coefficient à partir du nom / série / type (sans surcharge utilisateur).
 * @param {Object} exercise
 * @returns {number}
 */
/**
 * Nombre d'étoiles (1–5) à partir du coefficient de charge (affichage Aujourd'hui / Calendrier).
 */
export function intensityCoeffToStarCount(coeff) {
  const c = Number(coeff);
  if (!Number.isFinite(c) || c <= 0) return 1;
  if (c < 0.2) return 1;
  if (c < 1.35) return 2;
  if (c < 2.55) return 3;
  if (c < 3.85) return 4;
  return 5;
}

export function inferExerciseIntensityCoeff(exercise) {
  if (!exercise || typeof exercise !== 'object') {
    return 1;
  }

  const name = String(exercise.name || exercise.nom || '').toLowerCase();
  const series = String(exercise.series || '').toLowerCase();
  const type = String(exercise.type || '').toLowerCase();
  const idStr = exercise.id != null ? String(exercise.id) : '';

  if (idStr.includes('complementary')) {
    return 1;
  }

  // Référentiel cardio (onglet Exercices) — ids stables cardio_*
  if (idStr.startsWith('cardio_')) {
    if (idStr.includes('sprint')) return 2.35;
    if (idStr.includes('interval')) return 2.08;
    if (idStr.includes('fartlek')) return 1.68;
    if (idStr.includes('threshold') || idStr.includes('seuil')) return 1.86;
    if (idStr.includes('tempo')) return 1.78;
    if (idStr.includes('long')) return 1.42;
    if (idStr.includes('easy') || idStr.includes('fondamental') || idStr.includes('recovery')) return 1.06;
    if (idStr.includes('jumprope') || idStr.includes('corde')) return 1.42;
    if (idStr.includes('swim') || idStr.includes('natation')) return 1.52;
    if (idStr.includes('box')) return 1.55;
    if (idStr.includes('endurance')) return 1.32;
    return 1.28;
  }

  if (
    type.includes('circuit') ||
    type === 'circuit_abdos' ||
    series.includes('sec') ||
    /\b\d+\s*sec\b/i.test(series) ||
    name.includes('planche') ||
    name.includes('gainage') ||
    name.includes('plank') ||
    name.includes('hollow') ||
    name.includes('dead hang')
  ) {
    return 0.08;
  }

  if (name.includes('muscle-up') || name.includes('muscle up') || name.includes('muscleup')) {
    return 6;
  }
  if (name.includes('traction') || name.includes('pull-up') || name.includes('pull up') || name.includes('pullup')) {
    return name.includes('austral') ? 2.5 : 5;
  }
  if (name.includes('dip')) {
    return 4;
  }
  if (name.includes('pomp') || name.includes('push-up') || name.includes('push up') || name.includes('pushup')) {
    return 3;
  }
  if (name.includes('squat') || name.includes('fente') || name.includes('presse')) {
    return 2;
  }
  if (name.includes('curl')) {
    return 1;
  }

  return 1;
}

/**
 * Coefficient effectif pour un exercice (surcharge utilisateur > inférence).
 * @param {Object} exercise — au minimum { id, name? }
 * @param {Record<string, number>} userCoeffs — ex. data.exerciseIntensityCoeffs
 * @returns {number}
 */
export function resolveExerciseIntensityCoeff(exercise, userCoeffs = {}) {
  const coeffs = userCoeffs && typeof userCoeffs === 'object' ? userCoeffs : {};
  const idStr = exercise?.id != null ? String(exercise.id) : '';
  if (idStr) {
    const raw = coeffs[idStr];
    const n = raw !== undefined && raw !== null && raw !== '' ? Number(raw) : NaN;
    if (!Number.isNaN(n) && n > 0) {
      return n;
    }
  }
  if (exercise?.id != null && typeof exercise.id === 'number') {
    const raw = coeffs[exercise.id];
    const n = raw !== undefined && raw !== null && raw !== '' ? Number(raw) : NaN;
    if (!Number.isNaN(n) && n > 0) {
      return n;
    }
  }
  return inferExerciseIntensityCoeff(exercise);
}

/** Détection holds isométriques pour le calendrier (on n’a souvent que le nom). */
export function exerciseNameLooksIsometricForCalendar(name) {
  const n = String(name || '').toLowerCase();
  return /plank|planche|gainage|hollow|dead hang|mur du|l-sit|v-sit|statique|superman statique/.test(n);
}

/** Unités « brutes » paliers : 0–30 s ×1.5, 30–60 s ×2, au-delà ×2.5 (fatigue métabolique). */
export function tieredIsometricRawUnits(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (s <= 0) return 0;
  let raw = 0;
  raw += Math.min(s, 30) * 1.5;
  if (s > 30) raw += Math.min(s - 30, 30) * 2;
  if (s > 60) raw += (s - 60) * 2.5;
  return raw;
}

const TIERED_ISO_CALIBRATION = 0.575;

/**
 * Médiane des poids (kg) saisis pour un id d’exercice (toutes dates, clés `YYYY-MM-DD_id…`).
 * @param {Record<string, string|number>|undefined|null} exerciseWeights
 * @param {string|number} exerciseId
 * @returns {number|null}
 */
export function computeMedianWeightKgForExercise(exerciseWeights, exerciseId) {
  const id = exerciseId != null ? String(exerciseId) : '';
  if (!id || !exerciseWeights || typeof exerciseWeights !== 'object') return null;
  const vals = [];
  for (const [k, raw] of Object.entries(exerciseWeights)) {
    const rest = k.slice(11);
    if (rest !== id && !rest.startsWith(`${id}_`)) continue;
    if (raw === undefined || raw === null || String(raw).trim() === '') continue;
    const n = parseFloat(String(raw).trim().replace(',', '.'));
    if (Number.isFinite(n) && n > 0) vals.push(n);
  }
  if (!vals.length) return null;
  vals.sort((a, b) => a - b);
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

/**
 * Multiplicateur de charge pour exercices à charge externe (haltères / barre / gilet).
 * Sans poids saisi : 1 (pas « gratuit » vs charges lourdes).
 * Au-dessus de la médiane perso : bonus modéré ; en dessous : léger malus.
 */
export function computeExternalLoadMultiplier(usesExternalLoad, weightKg, medianKg) {
  if (!usesExternalLoad) return 1;
  const w = Number(weightKg);
  if (!Number.isFinite(w) || w <= 0) return 1;
  const med = Number(medianKg);
  if (!Number.isFinite(med) || med <= 0) {
    return Math.min(1.14, 1 + w / 420);
  }
  const ratio = w / med;
  if (ratio < 0.72) return 0.88 + (ratio / 0.72) * 0.06;
  if (ratio < 1) return 0.94 + ((ratio - 0.72) / (1 - 0.72)) * 0.06;
  if (ratio < 1.35) return 1 + ((ratio - 1) / 0.35) * 0.14;
  return Math.min(1.42, 1.14 + (ratio - 1.35) * 0.2);
}

/**
 * Contribution calendrier musculation : reps × coeff, ou paliers secondes × coeff pour holds détectés.
 * @param {number} [weightMultiplier] — ex. charge externe (défaut 1)
 */
export function computeStrengthCalendarContribution(exerciseLike, reps, coeff, weightMultiplier = 1) {
  const name = exerciseLike?.name || exerciseLike?.nom || '';
  const r = Math.max(0, Math.floor(Number(reps) || 0));
  if (r <= 0) return 0;
  const c = Number(coeff);
  const coeffN = Number.isFinite(c) && c > 0 ? c : inferExerciseIntensityCoeff(exerciseLike);
  const wm = Number(weightMultiplier);
  const mult = Number.isFinite(wm) && wm > 0 ? wm : 1;
  if (exerciseNameLooksIsometricForCalendar(name)) {
    const raw = tieredIsometricRawUnits(r);
    return raw * coeffN * TIERED_ISO_CALIBRATION * mult;
  }
  return r * coeffN * mult;
}

function normalizeSessionDate(session) {
  let d = session?.date;
  if (!d) return null;
  if (typeof d === 'string' && d.includes('T')) {
    d = d.split('T')[0];
  }
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }
  return null;
}

export function enduranceRepsForSession(activityType, session) {
  if (activityType === 'jumprope' || isMockEnduranceSession(session)) {
    return 0;
  }
  const raw =
    session.count !== undefined && session.count !== null
      ? session.count
      : session.reps !== undefined && session.reps !== null
        ? session.reps
        : 0;
  const n = typeof raw === 'number' ? raw : parseInt(raw, 10);
  return !Number.isNaN(n) && n > 0 ? n : 0;
}

const RUNNING_TYPE_FACTORS = {
  endurance: 1,
  easy: 0.86,
  fundamental: 0.86,
  recovery: 0.82,
  long_run: 1.1,
  long: 1.1,
  tempo: 1.28,
  threshold: 1.34,
  interval: 1.5,
  fartlek: 1.2,
  sprint: 1.64
};

/**
 * Détail des facteurs de charge course (aperçu UI + calcul).
 * @returns {null|{ minutes: number, distanceKm: number, type: string, tf: number, paceMult: number, elevMult: number, hrMult: number, volume: number, combined: number }}
 */
export function analyzeRunningSessionFactors(session) {
  if (!session || isMockEnduranceSession(session)) return null;

  const minutes = parseDurationToMinutes(session.duration || 0, 'analyzeRunningSessionFactors');
  const distanceKm = parseFloat(String(session.distance ?? '').replace(',', '.')) || 0;
  if (minutes <= 0 && distanceKm <= 0) return null;

  const type = String(session.type || 'endurance').toLowerCase();
  const tf = RUNNING_TYPE_FACTORS[type] ?? 1;

  let paceMult = 1;
  if (distanceKm > 0.05 && minutes > 0) {
    const paceMinPerKm = minutes / distanceKm;
    if (paceMinPerKm < 3.8) paceMult = 1.48;
    else if (paceMinPerKm < 4.4) paceMult = 1.34;
    else if (paceMinPerKm < 5) paceMult = 1.18;
    else if (paceMinPerKm < 5.8) paceMult = 1.02;
    else if (paceMinPerKm < 6.8) paceMult = 0.94;
    else if (paceMinPerKm < 8.2) paceMult = 0.86;
    else paceMult = 0.78;
  }

  const elev = parseFloat(String(session.elevation ?? '').replace(',', '.')) || 0;
  const elevMult = 1 + Math.min(Math.max(elev, 0) / 480, 1.25) * 0.26;

  let hrMult = 1;
  const hr = Number(session.avgHR);
  if (Number.isFinite(hr) && hr > 0) {
    if (hr >= 176) hrMult = 1.14;
    else if (hr >= 164) hrMult = 1.1;
    else if (hr >= 152) hrMult = 1.05;
    else if (hr <= 112) hrMult = 0.97;
  }

  const volume = minutes > 0 ? minutes * 1.45 : distanceKm * 11;
  const combined = volume * tf * paceMult * elevMult * hrMult;

  return {
    minutes,
    distanceKm,
    type,
    tf,
    paceMult,
    elevMult,
    hrMult,
    volume,
    combined
  };
}

/**
 * Charge « équivalent reps » pour une séance de course (durée, allure, type, D+, FC).
 * Échelle calibrée pour se combiner au reste du calendrier (muscu pondéré + autres endurance).
 */
export function computeRunningTrainingLoad(session) {
  const a = analyzeRunningSessionFactors(session);
  if (!a) return 0;
  const load = Math.round(a.combined);
  if (load > 0) return Math.max(1, load);
  return enduranceRepsForSession('running', session);
}

/**
 * Charge équivalente corde à sauter (durée + sauts) — alignée calendrier / Récap.
 */
export function computeJumpRopeTrainingLoad(session) {
  if (!session) return 0;
  const minutes = parseDurationToMinutes(session.duration);
  const jumps = Math.max(0, Math.floor(Number(session.jumps) || 0));
  const raw = minutes * 3.4 + jumps * 0.048;
  const load = Math.round(raw);
  return load > 0 ? Math.max(1, load) : 0;
}

function computeDurationMinutesTrainingLoad(session, factorPerMinute) {
  const minutes = parseDurationToMinutes(session?.duration);
  if (minutes <= 0) return 0;
  return Math.max(1, Math.round(minutes * factorPerMinute));
}

export function enduranceSessionCalendarLoad(activityType, session) {
  if (isMockEnduranceSession(session)) {
    return 0;
  }
  if (activityType === 'jumprope') {
    return computeJumpRopeTrainingLoad(session);
  }
  if (activityType === 'running') {
    const rl = computeRunningTrainingLoad(session);
    if (rl > 0) return rl;
  }
  if (activityType === 'boxing') {
    const d = computeDurationMinutesTrainingLoad(session, 4.35);
    if (d > 0) return d;
  }
  if (activityType === 'swimming') {
    const d = computeDurationMinutesTrainingLoad(session, 3.85);
    if (d > 0) return d;
  }
  return enduranceRepsForSession(activityType, session);
}

/**
 * Contribution endurance (incl. course pondérée allure/type) pour une date.
 */
export function getEnduranceLoadForDate(dateStr, allData) {
  const sessions = allData?.enduranceData?.sessions || {};
  let sum = 0;
  Object.entries(sessions).forEach(([activityType, activitySessions]) => {
    if (!Array.isArray(activitySessions)) return;
    activitySessions.forEach((session) => {
      const ds = normalizeSessionDate(session);
      if (!ds || ds !== dateStr) return;
      sum += enduranceSessionCalendarLoad(activityType, session);
    });
  });
  return sum;
}

/**
 * Agrège les clés reps par (date, id d'exercice numérique) en prenant la meilleure entrée cochée (même logique que variante A/B).
 */
export function aggregateCheckedRepsByDateAndExerciseId(reps, checked) {
  const best = new Map();
  const repKeys = Object.keys(reps || {});

  repKeys.forEach((key) => {
    const m = key.match(/^(\d{4}-\d{2}-\d{2})_(\d+)(?:_(semaineA|semaineB))?$/);
    if (!m) return;

    const dateStr = m[1];
    const exerciseId = m[2];
    const gkey = `${dateStr}::${exerciseId}`;

    const r = parseInt(reps[key], 10) || 0;
    if (!checked?.[key] || r <= 0) return;

    const prev = best.get(gkey);
    if (!prev || r > prev.reps) {
      best.set(gkey, { reps: r, key });
    }
  });

  return best;
}

/**
 * Carte date → charge musculation + endurance (reps endurance non pondérées, comme avant).
 * Utilisé pour calibrer les seuils du calendrier.
 *
 * @param {Object} allData — jeu workout (reps, checkedExercises, enduranceData, exerciseIntensityCoeffs)
 * @param {Function} [getExerciseNameById]
 * @returns {Record<string, number>}
 */
export function buildDailyTrainingLoadByDate(allData, getExerciseNameById) {
  const userCoeffs = allData?.exerciseIntensityCoeffs || {};
  const daily = {};

  const grouped = aggregateCheckedRepsByDateAndExerciseId(allData?.reps, allData?.checkedExercises);
  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const idStr = gkey.slice(sep + 2);
    const idNum = parseInt(idStr, 10);
    const name =
      typeof getExerciseNameById === 'function' && !Number.isNaN(idNum)
        ? getExerciseNameById(idStr)
        : '';
    const coeff = resolveExerciseIntensityCoeff(
      { id: idNum, name, nom: name, series: '', type: 'standard' },
      userCoeffs
    );
    const contrib = computeStrengthCalendarContribution(
      { id: idNum, name, nom: name, series: '', type: 'standard' },
      r,
      coeff
    );
    daily[dateStr] = (daily[dateStr] || 0) + contrib;
  });

  const sessions = allData?.enduranceData?.sessions || {};
  Object.entries(sessions).forEach(([activityType, activitySessions]) => {
    if (!Array.isArray(activitySessions)) return;
    activitySessions.forEach((session) => {
      const ds = normalizeSessionDate(session);
      if (!ds) return;
      const load = enduranceSessionCalendarLoad(activityType, session);
      if (load > 0) {
        daily[ds] = (daily[ds] || 0) + load;
      }
    });
  });

  return daily;
}
