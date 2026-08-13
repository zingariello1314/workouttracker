/**
 * Normalisation prescriptions programme — séries × reps structurées + meta pour analyse Récap.
 * Cible : programme Cycle 3+1 (formats hétérogènes → N×M[-K] avec meta setCount/repsMin/repsMax).
 */

import { normalizeSeriesForParsing, detectExerciseUnit, CYCLE_31_PROGRAM_IDS } from './exerciseCalculations';
import { distributeRepsToSets } from './exerciseLoadVolume';

const DEFAULT_MUSCU_SETS = 3;

function inferDefaultSetCount(exercise) {
  const cat = exercise?.programCategory;
  const type = exercise?.type;
  if (cat === 'cardio' || type === 'cardio_technique') return 1;
  if (type === 'circuit_abdos') return 1;
  return DEFAULT_MUSCU_SETS;
}

function detectRepsScope(original) {
  if (/par\s+bras/i.test(original) || /\/main/i.test(original)) return 'per_hand';
  if (/chaque\s+c[ôo]t[ée]/i.test(original) || /\/c[ôo]t[ée]/i.test(original)) return 'per_side';
  return 'total';
}

function scopeSuffix(repsScope) {
  if (repsScope === 'per_hand') return '/main';
  if (repsScope === 'per_side') return '/côté';
  return '';
}

function buildRepsPrescription(setCount, repsMin, repsMax, repsScope) {
  const repsPart = repsMin === repsMax ? String(repsMin) : `${repsMin}-${repsMax}`;
  const displaySeries = `${setCount}×${repsPart}${scopeSuffix(repsScope)}`;
  return {
    setCount,
    repsMin,
    repsMax,
    volumeMode: 'reps',
    repsScope,
    displaySeries
  };
}

function stripScopeText(text) {
  return String(text || '')
    .replace(/\s*par\s+bras/gi, '')
    .replace(/\s*chaque\s+c[ôo]t[ée]/gi, '')
    .trim();
}

/**
 * @param {string} rawSeries
 * @param {object} [exercise]
 * @returns {object|null} prescription structurée ou { skip: true }
 */
export function parsePrescriptionFromSeries(rawSeries, exercise = {}) {
  const original = String(rawSeries || '').trim();
  if (!original) return { skip: true, reason: 'empty' };

  if (/\bmax\b/i.test(original)) {
    return { skip: true, reason: 'amrap' };
  }

  const repsScope = detectRepsScope(original);
  const normalized = normalizeSeriesForParsing(original);
  const unitInfo = detectExerciseUnit({ ...exercise, series: original });

  if (unitInfo?.isTimeBased) {
    const setsTime = normalized.match(/(\d+)\s*×\s*(\d+)\s*(sec|min)/i);
    if (setsTime) {
      const unit = setsTime[3].toLowerCase();
      const val = parseInt(setsTime[2], 10);
      return {
        setCount: parseInt(setsTime[1], 10),
        repsMin: val,
        repsMax: val,
        volumeMode: unit === 'min' ? 'minutes' : 'seconds',
        repsScope: 'total',
        displaySeries: `${setsTime[1]}×${val} ${unit}`
      };
    }
    const lone = normalized.match(/(\d+)\s*(sec|min)/i);
    if (lone) {
      const unit = lone[2].toLowerCase();
      const val = parseInt(lone[1], 10);
      return {
        setCount: 1,
        repsMin: val,
        repsMax: val,
        volumeMode: unit === 'min' ? 'minutes' : 'seconds',
        repsScope: 'total',
        displaySeries: `${val} ${unit}`
      };
    }
    return { skip: true, reason: 'time_unparsed' };
  }

  if (/cycles?/i.test(original)) {
    const m = original.match(/(\d+)\s*cycles?/i);
    if (m) {
      const n = parseInt(m[1], 10);
      return {
        setCount: 1,
        repsMin: n,
        repsMax: n,
        volumeMode: 'reps',
        repsScope: 'total',
        displaySeries: `1×${n} cycles`
      };
    }
  }

  const cleaned = stripScopeText(normalized);

  const trailing = cleaned.match(/^(\d+)\s*×\s*$/);
  if (trailing) {
    const reps = parseInt(trailing[1], 10);
    return buildRepsPrescription(1, reps, reps, repsScope);
  }

  const fullRange = cleaned.match(/(\d+)\s*×\s*(\d+)\s*-\s*(\d+)/);
  if (fullRange) {
    return buildRepsPrescription(
      parseInt(fullRange[1], 10),
      parseInt(fullRange[2], 10),
      parseInt(fullRange[3], 10),
      repsScope
    );
  }

  const fixed = cleaned.match(/(\d+)\s*×\s*(\d+)/);
  if (fixed) {
    const reps = parseInt(fixed[2], 10);
    return buildRepsPrescription(parseInt(fixed[1], 10), reps, reps, repsScope);
  }

  const rangeOnly = cleaned.match(/^(\d+)\s*-\s*(\d+)/);
  if (rangeOnly) {
    return buildRepsPrescription(
      inferDefaultSetCount(exercise),
      parseInt(rangeOnly[1], 10),
      parseInt(rangeOnly[2], 10),
      repsScope
    );
  }

  const single = cleaned.match(/^(\d+)$/);
  if (single) {
    const reps = parseInt(single[1], 10);
    return buildRepsPrescription(inferDefaultSetCount(exercise), reps, reps, repsScope);
  }

  return { skip: true, reason: 'unparsed' };
}

/**
 * @param {object} exercise
 * @returns {{ exercise: object, changed: boolean, skipped?: boolean, reason?: string }}
 */
export function normalizeExercisePrescription(exercise) {
  if (!exercise) return { exercise, changed: false, skipped: true };

  const parsed = parsePrescriptionFromSeries(exercise.series, exercise);
  if (!parsed || parsed.skip) {
    return { exercise, changed: false, skipped: true, reason: parsed?.reason };
  }

  const meta = {
    ...(exercise.meta && typeof exercise.meta === 'object' ? exercise.meta : {}),
    volumeMode: parsed.volumeMode,
    setCount: parsed.setCount,
    repsMin: parsed.repsMin,
    repsMax: parsed.repsMax,
    repsScope: parsed.repsScope,
    prescriptionNormalized: true
  };

  if (parsed.volumeMode === 'reps' && parsed.repsScope === 'per_hand') {
    meta.repsPerHand = parsed.repsMin === parsed.repsMax ? parsed.repsMin : `${parsed.repsMin}-${parsed.repsMax}`;
  }
  if (parsed.volumeMode === 'reps' && parsed.repsScope === 'per_side') {
    meta.repsPerSide = parsed.repsMin === parsed.repsMax ? parsed.repsMin : `${parsed.repsMin}-${parsed.repsMax}`;
  }

  const newSeries = parsed.displaySeries;
  const changed =
    newSeries !== String(exercise.series || '').trim() ||
    meta.setCount !== exercise.meta?.setCount ||
    meta.repsMin !== exercise.meta?.repsMin;

  return {
    exercise: { ...exercise, series: newSeries, meta },
    changed,
    skipped: false
  };
}

function normalizeExerciseList(exercises, stats) {
  if (!Array.isArray(exercises)) return exercises;
  return exercises.map((ex) => {
    const { exercise, changed, skipped, reason } = normalizeExercisePrescription(ex);
    if (changed) stats.updated += 1;
    else if (skipped) stats.skipped += 1;
    else stats.unchanged += 1;
    if (skipped && reason === 'unparsed') stats.unparsed += 1;
    return exercise;
  });
}

/**
 * Normalise toutes les prescriptions d'un programme (jours + variantes salle A/B).
 * @param {object} program
 * @returns {{ program: object, stats: { updated: number, unchanged: number, skipped: number, unparsed: number } }}
 */
export function normalizeProgramSchedulePrescriptions(program) {
  if (!program?.schedule) {
    return { program, stats: { updated: 0, unchanged: 0, skipped: 0, unparsed: 0 } };
  }

  const stats = { updated: 0, unchanged: 0, skipped: 0, unparsed: 0 };
  const schedule = { ...program.schedule };

  for (const dayKey of Object.keys(schedule)) {
    const day = { ...schedule[dayKey] };
    if (Array.isArray(day.exercises)) {
      day.exercises = normalizeExerciseList(day.exercises, stats);
    }
    if (day.salleVariants) {
      const sv = { ...day.salleVariants };
      for (const vk of ['semaineA', 'semaineB']) {
        if (sv[vk]?.exercises) {
          sv[vk] = { ...sv[vk], exercises: normalizeExerciseList(sv[vk].exercises, stats) };
        }
      }
      day.salleVariants = sv;
    }
    schedule[dayKey] = day;
  }

  return {
    program: {
      ...program,
      schedule,
      prescriptionNormalizedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    stats
  };
}

/** Structure prescription depuis meta ou parsing. */
export function getExercisePrescriptionStruct(exercise) {
  const meta = exercise?.meta;
  if (meta?.setCount != null && meta?.volumeMode) {
    return {
      setCount: meta.setCount,
      repsMin: meta.repsMin,
      repsMax: meta.repsMax,
      volumeMode: meta.volumeMode,
      repsScope: meta.repsScope || 'total',
      skip: false
    };
  }
  const parsed = parsePrescriptionFromSeries(exercise?.series, exercise);
  if (!parsed || parsed.skip) return null;
  return parsed;
}

/** Total prévu (reps cumulées ou durée selon le mode). */
export function getPlannedTotalFromPrescription(exercise) {
  const p = getExercisePrescriptionStruct(exercise);
  if (!p) return null;
  if (p.volumeMode === 'seconds' || p.volumeMode === 'minutes') {
    return p.setCount * p.repsMin;
  }
  const avg = p.repsMin === p.repsMax ? p.repsMin : Math.round((p.repsMin + p.repsMax) / 2);
  return p.setCount * avg;
}

/**
 * @returns {{ status: 'complete'|'near'|'below'|'unknown', planned: number|null, done: number, gap: number|null }}
 */
export function evaluateVolumeCompletion(exercise, doneTotal) {
  const planned = getPlannedTotalFromPrescription(exercise);
  const unitInfo = detectExerciseUnit(exercise);
  const isTime = unitInfo?.isTimeBased === true;
  const done = isTime
    ? Math.max(0, Number(doneTotal) || 0)
    : Math.max(0, Math.floor(Number(doneTotal) || 0));
  if (planned == null || planned <= 0) {
    return { status: 'unknown', planned: null, done, gap: null };
  }
  const gap = planned - done;
  if (gap <= 0) return { status: 'complete', planned, done, gap: 0 };
  if (gap <= 2) return { status: 'near', planned, done, gap };
  return { status: 'below', planned, done, gap };
}

/**
 * Reps par série planifiées (tableau).
 * @param {object} exercise
 * @param {number} [totalOverride] — total saisi par l'utilisateur à redistribuer
 * @returns {number[]|null}
 */
export function getPlannedSetRepsArray(exercise, totalOverride) {
  const p = getExercisePrescriptionStruct(exercise);
  if (!p || p.volumeMode === 'seconds' || p.volumeMode === 'minutes') return null;

  const perSet =
    p.repsMin === p.repsMax ? p.repsMin : Math.round((p.repsMin + p.repsMax) / 2);
  const total =
    totalOverride != null && totalOverride > 0
      ? Math.floor(totalOverride)
      : p.setCount * perSet;

  if (totalOverride != null && totalOverride > 0) {
    return distributeRepsToSets(total, p.setCount);
  }
  return Array.from({ length: p.setCount }, () => perSet);
}

/** Programme Cycle 3+1 embarqué ou nommé ainsi. */
export function isCycle31Program(program) {
  if (!program) return false;
  if (CYCLE_31_PROGRAM_IDS.has(String(program.id || ''))) return true;
  return /cycle\s*3\s*(\+\s*1)?/i.test(String(program.name || ''));
}

/**
 * Affichage séparé séries / reps pour l'UI Programme.
 * @param {object} exercise
 * @returns {{ setsLabel: string, repsLabel: string, rawSeries: string }}
 */
export function getPrescriptionDisplayParts(exercise) {
  const rawSeries = String(exercise?.series || '').trim();
  const meta = exercise?.meta;

  if (meta?.setCount != null && meta.volumeMode === 'reps') {
    const repsCore =
      meta.repsMin === meta.repsMax ? String(meta.repsMin) : `${meta.repsMin}-${meta.repsMax}`;
    const scope =
      meta.repsScope === 'per_hand'
        ? ' par bras'
        : meta.repsScope === 'per_side'
          ? ' par côté'
          : '';
    return {
      setsLabel: String(meta.setCount),
      repsLabel: `${repsCore}${scope}`,
      rawSeries
    };
  }

  if (meta?.setCount != null && (meta.volumeMode === 'seconds' || meta.volumeMode === 'minutes')) {
    const unit = meta.volumeMode === 'minutes' ? 'min' : 'sec';
    return {
      setsLabel: String(meta.setCount),
      repsLabel: `${meta.repsMin} ${unit}`,
      rawSeries
    };
  }

  const parsed = parsePrescriptionFromSeries(rawSeries, exercise);
  if (parsed && !parsed.skip) {
    const scope =
      parsed.repsScope === 'per_hand'
        ? ' par bras'
        : parsed.repsScope === 'per_side'
          ? ' par côté'
          : '';
    const repsCore =
      parsed.repsMin === parsed.repsMax ? String(parsed.repsMin) : `${parsed.repsMin}-${parsed.repsMax}`;
    if (parsed.volumeMode === 'reps') {
      return {
        setsLabel: String(parsed.setCount),
        repsLabel: `${repsCore}${scope}`,
        rawSeries
      };
    }
    const unit = parsed.volumeMode === 'minutes' ? 'min' : 'sec';
    return {
      setsLabel: String(parsed.setCount),
      repsLabel: `${parsed.repsMin} ${unit}`,
      rawSeries
    };
  }

  return { setsLabel: '—', repsLabel: rawSeries || '—', rawSeries };
}
