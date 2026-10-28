import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useGarminData } from '../../../../hooks/useGarminData';
import { isAdminUser } from '../../../../utils/accessControl';
import { useTranslation } from '../../../../utils/translations';
import RecapDailyTrendChartsBlock from '../RecapDailyTrendChartsBlock';
import RecapCalendarMonthTrendCharts from '../RecapCalendarMonthTrendCharts';
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
      <p className="emp">{t('recap.tendances.noRecords', 'Aucun record course enregistré.')}</p>
    );
  }
  const tones = ['var(--a2)', 'var(--a1)', 'var(--a3)', 'var(--d)', 'var(--a5)', 'var(--a4)'];
  return (
    <div className="rec3">
      {records.slice(0, 9).map((rec, index) => {
        const distLabel =
          rec.distanceKm === 42.195
            ? '42,2 km'
            : `${rec.distanceKm % 1 === 0 ? rec.distanceKm : rec.distanceKm.toFixed(1).replace('.', ',')} km`;
        return (
          <div key={rec.distanceKm} className="rr" style={{ '--c': tones[index % tones.length] }}>
            <i>{distLabel}</i>
            <b>{rec.timeSec ? formatDurationHms(rec.timeSec) : '—'}</b>
            {rec.date ? <span>{rec.date}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function RecapTendancesView({
  period,
  onPeriodChange,
  enrichment,
  periodWindow = null,
  garminData = null
}) {
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
    <div className="rb-tend">
      <div id="mensuel">
      <RecapCalendarMonthTrendCharts
        period={period}
        periodWindow={periodWindow ?? enrichment?.window}
        garminData={garminData}
        chartHeight={190}
        showPeak
        peakPrefix={t('recap.tendances.peak', 'pic')}
      />
      </div>

      <div id="quotidien">
      <RecapDailyTrendChartsBlock
        layout="grid"
        chartHeight={190}
        showPeak
        peakPrefix={t('recap.tendances.peak', 'pic')}
        range={periodWindow ?? enrichment?.window ?? null}
      />
      </div>

      <section id="records">
        <div className="sh">
          <h2>{t('recap.tendances.records', 'Records course')}</h2>
        </div>
        <RecordsGrid records={runningRecords} t={t} />
      </section>

      <div id="modules">
      <div className="sh">
        <h2>{t('recap.tendances.modules', 'Course · Marche · Muscu')}</h2>
      </div>
      <RecapExtendedTrendCharts
        enrichment={enrichment}
        chartHeight={190}
        showPeak
        peakPrefix={t('recap.tendances.peak', 'pic')}
      />
      <div className="mods">
        <article className="md" style={{ '--c': 'var(--a2)' }}>
          <GarminRunningStatsCard
            variant="embedded"
            period={period}
            onPeriodChange={onPeriodChange}
            showPeriodSelector={false}
          />
        </article>
        <article className="md" style={{ '--c': 'var(--a1)' }}>
          <GarminWalkingStatsCard
            variant="embedded"
            period={period}
            onPeriodChange={onPeriodChange}
            showPeriodSelector={false}
          />
        </article>
        <article className="md md-wide" style={{ '--c': 'var(--a3)' }}>
          <RecapStrengthStatsCard
            variant="embedded"
            period={period}
            onPeriodChange={onPeriodChange}
            showPeriodSelector={false}
          />
        </article>
      </div>
      </div>
    </div>
  );
}
