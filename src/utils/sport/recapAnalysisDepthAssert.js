/**
 * Assertions de profondeur analytique (plan R1 / R3).
 * Vérifie un résultat positif, pas seulement l'absence de mauvaises phrases.
 */

import { findingDepthLevel } from './recapAnalyticalFindings';

const DEFERRED = [
  /Momentum doit rapprocher/i,
  /il faudra examiner/i,
  /il faut également examiner/i,
  /la suite permettra de distinguer/i
];

/**
 * @param {string} text
 */
export function hasDeferredReasoningPhrase(text) {
  return DEFERRED.some((re) => re.test(String(text || '')));
}

/**
 * Texte de carte / Finding : au moins comparaison OU levier nommé + pas de dérobade.
 */
export function assertAnalyticalDepthPositive(text, { requireComparison = true } = {}) {
  const blob = String(text || '');
  const issues = [];
  if (hasDeferredReasoningPhrase(blob)) {
    issues.push('deferred_reasoning');
  }
  if (blob.trim().length < 60) {
    issues.push('too_thin');
  }
  const hasComparison =
    /contre|par rapport|vs|d'avant|précéd|tandis que|alors que|surtout|via |levier|fréquence|dose|séances comparables|même (fenêtre|période|intervalle)|en même temps|en parallèle|coexistent|coïncidence|hors planning|complétion|repère/i.test(
      blob
    );
  if (requireComparison && !hasComparison) {
    issues.push('no_comparison_or_driver');
  }
  const hasImplication =
    /indique|montre que|conséquence|levier|capacité|objectif|pas seulement|ce n'est pas|ce n’est pas/i.test(
      blob
    );
  return {
    ok: issues.length === 0,
    issues,
    hasComparison,
    hasImplication,
    levelHint: hasImplication ? 3 : hasComparison ? 2 : 1
  };
}

/**
 * @param {import('./recapAnalyticalFindings.js').AnalyticalFinding} finding
 * @param {number} [minLevel=2]
 */
export function assertFindingDepth(finding, minLevel = 2) {
  const level = findingDepthLevel(finding);
  const prose = [finding?.statement, finding?.interpretation, finding?.consequence]
    .filter(Boolean)
    .join(' ');
  const textCheck = assertAnalyticalDepthPositive(prose, { requireComparison: minLevel >= 2 });
  return {
    ok: level >= minLevel && textCheck.ok,
    level,
    minLevel,
    textCheck,
    forbiddenHit: (finding?.forbidden || []).some((f) =>
      new RegExp(String(f).slice(0, 24), 'i').test(prose)
    )
  };
}
