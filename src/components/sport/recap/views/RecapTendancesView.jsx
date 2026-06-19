import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useGarminData } from '../../../../hooks/useGarminData';
import { isAdminUser } from '../../../../utils/accessControl';
import { useTranslation } from '../../../../utils/translations';
import RecapDailyTrendChartsBlock from '../RecapDailyTrendChartsBlock';
import RecapExtendedTrendCharts from '../RecapExtendedTrendCharts';
import GarminRunningStatsCard from '../../../garmin/GarminRunningStatsCard';
import GarminWalkingStatsCard from '../../../garmin/GarminWalkingStatsCard';
import RecapStrengthStatsCard from '../RecapStrengthStatsCard';
import {
  computeRunningDistanceRecordsFromGarminActivities,
  formatDurationHms
} from '../../../../utils/runningDistanceRecords';
import { isGarminRunningLikeActivity } from '../../../../utils/garminRunningLaps';

function RecordsGrid({ records, t }) {
  if (!records?.length) {
    return (
      <p className="text-xs text-slate-500">{t('recap.tendances.noRecords', 'Aucun record course enregistré.')}</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
      {records.slice(0, 9).map((rec) => {
        const distLabel =
          rec.distanceKm === 42.195
            ? '42,2 km'
            : `${rec.distanceKm % 1 === 0 ? rec.distanceKm : rec.distanceKm.toFixed(1).replace('.', ',')} km`;
        return (
          <div
            key={rec.distanceKm}
            className="rounded-lg border border-[#0F4C5C]/45 bg-black/50 px-3 py-2.5"
          >
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{distLabel}</div>
            <div className="mt-1 text-sm font-bold tabular-nums text-white">
              {rec.timeSec ? formatDurationHms(rec.timeSec) : '—'}
            </div>
            {rec.date ? <div className="text-[10px] text-teal-700 mt-0.5">{rec.date}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function RecapTendancesView({ period, onPeriodChange, enrichment }) {
  const t = useTranslation();
  const { getCurrentData, data } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = isAdminUser(currentUser);
  const [garminBundle, setGarminBundle] = useState(null);

  useEffect(() => {
    if (!dbReady || !isAuthenticated || !isAdmin) {
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
  }, [data, dbReady, loadAllData, isAuthenticated, isAdmin]);

  const runningRecords = useMemo(() => {
    const cardio = garminBundle?.activities?.cardio || [];
    const runningActs = cardio.filter((a) => isGarminRunningLikeActivity(a));
    const snap = getCurrentData();
    const momentumRuns = snap?.enduranceData?.sessions?.running || [];
    const merged = [...runningActs];
    return computeRunningDistanceRecordsFromGarminActivities(merged)?.records || [];
  }, [garminBundle, getCurrentData, data]);

  return (
    <div className="space-y-5">
      <RecapDailyTrendChartsBlock layout="grid" chartHeight={160} />

      <RecapExtendedTrendCharts enrichment={enrichment} chartHeight={160} />

      <section className="rounded-xl border border-[#0F4C5C]/70 bg-black p-4">
        <h2 className="text-sm font-semibold text-teal-100 mb-3">
          {t('recap.tendances.records', 'Records course')}
        </h2>
        <RecordsGrid records={runningRecords} t={t} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GarminRunningStatsCard
          variant="embedded"
          period={period}
          onPeriodChange={onPeriodChange}
          showPeriodSelector={false}
        />
        <GarminWalkingStatsCard
          variant="embedded"
          period={period}
          onPeriodChange={onPeriodChange}
          showPeriodSelector={false}
        />
      </div>

      <RecapStrengthStatsCard
        variant="embedded"
        period={period}
        onPeriodChange={onPeriodChange}
        showPeriodSelector={false}
      />
    </div>
  );
}
