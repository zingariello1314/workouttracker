/**
 * ComplianceDisplay - Composant d'Affichage de Conformité Nutritionnelle
 * 
 * Affiche la valeur actuelle, la cible, l'écart et le pourcentage de conformité.
 * Utilisé pour afficher les macros, calories, etc. avec leur conformité au programme.
 * 
 * @module components/tabs/nutrition/components/ComplianceDisplay
 */

import React from 'react';

/**
 * Composant ComplianceDisplay
 * 
 * @param {Object} props
 * @param {number} props.actual - Valeur actuelle
 * @param {number} props.target - Valeur cible
 * @param {string} props.unit - Unité de mesure (ex: 'g', 'kcal')
 * @param {boolean} props.showTarget - Afficher la cible et l'écart (défaut: true)
 */
const ComplianceDisplay = ({ actual, target, unit = '', showTarget = true }) => {
  const diff = actual - target;
  const percent = target > 0 ? Math.round((actual / target) * 100) : 0;
  const isOver = diff > 0;
  const isUnder = diff < 0;
  const isGood = Math.abs(diff) <= target * 0.1; // ±10% = bon

  return (
    <div className="flex items-center gap-2">
      <span className="text-white font-semibold">
        {actual.toLocaleString('fr-FR')} {unit}
      </span>
      {showTarget && (
        <>
          <span className="text-slate-400">/</span>
          <span className="text-slate-300">{target.toLocaleString('fr-FR')} {unit}</span>
          <span className={`text-sm font-medium ${
            isGood ? 'text-green-400' : isOver ? 'text-orange-400' : 'text-red-400'
          }`}>
            ({isOver ? '+' : ''}{diff.toLocaleString('fr-FR')} {unit})
          </span>
          <span className="text-slate-500 text-sm">({percent}%)</span>
        </>
      )}
    </div>
  );
};

export default ComplianceDisplay;

