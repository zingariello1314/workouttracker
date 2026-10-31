/**
 * P3.2a — Socle comptable musculaire (réalisé).
 *
 * Pas de parts 74/26. Pas de découvertes narratives.
 * Conservation : R = R_mono + R_multi + R_non_attr (+ unit_ambiguous hors R).
 *
 * @module recapMuscleLedgerP32a
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { findExerciseInDatabase, exerciseDatabase } from '../../data/exerciseDatabase';
import { resolveVisualGroupsFromLabels } from '../anatomy/fineMuscleToVisualGroup';
import {
  aggregateCheckedRepsByDateAndExerciseId,
  exerciseNameLooksIsometricForCalendar
} from '../trainingLoadUtils';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { normalizeGtgData } from '../../services/endurance/gtgService';
import {
  resolveGtgWorkoutStorageKey,
  sumGtgRepsForExerciseOnDay
} from '../../services/endurance/gtgWorkoutSync';
import {
  buildReverseStableIdIndex,
  resolveStorageExerciseIdentity,
  IDENTITY_CONFIDENCE as RESOLVER_IDENTITY_CONFIDENCE
} from './resolveStorageExerciseIdentity';
import { buildPlanRealizationMatrix } from './recapProgramAdherenceProgression.js';

export const CLASSIFICATION_VERSION = 'p32.v1';

/** Classes d’observation exclusives (avant attribution anatomique). */
export const UNIT_CLASS = Object.freeze({
  CERTAIN_REPS: 'certain_reps',
  ISOMETRIC_SECONDS: 'isometric_seconds',
  DURATION_OTHER: 'duration_other',
  HEURISTIC_UNIT: 'heuristic_unit',
  UNKNOWN_UNIT: 'unknown_unit',
  INVALID: 'invalid'
});

export const CHANNEL = Object.freeze({
  CLASSIC: 'classic',
  GTG_LEDGER: 'gtg_ledger',
  ENDURANCE_OTHER: 'endurance_other'
});

export const ATTR_SOURCE = Object.freeze({
  BANK: 'bank',
  BANK_KEY_EXPLICIT: 'bank_key_explicit',
  NAME_MATCH: 'name_match',
  HEURISTIC: 'heuristic',
  NONE: 'none'
});

export const IDENTITY_CONFIDENCE = RESOLVER_IDENTITY_CONFIDENCE;

/** Classification exclusive des charges (par ligne). */
export const WEIGHT_CLASS = Object.freeze({
  PRESENT: 'present',
  EXPLICIT_ZERO: 'explicit_zero',
  ABSENT: 'absent'
});

export const VOLUME_BUCKET = Object.freeze({
  MONO_PRIMARY: 'mono_primary',
  MULTI_PRIMARY: 'multi_primary',
  NON_ATTRIBUTABLE: 'non_attributable',
  UNIT_AMBIGUOUS: 'unit_ambiguous'
});

const dbLookupCache = new Map();

function dbLookupFlexible(name) {
  if (!name) return null;
  const n = String(name).toLowerCase().trim();
  if (dbLookupCache.has(n)) return dbLookupCache.get(n);
  let hit = findExerciseInDatabase(n);
  if (hit) {
    dbLookupCache.set(n, hit);
    return hit;
  }
  const base = n.split('(')[0].trim();
  hit = findExerciseInDatabase(base);
  if (hit) {
    dbLookupCache.set(n, hit);
    return hit;
  }
  for (const key of Object.keys(exerciseDatabase)) {
    if (n.includes(key) || key.includes(n.slice(0, Math.min(n.length, 12)))) {
      dbLookupCache.set(n, exerciseDatabase[key]);
      return exerciseDatabase[key];
    }
  }
  dbLookupCache.set(n, null);
  return null;
}

function parseWorkoutKey(key) {
  const m = String(key || '').match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!m) return null;
  let exerciseId = m[2].replace(/_(semaineA|semaineB)$/, '');
  return { date: m[1], exerciseId, rawKey: String(key) };
}

function parseNumericValue(raw) {
  if (raw == null || raw === '') return { ok: false, value: null, reason: 'empty' };
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return { ok: false, value: null, reason: 'nan' };
  if (n <= 0) return { ok: false, value: n, reason: 'non_positive' };
  return { ok: true, value: n };
}

/**
 * B3 — Identité storage-first (délègue au resolver réutilisable).
 */
export function resolveExerciseIdentity(opts = {}) {
  const r = resolveStorageExerciseIdentity(opts);
  return {
    storageId: r.storageId,
    resolvedName: r.resolvedName,
    originalId: r.originalId,
    exerciseBankKey: r.exerciseBankKey,
    identityConfidence: r.identityConfidence,
    resolutionSource: r.resolutionSource,
    hashAmbiguous: Boolean(r.hashAmbiguous)
  };
}

function mappingQualityFrom(primary, secondary, unmappedLabels, onlyFull) {
  if (primary.length >= 1) {
    // Secondary manquant ≠ absence d’attribution si primary fiable
    return unmappedLabels.length ? 'partial' : 'complete';
  }
  if (secondary.length >= 1) return unmappedLabels.length ? 'partial' : 'complete';
  if (onlyFull) return 'empty';
  return 'empty';
}

/**
 * B4 — Attribution anatomique (sans 74/26). Heuristique → non volume-admissible.
 */
export function attributeAnatomyForExercise({
  storageId,
  name = '',
  exerciseBankKey = null,
  identity = null
} = {}) {
  const idn =
    identity ||
    resolveExerciseIdentity({
      storageId,
      resolvedName: name,
      exerciseBankKey
    });
  const label = idn.resolvedName || name || '';
  const bankKey = exerciseBankKey || idn.exerciseBankKey || null;

  if (bankKey && exerciseDatabase[bankKey]) {
    const db = exerciseDatabase[bankKey];
    const { primaryIds, secondaryIds, unmappedLabels } = resolveVisualGroupsFromLabels(
      db.primaryMuscles,
      db.secondaryMuscles
    );
    const primary = [...primaryIds].filter((g) => g !== MuscleGroups.FULL_BODY);
    const secondary = [...secondaryIds];
    return {
      ...idn,
      classificationVersion: CLASSIFICATION_VERSION,
      attributionSource: ATTR_SOURCE.BANK_KEY_EXPLICIT,
      primaryGroups: primary,
      secondaryGroups: secondary,
      unmappedLabels,
      mappingQuality: mappingQualityFrom(primary, secondary, unmappedLabels, false),
      anatomyLinkConfidence: primary.length ? 'certain' : 'none',
      nonAttributionReason: primary.length
        ? null
        : 'bank_key_without_mappable_primary',
      metricAdmissible: {
        volumeMono: primary.length === 1,
        volumeMulti: primary.length >= 2,
        exposurePrimary: primary.length >= 1,
        exposureSecondary: secondary.length >= 1
      }
    };
  }

  const db = dbLookupFlexible(label);
  if (db && label) {
    const { primaryIds, secondaryIds, unmappedLabels } = resolveVisualGroupsFromLabels(
      db.primaryMuscles,
      db.secondaryMuscles
    );
    let primary = [...primaryIds].filter((g) => g !== MuscleGroups.FULL_BODY);
    const secondary = [...secondaryIds];
    const onlyFull =
      primaryIds.size === 1 && primaryIds.has(MuscleGroups.FULL_BODY) && secondaryIds.size === 0;
    if (onlyFull) primary = [];
    const exactName =
      String(db.name || '').toLowerCase().trim() === String(label).toLowerCase().trim();
    return {
      ...idn,
      classificationVersion: CLASSIFICATION_VERSION,
      attributionSource: exactName ? ATTR_SOURCE.BANK : ATTR_SOURCE.NAME_MATCH,
      primaryGroups: primary,
      secondaryGroups: secondary,
      unmappedLabels,
      mappingQuality: mappingQualityFrom(primary, secondary, unmappedLabels, onlyFull),
      anatomyLinkConfidence: primary.length ? (exactName ? 'certain' : 'probable') : 'none',
      nonAttributionReason: primary.length
        ? null
        : onlyFull
          ? 'full_body_only'
          : 'bank_hit_without_primary',
      metricAdmissible: {
        volumeMono: primary.length === 1,
        volumeMulti: primary.length >= 2,
        exposurePrimary: primary.length >= 1,
        exposureSecondary: secondary.length >= 1
      }
    };
  }

  return {
    ...idn,
    classificationVersion: CLASSIFICATION_VERSION,
    attributionSource: label ? ATTR_SOURCE.HEURISTIC : ATTR_SOURCE.NONE,
    primaryGroups: [],
    secondaryGroups: [],
    unmappedLabels: label ? [label] : [],
    mappingQuality: 'empty',
    anatomyLinkConfidence: 'none',
    nonAttributionReason: label ? 'heuristic_only_no_volume' : 'unknown_exercise',
    metricAdmissible: {
      volumeMono: false,
      volumeMulti: false,
      exposurePrimary: false,
      exposureSecondary: false
    }
  };
}

function classifyUnit({ name, parsed, raw }) {
  if (!parsed.ok) {
    if (parsed.reason === 'empty' || parsed.reason === 'nan') return UNIT_CLASS.INVALID;
    if (parsed.reason === 'non_positive') return UNIT_CLASS.INVALID;
    return UNIT_CLASS.UNKNOWN_UNIT;
  }
  if (exerciseNameLooksIsometricForCalendar(name)) return UNIT_CLASS.ISOMETRIC_SECONDS;
  // Valeurs numériques sans nom iso → reps certaines (contrat P3.2a)
  if (Number.isInteger(parsed.value)) return UNIT_CLASS.CERTAIN_REPS;
  return UNIT_CLASS.HEURISTIC_UNIT;
}

/**
 * Charges : trois classes exclusives.
 * - present : valeur > 0
 * - explicit_zero : clé présente avec 0 (distinct de l’absence)
 * - absent : aucune clé / non numérique
 */
export function weightStatus(snapshot, storageKey) {
  const hasOwn =
    snapshot?.exerciseWeights != null &&
    Object.prototype.hasOwnProperty.call(snapshot.exerciseWeights, storageKey);
  const raw = hasOwn ? snapshot.exerciseWeights[storageKey] : undefined;

  if (hasOwn) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      return {
        weightClass: WEIGHT_CLASS.PRESENT,
        weightPresent: true,
        weightExplicitZero: false,
        weightUnknown: false,
        weightKg: n
      };
    }
    if (Number.isFinite(n) && n === 0) {
      return {
        weightClass: WEIGHT_CLASS.EXPLICIT_ZERO,
        weightPresent: false,
        weightExplicitZero: true,
        weightUnknown: false,
        weightKg: 0
      };
    }
  }

  const setW = snapshot?.exerciseSetWeights?.[storageKey];
  if (setW && typeof setW === 'object') {
    const vals = Object.values(setW).map(Number).filter((x) => Number.isFinite(x));
    const positive = vals.filter((x) => x > 0);
    if (positive.length) {
      return {
        weightClass: WEIGHT_CLASS.PRESENT,
        weightPresent: true,
        weightExplicitZero: false,
        weightUnknown: false,
        weightKg: positive[0]
      };
    }
    if (vals.length && vals.every((x) => x === 0)) {
      return {
        weightClass: WEIGHT_CLASS.EXPLICIT_ZERO,
        weightPresent: false,
        weightExplicitZero: true,
        weightUnknown: false,
        weightKg: 0
      };
    }
  }

  return {
    weightClass: WEIGHT_CLASS.ABSENT,
    weightPresent: false,
    weightExplicitZero: false,
    weightUnknown: true,
    weightKg: null
  };
}

function setLogStats(snapshot, storageKey) {
  const log = snapshot?.exerciseSetLogs?.[storageKey];
  if (!log || typeof log !== 'object') {
    return { setsRecorded: 0, setRepsSum: null, setsFromPrescription: false };
  }
  // Ne jamais reconstruire depuis le prescrit — seulement ce qui est loggé
  const entries = Array.isArray(log) ? log : Object.values(log);
  let sets = 0;
  let sum = 0;
  let any = false;
  entries.forEach((e) => {
    const r = parseInt(String(e?.reps ?? e), 10);
    if (Number.isFinite(r) && r > 0) {
      sets += 1;
      sum += r;
      any = true;
    }
  });
  return {
    setsRecorded: sets,
    setRepsSum: any ? sum : null,
    setsFromPrescription: false
  };
}

/**
 * B1 — Univers initial avant dedup / attribution.
 * Une ligne candidate = une clé reps (pas encore dedup date×id).
 */
export function buildRawObservationUniverse(snapshot, window = null) {
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  const lines = [];
  const counts = {
    candidateKeys: 0,
    [UNIT_CLASS.CERTAIN_REPS]: { lines: 0, valueSum: 0 },
    [UNIT_CLASS.ISOMETRIC_SECONDS]: { lines: 0, valueSum: 0 },
    [UNIT_CLASS.DURATION_OTHER]: { lines: 0, valueSum: 0 },
    [UNIT_CLASS.HEURISTIC_UNIT]: { lines: 0, valueSum: 0 },
    [UNIT_CLASS.UNKNOWN_UNIT]: { lines: 0, valueSum: 0 },
    [UNIT_CLASS.INVALID]: { lines: 0, valueSum: 0 },
    uncheckedSkipped: 0,
    complementarySkipped: 0,
    outOfWindow: 0
  };

  for (const key of Object.keys(reps)) {
    counts.candidateKeys += 1;
    const parsedKey = parseWorkoutKey(key);
    if (!parsedKey) {
      counts[UNIT_CLASS.INVALID].lines += 1;
      lines.push({
        rawKey: key,
        unitClass: UNIT_CLASS.INVALID,
        channel: CHANNEL.CLASSIC,
        reason: 'bad_key'
      });
      continue;
    }
    if (window?.end && !isDateInRecapWindow(parsedKey.date, window)) {
      counts.outOfWindow += 1;
      continue;
    }
    if (
      parsedKey.exerciseId.startsWith('complementary_') &&
      parsedKey.exerciseId !== 'complementary_endurance_pushups'
    ) {
      counts.complementarySkipped += 1;
      continue;
    }
    if (checked[key] !== true) {
      counts.uncheckedSkipped += 1;
      continue;
    }
    const parsed = parseNumericValue(reps[key]);
    const name = '';
    const unitClass = classifyUnit({ name, parsed, raw: reps[key] });
    // Iso detection deferred to named pass — provisional certain_reps
    const row = {
      date: parsedKey.date,
      storageId: parsedKey.exerciseId,
      rawKey: key,
      channel: CHANNEL.CLASSIC,
      rawValue: reps[key],
      parsedValue: parsed.ok ? parsed.value : null,
      unitClass,
      checked: true
    };
    lines.push(row);
    counts[unitClass].lines += 1;
    if (parsed.ok) counts[unitClass].valueSum += parsed.value;
  }

  return { lines, counts, classificationVersion: CLASSIFICATION_VERSION };
}

/**
 * Lignes canoniques : dedup aggregate (max reps / date×id), puis unité + attribution.
 */
export function buildCanonicalObservationLines({
  snapshot,
  window,
  getExerciseNameById = null,
  nameById = null,
  reverseIndex = null
} = {}) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    snapshot?.reps,
    snapshot?.checkedExercises
  );
  const rev =
    reverseIndex ||
    buildReverseStableIdIndex({
      ...(nameById || {})
    });
  const lines = [];

  grouped.forEach(({ reps: r, key }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const date = gkey.slice(0, sep);
    const storageId = gkey.slice(sep + 2);
    if (window?.end && !isDateInRecapWindow(date, window)) return;

    const identity = resolveExerciseIdentity({
      storageId,
      snapshot,
      getExerciseNameById,
      nameById,
      reverseIndex: rev
    });
    const name = identity.resolvedName || '';

    const parsed = parseNumericValue(r);
    let unitClass = classifyUnit({ name, parsed, raw: r });
    if (parsed.ok && exerciseNameLooksIsometricForCalendar(name)) {
      unitClass = UNIT_CLASS.ISOMETRIC_SECONDS;
    }
    // Iso : heuristique nominative (unité non explicite dans la donnée brute)
    const unitSource =
      unitClass === UNIT_CLASS.ISOMETRIC_SECONDS
        ? 'name_heuristic'
        : parsed.ok
          ? 'parsed_integer'
          : 'invalid';

    const attr = attributeAnatomyForExercise({
      storageId,
      name,
      exerciseBankKey: identity.exerciseBankKey,
      identity
    });
    const w = weightStatus(snapshot, key);
    const sets = setLogStats(snapshot, key);

    let volumeBucket = VOLUME_BUCKET.UNIT_AMBIGUOUS;
    if (unitClass === UNIT_CLASS.CERTAIN_REPS) {
      if (attr.metricAdmissible.volumeMono) volumeBucket = VOLUME_BUCKET.MONO_PRIMARY;
      else if (attr.metricAdmissible.volumeMulti) volumeBucket = VOLUME_BUCKET.MULTI_PRIMARY;
      else volumeBucket = VOLUME_BUCKET.NON_ATTRIBUTABLE;
    }

    lines.push({
      date,
      storageId,
      rawKey: key,
      channel: CHANNEL.CLASSIC,
      reps: unitClass === UNIT_CLASS.CERTAIN_REPS ? parsed.value : null,
      durationSeconds: unitClass === UNIT_CLASS.ISOMETRIC_SECONDS ? parsed.value : null,
      unitClass,
      unitSource,
      volumeBucket,
      attribution: attr,
      ...w,
      ...sets
    });
  });

  return lines;
}

/**
 * GTG ledger séparé — ne s’additionne pas à R classic si déjà syncé dans reps.
 */
export function buildGtgLedgerLines({
  snapshot,
  window,
  getExerciseNameById = null,
  nameById = null,
  reverseIndex = null
} = {}) {
  const gtg = normalizeGtgData(snapshot?.enduranceData?.gtg);
  const sync = gtg.workoutSync && typeof gtg.workoutSync === 'object' ? gtg.workoutSync : {};
  const rev = reverseIndex || buildReverseStableIdIndex({ ...(nameById || {}) });
  const lines = [];
  const dates = new Set([...Object.keys(sync), ...Object.keys(gtg.days || {})]);

  for (const date of dates) {
    if (window?.end && !isDateInRecapWindow(date, window)) continue;
    const dayLedger = sync[date] && typeof sync[date] === 'object' ? sync[date] : null;
    const ids = dayLedger ? Object.keys(dayLedger) : gtg.config?.selectedIds || [];
    for (const exerciseId of ids) {
      const gtgReps = dayLedger
        ? Number(dayLedger[exerciseId]) || 0
        : sumGtgRepsForExerciseOnDay(gtg, date, exerciseId, { workoutData: snapshot });
      if (gtgReps <= 0) continue;
      const storageKey = resolveGtgWorkoutStorageKey(date, exerciseId, gtg.config);
      const storageId = storageKey.includes('_')
        ? storageKey.slice(storageKey.indexOf('_') + 1)
        : String(exerciseId);
      const classicVal = parseInt(String(snapshot?.reps?.[storageKey]), 10) || 0;
      const alreadyInClassic =
        snapshot?.checkedExercises?.[storageKey] === true && classicVal > 0;
      const identity = resolveExerciseIdentity({
        storageId,
        snapshot,
        getExerciseNameById,
        nameById,
        reverseIndex: rev
      });
      lines.push({
        date,
        storageId,
        gtgExerciseId: String(exerciseId),
        rawKey: storageKey,
        channel: CHANNEL.GTG_LEDGER,
        reps: gtgReps,
        unitClass: UNIT_CLASS.CERTAIN_REPS,
        alreadyInClassic,
        attribution: attributeAnatomyForExercise({
          storageId,
          name: identity.resolvedName || '',
          exerciseBankKey: identity.exerciseBankKey,
          identity
        })
      });
    }
  }
  return lines;
}

function emptyGroupMap() {
  return {};
}

function bump(map, key, n = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + n;
}

/**
 * B5 — Comptabilités conservatrices sur certaines reps classic.
 */
export function buildMuscleAccountingLedger({
  snapshot,
  window,
  getExerciseNameById = null,
  nameById = null
} = {}) {
  const reverseIndex = buildReverseStableIdIndex({ ...(nameById || {}) });
  const raw = buildRawObservationUniverse(snapshot, window);
  const classicLines = buildCanonicalObservationLines({
    snapshot,
    window,
    getExerciseNameById,
    nameById,
    reverseIndex
  });
  const gtgLines = buildGtgLedgerLines({
    snapshot,
    window,
    getExerciseNameById,
    nameById,
    reverseIndex
  });

  const certain = classicLines.filter((l) => l.unitClass === UNIT_CLASS.CERTAIN_REPS);
  const iso = classicLines.filter((l) => l.unitClass === UNIT_CLASS.ISOMETRIC_SECONDS);

  let R = 0;
  let R_mono = 0;
  let R_multi = 0;
  let R_non_attr = 0;
  const volumePrimary = emptyGroupMap();
  const multiPrimaryTouch = emptyGroupMap();
  const exposureDaysPrimary = {};
  const exposureDaysSecondary = {};
  const distinctExercisesPrimary = {};
  const daysPrimarySets = {};
  const daysSecondarySets = {};

  const identityInventory = {
    certain: [],
    probable: [],
    unresolved: []
  };

  const seenIdentity = new Set();

  certain.forEach((line) => {
    const r = Number(line.reps) || 0;
    R += r;
    const attr = line.attribution || {};
    const idKey = attr.storageId;
    if (idKey && !seenIdentity.has(idKey)) {
      seenIdentity.add(idKey);
      const bucket =
        attr.identityConfidence === IDENTITY_CONFIDENCE.CERTAIN
          ? 'certain'
          : attr.identityConfidence === IDENTITY_CONFIDENCE.PROBABLE
            ? 'probable'
            : 'unresolved';
      identityInventory[bucket].push({
        storageId: idKey,
        originalId: attr.originalId || null,
        name: attr.resolvedName,
        resolutionSource: attr.resolutionSource || null,
        attributionSource: attr.attributionSource,
        anatomyLinkConfidence: attr.anatomyLinkConfidence || null,
        bankKey: attr.exerciseBankKey || null,
        primaryGroups: attr.primaryGroups,
        mappingQuality: attr.mappingQuality,
        nonAttributionReason: attr.nonAttributionReason || null,
        reps: 0
      });
    }
    if (idKey && seenIdentity.has(idKey)) {
      const bucket =
        attr.identityConfidence === IDENTITY_CONFIDENCE.CERTAIN
          ? 'certain'
          : attr.identityConfidence === IDENTITY_CONFIDENCE.PROBABLE
            ? 'probable'
            : 'unresolved';
      const row = identityInventory[bucket].find((x) => x.storageId === idKey);
      if (row) row.reps += r;
    }

    if (line.volumeBucket === VOLUME_BUCKET.MONO_PRIMARY) {
      R_mono += r;
      const g = attr.primaryGroups[0];
      bump(volumePrimary, g, r);
    } else if (line.volumeBucket === VOLUME_BUCKET.MULTI_PRIMARY) {
      R_multi += r;
      (attr.primaryGroups || []).forEach((g) => bump(multiPrimaryTouch, g, r));
    } else {
      R_non_attr += r;
    }

    (attr.primaryGroups || []).forEach((g) => {
      if (!daysPrimarySets[g]) daysPrimarySets[g] = new Set();
      daysPrimarySets[g].add(line.date);
      if (!distinctExercisesPrimary[g]) distinctExercisesPrimary[g] = new Set();
      distinctExercisesPrimary[g].add(line.storageId);
    });
    (attr.secondaryGroups || []).forEach((g) => {
      if (!daysSecondarySets[g]) daysSecondarySets[g] = new Set();
      daysSecondarySets[g].add(line.date);
    });
  });

  Object.keys(daysPrimarySets).forEach((g) => {
    exposureDaysPrimary[g] = daysPrimarySets[g].size;
  });
  Object.keys(daysSecondarySets).forEach((g) => {
    exposureDaysSecondary[g] = daysSecondarySets[g].size;
  });
  const distinctPrimaryCounts = {};
  Object.keys(distinctExercisesPrimary).forEach((g) => {
    distinctPrimaryCounts[g] = distinctExercisesPrimary[g].size;
  });

  const isoSecondsSum = iso.reduce((s, l) => s + (Number(l.durationSeconds) || 0), 0);
  const setsRecorded = classicLines.reduce((s, l) => s + (l.setsRecorded || 0), 0);

  // Charges : univers certain_reps (exclusif) + univers all classic lines (transparence)
  const weightOnCertain = {
    present: certain.filter((l) => l.weightClass === WEIGHT_CLASS.PRESENT).length,
    explicitZero: certain.filter((l) => l.weightClass === WEIGHT_CLASS.EXPLICIT_ZERO).length,
    absent: certain.filter((l) => l.weightClass === WEIGHT_CLASS.ABSENT).length
  };
  const weightOnClassic = {
    present: classicLines.filter((l) => l.weightClass === WEIGHT_CLASS.PRESENT).length,
    explicitZero: classicLines.filter((l) => l.weightClass === WEIGHT_CLASS.EXPLICIT_ZERO)
      .length,
    absent: classicLines.filter((l) => l.weightClass === WEIGHT_CLASS.ABSENT).length
  };

  const trainingDaysClassic = new Set(certain.map((l) => l.date)).size;
  const occurrences = certain.length;
  const distinctExercises = new Set(certain.map((l) => l.storageId)).size;

  const gtgRepsListed = gtgLines.reduce((s, l) => s + (l.reps || 0), 0);
  const gtgAlreadyInClassic = gtgLines
    .filter((l) => l.alreadyInClassic)
    .reduce((s, l) => s + (l.reps || 0), 0);
  const gtgUniqueNotInClassic = gtgLines
    .filter((l) => !l.alreadyInClassic)
    .reduce((s, l) => s + (l.reps || 0), 0);

  const conservationOk = R_mono + R_multi + R_non_attr === R;

  // Pipeline comparable : somme aggregate (même fonction) sur fenêtre
  let pipelineAggregateSum = 0;
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    snapshot?.reps,
    snapshot?.checkedExercises
  );
  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const date = gkey.slice(0, sep);
    if (window?.end && !isDateInRecapWindow(date, window)) return;
    const storageId = gkey.slice(sep + 2);
    const name =
      (typeof getExerciseNameById === 'function' ? getExerciseNameById(storageId) || '' : '') ||
      (nameById && nameById[storageId]) ||
      '';
    if (exerciseNameLooksIsometricForCalendar(name)) return;
    pipelineAggregateSum += Math.max(0, Math.floor(Number(r) || 0));
  });

  return {
    classificationVersion: CLASSIFICATION_VERSION,
    window: window ? { start: window.start || null, end: window.end } : null,
    rawUniverse: raw.counts,
    lines: classicLines,
    gtgLines,
    totals: {
      R,
      R_mono,
      R_multi,
      R_non_attr,
      conservationOk,
      isoSecondsSum,
      isoLineCount: iso.length,
      pipelineAggregateSum,
      deltaVsPipelineAggregate: R - pipelineAggregateSum,
      gtgRepsListed,
      gtgAlreadyInClassic,
      gtgUniqueNotInClassic
    },
    volumePrimary,
    multiPrimaryTouch,
    exposureDaysPrimary,
    exposureDaysSecondary,
    distinctExercisesPrimary: distinctPrimaryCounts,
    activity: {
      trainingDaysClassic,
      occurrences,
      distinctExercises,
      setsRecorded,
      /** @deprecated préférer weightClassesCertainReps */
      weightPresentLines: weightOnCertain.present,
      weightUnknownLines: weightOnCertain.absent,
      weightClassesCertainReps: weightOnCertain,
      weightClassesAllClassicLines: weightOnClassic,
      weightClassesExclusiveOk:
        weightOnCertain.present + weightOnCertain.explicitZero + weightOnCertain.absent ===
        occurrences
    },
    identityInventory,
    coverage: {
      attributedReps: R_mono + R_multi,
      attributionCoveragePct: R > 0 ? Math.round(((R_mono + R_multi) / R) * 1000) / 10 : null,
      namedExercises:
        identityInventory.certain.length +
        identityInventory.probable.filter((x) => x.name).length,
      unnamedExercises: identityInventory.probable.filter((x) => !x.name).length +
        identityInventory.unresolved.length
    },
    invariants: {
      linesExclusiveUnitClasses: true,
      repsNotMixedWithSeconds: true,
      noSeventyFourTwentySix: true,
      setsNotInferredFromPrescription: true,
      conservationOk,
      weightClassesExclusiveOk:
        weightOnCertain.present + weightOnCertain.explicitZero + weightOnCertain.absent ===
        occurrences
    }
  };
}

/**
 * Réconciliation brute → dedup → unités → volumes (invariants par étape).
 */
export function auditUnitAndDedupPipeline({
  snapshot,
  window,
  getExerciseNameById = null,
  nameById = null
} = {}) {
  const reverseIndex = buildReverseStableIdIndex({ ...(nameById || {}) });
  const raw = buildRawObservationUniverse(snapshot, window);
  const checkedInWindow = [];
  for (const [key, val] of Object.entries(snapshot?.reps || {})) {
    const pk = parseWorkoutKey(key);
    if (!pk) continue;
    if (window?.end && !isDateInRecapWindow(pk.date, window)) continue;
    if (snapshot?.checkedExercises?.[key] !== true) continue;
    if (
      pk.exerciseId.startsWith('complementary_') &&
      pk.exerciseId !== 'complementary_endurance_pushups'
    ) {
      continue;
    }
    const parsed = parseNumericValue(val);
    checkedInWindow.push({
      key,
      date: pk.date,
      storageId: pk.exerciseId,
      value: parsed.ok ? parsed.value : null,
      raw: val
    });
  }

  const rawLines = checkedInWindow.length;
  const rawValueSum = checkedInWindow.reduce((s, r) => s + (r.value || 0), 0);

  // Dedup à la manière aggregate (max per date::id)
  const best = new Map();
  checkedInWindow.forEach((row) => {
    const gkey = `${row.date}::${row.storageId}`;
    const prev = best.get(gkey);
    if (!prev || (row.value || 0) > prev.value) best.set(gkey, row);
  });
  const afterDedupLines = best.size;
  const afterDedupSum = [...best.values()].reduce((s, r) => s + (r.value || 0), 0);
  const eliminatedByDedupSum = rawValueSum - afterDedupSum;
  const eliminatedByDedupLines = rawLines - afterDedupLines;

  const canonical = buildCanonicalObservationLines({
    snapshot,
    window,
    getExerciseNameById,
    nameById,
    reverseIndex
  });
  const certain = canonical.filter((l) => l.unitClass === UNIT_CLASS.CERTAIN_REPS);
  const iso = canonical.filter((l) => l.unitClass === UNIT_CLASS.ISOMETRIC_SECONDS);
  const certainSum = certain.reduce((s, l) => s + (l.reps || 0), 0);
  const isoSum = iso.reduce((s, l) => s + (l.durationSeconds || 0), 0);

  return {
    steps: {
      rawCheckedInWindow: { lines: rawLines, valueSum: rawValueSum, unit: 'mixed_pre_name' },
      afterDedupMax: {
        lines: afterDedupLines,
        valueSum: afterDedupSum,
        eliminatedLines: eliminatedByDedupLines,
        eliminatedValueSum: eliminatedByDedupSum
      },
      afterUnitSplit: {
        certain_reps: { lines: certain.length, valueSum: certainSum },
        isometric_seconds: {
          lines: iso.length,
          valueSum: isoSum,
          unitSource: 'name_heuristic'
        },
        note:
          'Iso retiré de R après résolution de nom ; 4367−4331=36 n’implique pas à lui seul une dedup correcte'
      }
    },
    invariants: {
      dedupSumPlusEliminatedEqualsRaw:
        afterDedupSum + eliminatedByDedupSum === rawValueSum,
      certainPlusIsoLinesEqualsCanonical:
        certain.length + iso.length ===
        canonical.filter(
          (l) =>
            l.unitClass === UNIT_CLASS.CERTAIN_REPS ||
            l.unitClass === UNIT_CLASS.ISOMETRIC_SECONDS
        ).length,
      certainSumPlusIsoSumEqualsDedupSumWhenOnlyThoseUnits:
        certainSum + isoSum === afterDedupSum
    },
    rawUniverseCounts: raw.counts
  };
}

/**
 * Table par date : checks, R, GTG, éligibilités calendrier / P3.0 / P3.2a.
 */
export function buildDayEligibilityTable({
  snapshot,
  window,
  getExerciseNameById = null,
  nameById = null
} = {}) {
  const ledger = buildMuscleAccountingLedger({
    snapshot,
    window,
    getExerciseNameById,
    nameById
  });
  const matrix = buildPlanRealizationMatrix({
    workoutData: snapshot,
    window,
    getExerciseNameById
  });

  const byDate = new Map();
  const ensure = (d) => {
    if (!byDate.has(d)) {
      byDate.set(d, {
        date: d,
        hasChecks: false,
        canonicalCertainReps: 0,
        canonicalOccurrences: 0,
        gtgNativeReps: 0,
        gtgSyncedIntoClassic: false,
        classicNonGtgReps: 0,
        eligibleCalendarDay: false,
        eligibleP30MatrixDay: false,
        eligibleP32aExposureDay: false,
        planSource: null
      });
    }
    return byDate.get(d);
  };

  // Checks bruts
  for (const key of Object.keys(snapshot?.checkedExercises || {})) {
    if (snapshot.checkedExercises[key] !== true) continue;
    const pk = parseWorkoutKey(key);
    if (!pk) continue;
    if (window?.end && !isDateInRecapWindow(pk.date, window)) continue;
    const row = ensure(pk.date);
    row.hasChecks = true;
  }

  ledger.lines.forEach((l) => {
    if (l.unitClass !== UNIT_CLASS.CERTAIN_REPS) return;
    const row = ensure(l.date);
    row.canonicalCertainReps += l.reps || 0;
    row.canonicalOccurrences += 1;
    row.eligibleP32aExposureDay = true;
    row.eligibleCalendarDay = true;
  });

  ledger.gtgLines.forEach((l) => {
    const row = ensure(l.date);
    row.gtgNativeReps += l.reps || 0;
    if (l.alreadyInClassic) row.gtgSyncedIntoClassic = true;
  });

  (matrix.days || []).forEach((d) => {
    const row = ensure(d.date);
    row.planSource = d.planSource || d.source || null;
    // Jour « touché » matrice = activité classic|GTG (champs exportés par buildDayPlanRealizationRow)
    row.eligibleP30MatrixDay = Boolean(d.hasClassicActivity || d.hasGtgActivity);
  });

  // Classic hors GTG : certain reps − portion GTG syncée ce jour (approx via alreadyInClassic keys)
  const gtgClassicKeys = new Set(
    ledger.gtgLines.filter((l) => l.alreadyInClassic).map((l) => `${l.date}::${l.storageId}`)
  );
  ledger.lines.forEach((l) => {
    if (l.unitClass !== UNIT_CLASS.CERTAIN_REPS) return;
    const row = ensure(l.date);
    if (!gtgClassicKeys.has(`${l.date}::${l.storageId}`)) {
      row.classicNonGtgReps += l.reps || 0;
    }
  });

  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return {
    days,
    counts: {
      daysWithChecks: days.filter((d) => d.hasChecks).length,
      daysP32aExposure: days.filter((d) => d.eligibleP32aExposureDay).length,
      daysCalendar: days.filter((d) => d.eligibleCalendarDay).length,
      daysP30MatrixTouched: days.filter((d) => d.eligibleP30MatrixDay).length,
      daysWithGtg: days.filter((d) => d.gtgNativeReps > 0).length
    },
    definitions: {
      p32aExposure: 'jour avec ≥1 ligne certain_reps canonique',
      calendarHeuristic: 'aligné P3.2a exposure sur cet export (reps certain)',
      p30Matrix: 'jour présent dans buildPlanRealizationMatrix (toute source)',
      note11vs15vs16:
        '11 = métrique discovery trainingDays (souvent séances densifiées) ; 15 = jours matrice P3.0 ; 16 = jours certain_reps P3.2a — prédicats distincts, pas un bug unique'
    }
  };
}

/**
 * Réconciliation chiffrée vs total pipeline documenté (ex. 4016).
 */
export function reconcileAgainstDocumentedTotal(ledger, documentedTotal) {
  const R = ledger?.totals?.R ?? null;
  const pipe = ledger?.totals?.pipelineAggregateSum ?? null;
  return {
    documentedTotal: documentedTotal ?? null,
    ledgerR: R,
    pipelineAggregateSum: pipe,
    deltaDocumentedMinusLedger:
      documentedTotal != null && R != null ? documentedTotal - R : null,
    deltaDocumentedMinusPipeline:
      documentedTotal != null && pipe != null ? documentedTotal - pipe : null,
    samePerimeterHypothesis:
      documentedTotal != null && pipe != null
        ? documentedTotal === pipe
          ? 'match_pipeline_aggregate'
          : 'mismatch_investigate_window_or_filters'
        : 'unknown'
  };
}
