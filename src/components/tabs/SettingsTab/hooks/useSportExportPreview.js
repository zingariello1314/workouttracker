/**
 * Aperçu export Sport — charge le contexte programme (IndexedDB) + compteurs nutrition/Garmin.
 * @module components/tabs/SettingsTab/hooks/useSportExportPreview
 */

import { useEffect, useMemo, useState } from 'react';
import {
  loadSportProgramContext,
  buildSportExportPreview
} from '../utils/sportExportBundle';
import { resolveLatestProgramContext } from '../../../../utils/programVersionUtils';
import {
  buildGarminDailyIndex,
  buildGarminExportSummary
} from '../utils/garminExportSummary';

/**
 * @param {Record<string, unknown>} data - Données workout
 * @param {string} storageKey
 * @param {object|null} currentUser
 * @param {{ exportGarminData?: () => Promise<object>, exportNutritionData?: () => Promise<object> }} extras
 */
export function useSportExportPreview(
  data,
  storageKey,
  currentUser,
  { exportGarminData = null, exportNutritionData = null, liveProgramContext = null } = {}
) {
  const [programContext, setProgramContext] = useState(null);
  const [ctxLoaded, setCtxLoaded] = useState(false);
  const [garminSummary, setGarminSummary] = useState(null);
  const [garminDailyIndex, setGarminDailyIndex] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setCtxLoaded(false);
    loadSportProgramContext(storageKey).then((ctx) => {
      if (!cancelled) {
        setProgramContext(ctx);
        setCtxLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    let cancelled = false;
    if (!exportGarminData) return undefined;

    exportGarminData()
      .then((garmin) => {
        if (cancelled || !garmin) return;
        setGarminSummary(buildGarminExportSummary(garmin));
        setGarminDailyIndex(buildGarminDailyIndex(garmin));
      })
      .catch(() => {
        if (!cancelled) {
          setGarminSummary(buildGarminExportSummary(null));
          setGarminDailyIndex([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [exportGarminData]);

  useEffect(() => {
    let cancelled = false;
    if (!exportNutritionData) return undefined;

    exportNutritionData()
      .then((nutrition) => {
        if (cancelled || !nutrition) return;
        setNutritionSummary({
          dailyMeals: nutrition.metadata?.totalDailyMeals ?? nutrition.dailyMeals?.length ?? 0,
          meals: nutrition.metadata?.totalMeals ?? nutrition.meals?.length ?? 0,
          programs: nutrition.metadata?.totalPrograms ?? nutrition.programs?.length ?? 0,
          favoriteFoods: nutrition.metadata?.totalFavoriteFoods ?? nutrition.favoriteFoods?.length ?? 0,
          activeProgram: nutrition.programs?.find((p) => p.isActive)?.name || null
        });
      })
      .catch(() => {
        if (!cancelled) {
          setNutritionSummary({ dailyMeals: 0, meals: 0, programs: 0, favoriteFoods: 0, activeProgram: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [exportNutritionData]);

  const sportPreview = useMemo(() => {
    if (!ctxLoaded) return null;
    const merged = resolveLatestProgramContext(programContext, liveProgramContext);
    return buildSportExportPreview(data || {}, merged, currentUser);
  }, [data, programContext, liveProgramContext, currentUser, ctxLoaded]);

  return {
    sportPreview,
    sportPreviewLoading: !ctxLoaded,
    garminSummary,
    garminDailyIndex,
    nutritionSummary
  };
}

export default useSportExportPreview;
