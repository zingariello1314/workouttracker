import { useMemo } from 'react';
import { buildRecapCrossCoachAggregate } from '../utils/sport/recapCrossCoachAggregate';
import { computeRecapCrossCoachInsights } from '../utils/sport/recapCrossCoachInsights';
import { useRecapCrossCoachNutrition } from './useRecapCrossCoachNutrition';
import { useRecapCrossCoachGarmin } from './useRecapCrossCoachGarmin';

const EMPTY_COACH = {
  aggregate: null,
  engine: null,
  nutritionLoading: false,
  garminLoading: false,
  trainingLineParams: { days: '0', reps: '0', vol: '0', distinct: 0 },
  bodyLine: { k: 'recap.crossCoach.pillar.bodyLine.none', p: {} },
  nutritionLineKey: 'recap.crossCoach.pillar.nutritionLine.loading'
};

/**
 * Agrégats « coach transversal » + insights pour la carte synthèse Récap (~28 j).
 */
export function useRecapSynthesisCoach({ snapshot, assessment, activeProgram, profileQuestionnaireRaw }) {
  const enabled = Boolean(assessment?.window28);
  const nutritionPartial = useRecapCrossCoachNutrition({ enabled });
  const win = assessment?.window28;
  const garminPartial = useRecapCrossCoachGarmin({
    startYmd: win?.startYmd,
    endYmd: win?.endYmd,
    enabled: enabled && Boolean(win?.startYmd && win?.endYmd)
  });

  const aggregate = useMemo(() => {
    if (!enabled) return null;
    return buildRecapCrossCoachAggregate({
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
    });
  }, [
    enabled,
    snapshot,
    assessment,
    activeProgram,
    profileQuestionnaireRaw,
    nutritionPartial,
    garminPartial
  ]);

  const engine = useMemo(
    () => (aggregate ? computeRecapCrossCoachInsights(aggregate) : null),
    [aggregate]
  );

  const nutritionLoading = nutritionPartial.status === 'loading';
  const garminLoading = garminPartial.status === 'loading';

  const trainingLineParams = useMemo(() => {
    const f = aggregate?.fitness || {};
    return {
      days: String(f.activeDays28 ?? 0),
      reps: String(f.totalReps28 ?? 0),
      vol: String(f.volumeKgRepsSum28 ?? 0),
      distinct: Number(f.distinctExercisesChecked28 ?? 0) || 0
    };
  }, [aggregate]);

  const bodyLine = useMemo(() => {
    const w = aggregate?.body?.latestWeightKg;
    if (w != null && Number.isFinite(Number(w))) {
      return { k: 'recap.crossCoach.pillar.bodyLine.weight', p: { w: String(w) } };
    }
    return { k: 'recap.crossCoach.pillar.bodyLine.none', p: {} };
  }, [aggregate]);

  const nutritionLineKey = !enabled || nutritionLoading
    ? 'recap.crossCoach.pillar.nutritionLine.loading'
    : (aggregate?.nutrition?.daysWithLoggedMeals28 || 0) > 0
      ? 'recap.crossCoach.pillar.nutritionLine.days'
      : 'recap.crossCoach.pillar.nutritionLine.empty';

  if (!enabled) return EMPTY_COACH;

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
