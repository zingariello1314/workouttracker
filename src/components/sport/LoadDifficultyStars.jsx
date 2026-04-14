import React from 'react';
import { intensityCoeffToStarCount } from '../../utils/trainingLoadUtils';

/**
 * Affiche 1–5 étoiles selon le coefficient de charge (réglage onglet Exercices).
 */
const LoadDifficultyStars = ({ coeff, className = '', title }) => {
  const c = Number(coeff);
  const n = intensityCoeffToStarCount(Number.isFinite(c) ? c : 1);
  const tip =
    title ||
    (Number.isFinite(c)
      ? `Charge calendrier ×${Math.round(c * 100) / 100} (${n}/5)`
      : `Charge calendrier (${n}/5)`);

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-amber-400 tracking-tight select-none ${className}`}
      title={tip}
      aria-label={tip}
    >
      <span className="text-sm" aria-hidden>
        {'★'.repeat(n)}
      </span>
      <span className="text-sm text-slate-600" aria-hidden>
        {'☆'.repeat(5 - n)}
      </span>
    </span>
  );
};

export default LoadDifficultyStars;
