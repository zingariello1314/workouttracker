/**
 * Ajustement budgets hebdo depuis historique (SPEC §14.5 — génération statique).
 */

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * @param {object} budgets — sortie buildWeeklyBudgets
 * @param {object} [trainingEvidence]
 * @param {object} [answers]
 */
export function applyBudgetFeedbackFromEvidence(budgets, trainingEvidence, answers = {}) {
  if (!budgets?.strengthFamilies) return budgets;
  const maturity = trainingEvidence?.maturity;
  if (!maturity || maturity === 'none') return budgets;

  const strength = { ...budgets.strengthFamilies };
  const feedback = [];
  const adj = trainingEvidence.adjustments || {};

  if (adj.adherenceVolumeCut || (trainingEvidence.regularityScore != null && trainingEvidence.regularityScore < 0.45)) {
    Object.keys(strength).forEach((k) => {
      strength[k] = round1((strength[k] || 0) * 0.9);
    });
    if (budgets.run?.kmTarget) {
      budgets = {
        ...budgets,
        run: {
          ...budgets.run,
          kmTarget: Math.round(budgets.run.kmTarget * 0.92)
        }
      };
    }
    feedback.push({
      signal: 'low_adherence',
      action: 'scale_budgets_0.9',
      reasonFr: 'Régularité en dessous de la cible — budgets semaine légèrement réduits.'
    });
  } else if (maturity === 'rich' && (trainingEvidence.regularityScore || 0) > 0.85) {
    const pri = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
    if (pri.includes('upper_body') || pri.includes('back')) {
      strength.pull = round1((strength.pull || 0) * 1.02);
    }
    if (pri.includes('lower_body') || pri.includes('legs')) {
      strength.legs = round1((strength.legs || 0) * 1.02);
    }
    feedback.push({
      signal: 'high_adherence',
      action: 'boost_priority_2pct',
      reasonFr: 'Bonne régularité — léger bonus sur les familles prioritaires du quiz.'
    });
  }

  if (trainingEvidence.restGap14 >= 10 && maturity !== 'none') {
    Object.keys(strength).forEach((k) => {
      strength[k] = round1((strength[k] || 0) * 0.95);
    });
    feedback.push({
      signal: 'rest_gap',
      action: 'scale_budgets_0.95',
      reasonFr: 'Peu d’activité récente — reprise prudente sur le volume.'
    });
  }

  return {
    ...budgets,
    strengthFamilies: strength,
    budgetFeedback: feedback
  };
}
