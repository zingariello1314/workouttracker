/**
 * Nuance d'intention probable (Phase 2D) — feature flag obligatoire.
 */

export const TRAINING_INTENT_CONFIDENCE_MIN = 0.75;

/**
 * @param {object|null|undefined} snapshot
 * @returns {boolean}
 */
export function isTrainingIntentClassifierEnabled(snapshot) {
  return snapshot?.trainingPrefs?.enableTrainingIntentClassifier === true;
}

/**
 * Enrichit un ProgressionInsight avec une formulation prudente (si flag actif).
 * @param {import('./volumeProgressionEngine.js').ProgressionInsight} insight
 * @param {object} [context]
 * @returns {import('./volumeProgressionEngine.js').ProgressionInsight & { intentLabel?: string }}
 */
export function classifyTrainingIntent(insight, context = {}) {
  if (!insight || insight.confidence < TRAINING_INTENT_CONFIDENCE_MIN) {
    return { ...insight, intentLabel: undefined };
  }

  const multiExoDeload = context.multiExoVolumeDrop === true;
  const type = insight.progressionType;

  const labels = {
    strength: 'possible orientation force',
    hypertrophy: 'possible orientation hypertrophie / endurance musculaire',
    volume: 'surcharge par le volume',
    technical: 'possible travail technique ou contrôle',
    deload: 'deload probable',
    fatigue_accumulated: 'fatigue accumulée possible',
    stall: 'plateau de performance',
    regression: 'baisse à surveiller',
    neutral: ''
  };

  let intentLabel = labels[type] || '';
  if (multiExoDeload && (type === 'regression' || type === 'stall')) {
    intentLabel = 'deload probable sur plusieurs exercices';
  }

  let explanation = insight.explanation || '';
  if (intentLabel && context.applyWording !== false) {
    explanation = `${explanation} (${intentLabel})`.trim();
  }

  return {
    ...insight,
    intentLabel: intentLabel || undefined,
    explanation
  };
}

/**
 * Applique le classifieur sur une liste si le flag est actif.
 * @param {import('./volumeProgressionEngine.js').ProgressionInsight[]} insights
 * @param {object|null|undefined} snapshot
 * @param {object} [context]
 */
export function applyTrainingIntentToInsights(insights, snapshot, context = {}) {
  if (!isTrainingIntentClassifierEnabled(snapshot) || !Array.isArray(insights)) {
    return insights || [];
  }
  return insights.map((insight) => classifyTrainingIntent(insight, context));
}
