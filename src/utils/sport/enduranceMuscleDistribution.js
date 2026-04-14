/**
 * Répartition charge endurance sur les groupes (dont jambes découpées quad / ischio / mollet)
 * selon le type de séance course ou corde.
 */
import { MuscleGroups } from '../../data/workoutProgramEnhanced';

/** Part « haut du corps + core » inchangée par type (sauf legs → 4 segments). */
const RUNNING_UPPER = {
  [MuscleGroups.CORE]: 0.14,
  [MuscleGroups.SHOULDERS]: 0.08,
  [MuscleGroups.BACK]: 0.1,
  [MuscleGroups.CHEST]: 0.04,
  [MuscleGroups.FULL_BODY]: 0.12
};

/**
 * Répartition de la part « jambes » pour la course entre
 * quadriceps / ischio / mollets / tibial antérieur.
 * Somme (quads+hams+calves+tibialis) = 0.52 pour conserver l’équilibre historique.
 */
const RUNNING_LEG_BY_TYPE = {
  recovery: { [MuscleGroups.QUADS]: 0.12, [MuscleGroups.HAMSTRINGS]: 0.2, [MuscleGroups.CALVES]: 0.14, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.06 },
  easy: { [MuscleGroups.QUADS]: 0.14, [MuscleGroups.HAMSTRINGS]: 0.18, [MuscleGroups.CALVES]: 0.14, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.06 },
  fundamental: { [MuscleGroups.QUADS]: 0.14, [MuscleGroups.HAMSTRINGS]: 0.18, [MuscleGroups.CALVES]: 0.14, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.06 },
  endurance: { [MuscleGroups.QUADS]: 0.16, [MuscleGroups.HAMSTRINGS]: 0.17, [MuscleGroups.CALVES]: 0.14, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 },
  long_run: { [MuscleGroups.QUADS]: 0.13, [MuscleGroups.HAMSTRINGS]: 0.22, [MuscleGroups.CALVES]: 0.12, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 },
  long: { [MuscleGroups.QUADS]: 0.13, [MuscleGroups.HAMSTRINGS]: 0.22, [MuscleGroups.CALVES]: 0.12, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 },
  tempo: { [MuscleGroups.QUADS]: 0.21, [MuscleGroups.HAMSTRINGS]: 0.14, [MuscleGroups.CALVES]: 0.12, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 },
  threshold: { [MuscleGroups.QUADS]: 0.23, [MuscleGroups.HAMSTRINGS]: 0.13, [MuscleGroups.CALVES]: 0.11, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 },
  interval: { [MuscleGroups.QUADS]: 0.25, [MuscleGroups.HAMSTRINGS]: 0.12, [MuscleGroups.CALVES]: 0.1, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 },
  fartlek: { [MuscleGroups.QUADS]: 0.2, [MuscleGroups.HAMSTRINGS]: 0.15, [MuscleGroups.CALVES]: 0.12, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 },
  sprint: { [MuscleGroups.QUADS]: 0.26, [MuscleGroups.HAMSTRINGS]: 0.11, [MuscleGroups.CALVES]: 0.1, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 }
};

const JUMPROPE_UPPER = {
  [MuscleGroups.SHOULDERS]: 0.17,
  [MuscleGroups.CORE]: 0.21,
  [MuscleGroups.BICEPS]: 0.07,
  [MuscleGroups.TRICEPS]: 0.05,
  [MuscleGroups.FULL_BODY]: 0.08
};

/** Part jambes corde 0.42 répartie avec tibial antérieur. */
const JUMPROPE_LEG_BY_TYPE = {
  continue: { [MuscleGroups.QUADS]: 0.1, [MuscleGroups.HAMSTRINGS]: 0.09, [MuscleGroups.CALVES]: 0.16, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.07 },
  hiit: { [MuscleGroups.QUADS]: 0.15, [MuscleGroups.HAMSTRINGS]: 0.1, [MuscleGroups.CALVES]: 0.12, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 },
  interval: { [MuscleGroups.QUADS]: 0.16, [MuscleGroups.HAMSTRINGS]: 0.09, [MuscleGroups.CALVES]: 0.12, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 },
  default: { [MuscleGroups.QUADS]: 0.13, [MuscleGroups.HAMSTRINGS]: 0.1, [MuscleGroups.CALVES]: 0.14, [MuscleGroups.TIBIALIS_ANTERIOR]: 0.05 }
};

function normalizeWeights(raw, allKeys) {
  const out = { ...raw };
  let sum = 0;
  allKeys.forEach((g) => {
    sum += out[g] || 0;
  });
  if (sum <= 0) return { [MuscleGroups.FULL_BODY]: 1 };
  const norm = {};
  allKeys.forEach((g) => {
    if (out[g]) norm[g] = out[g] / sum;
  });
  return norm;
}

const RECAP_GROUP_KEYS = [
  MuscleGroups.CHEST,
  MuscleGroups.BACK,
  MuscleGroups.SHOULDERS,
  MuscleGroups.BICEPS,
  MuscleGroups.TRICEPS,
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.CALVES,
  MuscleGroups.TIBIALIS_ANTERIOR,
  MuscleGroups.CORE,
  MuscleGroups.FULL_BODY
];

function parsePaceToSecPerKm(session) {
  const candidates = [
    session?.pace,
    session?.avgPace,
    session?.allure,
    session?.averagePace,
    session?.metrics?.pace
  ];
  for (const raw of candidates) {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 1 && raw < 1200) return raw;
    const txt = String(raw || '').trim();
    if (!txt) continue;
    const m = txt.match(/^(\d{1,2})[:m](\d{1,2})/i);
    if (m) {
      const mm = Number(m[1]);
      const ss = Number(m[2]);
      if (Number.isFinite(mm) && Number.isFinite(ss)) return mm * 60 + ss;
    }
  }
  return null;
}

function runningTypeIntensity(type) {
  const t = String(type || '').toLowerCase();
  if (/(sprint|interval|fractionn|vma|repetition)/.test(t)) return 1.18;
  if (/(tempo|threshold|seuil|fartlek)/.test(t)) return 1.1;
  if (/(long|sortie longue)/.test(t)) return 0.96;
  if (/(recovery|récup|recup)/.test(t)) return 0.9;
  if (/(easy|fundamental|endurance fondamentale)/.test(t)) return 0.94;
  return 1.0;
}

function paceIntensityFactor(session) {
  const paceSec = parsePaceToSecPerKm(session);
  if (!paceSec) return 1.0;
  // Bornes raisonnables: 3:20/km (très rapide) à 7:20/km (EF douce)
  const minP = 200;
  const maxP = 440;
  const clamped = Math.max(minP, Math.min(maxP, paceSec));
  const norm = (maxP - clamped) / (maxP - minP); // rapide -> 1
  return 0.9 + norm * 0.24; // 0.90 .. 1.14
}

function durationFatigueFactor(session) {
  const raw =
    session?.durationMinutes ??
    session?.duration_min ??
    session?.duration ??
    session?.metrics?.durationMinutes ??
    0;
  let min = Number(raw);
  if (!Number.isFinite(min)) {
    const txt = String(raw || '').trim().toLowerCase();
    const hm = txt.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (hm) {
      const h = Number(hm[3] ? hm[1] : 0);
      const m = Number(hm[3] ? hm[2] : hm[1]);
      const s = Number(hm[3] ? hm[3] : hm[2]);
      min = h * 60 + m + s / 60;
    } else {
      const minsMatch = txt.match(/(\d+(?:\.\d+)?)\s*(min|mn|m)/);
      if (minsMatch) min = Number(minsMatch[1]);
    }
  }
  if (!Number.isFinite(min) || min <= 0) return 1.0;
  if (min <= 20) return 0.94;
  if (min <= 45) return 1.0;
  if (min <= 75) return 1.05;
  return 1.1;
}

export function weightsForRunningSession(session) {
  const type = String(session?.type || 'endurance').toLowerCase();
  const leg = RUNNING_LEG_BY_TYPE[type] || RUNNING_LEG_BY_TYPE.endurance;
  const merged = { ...RUNNING_UPPER, ...leg };

  const intensity =
    runningTypeIntensity(type) *
    paceIntensityFactor(session) *
    durationFatigueFactor(session);

  // Ajustements réalistes du pattern jambe selon l'intensité perçue.
  // Intensité haute: +quads/+tibialis ; faible/longue: +ischios/+mollets.
  const high = Math.max(0, intensity - 1);
  const low = Math.max(0, 1 - intensity);
  merged[MuscleGroups.QUADS] = (merged[MuscleGroups.QUADS] || 0) + high * 0.04 - low * 0.01;
  merged[MuscleGroups.TIBIALIS_ANTERIOR] =
    (merged[MuscleGroups.TIBIALIS_ANTERIOR] || 0) + high * 0.025;
  merged[MuscleGroups.HAMSTRINGS] = (merged[MuscleGroups.HAMSTRINGS] || 0) + low * 0.03;
  merged[MuscleGroups.CALVES] = (merged[MuscleGroups.CALVES] || 0) + low * 0.02;

  return normalizeWeights(merged, RECAP_GROUP_KEYS);
}

export function weightsForJumpRopeSession(session) {
  const type = String(session?.type || 'continue').toLowerCase();
  const leg = JUMPROPE_LEG_BY_TYPE[type] || JUMPROPE_LEG_BY_TYPE.default;
  const merged = { ...JUMPROPE_UPPER, ...leg };
  return normalizeWeights(merged, RECAP_GROUP_KEYS);
}
