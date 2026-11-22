/**
 * Représentation structurelle des séances d’un programme (Mission 7 / 11).
 * Généralisable : ne dépend pas des jours calendaires ni d’un utilisateur.
 * Muscles : banque d’exercices (primary/secondary) — jamais programCategory
 * (street_workout / muscu / cardio) comme groupe musculaire.
 *
 * Relations typées (preuves + confiance) :
 * - similar_session / session_variant
 * - shared_movement / complementary_movement
 * - shared_muscle_exposure
 * - joint_progression (signal seulement)
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { inferMuscleLoadRolesForExercise } from './recapMuscleInference';

/** Catégories d’activité / programme — ce ne sont PAS des muscles. */
export const NON_MUSCLE_ACTIVITY_KEYS = Object.freeze(
  new Set([
    'street_workout',
    'muscu',
    'cardio',
    'endurance',
    'strength',
    'hyrox',
    'other',
    'activity',
    'program',
    'salle',
    'maison'
  ])
);

const VALID_MUSCLE_KEYS = new Set(Object.values(MuscleGroups));

const MUSCLE_LABEL_FR = Object.freeze({
  [MuscleGroups.CHEST]: 'pectoraux',
  [MuscleGroups.BACK]: 'dos',
  [MuscleGroups.SHOULDERS]: 'épaules',
  [MuscleGroups.BICEPS]: 'biceps',
  [MuscleGroups.TRICEPS]: 'triceps',
  [MuscleGroups.FOREARMS]: 'avant-bras',
  [MuscleGroups.GLUTES]: 'fessiers',
  [MuscleGroups.LEGS]: 'jambes',
  [MuscleGroups.QUADS]: 'quadriceps',
  [MuscleGroups.HAMSTRINGS]: 'ischio-jambiers',
  [MuscleGroups.CALVES]: 'mollets',
  [MuscleGroups.TIBIALIS_ANTERIOR]: 'tibial antérieur',
  [MuscleGroups.NECK]: 'cou',
  [MuscleGroups.ADDUCTORS]: 'adducteurs',
  [MuscleGroups.CORE]: 'tronc',
  [MuscleGroups.FULL_BODY]: 'corps entier'
});

function normalizeMoveName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Clés de mouvement pour similarité inter-séances.
 * Les programmes réels dupliquent souvent le même mouvement sous des ids distincts
 * (ex. 101 vs 501, dup_*, ex_*) — la ressemblance doit aussi passer par le nom.
 */
function exerciseKeysOf(ex) {
  if (!ex) return [];
  const keys = [];
  const id = ex.originalId ?? ex.storageId ?? ex.id ?? ex.exerciseId;
  if (id != null && id !== '') keys.push(`id:${id}`);
  const name = normalizeMoveName(ex.name || ex.exerciseName);
  if (name) keys.push(`name:${name}`);
  return keys;
}

function parseSeriesScheme(text) {
  const raw = String(text || '').trim();
  const matched = raw.match(/(\d+)\s*[×xX*]\s*(\d+)/);
  if (matched) {
    const sets = Number(matched[1]);
    const repsPerSet = Number(matched[2]);
    return { sets, repsPerSet, total: sets * repsPerSet };
  }
  return { sets: null, repsPerSet: null, total: null };
}

function plannedRepsOf(ex) {
  const scheme = parseSeriesScheme(ex?.series || ex?.scheme);
  if (scheme.total != null) return scheme.total;
  const metaSets = Number(ex?.meta?.setCount) || 0;
  const metaReps = Number(ex?.meta?.repsMax ?? ex?.meta?.repsMin) || 0;
  if (metaSets > 0 && metaReps > 0) return metaSets * metaReps;
  const sets = Number(ex?.sets) || 0;
  const reps = Number(ex?.reps ?? ex?.repetitions) || 0;
  if (sets > 0 && reps > 0) return sets * reps;
  if (Number.isFinite(Number(ex?.targetReps))) return Number(ex.targetReps);
  if (Number.isFinite(Number(ex?.plannedReps))) return Number(ex.plannedReps);
  return 0;
}

function plannedSetsOf(ex) {
  const scheme = parseSeriesScheme(ex?.series || ex?.scheme);
  if (scheme.sets != null) return scheme.sets;
  return Number(ex?.sets ?? ex?.meta?.setCount) || 0;
}

/** Presses / muscu : jamais cardio même si programCategory contient « cardio ». */
const STRENGTH_NAME_NOT_CARDIO =
  /developp|couche|haltere|bench\s*press|shoulder press|pec\s*deck|butterfly|ecartes?|flyes?\b|chest press|arnold|military press|curl|rowing|traction|pompes?|dips?|squat|fente|soulev|hip thrust|kickback|oiseau|face\s*pull|elevation|lateral|presse|extension|flex/;

const ISOMETRIC_NAME =
  /gainage|planche|isometr|isométr|wall\s*sit|chaise\s*(murale|au mur)|hold\b|statique/;

const CARDIO_NAME_EXPLICIT =
  /course\s+endurance|endurance\s+fondamentale|\bfooting\b|\bfractionn|\brunning\b|\bnatation\b|\bvelo\b|\bvélo\b|\brameur\b|corde\s+a\s+sauter|corde\s+à\s+sauter|\bhiit\b|\bcycling\b|\bswim\b/;

/**
 * Modalité de travail — axes indépendants du muscle et de l’intitulé libre.
 * Règles (Mission 13) :
 * - programCategory / type « cardio » ≠ modalité si le nom est un mouvement de force.
 * - Une durée (min/s) seule ≠ cardio.
 * - Le mot « endurance » dans un intitulé libre ≠ stimulus cardio automatique.
 */
export function exerciseWorkModality(ex) {
  const name = String(ex?.name || ex?.exerciseName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const bankKey = String(ex?.exerciseBankKey || ex?.databaseKey || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const series = String(ex?.series || ex?.scheme || '').toLowerCase();
  const activity = String(ex?.programCategory || ex?.category || '')
    .toLowerCase()
    .trim();
  const typeField = String(ex?.type || ex?.modality || '')
    .toLowerCase()
    .trim();

  // 1) Isométrie par nom / banque (wall sit, gainage…)
  if (ISOMETRIC_NAME.test(name) || ISOMETRIC_NAME.test(bankKey)) {
    return 'isometric';
  }
  // Séries en secondes + nom de maintien
  if (/\d+\s*s\b|\d+\s*sec|\d+\s*second/.test(series) && /hold|statique|gainage|planche|sit|chaise/.test(name)) {
    return 'isometric';
  }

  // 2) Renforcement connu : jamais cardio via catégorie programme
  if (STRENGTH_NAME_NOT_CARDIO.test(name) || STRENGTH_NAME_NOT_CARDIO.test(bankKey)) {
    if (/compl[ée]mentaire|endurance.*pomp/.test(name)) return 'complementary';
    return 'strength_reps';
  }

  // 3) Cardio explicite par nom / clé banque (pas par programCategory seule)
  if (CARDIO_NAME_EXPLICIT.test(name) || CARDIO_NAME_EXPLICIT.test(bankKey)) {
    return 'cardio';
  }
  // type/modality explicite cardio UNIQUEMENT si le nom n’est pas de la force
  if (
    (typeField === 'cardio' || typeField === 'running' || typeField === 'endurance') &&
    !STRENGTH_NAME_NOT_CARDIO.test(name)
  ) {
    if (CARDIO_NAME_EXPLICIT.test(name) || /course|run|velo|vélo|natation|corde|rameur|hiit/.test(name)) {
      return 'cardio';
    }
    // type=cardio sans nom cardio : incertitude → ne pas classer cardio
  }
  // programCategory « cardio » seule : insuffisante
  if (activity === 'cardio' && CARDIO_NAME_EXPLICIT.test(`${name} ${bankKey}`)) {
    return 'cardio';
  }

  if (/compl[ée]mentaire|endurance.*pomp/.test(name)) return 'complementary';
  return 'strength_reps';
}

/**
 * Classification multi-axes (Mission 13) — ne fusionne pas les dimensions.
 */
export function classifyExerciseAxes(ex) {
  const modality = exerciseWorkModality(ex);
  const muscles = resolveExerciseMusclesFromBank(ex);
  const series = String(ex?.series || '');
  const name = String(ex?.name || ex?.exerciseName || '');
  const bankKey = String(ex?.exerciseBankKey || ex?.databaseKey || '');
  const hasBankSignal = Boolean(bankKey) || muscles.primary.length > 0;
  const hasNameSignal = name.trim().length >= 3;
  const unit =
    modality === 'isometric' || /\d+\s*s\b|\d+\s*min\b/i.test(series)
      ? /min/i.test(series)
        ? 'minutes'
        : 'seconds'
      : modality === 'cardio'
        ? /km|distance/i.test(series)
          ? 'distance'
          : 'duration_or_reps'
        : 'reps';
  // Mission 14 : ne pas présenter un inconnu comme force certaine
  let certainty = 'probable';
  if (modality === 'cardio' || modality === 'isometric') certainty = 'certain';
  else if (hasBankSignal && hasNameSignal) certainty = 'certain';
  else if (!hasNameSignal && !hasBankSignal) certainty = 'indeterminate';
  else if (muscles.unknown && !hasBankSignal) certainty = 'indeterminate';
  return {
    schema: 'momentum.exerciseClassification.v2',
    modality: certainty === 'indeterminate' ? 'indeterminate' : modality,
    modalityFallback: modality,
    certainty,
    recordedUnit: unit,
    primaryMuscles: muscles.primary,
    secondaryMuscles: muscles.secondary,
    activityCategory: muscles.activityCategory,
    unknownMuscles: muscles.unknown,
    name: ex?.name || ex?.exerciseName || null,
    justification: {
      modalitySource:
        certainty === 'indeterminate'
          ? 'insufficient_metadata'
          : modality === 'cardio'
            ? 'explicit_cardio_name_or_bank'
            : modality === 'isometric'
              ? 'isometric_name_or_timed_hold'
              : hasBankSignal
                ? 'bank_or_known_strength_name'
                : 'name_heuristic_probable',
      note: 'programCategory n’impose pas la modalité ; indeterminate ≠ inventer strength_reps'
    }
  };
}

/**
 * Muscles réels depuis la banque — jamais programCategory comme muscle.
 * @returns {{ primary: string[], secondary: string[], unknown: boolean, activityCategory: string|null }}
 */
export function resolveExerciseMusclesFromBank(ex) {
  const activityRaw = String(ex?.programCategory || ex?.category || '')
    .toLowerCase()
    .trim();
  const activityCategory =
    activityRaw && NON_MUSCLE_ACTIVITY_KEYS.has(activityRaw) ? activityRaw : null;

  const roles = inferMuscleLoadRolesForExercise({
    name: ex?.name || ex?.exerciseName,
    nom: ex?.name || ex?.exerciseName,
    id: ex?.originalId ?? ex?.id ?? ex?.exerciseId,
    exerciseBankKey: ex?.exerciseBankKey || ex?.databaseKey || null,
    primaryMuscles: ex?.primaryMuscles,
    secondaryMuscles: ex?.secondaryMuscles
  });

  const primary = (roles?.primary || []).filter(
    (g) => g && VALID_MUSCLE_KEYS.has(g) && g !== MuscleGroups.FULL_BODY && !NON_MUSCLE_ACTIVITY_KEYS.has(g)
  );
  const secondary = (roles?.secondary || []).filter(
    (g) => g && VALID_MUSCLE_KEYS.has(g) && g !== MuscleGroups.FULL_BODY && !NON_MUSCLE_ACTIVITY_KEYS.has(g)
  );

  // Fallback explicite : champ muscleGroup seulement s’il est un MuscleGroups valide
  const rawGroup = String(
    ex?.muscleGroup || ex?.group || ex?.primaryMuscle || ex?.meta?.muscleGroup || ''
  ).toLowerCase();
  if (
    !primary.length &&
    rawGroup &&
    VALID_MUSCLE_KEYS.has(rawGroup) &&
    !NON_MUSCLE_ACTIVITY_KEYS.has(rawGroup) &&
    rawGroup !== MuscleGroups.FULL_BODY
  ) {
    primary.push(rawGroup);
  }

  return {
    primary,
    secondary,
    unknown: primary.length === 0 && secondary.length === 0,
    activityCategory,
    modality: exerciseWorkModality(ex)
  };
}

/**
 * Profil musculaire d’une séance depuis sa composition (banque), pas son nom libre.
 */
export function sessionMuscleProfile(exercises = []) {
  const tallies = new Map();
  let unknownCount = 0;
  let cardioCount = 0;
  let isoCount = 0;
  let complementaryCount = 0;
  let strengthCount = 0;
  (exercises || []).forEach((ex) => {
    const resolved = resolveExerciseMusclesFromBank(ex);
    if (resolved.modality === 'cardio') {
      cardioCount += 1;
      return;
    }
    if (resolved.modality === 'isometric') isoCount += 1;
    else if (resolved.modality === 'complementary') complementaryCount += 1;
    else strengthCount += 1;
    if (resolved.unknown) {
      unknownCount += 1;
      return;
    }
    resolved.primary.forEach((g) => {
      tallies.set(g, (tallies.get(g) || 0) + 2);
    });
    resolved.secondary.forEach((g) => {
      tallies.set(g, (tallies.get(g) || 0) + 1);
    });
  });
  const ranked = [...tallies.entries()].sort((a, b) => b[1] - a[1]);
  const dominant = ranked.slice(0, 3).map(([g]) => g);
  return {
    muscleKeys: ranked.map(([g]) => g),
    dominant,
    dominantLabels: dominant.map((g) => MUSCLE_LABEL_FR[g] || g),
    unknownExerciseCount: unknownCount,
    modalities: {
      strength_reps: strengthCount,
      isometric: isoCount,
      cardio: cardioCount,
      complementary: complementaryCount
    }
  };
}

export function describeFamilyMuscleProfile(templates = []) {
  const merged = new Map();
  const modalities = { strength_reps: 0, isometric: 0, cardio: 0, complementary: 0 };
  templates.forEach((tpl) => {
    (tpl.muscleKeys || []).forEach((g) => {
      merged.set(g, (merged.get(g) || 0) + 1);
    });
    const m = tpl.modalities || {};
    Object.keys(modalities).forEach((k) => {
      modalities[k] += Number(m[k]) || 0;
    });
  });
  const ranked = [...merged.entries()].sort((a, b) => b[1] - a[1]);
  const labels = ranked.slice(0, 4).map(([g]) => MUSCLE_LABEL_FR[g] || g);
  const bits = [];
  if (labels.length) bits.push(`dominante ${labels.join(', ')}`);
  if (modalities.cardio > 0) bits.push('composante aérobie');
  if (modalities.isometric > 0) bits.push('composante isométrique');
  return {
    labels,
    muscleKeys: ranked.map(([g]) => g),
    modalities,
    prose: bits.length ? bits.join(' · ') : 'composition musculaire non résolue (métadonnées manquantes)'
  };
}

/**
 * Extraire les templates de séance depuis un programme actif (schedule).
 * @returns {Array<{ dayKey: string, name: string, exercises: object[], signature: object }>}
 */
export function extractSessionTemplates(activeProgram) {
  const schedule = activeProgram?.schedule || {};
  const templates = [];
  Object.entries(schedule).forEach(([dayKey, day]) => {
    if (!day || day.active === false) return;
    const exercises = Array.isArray(day.exercises) ? day.exercises : [];
    if (!exercises.length) return;
    const movementKeys = [
      ...new Set(
        exercises
          .filter((ex) => exerciseWorkModality(ex) !== 'cardio')
          .map((ex) => {
            const name = normalizeMoveName(ex?.name || ex?.exerciseName);
            if (name) return `name:${name}`;
            const id = ex?.originalId ?? ex?.storageId ?? ex?.id ?? ex?.exerciseId;
            return id != null && id !== '' ? `id:${id}` : null;
          })
          .filter(Boolean)
      )
    ];
    const cardioKeys = [
      ...new Set(
        exercises
          .filter((ex) => exerciseWorkModality(ex) === 'cardio')
          .map((ex) => normalizeMoveName(ex?.name || ex?.exerciseName))
          .filter(Boolean)
          .map((n) => `cardio:${n}`)
      )
    ];
    const allKeys = [...new Set(exercises.flatMap(exerciseKeysOf))];
    const profile = sessionMuscleProfile(exercises);
    const strengthExercises = exercises.filter((ex) => exerciseWorkModality(ex) !== 'cardio');
    const totalReps = strengthExercises.reduce((s, ex) => s + plannedRepsOf(ex), 0);
    const totalSets = strengthExercises.reduce((s, ex) => s + plannedSetsOf(ex), 0);
    templates.push({
      dayKey,
      name: day.name || day.focus || dayKey,
      focus: day.focus || null,
      exercises,
      exerciseKeys: movementKeys,
      cardioKeys,
      allExerciseKeys: allKeys,
      muscleKeys: profile.muscleKeys,
      muscleProfile: profile,
      modalities: profile.modalities,
      plannedReps: totalReps,
      plannedSets: totalSets,
      exerciseCount: exercises.length,
      strengthExerciseCount: strengthExercises.length
    });
  });
  return templates;
}

function jaccard(a, b) {
  const A = new Set(a || []);
  const B = new Set(b || []);
  if (!A.size && !B.size) return 0;
  let inter = 0;
  A.forEach((x) => {
    if (B.has(x)) inter += 1;
  });
  return inter / (A.size + B.size - inter);
}

/**
 * Relier des templates de séances par similarité de contenu (pas par jour).
 */
export function relateSessionTemplates(templates = []) {
  const relations = [];
  for (let i = 0; i < templates.length; i += 1) {
    for (let j = i + 1; j < templates.length; j += 1) {
      const a = templates[i];
      const b = templates[j];
      const exSim = jaccard(a.exerciseKeys, b.exerciseKeys);
      // muscleSimilarity : uniquement vrais MuscleGroups (jamais street_workout/muscu/cardio)
      const cleanA = (a.muscleKeys || []).filter(
        (k) => VALID_MUSCLE_KEYS.has(k) && !NON_MUSCLE_ACTIVITY_KEYS.has(k)
      );
      const cleanB = (b.muscleKeys || []).filter(
        (k) => VALID_MUSCLE_KEYS.has(k) && !NON_MUSCLE_ACTIVITY_KEYS.has(k)
      );
      const musSim = jaccard(cleanA, cleanB);
      const sharedMoves = a.exerciseKeys.filter((k) => b.exerciseKeys.includes(k));
      const onlyA = a.exerciseKeys.filter((k) => !b.exerciseKeys.includes(k));
      const onlyB = b.exerciseKeys.filter((k) => !a.exerciseKeys.includes(k));
      let type = null;
      let confidence = 0;
      if (exSim >= 0.75) {
        type = 'similar_session';
        confidence = exSim;
      } else if (exSim >= 0.35 && sharedMoves.length >= 2) {
        type = 'session_variant';
        confidence = 0.45 + exSim * 0.4;
      } else if (musSim >= 0.6 && sharedMoves.length >= 1 && cleanA.length && cleanB.length) {
        type = 'shared_muscle_exposure';
        confidence = musSim * 0.7;
      } else if (sharedMoves.length >= 1) {
        type = 'shared_movement';
        confidence = Math.min(0.55, 0.25 + sharedMoves.length * 0.1);
      }
      if (!type) continue;
      const volumeDelta =
        a.plannedReps > 0 || b.plannedReps > 0
          ? {
              a: a.plannedReps,
              b: b.plannedReps,
              delta: a.plannedReps - b.plannedReps
            }
          : null;
      relations.push({
        type,
        confidence: Math.round(confidence * 1000) / 1000,
        left: { dayKey: a.dayKey, name: a.name },
        right: { dayKey: b.dayKey, name: b.name },
        proof: {
          exerciseSimilarity: Math.round(exSim * 1000) / 1000,
          muscleSimilarity: Math.round(musSim * 1000) / 1000,
          muscleKeysCompared: { left: cleanA, right: cleanB },
          sharedMoves,
          onlyLeft: onlyA,
          onlyRight: onlyB,
          volumeDelta,
          note: 'muscleSimilarity exclut les catégories d’activité (street_workout, muscu, cardio)'
        },
        certainty: confidence >= 0.75 ? 'high' : confidence >= 0.45 ? 'medium' : 'low'
      });
    }
  }
  return relations;
}

/**
 * Familles de séances : composantes connexes via similar_session / session_variant.
 */
export function clusterSessionFamilies(templates = [], relations = []) {
  const parent = new Map(templates.map((t) => [t.dayKey, t.dayKey]));
  const find = (x) => {
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)));
    return parent.get(x);
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  relations.forEach((rel) => {
    if (rel.type === 'similar_session' || rel.type === 'session_variant') {
      if (rel.confidence >= 0.4) union(rel.left.dayKey, rel.right.dayKey);
    }
  });
  const families = new Map();
  templates.forEach((t) => {
    const root = find(t.dayKey);
    if (!families.has(root)) families.set(root, []);
    families.get(root).push(t.dayKey);
  });
  return [...families.values()].map((members, index) => ({
    familyId: `sessionFamily:${index + 1}`,
    members,
    size: members.length,
    relationTypes: relations
      .filter(
        (r) =>
          members.includes(r.left.dayKey) &&
          members.includes(r.right.dayKey) &&
          (r.type === 'similar_session' || r.type === 'session_variant')
      )
      .map((r) => r.type)
  }));
}

/**
 * Comparaison détaillée de deux templates apparentés (composition, volume, séries).
 * Généralisable — aucun jour calendaire codé en dur.
 */
export function compareSessionPairComposition(leftTpl, rightTpl) {
  if (!leftTpl || !rightTpl) return null;
  const leftKeys = new Set(leftTpl.exerciseKeys || []);
  const rightKeys = new Set(rightTpl.exerciseKeys || []);
  const shared = [...leftKeys].filter((k) => rightKeys.has(k));
  const onlyLeft = [...leftKeys].filter((k) => !rightKeys.has(k));
  const onlyRight = [...rightKeys].filter((k) => !leftKeys.has(k));

  const moveDetail = (tpl, key) => {
    const name = key.startsWith('name:') ? key.slice(5) : key;
    const ex = (tpl.exercises || []).find((e) => {
      const n = normalizeMoveName(e?.name || e?.exerciseName);
      if (key.startsWith('name:') && n === name) return true;
      const id = e?.originalId ?? e?.storageId ?? e?.id ?? e?.exerciseId;
      return key === `id:${id}`;
    });
    return {
      key,
      label: ex?.name || name,
      plannedReps: plannedRepsOf(ex),
      plannedSets: plannedSetsOf(ex),
      series: ex?.series || null,
      muscles: resolveExerciseMusclesFromBank(ex),
      modality: exerciseWorkModality(ex)
    };
  };

  const sharedDetails = shared.map((k) => ({
    key: k,
    left: moveDetail(leftTpl, k),
    right: moveDetail(rightTpl, k)
  }));
  const sharedRepsLeft = sharedDetails.reduce((s, d) => s + (d.left.plannedReps || 0), 0);
  const sharedRepsRight = sharedDetails.reduce((s, d) => s + (d.right.plannedReps || 0), 0);
  const totalPair = (leftTpl.plannedReps || 0) + (rightTpl.plannedReps || 0);

  const redistribution = sharedDetails
    .filter((d) => d.left.plannedReps !== d.right.plannedReps)
    .map((d) => ({
      move: d.left.label,
      leftReps: d.left.plannedReps,
      rightReps: d.right.plannedReps,
      leftSeries: d.left.series,
      rightSeries: d.right.series
    }));

  return {
    schema: 'momentum.sessionPairComposition.v1',
    left: {
      dayKey: leftTpl.dayKey,
      name: leftTpl.name,
      plannedReps: leftTpl.plannedReps,
      plannedSets: leftTpl.plannedSets,
      exerciseCount: leftTpl.exerciseCount,
      muscleKeys: leftTpl.muscleKeys,
      muscleProfile: leftTpl.muscleProfile || null
    },
    right: {
      dayKey: rightTpl.dayKey,
      name: rightTpl.name,
      plannedReps: rightTpl.plannedReps,
      plannedSets: rightTpl.plannedSets,
      exerciseCount: rightTpl.exerciseCount,
      muscleKeys: rightTpl.muscleKeys,
      muscleProfile: rightTpl.muscleProfile || null
    },
    sharedMoves: shared,
    onlyLeft,
    onlyRight,
    sharedDetails,
    redistribution,
    sharedVolume: { left: sharedRepsLeft, right: sharedRepsRight },
    pairTotalReps: totalPair,
    complementarity:
      onlyLeft.length + onlyRight.length > 0
        ? 'socle_commun_avec_variantes'
        : shared.length === leftKeys.size && shared.length === rightKeys.size
          ? 'presque_identiques'
          : 'chevauchement_partiel'
  };
}

/**
 * Graphe structurel complet d’un programme.
 */
export function buildProgramSessionGraph(activeProgram) {
  if (!activeProgram?.schedule) {
    return {
      schema: 'momentum.programSessionGraph.v1',
      available: false,
      reason: 'no_schedule',
      templates: [],
      relations: [],
      families: []
    };
  }
  const templates = extractSessionTemplates(activeProgram);
  const relations = relateSessionTemplates(templates);
  const families = clusterSessionFamilies(templates, relations);
  return {
    schema: 'momentum.programSessionGraph.v1',
    available: true,
    source: 'active_program_schedule',
    note: 'Structure programmée — distincte de la pratique reconstruite. Muscles = banque, pas intitulés libres.',
    templateCount: templates.length,
    templates: templates.map((t) => ({
      dayKey: t.dayKey,
      name: t.name,
      focus: t.focus,
      exerciseCount: t.exerciseCount,
      strengthExerciseCount: t.strengthExerciseCount,
      plannedReps: t.plannedReps,
      plannedSets: t.plannedSets,
      exerciseKeys: t.exerciseKeys,
      cardioKeys: t.cardioKeys,
      muscleKeys: t.muscleKeys,
      muscleProfile: t.muscleProfile,
      modalities: t.modalities
    })),
    relations,
    families
  };
}
