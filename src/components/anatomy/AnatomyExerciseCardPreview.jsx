import React, { useMemo } from 'react';
import { getExerciseDatabaseHit, getExerciseDatabaseKey } from '../../utils/exerciseHeroContent';
import AnatomyBankCardPreview from './AnatomyBankCardPreview';

/** Réf cardio banque (`cardioExerciseCatalog`) : évite un « hit » ponctuel sur un homonyme dans `exerciseDatabase` (synonymes « corde », « vma », etc.). */
function shouldUseBareExerciseMuscles(exercise) {
  if (!exercise) return false;
  if (exercise.isCardioReference === true) return true;
  const id = exercise.id;
  return typeof id === 'string' && id.startsWith('cardio_');
}

/** Toutes les fiches `cardio_run_*` partagent l’aperçu 3D du footing (même hash .webp / même mesh). */
const CARDIO_RUN_PREVIEW_KEY = 'cardio_run_easy';

function resolveCardioPreviewDatabaseKey(exercise) {
  const id = exercise?.id != null ? String(exercise.id) : '';
  if (id.startsWith('cardio_run_')) return CARDIO_RUN_PREVIEW_KEY;
  if (id.startsWith('cardio_')) return id;
  return null;
}

/** Aperçu 3D sur carte exercice (données référentiel + objet programme). */
export default function AnatomyExerciseCardPreview({ exercise, previewLayout = 'compact' }) {
  const bareMuscles = useMemo(() => shouldUseBareExerciseMuscles(exercise), [exercise]);
  const dbHit = useMemo(
    () => (bareMuscles ? null : getExerciseDatabaseHit(exercise)),
    [exercise, bareMuscles]
  );

  const primaryMuscles = bareMuscles
    ? exercise?.primaryMuscles ?? []
    : dbHit?.primaryMuscles ?? exercise?.primaryMuscles ?? [];
  const secondaryMuscles = bareMuscles
    ? exercise?.secondaryMuscles ?? []
    : dbHit?.secondaryMuscles ?? exercise?.secondaryMuscles ?? [];

  /** Aligné sur `anatomyPreviewManifest.mjs` : stem .webp inclut vue / tuning banque selon cette clé. */
  const exerciseDatabaseKey =
    resolveCardioPreviewDatabaseKey(exercise) ||
    getExerciseDatabaseKey(exercise) ||
    (typeof exercise?.id === 'string' && exercise.id.startsWith('cardio_') ? exercise.id : null);

  return (
    <AnatomyBankCardPreview
      primaryMuscles={primaryMuscles}
      secondaryMuscles={secondaryMuscles}
      mode="exercise"
      layout={previewLayout}
      exerciseDatabaseKey={exerciseDatabaseKey || undefined}
    />
  );
}
