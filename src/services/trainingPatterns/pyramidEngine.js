/**
 * Moteur pyramide (pur) : séquences, volumes, repos indicatifs, suggestions.
 * @module services/trainingPatterns/pyramidEngine
 */

export const PYRAMID_PATTERN_TYPES = {
  ASCENDING: 'pyramid_ascending',
  FULL: 'pyramid_full',
  LIGHT: 'pyramid_light'
};

/**
 * @param {number} peak
 * @returns {number[]}
 */
export function buildAscendingSteps(peak) {
  const p = Math.max(1, Math.floor(Number(peak) || 1));
  return Array.from({ length: p }, (_, i) => i + 1);
}

/**
 * Pyramide complète 1..n..1 (n répété une seule fois au sommet).
 * @param {number} peak
 * @returns {number[]}
 */
export function buildFullPyramidSteps(peak) {
  const p = Math.max(1, Math.floor(Number(peak) || 1));
  const up = buildAscendingSteps(p);
  if (p <= 1) return up;
  const down = Array.from({ length: p - 1 }, (_, i) => p - 1 - i);
  return [...up, ...down];
}

/**
 * @param {number[]} steps
 * @param {number} [rounds=1]
 */
export function sumStepsReps(steps, rounds = 1) {
  const r = Math.max(1, Math.floor(Number(rounds) || 1));
  if (!Array.isArray(steps) || steps.length === 0) return 0;
  const perRound = steps.reduce((a, b) => a + (Number(b) || 0), 0);
  return Math.round(perRound * r);
}

/**
 * Heuristique : séries droites stables (sets × reps) → fourchette de max plausible en tractions/poids corps.
 * @param {{ sets: number, repsPerSet: number }} param
 * @returns {{ min: number, max: number, point: number }}
 */
export function estimateMaxBandFromStraightSets({ sets, repsPerSet }) {
  const s = Math.max(1, Math.floor(Number(sets) || 1));
  const r = Math.max(1, Math.floor(Number(repsPerSet) || 1));
  const volume = s * r;
  const low = Math.round(r + volume / (s + 4));
  const high = Math.round(r * 2.15 + volume / (s + 0.75));
  const point = Math.round((low + high) / 2);
  return {
    min: Math.max(r + 1, low),
    max: Math.max(high, low + 2),
    point: Math.max(r + 1, point)
  };
}

/**
 * Sommet « raisonnable » à partir d'un max observé ou estimé (ratio ~ RPE sous-max).
 * @param {number} observedOrEstimatedMax
 * @param {{ ratio?: number, minPeak?: number, maxPeak?: number }} [options]
 */
export function clampPeakFromMax(observedOrEstimatedMax, options = {}) {
  const { ratio = 0.72, minPeak = 3, maxPeak = 12 } = options;
  const om = Math.max(2, Math.floor(Number(observedOrEstimatedMax) || 5));
  const raw = Math.round(om * ratio);
  return Math.min(maxPeak, Math.max(minPeak, raw));
}

/**
 * Repos indicatifs (secondes) — calibrés prudemment pour tractions / calisthenics.
 * @param {string} patternType
 * @param {number} peak
 */
export function suggestRestSeconds(patternType, peak) {
  const p = Math.max(1, Math.floor(Number(peak) || 1));
  const intraBase = 35 + p * 8;
  const intra = Math.min(150, Math.max(25, intraBase));
  const inter = patternType === PYRAMID_PATTERN_TYPES.ASCENDING ? intra + 45 : intra + 75;
  const afterPeak =
    patternType === PYRAMID_PATTERN_TYPES.FULL || patternType === PYRAMID_PATTERN_TYPES.LIGHT
      ? Math.min(180, 60 + p * 12)
      : null;
  return {
    restBetweenStepsSec: intra,
    restBetweenRoundsSec: inter,
    restAfterPeakSec: afterPeak
  };
}

/**
 * @param {object} raw
 * @returns {object|null} pattern normalisé ou null
 */
export function normalizeTrainingPattern(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.patternType !== PYRAMID_PATTERN_TYPES.ASCENDING &&
      raw.patternType !== PYRAMID_PATTERN_TYPES.FULL &&
      raw.patternType !== PYRAMID_PATTERN_TYPES.LIGHT) {
    return null;
  }
  const steps = Array.isArray(raw.steps) ? raw.steps.map((n) => Math.max(0, Math.floor(Number(n) || 0))).filter((n) => n > 0) : [];
  if (steps.length === 0) return null;
  const rounds = Math.max(1, Math.floor(Number(raw.rounds) || 1));
  const peak = Math.max(...steps);
  const rest = raw.restBetweenStepsSec != null
    ? {
        restBetweenStepsSec: Math.max(10, Math.floor(Number(raw.restBetweenStepsSec) || 45)),
        restBetweenRoundsSec: Math.max(30, Math.floor(Number(raw.restBetweenRoundsSec) || 90)),
        restAfterPeakSec: raw.restAfterPeakSec != null ? Math.max(0, Math.floor(Number(raw.restAfterPeakSec))) : null
      }
    : suggestRestSeconds(raw.patternType, peak);

  return {
    patternType: raw.patternType,
    peak,
    steps,
    rounds,
    totalReps: sumStepsReps(steps, rounds),
    ...rest,
    source: raw.source || 'defis_pyramid_v1',
    createdAt: raw.createdAt || new Date().toISOString(),
    label: typeof raw.label === 'string' ? raw.label : ''
  };
}

/**
 * Génère 2–3 propositions + métadonnées pour l’UI.
 * @param {{
 *   observedMax: number|null,
 *   meanSessionTotal: number|null,
 *   sessionsPerWeek: number|null,
 *   straightSets: { sets: number, repsPerSet: number }|null
 * }} input
 */
export function buildPyramidSuggestions(input) {
  const {
    observedMax = null,
    meanSessionTotal = null,
    sessionsPerWeek = null,
    straightSets = null
  } = input || {};

  let refMax = observedMax != null && Number.isFinite(observedMax) ? Math.floor(observedMax) : null;
  if (refMax == null && straightSets) {
    refMax = estimateMaxBandFromStraightSets(straightSets).point;
  }
  if (refMax == null) refMax = 8;

  const freq = sessionsPerWeek != null && Number.isFinite(sessionsPerWeek) ? Math.max(1, sessionsPerWeek) : 3;
  const volumeHint = meanSessionTotal != null && Number.isFinite(meanSessionTotal) ? meanSessionTotal : null;

  const ratioLight = freq >= 4 ? 0.62 : 0.68;
  const ratioStandard = 0.72;
  const ratioAggressive = freq <= 2 ? 0.82 : 0.78;

  const peakLight = clampPeakFromMax(refMax, { ratio: ratioLight, minPeak: 3, maxPeak: 8 });
  const peakStd = clampPeakFromMax(refMax, { ratio: ratioStandard, minPeak: 4, maxPeak: 10 });
  const peakHard = clampPeakFromMax(refMax, { ratio: ratioAggressive, minPeak: 5, maxPeak: 12 });

  const candidates = [
    {
      id: 'light',
      label: 'Pyramide légère (pic modéré)',
      patternType: PYRAMID_PATTERN_TYPES.LIGHT,
      peak: Math.max(3, peakLight),
      steps: buildFullPyramidSteps(Math.max(3, peakLight)),
      intent: 'Forme complète 1..n..1 avec un pic conservateur (moins dur qu’une full « challenge »).'
    },
    {
      id: 'ascending',
      label: 'Pyramide montante',
      patternType: PYRAMID_PATTERN_TYPES.ASCENDING,
      peak: peakStd,
      steps: buildAscendingSteps(peakStd),
      intent: 'Montée progressive, échauffement naturel, intensité en fin de série.'
    },
    {
      id: 'full',
      label: 'Pyramide complète',
      patternType: PYRAMID_PATTERN_TYPES.FULL,
      peak: peakHard,
      steps: buildFullPyramidSteps(peakHard),
      intent: 'Volume plus élevé — à utiliser quand tu dors bien et que la technique reste stricte.'
    }
  ];

  return candidates.map((c) => {
    const rounds = 1;
    const totalReps = sumStepsReps(c.steps, rounds);
    const rest = suggestRestSeconds(c.patternType, c.peak);
    const vsHabit =
      volumeHint != null && volumeHint > 0
        ? Math.round(((totalReps - volumeHint) / volumeHint) * 100)
        : null;

    let volumeNote = '';
    if (vsHabit != null) {
      if (vsHabit > 25) volumeNote = `Environ +${vsHabit}% vs ton volume moyen récent sur cet exercice.`;
      else if (vsHabit < -15) volumeNote = `Environ ${vsHabit}% vs ton volume moyen récent (séance plus légère).`;
      else volumeNote = 'Proche de ton volume habituel.';
    }

    return {
      ...c,
      rounds,
      totalReps,
      ...rest,
      volumeNote
    };
  });
}

/**
 * Choisit la suggestion dont le volume total est le plus proche des séries droites du programme.
 * @param {Array<{ totalReps?: number }>} suggestions
 * @param {{ sets: number, repsPerSet: number }|null} straightSets
 */
export function pickSuggestionClosestToVolume(suggestions, straightSets) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null;
  if (!straightSets || !straightSets.sets || !straightSets.repsPerSet) {
    return suggestions[1] || suggestions[0];
  }
  const target = Math.max(1, straightSets.sets * straightSets.repsPerSet);
  return suggestions.reduce((best, cur) => {
    const tr = Number(cur?.totalReps) || 0;
    const br = Number(best?.totalReps) || 0;
    const d = Math.abs(tr - target);
    const bd = Math.abs(br - target);
    return d < bd ? cur : best;
  }, suggestions[0]);
}

/**
 * Chaîne compacte type « 1-2-3-4-3-2-1 »
 * @param {number[]} steps
 * @param {number} [maxDisplay=28]
 */
export function formatStepsDash(steps, maxDisplay = 28) {
  if (!Array.isArray(steps) || steps.length === 0) return '';
  const slice = steps.length > maxDisplay ? [...steps.slice(0, maxDisplay - 1), '…'] : steps;
  return slice.join('-');
}
