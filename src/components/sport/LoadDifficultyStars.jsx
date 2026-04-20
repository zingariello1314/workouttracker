import React from 'react';
import { intensityCoeffToStarCount } from '../../utils/trainingLoadUtils';

/**
 * Affiche 1–5 (ou 1–10) étoiles selon le coefficient de charge (réglage onglet Exercices).
 * @param {5|10} [maxStars=5]
 */
const LoadDifficultyStars = ({ coeff, className = '', title, maxStars = 5 }) => {
  const c = Number(coeff);
  const base5 = intensityCoeffToStarCount(Number.isFinite(c) ? c : 1);
  const n =
    maxStars === 10
      ? Math.max(1, Math.min(10, Math.round(1 + ((base5 - 1) * 9) / 4)))
      : base5;
  const max = maxStars === 10 ? 10 : 5;
  const tip =
    title ||
    (Number.isFinite(c)
      ? `Charge calendrier ×${Math.round(c * 100) / 100} (${n}/${max})`
      : `Charge calendrier (${n}/${max})`);

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
        {'☆'.repeat(max - n)}
      </span>
    </span>
  );
};

export default LoadDifficultyStars;
