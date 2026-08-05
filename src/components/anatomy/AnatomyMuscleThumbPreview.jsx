import React, { useMemo } from 'react';
import AnatomyBankCardPreview from './AnatomyBankCardPreview';
import { resolveAnatomyMusclePreviewAnatomy } from '../../utils/anatomy/resolveAnatomyMusclePreviewAnatomy';

/**
 * Aperçu 3D statique sur une ligne « Muscles de cette famille »
 * (même format portrait que la banque d’exercices).
 */
export default function AnatomyMuscleThumbPreview({ muscle, className = '' }) {
  const anatomy = useMemo(() => resolveAnatomyMusclePreviewAnatomy(muscle), [muscle]);

  return (
    <AnatomyBankCardPreview
      precomputedAnatomy={anatomy}
      layout="anatomyRow"
      className={className}
    />
  );
}
