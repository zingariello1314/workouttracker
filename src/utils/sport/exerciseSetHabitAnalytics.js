/**
 * Analytics habitudes de répartition par séries — Récap Analyse.
 * Agrège profils intra/inter-séances et corrèle avec charge, volume et type d'exercice.
 */

import {
  analyzeIntraSessionRepPattern,
  classifyRepRangeIntent
} from './repSetSemanticAnalysis';
import { classifyRepScheme } from './volumeProgressionEngine';
import { resolveExerciseSetsForAnalysis } from './exerciseSessionSetsResolver';
import {
  formatSetInferenceLabel,
  SET_INFERENCE_METHOD,
  medianRepProfile
} from './exerciseSetInference';
import { getExercisePrescriptionStruct } from '../programPrescriptionNormalizer';
import { lookupProgramExerciseStub } from '../exerciseLoadVolume';

export const HABIT_PROFILE = {
  STABLE_UNIFORM: 'stable_uniform',
  STABLE_FATIGUE: 'stable_fatigue',
  EVOLVING_FATIGUE_RESISTANCE: 'evolving_fatigue_resistance',
  WORSENING_FATIGUE: 'worsening_fatigue',
  LAST_SET_PROGRESSION: 'last_set_progression',
  IRREGULAR: 'irregular',
  SINGLE_SET: 'single_set',
  HOLD_STABLE: 'hold_stable',
  HOLD_PROGRESSIVE: 'hold_progressive',
  INSUFFICIENT: 'insufficient'
};

const PROFILE_LABELS = {
  [HABIT_PROFILE.STABLE_UNIFORM]: 'Schéma régulier et uniforme',
  [HABIT_PROFILE.STABLE_FATIGUE]: 'Profil fatigue stable',
  [HABIT_PROFILE.EVOLVING_FATIGUE_RESISTANCE]: 'Résistance à la fatigue en progrès',
  [HABIT_PROFILE.WORSENING_FATIGUE]: 'Fatigue plus marquée en fin de séance',
  [HABIT_PROFILE.LAST_SET_PROGRESSION]: 'Progression sur la dernière série',
  [HABIT_PROFILE.IRREGULAR]: 'Répartition variable',
  [HABIT_PROFILE.SINGLE_SET]: 'Séance mono-série',
  [HABIT_PROFILE.HOLD_STABLE]: 'Maintiens stables',
  [HABIT_PROFILE.HOLD_PROGRESSIVE]: 'Durées de maintien en hausse',
  [HABIT_PROFILE.INSUFFICIENT]: 'Données insuffisantes'
};

function pctDelta(prev, curr) {
  if (!(prev > 0)) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function avgOf(arr, pick) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + pick(x), 0) / arr.length;
}

function formatHoldSeconds(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r ? `${m}m${r}s` : `${m}m`;
  }
  return `${s}s`;
}

/** @param {number[]} holdSeconds */
export function analyzeHoldSetPattern(holdSeconds) {
  const vals = (holdSeconds || [])
    .map((s) => Math.max(0, Math.floor(Number(s) || 0)))
    .filter((s) => s > 0);
  if (!vals.length) {
    return { pattern: '', dropFirstToLast: 0, isUniform: true, fatigueLevel: 'none' };
  }
  const first = vals[0];
  const last = vals[vals.length - 1];
  const drop = Math.max(0, first - last);
  const isUniform = vals.every((v) => v === first);
  const pattern = vals.map(formatHoldSeconds).join(' - ');

  let fatigueLevel = 'none';
  if (!isUniform) {
    const pctDrop = first > 0 ? drop / first : 0;
    if (pctDrop >= 0.25 || drop >= 15) fatigueLevel = 'extreme';
    else if (pctDrop >= 0.12 || drop >= 8) fatigueLevel = 'high';
    else if (drop >= 1) fatigueLevel = 'normal';
  }

  return { pattern, dropFirstToLast: drop, isUniform, fatigueLevel };
}

function extractSetRepsFromSession(session) {
  return (session.sets || [])
    .map((s) => Math.max(0, Math.floor(Number(s?.reps) || 0)))
    .filter((r) => r > 0);
}

function extractHoldSecondsFromSession(session) {
  return (session.sets || [])
    .map((s) => Math.max(0, Math.floor(Number(s?.holdSeconds ?? s?.reps) || 0)))
    .filter((s) => s > 0);
}

function patternKey(reps) {
  return reps.join('/');
}

function isEstimatedInference(method) {
  return (
    method &&
    method !== SET_INFERENCE_METHOD.MANUAL &&
    method !== SET_INFERENCE_METHOD.LEGACY
  );
}

/**
 * Profils détaillés par séance (séries, inférence, pattern).
 */
export function buildSessionSetProfiles(sessions, workoutData, getExerciseNameById) {
  return (sessions || []).map((session) => {
    const isHold = Boolean(session.isHold);
    const setReps = isHold ? [] : extractSetRepsFromSession(session);
    const holdSeconds = isHold ? extractHoldSecondsFromSession(session) : null;

    const resolved =
      workoutData && session.storageKey
        ? resolveExerciseSetsForAnalysis(workoutData, session.storageKey, getExerciseNameById)
        : null;
    const inference = resolved?.inference || null;
    const method =
      inference?.method ||
      (resolved?.source === 'structured' ? SET_INFERENCE_METHOD.MANUAL : SET_INFERENCE_METHOD.LEGACY);

    const patternAnalysis = isHold
      ? analyzeHoldSetPattern(holdSeconds)
      : analyzeIntraSessionRepPattern(setReps);

    return {
      dateYmd: session.dateYmd,
      storageKey: session.storageKey,
      isHold,
      setReps,
      holdSeconds,
      pattern: patternAnalysis.pattern,
      dropFirstToLast: patternAnalysis.dropFirstToLast,
      isUniform: patternAnalysis.isUniform,
      fatigueLevel: patternAnalysis.fatigueLevel,
      inferenceMethod: method,
      inferenceLabel: formatSetInferenceLabel(inference) || (method === SET_INFERENCE_METHOD.MANUAL ? 'Séries saisies' : null),
      inferenceConfidence: inference?.confidence ?? null,
      isEstimated: isEstimatedInference(method),
      avgWeight: session.avgWeight || 0,
      totalReps: session.totalReps,
      setCount: isHold ? holdSeconds?.length || session.setCount : setReps.length || session.setCount,
      maxSetReps: session.maxSetReps,
      maxHoldSeconds: session.maxHoldSeconds
    };
  });
}

function classifyHabitProfileType({
  isHold,
  multiSetProfiles,
  patternConsistencyPct,
  avgDropFirstToLast,
  dropTrend,
  lastSetTrend,
  dominantIsUniform
}) {
  if (!multiSetProfiles.length) return HABIT_PROFILE.SINGLE_SET;

  if (isHold) {
    const bestHolds = multiSetProfiles.map((p) =>
      Math.max(...(p.holdSeconds || [0]))
    );
    const holdTrend = pctDelta(bestHolds[0], bestHolds[bestHolds.length - 1]);
    if (holdTrend >= 8) return HABIT_PROFILE.HOLD_PROGRESSIVE;
    if (patternConsistencyPct >= 70 && avgDropFirstToLast <= 3) return HABIT_PROFILE.HOLD_STABLE;
    return HABIT_PROFILE.IRREGULAR;
  }

  if (lastSetTrend >= 8 && dropTrend <= 0) return HABIT_PROFILE.LAST_SET_PROGRESSION;
  if (dropTrend <= -15 && avgDropFirstToLast >= 1) {
    return HABIT_PROFILE.EVOLVING_FATIGUE_RESISTANCE;
  }
  if (dropTrend >= 15 && avgDropFirstToLast >= 2) return HABIT_PROFILE.WORSENING_FATIGUE;

  if (patternConsistencyPct >= 75) {
    if (dominantIsUniform || avgDropFirstToLast === 0) return HABIT_PROFILE.STABLE_UNIFORM;
    if (avgDropFirstToLast >= 1) return HABIT_PROFILE.STABLE_FATIGUE;
  }

  if (patternConsistencyPct >= 55 && avgDropFirstToLast >= 1 && !dominantIsUniform) {
    return HABIT_PROFILE.STABLE_FATIGUE;
  }

  return HABIT_PROFILE.IRREGULAR;
}

function detectLastSetOnlyRegression(prevReps, currReps) {
  if (!prevReps?.length || !currReps?.length || prevReps.length !== currReps.length) return null;
  if (prevReps.length < 2) return null;

  let changed = 0;
  let lastChanged = false;
  for (let i = 0; i < prevReps.length; i += 1) {
    if (prevReps[i] !== currReps[i]) {
      changed += 1;
      if (i === prevReps.length - 1) lastChanged = true;
    }
  }
  if (changed === 1 && lastChanged && currReps[currReps.length - 1] < prevReps[prevReps.length - 1]) {
    return {
      prev: prevReps.join(' / '),
      curr: currReps.join(' / '),
      delta: prevReps[prevReps.length - 1] - currReps[currReps.length - 1]
    };
  }
  return null;
}

function buildCorrelatedHabitBullets({
  profileType,
  profileLabel,
  isHold,
  repIntent,
  repScheme,
  patternConsistencyPct,
  avgDropFirstToLast,
  dropTrend,
  lastSetTrend,
  dominantPattern,
  weightTrendPct,
  volTrendPct,
  multiSetProfiles,
  inferenceBreakdown,
  prescriptionGap
}) {
  const bullets = [];

  if (profileLabel && multiSetProfiles.length >= 2) {
    bullets.push(
      `Habitude de séries : ${profileLabel.toLowerCase()}${dominantPattern ? ` (${dominantPattern.replace(/\//g, ' / ')})` : ''}.`
    );
  }

  if (patternConsistencyPct >= 80 && multiSetProfiles.length >= 3) {
    bullets.push(
      `Schéma reproduit à ${patternConsistencyPct} % sur ${multiSetProfiles.length} séances multi-séries — analyse fiable.`
    );
  } else if (patternConsistencyPct < 50 && multiSetProfiles.length >= 3) {
    bullets.push(
      'Répartition très variable d\'une séance à l\'autre — privilégiez une saisie détaillée des séries pour affiner le suivi.'
    );
  }

  if (!isHold && avgDropFirstToLast >= 2 && dropTrend <= -10) {
    bullets.push(
      `La chute 1ʳᵉ→dernière série diminue (${avgDropFirstToLast} rep en moy.) — meilleure endurance intra-séance.`
    );
  }
  if (!isHold && dropTrend >= 15 && avgDropFirstToLast >= 2) {
    bullets.push(
      'Fatigue plus marquée sur les dernières séries qu\'en début de période — surveillez récupération ou charge.'
    );
  }

  if (!isHold && lastSetTrend >= 8) {
    bullets.push(
      'La dernière série progresse entre le début et la fin de période malgré la fatigue — signe de marge sur le volume.'
    );
  }

  const lastTwo = multiSetProfiles.slice(-2);
  if (lastTwo.length === 2 && !isHold) {
    const regression = detectLastSetOnlyRegression(lastTwo[0].setReps, lastTwo[1].setReps);
    if (regression) {
      bullets.push(
        `Récent : ${regression.prev} → ${regression.curr} — seule la dernière série recule (${regression.delta} rep), le reste est stable.`
      );
    }
  }

  if (weightTrendPct != null && weightTrendPct >= 5 && !isHold) {
    if (profileType === HABIT_PROFILE.STABLE_FATIGUE || avgDropFirstToLast >= 1) {
      bullets.push(
        `Charge +${weightTrendPct} % avec chute habituelle en fin de série — cohérent avec une montée en intensité${repScheme === 'strength' ? ' (force)' : ''}.`
      );
    } else if (profileType === HABIT_PROFILE.STABLE_UNIFORM) {
      bullets.push(
        `Charge +${weightTrendPct} % sans perte de régularité série à série — excellent contrôle technique.`
      );
    }
  }

  if (weightTrendPct != null && weightTrendPct <= -5 && volTrendPct != null && volTrendPct >= 5) {
    bullets.push(
      'Volume en hausse malgré charge allégée — possible phase technique ou pré-fatigue avant remontée en kg.'
    );
  }

  if (repIntent === 'max_strength' || repIntent === 'hybrid') {
    if (profileType === HABIT_PROFILE.STABLE_UNIFORM) {
      bullets.push('Zone force : séries régulières — le PR série et la charge sont les meilleurs indicateurs.');
    }
  } else if (repIntent === 'hypertrophy') {
    if (profileType === HABIT_PROFILE.STABLE_UNIFORM && patternConsistencyPct >= 70) {
      bullets.push('Hypertrophie : régularité inter-séances — levier typique : +1 rep/série avant d\'augmenter la charge.');
    }
    if (avgDropFirstToLast >= 3) {
      bullets.push('Chute marquée en fin de série — envisagez +30–60 s de repos ou une légère baisse de charge.');
    }
  } else if (repIntent === 'muscular_endurance' || repIntent === 'endurance') {
    if (volTrendPct != null && volTrendPct >= 10) {
      bullets.push('Endurance musculaire : le volume total prime ; la variation intra-séance est secondaire.');
    }
  }

  if (isHold && profileType === HABIT_PROFILE.HOLD_PROGRESSIVE) {
    bullets.push('Durées de maintien en progression — corrélation directe avec l\'endurance isométrique.');
  }

  const estimatedCount = Object.entries(inferenceBreakdown).reduce(
    (s, [k, v]) => (isEstimatedInference(k) ? s + v : s),
    0
  );
  if (estimatedCount >= 2 && multiSetProfiles.length >= 2) {
    bullets.push(
      `${estimatedCount} séance${estimatedCount > 1 ? 's' : ''} sur ${multiSetProfiles.length} avec répartition estimée — saisie manuelle des séries pour précision maximale.`
    );
  }

  if (prescriptionGap?.shortfall >= 3 && prescriptionGap.sessions >= 2) {
    bullets.push(
      `Volume sous prescription ${prescriptionGap.sessions} fois (${prescriptionGap.shortfall} reps manquantes en moy.) — habituellement compensé par une chute sur les dernières séries.`
    );
  }

  return bullets.filter(Boolean);
}

/**
 * Analyse agrégée des habitudes de répartition par séries sur une fenêtre.
 *
 * @param {object[]} sessions — historique enrichi
 * @param {object|null} workoutData
 * @param {(id: number|string) => string} [getExerciseNameById]
 * @param {{ weightTrendPct?: number|null, volTrendPct?: number|null, repScheme?: string }} [context]
 */
export function analyzeExerciseSetHabits(
  sessions,
  workoutData = null,
  getExerciseNameById = null,
  context = {}
) {
  const empty = {
    profileType: HABIT_PROFILE.INSUFFICIENT,
    profileLabel: PROFILE_LABELS[HABIT_PROFILE.INSUFFICIENT],
    stabilityScore: 0,
    patternConsistencyPct: 0,
    avgDropFirstToLast: 0,
    dropTrend: 0,
    lastSetTrend: 0,
    dominantPattern: null,
    inferenceBreakdown: {},
    metrics: [],
    bullets: [],
    sessionProfiles: []
  };

  if (!sessions?.length) return empty;

  const isHold = sessions.some((s) => s.isHold);
  const sessionProfiles = buildSessionSetProfiles(sessions, workoutData, getExerciseNameById);

  const multiSetProfiles = sessionProfiles.filter((p) =>
    isHold ? (p.holdSeconds?.length || 0) >= 2 : (p.setReps?.length || 0) >= 2
  );

  if (multiSetProfiles.length === 0) {
    return {
      ...empty,
      profileType: HABIT_PROFILE.SINGLE_SET,
      profileLabel: PROFILE_LABELS[HABIT_PROFILE.SINGLE_SET],
      sessionProfiles
    };
  }

  if (multiSetProfiles.length === 1) {
    const p = multiSetProfiles[0];
    return {
      ...empty,
      profileType: isHold ? HABIT_PROFILE.HOLD_STABLE : HABIT_PROFILE.IRREGULAR,
      profileLabel: isHold
        ? PROFILE_LABELS[HABIT_PROFILE.HOLD_STABLE]
        : p.isUniform
          ? PROFILE_LABELS[HABIT_PROFILE.STABLE_UNIFORM]
          : PROFILE_LABELS[HABIT_PROFILE.STABLE_FATIGUE],
      dominantPattern: p.pattern || null,
      avgDropFirstToLast: p.dropFirstToLast,
      sessionProfiles,
      inferenceBreakdown: { [p.inferenceMethod]: 1 }
    };
  }

  const patternCounts = {};
  multiSetProfiles.forEach((p) => {
    const key = isHold ? p.pattern : patternKey(p.setReps);
    if (!key) return;
    patternCounts[key] = (patternCounts[key] || 0) + 1;
  });

  const sortedPatterns = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]);
  const dominantPattern = sortedPatterns[0]?.[0] || null;
  const patternConsistencyPct = dominantPattern
    ? Math.round((sortedPatterns[0][1] / multiSetProfiles.length) * 100)
    : 0;

  const drops = multiSetProfiles.map((p) => p.dropFirstToLast);
  const avgDropFirstToLast = Math.round(avgOf(drops, (d) => d) * 10) / 10;

  const mid = Math.floor(drops.length / 2);
  const dropFirstHalf = avgOf(drops.slice(0, Math.max(1, mid)), (d) => d);
  const dropSecondHalf = avgOf(drops.slice(Math.max(1, mid)), (d) => d);
  const dropTrend = pctDelta(dropFirstHalf, dropSecondHalf);

  const lastSetValues = multiSetProfiles.map((p) =>
    isHold
      ? (p.holdSeconds || [])[(p.holdSeconds || []).length - 1] || 0
      : (p.setReps || [])[(p.setReps || []).length - 1] || 0
  );
  const lastSetTrend = pctDelta(lastSetValues[0], lastSetValues[lastSetValues.length - 1]);

  const dominantProfile = multiSetProfiles.find((p) =>
    isHold ? p.pattern === dominantPattern : patternKey(p.setReps) === dominantPattern
  );
  const dominantIsUniform = dominantProfile?.isUniform ?? false;

  const profileType = classifyHabitProfileType({
    isHold,
    multiSetProfiles,
    patternConsistencyPct,
    avgDropFirstToLast,
    dropTrend,
    lastSetTrend,
    dominantIsUniform
  });

  const inferenceBreakdown = {};
  multiSetProfiles.forEach((p) => {
    inferenceBreakdown[p.inferenceMethod] = (inferenceBreakdown[p.inferenceMethod] || 0) + 1;
  });

  const lastSession = sessions[sessions.length - 1];
  const stub = lookupProgramExerciseStub(lastSession?.exerciseId);
  const prescription = getExercisePrescriptionStruct(stub);
  const avgRepsPerSet =
    multiSetProfiles.reduce((s, p) => {
      const reps = p.setReps?.length ? p.setReps : p.holdSeconds;
      if (!reps?.length) return s;
      return s + reps.reduce((a, r) => a + r, 0) / reps.length;
    }, 0) / Math.max(1, multiSetProfiles.length);
  const repIntent = classifyRepRangeIntent(avgRepsPerSet);
  const repScheme =
    context.repScheme ||
    classifyRepScheme(lastSession?.setCount, lastSession?.totalReps);

  let prescriptionGap = null;
  if (prescription?.setCount && prescription?.repsMin != null) {
    const plannedPerSet =
      prescription.repsMax != null ? prescription.repsMax : prescription.repsMin;
    const plannedTotal = prescription.setCount * plannedPerSet;
    const shortfalls = multiSetProfiles
      .map((p) => Math.max(0, plannedTotal - (p.totalReps || 0)))
      .filter((g) => g > 0);
    if (shortfalls.length >= 2) {
      prescriptionGap = {
        shortfall: Math.round(avgOf(shortfalls, (g) => g)),
        sessions: shortfalls.length
      };
    }
  }

  const medianProfile =
    !isHold && multiSetProfiles.length >= 2
      ? medianRepProfile(multiSetProfiles.map((p) => p.setReps))
      : null;

  const stabilityScore = Math.min(
    100,
    Math.round(
      patternConsistencyPct * 0.55 +
        (100 - Math.min(100, avgDropFirstToLast * 12)) * 0.15 +
        Math.min(100, multiSetProfiles.length * 12) * 0.2 +
        (Object.keys(inferenceBreakdown).some((k) => k === SET_INFERENCE_METHOD.MANUAL) ? 10 : 0)
    )
  );

  const metrics = [];
  if (patternConsistencyPct > 0) {
    metrics.push({ key: 'consistency', label: 'Régularité schéma', value: `${patternConsistencyPct} %` });
  }
  if (!isHold && avgDropFirstToLast > 0) {
    metrics.push({
      key: 'drop',
      label: 'Chute 1ʳᵉ→dernière',
      value: `${avgDropFirstToLast} rep`
    });
  }
  if (isHold && avgDropFirstToLast > 0) {
    metrics.push({
      key: 'drop',
      label: 'Écart maintiens',
      value: formatHoldSeconds(avgDropFirstToLast)
    });
  }
  metrics.push({ key: 'stability', label: 'Score stabilité', value: `${stabilityScore}` });

  const bullets = buildCorrelatedHabitBullets({
    profileType,
    profileLabel: PROFILE_LABELS[profileType],
    isHold,
    repIntent,
    repScheme,
    patternConsistencyPct,
    avgDropFirstToLast,
    dropTrend,
    lastSetTrend,
    dominantPattern,
    weightTrendPct: context.weightTrendPct,
    volTrendPct: context.volTrendPct,
    multiSetProfiles,
    inferenceBreakdown,
    prescriptionGap
  });

  return {
    profileType,
    profileLabel: PROFILE_LABELS[profileType],
    stabilityScore,
    patternConsistencyPct,
    avgDropFirstToLast,
    dropTrend,
    lastSetTrend,
    dominantPattern: isHold ? dominantPattern : dominantPattern?.replace(/\//g, ' / '),
    medianProfile: medianProfile?.join(' / ') || null,
    inferenceBreakdown,
    metrics,
    bullets,
    sessionProfiles,
    repIntent,
    repScheme
  };
}
