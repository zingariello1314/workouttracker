import React, { useMemo } from 'react';
import { getExerciseDatabaseHit } from '../../utils/exerciseHeroContent';
import AnatomyBankCardPreview from './AnatomyBankCardPreview';

/** Aperçu 3D sur carte exercice (données référentiel + objet programme). */
export default function AnatomyExerciseCardPreview({ exercise }) {
  const dbHit = useMemo(() => getExerciseDatabaseHit(exercise), [exercise]);

  const primaryMuscles = dbHit?.primaryMuscles ?? exercise?.primaryMuscles ?? [];
  const secondaryMuscles = dbHit?.secondaryMuscles ?? exercise?.secondaryMuscles ?? [];

  return (
    <AnatomyBankCardPreview
      primaryMuscles={primaryMuscles}
      secondaryMuscles={secondaryMuscles}
      mode="exercise"
    />
  );
}
