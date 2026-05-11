/**
 * Résout le plan pyramide effectif : priorité dailyVariations > modèle programme (pyramidTemplate).
 * @module services/trainingPatterns/resolveExercisePyramidPattern
 */

import {
  normalizeTrainingPattern,
  buildPyramidSuggestions,
  buildFullPyramidSteps,
  buildAscendingSteps,
  pickSuggestionClosestToVolume,
  suggestRestSeconds,
  PYRAMID_PATTERN_TYPES
} from './pyramidEngine';
import { parseStraightSetSeries, resolveObservedMaxReps } from './pyramidUserSignals';

/**
 * @param {object|null|undefined} tpl
 * @returns {{ enabled: boolean, preset: string, customPeak?: number, customMode?: string }}
 */
export function normalizePyramidTemplate(tpl) {
  if (!tpl || typeof tpl !== 'object') return { enabled: false, preset: 'off' };
  const enabled = Boolean(tpl.enabled);
  const preset = String(tpl.preset || 'auto').toLowerCase();
  const customPeak = tpl.customPeak != null ? Math.max(1, Math.min(25, Math.floor(Number(tpl.customPeak) || 1))) : undefined;
  const customMode = tpl.customMode === 'ascending' ? 'ascending' : 'full';
  return { enabled, preset: enabled ? preset : 'off', customPeak, customMode };
}

/**
 * @param {{
 *   dailyVariations: object|null|undefined,
 *   dateStr: string,
 *   exercise: { id: number|string, name?: string, series?: string, pyramidTemplate?: object },
 *   records?: Array<object>,
 *   meanSessionTotal?: number|null,
 *   sessionsPerWeek?: number|null
 * }} ctx
 * @returns {object|null} pattern normalisé
 */
export function resolveExercisePyramidPattern(ctx) {
  const { dailyVariations, dateStr, exercise, records = [], meanSessionTotal = null, sessionsPerWeek = null } =
    ctx || {};
  if (!exercise || exercise.id == null || !dateStr) return null;

  const idStr = String(exercise.id);
  const fromDaily = dailyVariations?.[dateStr]?.exerciseTrainingPatterns?.[idStr];
  if (fromDaily && Array.isArray(fromDaily.steps) && fromDaily.steps.length > 0) {
    return normalizeTrainingPattern(fromDaily);
  }

  const tpl = normalizePyramidTemplate(exercise.pyramidTemplate);
  if (!tpl.enabled || tpl.preset === 'off') return null;

  const straightSets = parseStraightSetSeries(exercise.series || '');
  const observedMax = resolveObservedMaxReps(records, {
    programExerciseId: exercise.id,
    exerciseName: exercise.name
  });

  const suggestions = buildPyramidSuggestions({
    observedMax,
    meanSessionTotal,
    sessionsPerWeek,
    straightSets
  });

  if (tpl.preset === 'custom') {
    const peak = tpl.customPeak != null ? tpl.customPeak : 5;
    const mode = tpl.customMode === 'ascending' ? 'ascending' : 'full';
    const steps = mode === 'ascending' ? buildAscendingSteps(peak) : buildFullPyramidSteps(peak);
    const patternType =
      mode === 'ascending' ? PYRAMID_PATTERN_TYPES.ASCENDING : PYRAMID_PATTERN_TYPES.FULL;
    const rest = suggestRestSeconds(patternType, peak);
    return normalizeTrainingPattern({
      patternType,
      steps,
      rounds: 1,
      label: `Pyramide perso (programme) pic ${peak}`,
      source: 'program_pyramid_template',
      ...rest
    });
  }

  if (tpl.preset === 'auto') {
    const picked = pickSuggestionClosestToVolume(suggestions, straightSets);
    if (!picked) return null;
    return normalizeTrainingPattern({
      patternType: picked.patternType,
      steps: picked.steps,
      rounds: picked.rounds || 1,
      restBetweenStepsSec: picked.restBetweenStepsSec,
      restBetweenRoundsSec: picked.restBetweenRoundsSec,
      restAfterPeakSec: picked.restAfterPeakSec,
      label: `${picked.label} (auto volume)`,
      source: 'program_pyramid_template'
    });
  }

  const byPreset = {
    light: suggestions[0],
    ascending: suggestions[1],
    full: suggestions[2]
  };
  const picked = byPreset[tpl.preset] || suggestions[1];
  if (!picked) return null;
  return normalizeTrainingPattern({
    patternType: picked.patternType,
    steps: picked.steps,
    rounds: picked.rounds || 1,
    restBetweenStepsSec: picked.restBetweenStepsSec,
    restBetweenRoundsSec: picked.restBetweenRoundsSec,
    restAfterPeakSec: picked.restAfterPeakSec,
    label: `${picked.label} (programme)`,
    source: 'program_pyramid_template'
  });
}
