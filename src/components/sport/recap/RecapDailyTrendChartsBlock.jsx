import React, { useEffect, useMemo, useState } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { useGarminData } from '../../../hooks/useGarminData';
import { useAuth } from '../../../context/AuthContext';
import DenseDailyLineChart from '../charts/DenseDailyLineChart';
import { buildDenseDailyPoints, defaultActivityRange } from '../../../utils/sport/dailyDenseTimeSeries';
import {
  buildGarminCardioById,
  buildKmByDateFromRows,
  computeRunningVolumeTotals,
  mergeRunningSessionsWithGarmin
} from '../../../utils/sport/runningVolumeTruth';
import { aggregateLiftVolumeKgByDate } from '../../../utils/exerciseLoadVolume';
import {
  buildMergedStepsByDate,
  buildTotalStrengthRepsByDate,
  firstLiftVolumeDate,
  firstPositiveDateInMap,
  todayYmd
} from '../../../utils/sport/recapDailyChartData';

/**
 * Tendances quotidiennes pour le Récap (et réutilisable dans le Dashboard).
 * @param {{ compact?: boolean, layout?: 'stack'|'grid', chartHeight?: number }} props
 */
const RecapDailyTrendChartsBlock = ({ compact = false, layout = 'stack', chartHeight }) => {
  const { data, getCurrentData } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const { isAuthenticated } = useAuth();

  const [garminBundle, setGarminBundle] = useState(null);
  useEffect(() => {
    if (!dbReady || !isAuthenticated) {
      setGarminBundle(null);
      return;
    }
    let cancelled = false;
    loadAllData()
      .then((bundle) => {
        if (!cancelled) setGarminBundle(bundle);
      })
      .catch(() => {
        if (!cancelled) setGarminBundle(null);
      });
    return () => {
      cancelled = true;
    };
  }, [data, dbReady, loadAllData, isAuthenticated]);

  const chartModel = useMemo(() => {
    const snap = getCurrentData();
    const end = todayYmd();

    const runningRaw = Array.isArray(snap?.enduranceData?.sessions?.running)
      ? snap.enduranceData.sessions.running
      : [];
    const garminById = buildGarminCardioById(garminBundle?.activities?.cardio);
    const merged = mergeRunningSessionsWithGarmin(runningRaw, garminById);
    const { rows } = computeRunningVolumeTotals(merged, garminById, { period: 'all' });
    const kmByDate = buildKmByDateFromRows(rows);
    const runRange = defaultActivityRange(kmByDate, end);
    const runPoints = buildDenseDailyPoints(kmByDate, runRange.start, runRange.end);

    const repsByDate = buildTotalStrengthRepsByDate(snap);
    const repsRange = defaultActivityRange(repsByDate, end);
    const repsPoints = buildDenseDailyPoints(repsByDate, repsRange.start, repsRange.end);

    const volMap = aggregateLiftVolumeKgByDate(snap);
    const liftFirst = firstLiftVolumeDate(snap);
    const repsFirst = firstPositiveDateInMap(repsByDate);
    const dualStart = liftFirst || repsFirst || end;
    const dualEnd = end;
    const volPts = buildDenseDailyPoints(volMap, dualStart, dualEnd);
    const repPtsAligned = buildDenseDailyPoints(repsByDate, dualStart, dualEnd);

    const stepsMap = buildMergedStepsByDate(
      garminBundle?.dailyMetrics,
      snap?.enduranceData?.manualDailyWalkByDate
    );
    const stepsRange = defaultActivityRange(stepsMap, end);
    const stepsPoints = buildDenseDailyPoints(stepsMap, stepsRange.start, stepsRange.end);

    return {
      runPoints,
      repsPoints,
      volPts,
      repPtsAligned,
      stepsPoints
    };
  }, [data, getCurrentData, garminBundle]);

  const { runPoints, repsPoints, volPts, repPtsAligned, stepsPoints } = chartModel;

  const padClass = compact ? 'p-3' : 'p-4';
  const chartCardClass =
    'rounded-xl border border-[#0F4C5C]/45 bg-gradient-to-b from-slate-950/70 to-black p-3 shadow-[inset_0_0_24px_rgba(15,76,92,0.12)]';
  const h = chartHeight ?? (compact ? 160 : 200);
  const isGrid = layout === 'grid';

  const runChart = (
    <div className={chartCardClass}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-200/90">Course (km / jour)</h3>
      <DenseDailyLineChart
        seriesA={runPoints.map((p) => ({ date: p.date, value: p.value }))}
        metaA={{ label: 'km', color: '#38bdf8' }}
        valueFormatA={(v) => (Math.round(v * 100) / 100).toFixed(2)}
        height={h}
      />
    </div>
  );

  const repsChart = (
    <div className={chartCardClass}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-200/90">
        Reps totaux / jour
      </h3>
      <DenseDailyLineChart
        seriesA={repsPoints.map((p) => ({ date: p.date, value: p.value }))}
        metaA={{ label: 'reps', color: '#e879f9' }}
        height={h}
      />
    </div>
  );

  const volumeChart = (
    <div className={chartCardClass}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
        Volume (kg×reps) / jour
      </h3>
      <DenseDailyLineChart
        seriesA={volPts.map((p) => ({ date: p.date, value: p.value }))}
        metaA={{ label: 'kg×reps', color: '#34d399' }}
        valueFormatA={(v) => (Math.round(v * 10) / 10).toFixed(1)}
        height={h}
      />
    </div>
  );

  const stepsChart = (
    <div className={chartCardClass}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">Pas / jour</h3>
      <DenseDailyLineChart
        seriesA={stepsPoints.map((p) => ({ date: p.date, value: p.value }))}
        metaA={{ label: 'pas', color: '#fcd34d' }}
        height={h}
      />
    </div>
  );

  return (
    <section className={`rounded-xl border-2 border-[#0F4C5C]/70 bg-black ${padClass} space-y-4`}>
      {!compact ? (
        <div>
          <h2 className="text-sm font-semibold text-teal-100">Tendances quotidiennes</h2>
          <p className="mt-1 text-xs text-teal-700 leading-relaxed">
            Courbes denses : chaque jour calendaire apparaît ; les jours sans activité sont à 0.
          </p>
        </div>
      ) : null}

      {isGrid ? (
        <div className="grid gap-4 sm:grid-cols-2">{runChart}{repsChart}{volumeChart}{stepsChart}</div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {runChart}
            {repsChart}
          </div>
          <div className={chartCardClass}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
              Volume soulevé (kg×reps) et reps le même jour
            </h3>
            <p className="mb-3 text-[11px] text-slate-500">
              La série commence au premier jour où du volume pondéré est enregistré.
            </p>
            <DenseDailyLineChart
              seriesA={volPts.map((p) => ({ date: p.date, value: p.value }))}
              seriesB={repPtsAligned.map((p) => ({ date: p.date, value: p.value }))}
              metaA={{ label: 'kg×reps', color: '#34d399' }}
              metaB={{ label: 'reps', color: '#f472b6' }}
              valueFormatA={(v) => (Math.round(v * 10) / 10).toFixed(1)}
              height={compact ? 180 : 220}
            />
          </div>
          {!compact ? stepsChart : null}
        </>
      )}
    </section>
  );
};

export default RecapDailyTrendChartsBlock;
