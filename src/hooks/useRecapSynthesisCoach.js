import { useMemo } from 'react';
import { buildRecapCrossCoachAggregate } from '../utils/sport/recapCrossCoachAggregate';
import { computeRecapCrossCoachInsights } from '../utils/sport/recapCrossCoachInsights';
import { useRecapCrossCoachNutrition } from './useRecapCrossCoachNutrition';
import { useRecapCrossCoachGarmin } from './useRecapCrossCoachGarmin';

/**
 * Agrégats « coach transversal » + insights pour la carte synthèse Récap (~28 j).
 */
export function useRecapSynthesisCoach({ snapshot, assessment, activeProgram, profileQuestionnaireRaw }) {
  const nutritionPartial = useRecapCrossCoachNutrition({ enabled: true });
  const win = assessment?.window28;
  const garminPartial = useRecapCrossCoachGarmin({
    startYmd: win?.startYmd,
    endYmd: win?.endYmd,
    enabled: Boolean(win?.startYmd && win?.endYmd)
  });

  const aggregate = useMemo(
    () =>
      buildRecapCrossCoachAggregate({
        snapshot,
        assessment,
        activeProgram,
        profileQuestionnaireRaw,
        nutritionPartial:
          nutritionPartial.status === 'loading'
            ? { status: 'loading' }
            : nutritionPartial.status === 'skipped'
              ? { status: 'skipped' }
              : { status: 'ready', ...nutritionPartial },
        garminPartial:
          garminPartial.status === 'loading'
            ? { status: 'loading' }
            : garminPartial.status === 'skipped'
              ? { status: 'skipped' }
              : { status: 'ready', ...garminPartial }
      }),
    [snapshot, assessment, activeProgram, profileQuestionnaireRaw, nutritionPartial, garminPartial]
  );

  const engine = useMemo(() => computeRecapCrossCoachInsights(aggregate), [aggregate]);

  const nutritionLoading = nutritionPartial.status === 'loading';
  const garminLoading = garminPartial.status === 'loading';

  const trainingLineParams = useMemo(() => {
    const f = aggregate.fitness || {};
    return {
      days: String(f.activeDays28 ?? 0),
      reps: String(f.totalReps28 ?? 0),
      vol: String(f.volumeKgRepsSum28 ?? 0),
      distinct: Number(f.distinctExercisesChecked28 ?? 0) || 0
    };
  }, [aggregate]);

  const bodyLine = useMemo(() => {
    const w = aggregate.body?.latestWeightKg;
    if (w != null && Number.isFinite(Number(w))) {
      return { k: 'recap.crossCoach.pillar.bodyLine.weight', p: { w: String(w) } };
    }
    return { k: 'recap.crossCoach.pillar.bodyLine.none', p: {} };
  }, [aggregate]);

  const nutritionLineKey = nutritionLoading
    ? 'recap.crossCoach.pillar.nutritionLine.loading'
    : (aggregate.nutrition?.daysWithLoggedMeals28 || 0) > 0
      ? 'recap.crossCoach.pillar.nutritionLine.days'
      : 'recap.crossCoach.pillar.nutritionLine.empty';

  return {
    aggregate,
    engine,
    nutritionLoading,
    garminLoading,
    trainingLineParams,
    bodyLine,
    nutritionLineKey
  };
}
