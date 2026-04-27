/**
 * Volume de charge (kg × reps) avec prise en charge :
 * - saisie « par haltère / par bras » (charge affichée = une haltère, volume = ×2 si mouvement bilatéral deux haltères) ;
 * - poids différents par série (pyramide / séries dégressives).
 */

import { workoutProgram } from '../data/workoutProgram';
import { enrichExercise } from './programUtils';
import { Equipment } from '../data/workoutProgramEnhanced';
import { collectDedupedCheckedVolumeKeys } from './trainingLoadUtils';

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * @param {object} exercise
 * @returns {boolean}
 */
export function exerciseIsDumbbellEquipment(exercise) {
  if (!exercise || typeof exercise !== 'object') return false;
  const n = norm(exercise.name || exercise.nom);
  if (n.includes('haltère') || n.includes('haltères')) return true;
  try {
    const { metadata } = enrichExercise({
      name: exercise.name || exercise.nom || 'Exercice',
      materiel: exercise.materiel || exercise.equipment || '',
      series: exercise.series || ''
    });
    return metadata?.equipment === Equipment.DUMBBELL;
  } catch {
    return false;
  }
}

/**
 * Mouvement un bras / une haltère pour l’effort (ex. rowing haltère, curl concentration).
 * @param {object} exercise
 * @returns {boolean}
 */
export function exerciseLooksUnilateralOneArm(exercise) {
  const n = norm(exercise?.name);
  const notes = norm(exercise?.notes);
  const mat = norm(exercise?.materiel);
  if (n.includes('unilateral') || n.includes('unilatéral') || n.includes('unilat')) return true;
  if (n.includes('1 bras') || n.includes('un bras') || n.includes('altern')) return true;
  if (notes.includes('/ bras') || notes.includes('1 bras')) return true;
  if (mat.includes('haltère') && !mat.includes('haltères')) return true;
  return false;
}

/**
 * kg déplacés pour une répétition, à partir de la valeur saisie.
 * @param {number} enteredKg — valeur saisie (toujours positive)
 * @param {{ perArm: boolean, exercise: object }} opts
 * @returns {number}
 */
export function effectiveKgMovedPerRep(enteredKg, { perArm, exercise }) {
  const w = Number(enteredKg);
  if (!Number.isFinite(w) || w <= 0) return 0;
  if (!exerciseIsDumbbellEquipment(exercise)) return w;
  if (!perArm) return w;
  const uni = exerciseLooksUnilateralOneArm(exercise);
  return w * (uni ? 1 : 2);
}

/**
 * Extrait le nombre de séries depuis le texte « 4×10 », « 3 x 8-10 », etc.
 * @param {string|undefined|null} seriesText
 * @returns {number|null}
 */
export function parseSeriesSetCount(seriesText) {
  const s = String(seriesText || '').trim();
  const m = s.match(/(\d+)\s*[×x]\s*\d/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * @param {object} exercise
 * @param {number} setWeightsLength — longueur du tableau poids/série saisi
 * @returns {number} — toujours ≥ 1
 */
export function inferDefaultSetCount(exercise, setWeightsLength) {
  const fromSeries = parseSeriesSetCount(exercise?.series);
  if (fromSeries && fromSeries > 0) return fromSeries;
  const len = Math.max(0, Math.floor(Number(setWeightsLength) || 0));
  if (len > 0) return len;
  return 1;
}

/**
 * Répartition entière des reps sur les séries (somme = totalReps).
 * @param {number} totalReps
 * @param {number} setCount
 * @returns {number[]}
 */
export function distributeRepsToSets(totalReps, setCount) {
  const t = Math.max(0, Math.floor(Number(totalReps) || 0));
  const n = Math.max(1, Math.floor(Number(setCount) || 1));
  const base = Math.floor(t / n);
  let rem = t - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

function parseKg(raw) {
  const n = parseFloat(String(raw ?? '').trim().replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Volume total kg×reps pour une entrée d’exercice (clé de stockage).
 * @param {object} opts
 * @param {object} opts.exercise — { id, name, nom?, materiel, series, notes? }
 * @param {number|string} opts.totalReps
 * @param {string|number} opts.singleWeightStr — poids unique (même schéma que `exerciseWeights`)
 * @param {boolean} [opts.perArm] — depuis `exerciseWeightPerArm[key]`
 * @param {string[]|null|undefined} opts.setWeightStrs — depuis `exerciseSetWeights[key]`
 * @returns {number}
 */
export function computeVolumeKgReps({
  exercise,
  totalReps,
  singleWeightStr,
  perArm = false,
  setWeightStrs
}) {
  const reps = Math.max(0, parseInt(String(totalReps), 10) || 0);
  if (reps <= 0) return 0;

  const arr = Array.isArray(setWeightStrs)
    ? setWeightStrs.map((x) => parseKg(x)).filter((x) => x > 0)
    : [];
  const setCount = inferDefaultSetCount(exercise, arr.length > 0 ? arr.length : 0);

  let weights;
  if (arr.length === 0) {
    const one = parseKg(singleWeightStr);
    if (one <= 0) return 0;
    weights = Array(setCount).fill(one);
  } else {
    weights = [...arr];
    while (weights.length < setCount) {
      weights.push(weights[weights.length - 1] || 0);
    }
    if (weights.length > setCount) weights.length = setCount;
  }

  const repsEach = distributeRepsToSets(reps, setCount);
  let vol = 0;
  for (let i = 0; i < setCount; i++) {
    const w = weights[i];
    if (!Number.isFinite(w) || w <= 0) continue;
    const eff = effectiveKgMovedPerRep(w, { perArm: !!perArm, exercise });
    vol += eff * (repsEach[i] || 0);
  }
  return vol;
}

/**
 * kg moyen « par rep » pour les bonus type XP / multiplicateur calendrier (volume/reps).
 * @returns {number}
 */
export function computeRepresentativeKgPerRep(opts) {
  const reps = Math.max(0, parseInt(String(opts.totalReps), 10) || 0);
  if (reps <= 0) return 0;
  const v = computeVolumeKgReps(opts);
  return v / reps;
}

let programExerciseByIdCache = null;

function buildProgramExerciseById() {
  const map = new Map();
  const visitList = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((ex) => {
      if (ex && ex.id != null) map.set(String(ex.id), ex);
    });
  };
  Object.values(workoutProgram || {}).forEach((day) => {
    visitList(day?.exercices);
    const vars = day?.salleVariants;
    if (vars && typeof vars === 'object') {
      Object.values(vars).forEach((v) => visitList(v?.exercices));
    }
  });
  return map;
}

/**
 * Résout un stub exercice depuis l’id programme (stats année / clés seules).
 * @param {string|number} exerciseId
 * @returns {{ id: string|number, name: string, materiel: string, series: string, notes?: string }}
 */
export function lookupProgramExerciseStub(exerciseId) {
  if (programExerciseByIdCache == null) {
    programExerciseByIdCache = buildProgramExerciseById();
  }
  const id = exerciseId != null ? String(exerciseId) : '';
  const hit = programExerciseByIdCache.get(id);
  if (hit) {
    return {
      id: hit.id,
      name: hit.name || 'Exercice',
      materiel: hit.materiel || hit.equipment || '',
      series: hit.series || '',
      notes: hit.notes || ''
    };
  }
  return { id: exerciseId, name: 'Exercice', materiel: '', series: '', notes: '' };
}

/**
 * Volume pour une clé `YYYY-MM-DD_id…` et les champs workout bruts.
 * @param {string} key
 * @param {object} workoutData
 * @returns {number}
 */
export function computeVolumeKgForWorkoutKey(key, workoutData) {
  if (!key || !workoutData || typeof workoutData !== 'object') return 0;
  const checked = workoutData.checkedExercises?.[key];
  if (!checked) return 0;
  const reps = workoutData.reps?.[key];
  const r = parseInt(String(reps), 10) || 0;
  if (r <= 0) return 0;

  const rawId = String(key).slice(11).replace(/_semaineA$|_semaineB$/, '');
  const exercise = lookupProgramExerciseStub(rawId);

  const single = workoutData.exerciseWeights?.[key];
  const perArm = workoutData.exerciseWeightPerArm?.[key] === true;
  const setArr = workoutData.exerciseSetWeights?.[key];
  return computeVolumeKgReps({
    exercise,
    totalReps: r,
    singleWeightStr: single,
    perArm,
    setWeightStrs: Array.isArray(setArr) ? setArr : null
  });
}

/**
 * Somme des volumes (kg×reps) par jour calendaire, pour heatmap / comparaisons relatives.
 * @param {object} workoutData
 * @returns {Map<string, number>} dateStr → kg×reps
 */
export function aggregateLiftVolumeKgByDate(workoutData) {
  const map = new Map();
  if (!workoutData || typeof workoutData !== 'object') return map;
  collectDedupedCheckedVolumeKeys(workoutData).forEach((key) => {
    const m = String(key).match(/^(\d{4}-\d{2}-\d{2})_/);
    if (!m) return;
    const d = m[1];
    const v = computeVolumeKgForWorkoutKey(key, workoutData);
    if (v > 0) map.set(d, (map.get(d) || 0) + v);
  });
  return map;
}

/**
 * Somme volume kg×reps sur un ensemble de clés (typiquement déjà dédupliquées).
 */
export function sumLiftVolumeKgForKeys(keys, workoutData) {
  if (!Array.isArray(keys) || !workoutData) return 0;
  let s = 0;
  keys.forEach((key) => {
    s += computeVolumeKgForWorkoutKey(key, workoutData);
  });
  return s;
}
