/**
 * Résumé pédagogique du champ « séries » issu des programmes (texte libre + parse partiel).
 *
 * @module exerciseSeriesSummary
 */

import { parseSeries, calculateAutoReps, detectExerciseUnit } from './exerciseCalculations';

/**
 * @param {Object} exercise — au minimum { series, name? }
 * @returns {{ headline: string, detail: string, setsCount: number|null, autoRepsTotal: number|null }}
 */
export function summarizeExerciseSeries(exercise) {
  const series = (exercise && exercise.series) || '';
  if (!series.trim()) {
    return {
      headline: '',
      detail: '',
      setsCount: null,
      autoRepsTotal: null
    };
  }

  const parsed = parseSeries(series);
  const autoReps = calculateAutoReps(series, { round: true });
  const unitInfo = detectExerciseUnit({ ...exercise, series });

  if (unitInfo?.isTimeBased) {
    return {
      headline: series.trim(),
      detail:
        parsed != null
          ? `${parsed.sets} séries × temps (chronomètre). Pour la charge calendrier, chaque seconde compte avec un petit coefficient afin de rester cohérent avec les reps « classiques ».`
          : 'Séance au chronomètre : la charge calendrier utilise le temps enregistré plutôt qu’un décompte de reps.',
      setsCount: parsed?.sets ?? null,
      autoRepsTotal: autoReps
    };
  }

  if (parsed != null && autoReps != null) {
    const range =
      parsed.maxReps !== parsed.minReps ? `${parsed.minReps}–${parsed.maxReps}` : String(parsed.minReps);
    return {
      headline: `${parsed.sets} séries × ${range} reps (cible programme)`,
      detail: `Total indicatif ≈ ${autoReps} répétitions (moyenne des plages du texte « ${series.trim()} »). C’est une lecture du programme, pas l’historique réalisé.`,
      setsCount: parsed.sets,
      autoRepsTotal: autoReps
    };
  }

  return {
    headline: series.trim(),
    detail:
      'Format de séries non standard (texte libre). Utilise la ligne programme telle quelle ; le détail exact peut être dans les notes ou l’onglet Programme.',
    setsCount: null,
    autoRepsTotal: autoReps
  };
}
