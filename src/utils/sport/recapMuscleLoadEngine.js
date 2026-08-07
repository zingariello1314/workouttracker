/**
 * Moteur Récap : charge force (reps × coeff + iso), decay temporel, cardio/endurance
 * normalisé puis fusionné par groupe musculaire.
 */
import { normalizeDateString, isMockEnduranceSession, parseDurationToMinutes } from '../calendarUtils';
import {
  aggregateCheckedRepsByDateAndExerciseId,
  computeStrengthCalendarContribution,
  resolveExerciseIntensityCoeff,
  enduranceSessionCalendarLoad,
  enduranceRepsForSession,
  exerciseNameLooksIsometricForCalendar
} from '../trainingLoadUtils';
import { inferMuscleGroupsForExercise } from './recapMuscleInference';
import { recapScoreToHexRelative, recapZoneBlendHueScore } from './recapIntensityColors';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { getMeshesForMuscleGroup } from './recapMeshBinding';
import { weightsForRunningSession, weightsForJumpRopeSession } from './enduranceMuscleDistribution';
import { computeVolumeKgForWorkoutKey } from '../exerciseLoadVolume';
import { weightedRecapLoadMultiplier } from './weightedTrainingRecapInsights';
import { exerciseDatabase } from '../../data/exerciseDatabase';

export const DECAY_LAMBDA_PER_DAY = 0.11;
/** Poids du canal cardio sur la charge « affichée » (plafonné par groupe). */
export const CARDIO_BLEND = 0.32;
/** Plafond de contribution cardio decayée par groupe et par jour (évite d’écraser la muscu). */
export const CARDIO_PER_GROUP_DAY_CAP = 95;

/** Id stable pour agréger les pompes « onglet Endurance » dans les listes d’exos du Récap. */
export const RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID = '__recap_endurance_pushups__';

const makeDbExerciseId = (key) =>
  `db_${String(key)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()}`;

const EXERCISE_DB_NAME_BY_ID = Object.entries(exerciseDatabase).reduce((acc, [key, ex]) => {
  acc[makeDbExerciseId(key)] = ex?.name || key;
  return acc;
}, {});

function resolveExerciseNameForRecap(exerciseId, getExerciseNameById) {
  const idStr = String(exerciseId || '').trim();
  if (!idStr) return '';
  if (EXERCISE_DB_NAME_BY_ID[idStr]) return EXERCISE_DB_NAME_BY_ID[idStr];
  if (typeof getExerciseNameById === 'function') {
    const byGetter = getExerciseNameById(idStr);
    if (byGetter && !/^Exercice\s+/i.test(String(byGetter))) return byGetter;
  }
  return '';
}

const ALL_GROUPS = [
  MuscleGroups.CHEST,
  MuscleGroups.BACK,
  MuscleGroups.SHOULDERS,
  MuscleGroups.BICEPS,
  MuscleGroups.TRICEPS,
  MuscleGroups.FOREARMS,
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.GLUTES,
  MuscleGroups.CALVES,
  MuscleGroups.TIBIALIS_ANTERIOR,
  MuscleGroups.CORE,
  MuscleGroups.FULL_BODY
];

/** Répartition endurance (hors course / corde : gérés par séance dans `enduranceMuscleDistribution`). */
const ENDURANCE_WEIGHTS = {
  swimming: {
    [MuscleGroups.BACK]: 0.22,
    [MuscleGroups.SHOULDERS]: 0.2,
    [MuscleGroups.QUADS]: 0.08,
    [MuscleGroups.HAMSTRINGS]: 0.07,
    [MuscleGroups.CALVES]: 0.05,
    [MuscleGroups.CORE]: 0.16,
    [MuscleGroups.CHEST]: 0.1,
    [MuscleGroups.FULL_BODY]: 0.12
  },
  boxing: {
    [MuscleGroups.SHOULDERS]: 0.18,
    [MuscleGroups.CHEST]: 0.1,
    [MuscleGroups.CORE]: 0.22,
    [MuscleGroups.QUADS]: 0.05,
    [MuscleGroups.HAMSTRINGS]: 0.04,
    [MuscleGroups.CALVES]: 0.03,
    [MuscleGroups.BACK]: 0.08,
    [MuscleGroups.BICEPS]: 0.06,
    [MuscleGroups.TRICEPS]: 0.06,
    [MuscleGroups.FULL_BODY]: 0.18
  },
  pushups: {
    [MuscleGroups.CHEST]: 0.42,
    [MuscleGroups.TRICEPS]: 0.24,
    [MuscleGroups.SHOULDERS]: 0.18,
    [MuscleGroups.CORE]: 0.16
  },
  default: { [MuscleGroups.FULL_BODY]: 1 }
};

function toYmd(d) {
  const x = d instanceof Date ? d : new Date(d);
  return x.toISOString().slice(0, 10);
}

function calendarDaysBetween(earlierYmd, laterYmd) {
  const a = new Date(`${earlierYmd}T12:00:00`);
  const b = new Date(`${laterYmd}T12:00:00`);
  return Math.max(0, Math.round((b - a) / 86400000));
}

function decayFactor(earlierYmd, refYmd) {
  const days = calendarDaysBetween(earlierYmd, refYmd);
  return Math.exp(-DECAY_LAMBDA_PER_DAY * days);
}

/**
 * @param {'today'|'7d'|'30d'|'3m'|'6m'|'1y'|'2y'|'all'} period
 * @param {Date} ref
 */
export function getRecapDateWindow(period, ref = new Date()) {
  const end = toYmd(ref);
  if (period === 'all') return { start: null, end };
  if (period === 'today') return { start: end, end };
  const spanById = {
    '7d': 7,
    '30d': 30,
    '3m': 92,
    '6m': 183,
    '1y': 365,
    '2y': 730
  };
  const span = spanById[period] ?? 7;
  const d = new Date(ref);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - (span - 1));
  return { start: toYmd(d), end };
}

/** Fenêtre récap (inclusif). `start == null` ⇒ tout l’historique jusqu’à `end`. */
export function isDateInRecapWindow(dateStr, window) {
  if (!dateStr) return false;
  if (window.start == null) return dateStr <= window.end;
  return dateStr >= window.start && dateStr <= window.end;
}

function normalizeWeights(raw) {
  const out = { ...raw };
  let sum = 0;
  ALL_GROUPS.forEach((g) => {
    sum += out[g] || 0;
  });
  if (sum <= 0) return { [MuscleGroups.FULL_BODY]: 1 };
  const norm = {};
  ALL_GROUPS.forEach((g) => {
    if (out[g]) norm[g] = out[g] / sum;
  });
  return norm;
}

function weightsForActivity(activityType) {
  const t = String(activityType || '').toLowerCase();
  if (t === 'swimming') return normalizeWeights(ENDURANCE_WEIGHTS.swimming);
  if (t === 'boxing') return normalizeWeights(ENDURANCE_WEIGHTS.boxing);
  if (t === 'pushups') return normalizeWeights(ENDURANCE_WEIGHTS.pushups);
  return normalizeWeights(ENDURANCE_WEIGHTS.default);
}

/**
 * Répartition type « pompes » alignée sur `ENDURANCE_WEIGHTS.pushups` quand l’inférence
 * retourne exactement pecs / triceps / épaules / core (cas « Pompes » base en base exercices).
 * Sinon parts égales (autres variantes en base).
 */
const PUSHUP_REP_SHARE_TEMPLATE = {
  [MuscleGroups.CHEST]: 0.42,
  [MuscleGroups.TRICEPS]: 0.24,
  [MuscleGroups.SHOULDERS]: 0.18,
  [MuscleGroups.CORE]: 0.16
};

function pushupRepShareWeights(groupsForReps) {
  const g = groupsForReps || [];
  if (g.length !== 4) return null;
  const need = new Set(Object.keys(PUSHUP_REP_SHARE_TEMPLATE));
  const got = new Set(g);
  if (need.size !== got.size) return null;
  for (const x of need) {
    if (!got.has(x)) return null;
  }
  return PUSHUP_REP_SHARE_TEMPLATE;
}

export function collectPushupEnduranceSessions(allData) {
  const modern = allData?.enduranceData?.sessions?.pushups;
  const legacy = allData?.enduranceData?.pushupSessions;
  const raw = [
    ...(Array.isArray(modern) ? modern : []),
    ...(Array.isArray(legacy) ? legacy : [])
  ];
  const seen = new Set();
  const out = [];
  raw.forEach((session) => {
    const ds = normalizeDateString(session?.date);
    const n = enduranceRepsForSession('pushups', session);
    const key =
      session?.id != null && session.id !== ''
        ? `id:${session.id}`
        : `d:${ds}:n:${n}:${session?.note || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(session);
  });
  return out;
}

function applyEndurancePushupsRepShares({ allData, window, repShareByGroup, exerciseAccByGroup, volumeTotals }) {
  const wmap = normalizeWeights(ENDURANCE_WEIGHTS.pushups);
  const pushupSessions = collectPushupEnduranceSessions(allData);

  pushupSessions.forEach((session) => {
    if (isMockEnduranceSession(session)) return;
    const ds = normalizeDateString(session?.date);
    if (!ds || !isDateInRecapWindow(ds, window)) return;
    const n = enduranceRepsForSession('pushups', session);
    if (n <= 0) return;

    volumeTotals.strengthReps += n;
    volumeTotals.endurancePushupReps += n;
    Object.entries(wmap).forEach(([g, frac]) => {
      const share = n * frac;
      repShareByGroup[g] = (repShareByGroup[g] || 0) + share;
      if (!exerciseAccByGroup[g]) exerciseAccByGroup[g] = new Map();
      const map = exerciseAccByGroup[g];
      const prev = map.get(RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID) || {
        id: RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID,
        name: RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID,
        repsShare: 0,
        isIso: false
      };
      prev.repsShare += share;
      map.set(RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID, prev);
    });
  });
}

/**
 * @param {Object} allData — reps, checkedExercises, enduranceData, exerciseIntensityCoeffs
 * @param {'today'|'7d'|'30d'|'3m'|'6m'|'1y'|'2y'|'all'} period
 * @param {(id: string|number) => string} getExerciseNameById
 * @param {Date} [referenceDate]
 */
export function computeRecapMuscleState(allData, period, getExerciseNameById, referenceDate = new Date()) {
  const window = getRecapDateWindow(period, referenceDate);
  const refYmd = window.end;

  /** @type {Record<string, { strength: number, cardio: number }>} */
  const accum = {};
  ALL_GROUPS.forEach((g) => {
    accum[g] = { strength: 0, cardio: 0 };
  });

  const userCoeffs = allData?.exerciseIntensityCoeffs || {};
  const grouped = aggregateCheckedRepsByDateAndExerciseId(allData?.reps, allData?.checkedExercises);

  /** @type {Record<string, number>} parts de reps (ou secondes iso) attribuées par groupe */
  const repShareByGroup = {};
  /** @type {Record<string, Map<string, { name: string, repsShare: number, isIso: boolean }>>} */
  const exerciseAccByGroup = {};
  const volumeTotals = { strengthReps: 0, isoSeconds: 0, enduranceMinutes: 0, endurancePushupReps: 0 };
  const cardioMinutesByGroup = {};
  ALL_GROUPS.forEach((g) => {
    cardioMinutesByGroup[g] = 0;
  });

  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const idStr = gkey.slice(sep + 2);
    if (!isDateInRecapWindow(dateStr, window)) return;

    const idNum = parseInt(idStr, 10);
    const normalizedId = Number.isNaN(idNum) ? idStr : idNum;
    const name = resolveExerciseNameForRecap(idStr, getExerciseNameById);
    const exLike = { id: normalizedId, name, nom: name, series: '', type: 'standard' };
    const coeff = resolveExerciseIntensityCoeff(exLike, userCoeffs);
    const contrib = computeStrengthCalendarContribution(exLike, r, coeff);
    const rInt = Math.max(0, Math.floor(Number(r) || 0));
    const isIso = exerciseNameLooksIsometricForCalendar(name);

    if (rInt > 0) {
      if (isIso) volumeTotals.isoSeconds += rInt;
      else volumeTotals.strengthReps += rInt;
      const groupsForReps = inferMuscleGroupsForExercise(exLike);
      const pushW = pushupRepShareWeights(groupsForReps);
      groupsForReps.forEach((g) => {
        const repShare = pushW ? rInt * pushW[g] : rInt / groupsForReps.length;
        repShareByGroup[g] = (repShareByGroup[g] || 0) + repShare;
        if (!exerciseAccByGroup[g]) exerciseAccByGroup[g] = new Map();
        const prev = exerciseAccByGroup[g].get(idStr) || {
          id: idStr,
          name: name || `#${idStr}`,
          repsShare: 0,
          isIso
        };

        prev.name = name || prev.name;
        prev.repsShare += repShare;
        prev.isIso = prev.isIso || isIso;
        exerciseAccByGroup[g].set(idStr, prev);
      });
    }

    if (contrib <= 0) return;

    let weightedMul = 1;
    const storageKey = `${dateStr}_${idStr}`;
    const volKg = computeVolumeKgForWorkoutKey(storageKey, allData);
    if (volKg > 0 && rInt > 0) {
      weightedMul = weightedRecapLoadMultiplier(rInt, volKg);
    }

    const groups = inferMuscleGroupsForExercise(exLike);
    const share = (contrib * weightedMul) / groups.length;
    const w = decayFactor(dateStr, refYmd);
    groups.forEach((g) => {
      if (!accum[g]) accum[g] = { strength: 0, cardio: 0 };
      accum[g].strength += share * w;
    });
  });

  applyEndurancePushupsRepShares({
    allData,
    window,
    repShareByGroup,
    exerciseAccByGroup,
    volumeTotals
  });

  const sessions = allData?.enduranceData?.sessions || {};
  let cardioMinutesWeightedTotal = 0;
  Object.entries(sessions).forEach(([activityType, activitySessions]) => {
    if (!Array.isArray(activitySessions)) return;
    activitySessions.forEach((session) => {
      if (isMockEnduranceSession(session)) return;
      const ds = normalizeDateString(session?.date);
      if (!ds || !isDateInRecapWindow(ds, window)) return;
      const load = enduranceSessionCalendarLoad(activityType, session);
      if (load <= 0) return;
      const sessionMinutes = parseDurationToMinutes(
        session?.duration ??
          session?.durationMinutes ??
          session?.duration_min ??
          session?.metrics?.durationMinutes ??
          0
      );
      volumeTotals.enduranceMinutes += sessionMinutes;
      const wmap =
        activityType === 'running'
          ? weightsForRunningSession(session)
          : activityType === 'jumprope'
            ? weightsForJumpRopeSession(session)
            : weightsForActivity(activityType);
      const dayCap = Math.min(load, CARDIO_PER_GROUP_DAY_CAP * 6);
      const w = decayFactor(ds, refYmd);
      Object.entries(wmap).forEach(([g, frac]) => {
        if (!accum[g]) accum[g] = { strength: 0, cardio: 0 };
        accum[g].cardio += dayCap * frac * w;
        const minutesShare = sessionMinutes * frac;
        cardioMinutesByGroup[g] = (cardioMinutesByGroup[g] || 0) + minutesShare;
        cardioMinutesWeightedTotal += minutesShare;
      });
    });
  });

  const byGroup = {};
  let maxDisplay = 0;
  /** Max charge affichée (muscu + cardio) — conservé pour debug / futur. */
  let dominantByDisplay = MuscleGroups.FULL_BODY;

  ALL_GROUPS.forEach((g) => {
    const { strength, cardio } = accum[g] || { strength: 0, cardio: 0 };
    const cardioCapped = Math.min(cardio, strength * 1.4 + 220);
    const display = strength + CARDIO_BLEND * cardioCapped;
    byGroup[g] = {
      strengthEffective: strength,
      cardioEffective: cardio,
      displayScore: display
    };
    if (display > maxDisplay) {
      maxDisplay = display;
      dominantByDisplay = g;
    }
  });

  /** Groupes « anatomiques » : le libellé dominant ignore le seau poly/full-body. */
  const ANATOMICAL_GROUPS = ALL_GROUPS.filter((g) => g !== MuscleGroups.FULL_BODY);

  /** Zone la plus volumineuse en reps (parts) — aligné lecture utilisateur, sans cardio. */
  let dominantByRepShare = MuscleGroups.FULL_BODY;
  let maxRepShareVal = -1;
  ANATOMICAL_GROUPS.forEach((g) => {
    const r = repShareByGroup[g] || 0;
    const prev = dominantByRepShare;
    if (r > maxRepShareVal) {
      maxRepShareVal = r;
      dominantByRepShare = g;
    } else if (r === maxRepShareVal && r > 0) {
      const s1 = byGroup[g]?.strengthEffective || 0;
      const s0 = byGroup[prev]?.strengthEffective || 0;
      if (s1 > s0) dominantByRepShare = g;
    }
  });
  if (maxRepShareVal <= 0) {
    let md = -1;
    ANATOMICAL_GROUPS.forEach((g) => {
      const d = byGroup[g]?.displayScore || 0;
      if (d > md) {
        md = d;
        dominantByRepShare = g;
      }
    });
  }

  const aggregateDisplay = ALL_GROUPS.reduce(
    (sum, g) => sum + (byGroup[g]?.displayScore || 0),
    0
  );
  /**
   * Référence unique pour la palette (3D + jauges + meshes).
   * Pas de plancher artificiel : un plancher type « 15 » écrasait les petites charges
   * (bras, triceps) → tout retombait au même gris que le repos.
   */
  const colorReferenceMax = Math.max(maxDisplay, aggregateDisplay * 0.36, 1e-9);

  let maxRepShareAcrossGroups = 0;
  ALL_GROUPS.forEach((g) => {
    maxRepShareAcrossGroups = Math.max(maxRepShareAcrossGroups, repShareByGroup[g] || 0);
  });

  const meshColors = {};
  let mappedAny = false;
  ALL_GROUPS.forEach((g) => {
    const isFB = g === MuscleGroups.FULL_BODY;
    const volMesh = isFB ? Math.round(volumeTotals.strengthReps || 0) : Math.round(repShareByGroup[g] || 0);
    const maxRHMesh = Math.max(maxRepShareAcrossGroups, isFB ? volumeTotals.strengthReps || 0 : 0);
    const repHMesh = isFB
      ? Math.max(repShareByGroup[g] || 0, volumeTotals.strengthReps || 0)
      : repShareByGroup[g] || 0;
    const hue = recapZoneBlendHueScore({
      vol: volMesh,
      maxRH: maxRHMesh,
      repH: repHMesh,
      displayScore: byGroup[g].displayScore,
      maxDisplay,
      colorReferenceMax,
      forFullBody: isFB
    });
    const hex = recapScoreToHexRelative(hue, colorReferenceMax);
    const meshes = getMeshesForMuscleGroup(g);
    meshes.forEach((meshName) => {
      meshColors[meshName] = hex;
      mappedAny = true;
    });
  });

  /**
   * GLB Sketchfab « basemesh » : souvent quelques meshes plein corps qui se chevauchent
   * (pas de vraie découpe musculaire). `aggregateDisplay * 0.36` saturait toujours le rouge.
   * On aligne la teinte globale sur le pic de charge de la période (= même lecture que la zone max).
   */
  const uniformBodyColor = recapScoreToHexRelative(maxDisplay, colorReferenceMax);

  const topExercisesByGroup = {};
  ALL_GROUPS.forEach((g) => {
    const m = exerciseAccByGroup[g];
    if (!m || m.size === 0) {
      topExercisesByGroup[g] = [];
      return;
    }
    topExercisesByGroup[g] = [...m.values()]
      .sort((a, b) => b.repsShare - a.repsShare)
      .slice(0, 8);
  });

  const cardioActivationPctByGroup = {};
  ALL_GROUPS.forEach((g) => {
    const m = cardioMinutesByGroup[g] || 0;
    cardioActivationPctByGroup[g] =
      cardioMinutesWeightedTotal > 0 ? (m / cardioMinutesWeightedTotal) * 100 : 0;
  });

  return {
    byGroup,
    dominantGroup: dominantByRepShare,
    dominantGroupByDisplayScore: dominantByDisplay,
    meshColors: mappedAny ? meshColors : {},
    uniformBodyColor,
    colorReferenceMax,
    repShareByGroup,
    maxRepShareAcrossGroups,
    topExercisesByGroup,
    cardioMinutesByGroup,
    cardioActivationPctByGroup,
    volumeTotals: {
      ...volumeTotals,
      strengthMinutesFromIso: volumeTotals.isoSeconds / 60,
      totalExerciseMinutes:
        volumeTotals.enduranceMinutes + volumeTotals.isoSeconds / 60
    },
    window,
    meta: {
      decayLambda: DECAY_LAMBDA_PER_DAY,
      cardioBlend: CARDIO_BLEND
    }
  };
}
