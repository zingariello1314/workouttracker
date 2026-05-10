/**
 * Manifest des previews anatomie (vite-node uniquement).
 * Partagé par list-anatomy-preview-keys et render-anatomy-previews.
 */

import { exerciseDatabase } from '../src/data/exerciseDatabase.js';
import { CARDIO_REFERENCE_EXERCISES } from '../src/data/cardioExerciseCatalog.js';

const CARDIO_BY_ID = Object.fromEntries(
  CARDIO_REFERENCE_EXERCISES.map((ex) => [String(ex.id), ex])
);
import { stretchDatabase } from '../src/data/stretchDatabase.js';
import { resolveBankItemAnatomy } from '../src/utils/anatomy/resolveBankItemAnatomy.js';
import {
  anatomyRasterFileBase,
  buildAnatomyRasterSignature
} from '../src/utils/anatomy/anatomyPreviewRasterKey.js';

function collect(mode, rows) {
  const byKey = new Map();
  for (const row of rows) {
    const ctx =
      row.label.startsWith('exercise:') && mode === 'exercise'
        ? { exerciseDatabaseKey: row.label.slice('exercise:'.length) }
        : row.label.startsWith('stretch:') && mode === 'stretch'
          ? { stretchDatabaseKey: row.label.slice('stretch:'.length) }
          : undefined;
    const anatomy = resolveBankItemAnatomy(
      {
        primaryMuscles: row.primaryMuscles ?? [],
        secondaryMuscles: row.secondaryMuscles ?? []
      },
      mode,
      ctx
    );
    const stem = anatomyRasterFileBase(anatomy, mode);
    const signature = buildAnatomyRasterSignature(anatomy, mode);
    if (!byKey.has(stem)) {
      byKey.set(stem, { stem, signature, mode, examples: [] });
    }
    const entry = byKey.get(stem);
    if (entry.examples.length < 4) entry.examples.push(row.label);
  }
  return [...byKey.values()].sort((a, b) => a.stem.localeCompare(b.stem));
}

export function buildAnatomyPreviewManifest() {
const exerciseRowsDb = Object.entries(exerciseDatabase).map(([key, ex]) => ({
  label: `exercise:${key}`,
  primaryMuscles: ex.primaryMuscles,
  secondaryMuscles: ex.secondaryMuscles
}));

const exerciseRowsCardio = CARDIO_REFERENCE_EXERCISES.map((ex) => ({
  label: `exercise:${ex.id}`,
  primaryMuscles: ex.primaryMuscles,
  secondaryMuscles: ex.secondaryMuscles
}));

const exerciseRows = [...exerciseRowsDb, ...exerciseRowsCardio];

const stretchRows = Object.entries(stretchDatabase).map(([key, st]) => ({
    label: `stretch:${key}`,
    primaryMuscles: st.primaryMuscles,
    secondaryMuscles: st.secondaryMuscles
  }));

  const exercise = collect('exercise', exerciseRows);
  const stretch = collect('stretch', stretchRows);
  const uniqueStems = new Set([...exercise.map((e) => e.stem), ...stretch.map((s) => s.stem)]);

  return {
    summary: {
      uniquePreviewFilesTotal: uniqueStems.size,
      exerciseGroups: exercise.length,
      stretchGroups: stretch.length,
      destinationFolder: 'public/anatomy-previews',
      extension: '.webp'
    },
    exercise,
    stretch
  };
}

/** @param {string} label ex. exercise:pompes / stretch:respiration_nasale_lente */
export function getMusclesForExampleLabel(label) {
  const i = label.indexOf(':');
  if (i < 0) return { primaryMuscles: [], secondaryMuscles: [] };
  const kind = label.slice(0, i);
  const key = label.slice(i + 1);
  if (kind === 'exercise') {
    const ex = exerciseDatabase[key];
    if (ex) {
      return {
        primaryMuscles: ex.primaryMuscles || [],
        secondaryMuscles: ex.secondaryMuscles || []
      };
    }
    const cardio = CARDIO_BY_ID[String(key)];
    if (cardio) {
      return {
        primaryMuscles: cardio.primaryMuscles || [],
        secondaryMuscles: cardio.secondaryMuscles || []
      };
    }
    return { primaryMuscles: [], secondaryMuscles: [] };
  }
  if (kind === 'stretch') {
    const st = stretchDatabase[key];
    if (!st) return { primaryMuscles: [], secondaryMuscles: [] };
    return {
      primaryMuscles: st.primaryMuscles || [],
      secondaryMuscles: st.secondaryMuscles || []
    };
  }
  return { primaryMuscles: [], secondaryMuscles: [] };
}
