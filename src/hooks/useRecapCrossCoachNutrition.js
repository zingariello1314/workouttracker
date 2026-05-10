import { useEffect, useMemo, useState } from 'react';
import DateHelper from '../utils/dateHelper';
import { useNutritionData } from './useNutritionData';
import { useAuth } from '../context/AuthContext';

/**
 * Charge les signaux nutrition sur la même fenêtre 28 j que le Récap (locale).
 * @param {{ enabled?: boolean }} opts
 */
export function useRecapCrossCoachNutrition(opts = {}) {
  const { enabled = true } = opts;
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const { dbReady, getMealsByDateRange, getActiveProgram, getAllPrograms, calculateDailyTotals } =
    useNutritionData();

  const range = useMemo(() => {
    const endYmd = DateHelper.getTodayLocal();
    const startYmd = DateHelper.addDays(endYmd, -27);
    return { startYmd, endYmd };
  }, []);

  const [partial, setPartial] = useState(() => ({
    status: enabled ? 'loading' : 'skipped'
  }));

  useEffect(() => {
    if (!enabled) {
      setPartial({ status: 'skipped' });
      return;
    }
    if (!dbReady) {
      setPartial({ status: 'loading' });
      return;
    }

    let cancelled = false;
    const run = async () => {
      const { startYmd, endYmd } = range;
      try {
        const [meals, activeProgram, allPrograms] = await Promise.all([
          getMealsByDateRange(startYmd, endYmd),
          getActiveProgram(),
          getAllPrograms()
        ]);
        if (cancelled) return;

        const filterU = (row) =>
          row &&
          (userId == null || row.userId === userId || row.userId === undefined || row.userId === null);

        const mealsF = (meals || []).filter(filterU);

        const byDate = {};
        mealsF.forEach((m) => {
          const d = String(m.date || '').slice(0, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
          if (!byDate[d]) byDate[d] = [];
          byDate[d].push(m);
        });

        const dates = DateHelper.getDateRange(startYmd, endYmd);
        let daysWithLoggedMeals28 = 0;
        const complianceScores = [];
        const pctCal = [];
        const deltaCals = [];

        for (const d of dates) {
          const dayMeals = byDate[d] || [];
          if (dayMeals.length === 0) continue;
          daysWithLoggedMeals28 += 1;
          let totals;
          try {
            totals = calculateDailyTotals(dayMeals, activeProgram || null);
          } catch {
            /* ignore invalid day */
            continue;
          }
          const tc = Number(totals.targetCalories) || 0;
          const c = Number(totals.calories) || 0;
          if (tc > 50) {
            pctCal.push((c / tc) * 100);
            deltaCals.push(c - tc);
          }
          if (typeof totals.complianceScore === 'number' && Number.isFinite(totals.complianceScore)) {
            complianceScores.push(totals.complianceScore);
          }
        }

        const meanPctCaloriesVsTarget =
          pctCal.length > 0 ? pctCal.reduce((a, b) => a + b, 0) / pctCal.length : null;

        let calorieDeltaStdApprox = null;
        if (deltaCals.length >= 3) {
          const mu = deltaCals.reduce((a, b) => a + b, 0) / deltaCals.length;
          const variance =
            deltaCals.reduce((a, q) => a + (q - mu) ** 2, 0) / Math.max(1, deltaCals.length - 1);
          calorieDeltaStdApprox = Math.sqrt(variance);
        }

        const avgComplianceScore =
          complianceScores.length > 0
            ? complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length
            : null;

        setPartial({
          status: 'ready',
          daysWithLoggedMeals28,
          avgComplianceScore:
            avgComplianceScore != null ? Math.round(avgComplianceScore * 10) / 10 : null,
          meanPctCaloriesVsTarget:
            meanPctCaloriesVsTarget != null ? Math.round(meanPctCaloriesVsTarget * 10) / 10 : null,
          calorieDeltaStdApprox:
            calorieDeltaStdApprox != null ? Math.round(calorieDeltaStdApprox * 10) / 10 : null,
          programsOwnedCount: Array.isArray(allPrograms) ? allPrograms.length : 0
        });
      } catch {
        if (!cancelled) {
          setPartial({
            status: 'ready',
            daysWithLoggedMeals28: 0,
            avgComplianceScore: null,
            meanPctCaloriesVsTarget: null,
            calorieDeltaStdApprox: null,
            programsOwnedCount: 0
          });
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    dbReady,
    range.startYmd,
    range.endYmd,
    getMealsByDateRange,
    getActiveProgram,
    getAllPrograms,
    calculateDailyTotals,
    userId
  ]);

  return partial;
}
