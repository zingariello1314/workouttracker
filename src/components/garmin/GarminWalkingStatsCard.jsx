import React, { useEffect, useMemo, useState } from 'react';
import { Footprints } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useGarminData } from '../../hooks/useGarminData';
import { ActivityStatsCard } from '../ui/ActivityStatsCard';
import { buildAllTimeWalkingFromSteps } from '../../utils/sport/walkingFromSteps';
import { addCalendarDays, todayIsoLocal } from '../../utils/sport/garminRunningPeriodStats';
import { isGarminWalkingLikeActivity } from '../../utils/garminRunningLaps';
import { isWalkingLikeRunningSession } from '../../utils/runningSessionMovementKind';
import { parseDurationToMinutes } from '../../utils/calendarUtils';
import { loadEnduranceData as loadEnduranceDataService } from '../../services/endurance/enduranceDataService';
import { getRecapDateWindow } from '../../utils/sport/recapMuscleLoadEngine';
import { RECAP_VIEW_PERIODS } from '../../utils/sport/recapViewPeriods';
import { useTranslation } from '../../utils/translations';

const NUM_BARS = 8;
const DEFAULT_WALKING_CADENCE_SPM = 105;

function distanceKmFromActivity(activity) {
  let d = activity?.distance;
  if (d != null && typeof d === 'object') {
    d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  }
  const n = Number(d);
  if (Number.isFinite(n) && n > 0) {
    if (n > 400 && n < 200000) return n / 1000;
    return n;
  }
  const meters = Number(activity?.running?.distanceMeters ?? activity?.distanceMeters ?? 0);
  if (Number.isFinite(meters) && meters > 0) return meters / 1000;
  return 0;
}

function durationSecFromActivity(activity) {
  const sec = Number(activity?.duration ?? activity?.running?.durationSec ?? 0);
  return Number.isFinite(sec) && sec > 0 ? sec : 0;
}

function formatDurationFromSec(sec) {
  if (!sec || sec <= 0) return '—';
  const totalMin = Math.round(sec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

function formatDateFr(dateKey) {
  if (!dateKey) return '—';
  try {
    return new Date(`${dateKey}T12:00:00`).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateKey;
  }
}

function classifyCardioActivityAsWalking(activity) {
  if (!activity) return false;
  if (isGarminWalkingLikeActivity(activity)) return true;
  const km = distanceKmFromActivity(activity);
  const sec = durationSecFromActivity(activity);
  if (km <= 0 || sec <= 0) return false;
  const speedKmh = km / (sec / 3600);
  const paceMinPerKm = (sec / 60) / km;
  const cadence = Number(
    activity?.running?.averageCadenceSpm ??
      activity?.running?.avgCadence ??
      activity?.averageCadence ??
      activity?.cadence ??
      0
  );
  const typeText = String(
    activity?.activityType ??
      activity?.type ??
      activity?.activityTypeKey ??
      activity?.activityName ??
      activity?.name ??
      ''
  ).toLowerCase();
  if (/\b(walk|walking|marche|hike|hiking|randonn|trek)\b/.test(typeText)) return true;
  if (paceMinPerKm >= 9.8) return true;
  if (speedKmh <= 6.4 && paceMinPerKm >= 8.2) return true;
  if (Number.isFinite(cadence) && cadence > 0 && cadence < 120 && speedKmh < 7.2) return true;
  return false;
}

function buildWindowCompare(points, endStr, windowDays = 30, numBars = NUM_BARS) {
  const byDate = new Map((points || []).map((p) => [p.date, p]));
  const currStart = addCalendarDays(endStr, -(windowDays - 1));
  const prevEnd = addCalendarDays(currStart, -1);
  const prevStart = addCalendarDays(prevEnd, -(windowDays - 1));
  const daysPerChunk = Math.max(1, Math.ceil(windowDays / numBars));
  const chartData = [];

  for (let c = 0; c < numBars; c += 1) {
    let currentValue = 0;
    let previousValue = 0;
    for (let k = 0; k < daysPerChunk; k += 1) {
      const idx = c * daysPerChunk + k;
      if (idx >= windowDays) break;
      const cd = addCalendarDays(currStart, idx);
      const pd = addCalendarDays(prevStart, idx);
      currentValue += Number(byDate.get(cd)?.walkingKm || 0);
      previousValue += Number(byDate.get(pd)?.walkingKm || 0);
    }
    chartData.push({
      label: addCalendarDays(currStart, c * daysPerChunk).slice(5).replace('-', '/'),
      currentValue,
      previousValue,
      currentPct: 0,
      previousPct: 0
    });
  }

  let max = 0.0001;
  chartData.forEach((p) => {
    max = Math.max(max, p.currentValue, p.previousValue);
  });
  chartData.forEach((p) => {
    p.currentPct = (p.currentValue / max) * 100;
    p.previousPct = (p.previousValue / max) * 100;
  });

  const totalCurrKm = chartData.reduce((sum, p) => sum + p.currentValue, 0);
  const totalPrevKm = chartData.reduce((sum, p) => sum + p.previousValue, 0);
  const changeValue = totalPrevKm > 1e-6 ? ((totalCurrKm - totalPrevKm) / totalPrevKm) * 100 : totalCurrKm > 0 ? 100 : 0;
  return { chartData, totalCurrKm, totalPrevKm, changeValue };
}

export default function GarminWalkingStatsCard({
  variant = 'embedded',
  period = '30d',
  onPeriodChange = null,
  showPeriodSelector = true,
  contentMode = 'full'
}) {
  const t = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState(() => ({ totalWalkingKm: 0, totalSteps: 0, points: [] }));
  const [cardioActivities, setCardioActivities] = useState([]);

  useEffect(() => {
    if (!dbReady || !isAuthenticated) {
      setLoading(false);
      setDataset({ totalWalkingKm: 0, totalSteps: 0, points: [] });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const loaded = await loadAllData();
        if (cancelled) return;
        const built = buildAllTimeWalkingFromSteps({
          dailyMetrics: loaded?.dailyMetrics || {},
          activities: loaded?.activities || {},
          manualStepsByDate: data?.enduranceData?.manualDailyWalkByDate
        });
        setDataset(built);
        const cardio = Array.isArray(loaded?.activities?.cardio) ? loaded.activities.cardio : [];
        setCardioActivities(cardio);
      } catch {
        if (!cancelled) {
          setDataset({ totalWalkingKm: 0, totalSteps: 0, points: [] });
          setCardioActivities([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dbReady, isAuthenticated, loadAllData, data?.enduranceData?.manualDailyWalkByDate]);

  const periodPoints = useMemo(() => {
    const points = Array.isArray(dataset?.points) ? dataset.points : [];
    if (period === 'all') return points;
    const w = getRecapDateWindow(period, new Date());
    const start = w?.start;
    const end = w?.end || todayIsoLocal();
    if (!start) return points;
    return points.filter((p) => p?.date && p.date >= start && p.date <= end);
  }, [dataset?.points, period]);

  const periodSummary = useMemo(() => {
    const points = Array.isArray(periodPoints) ? periodPoints : [];
    let totalWalkingKm = 0;
    let totalWalkingSteps = 0;
    points.forEach((p) => {
      totalWalkingKm += Number(p?.walkingKm || 0);
      totalWalkingSteps += Number(p?.walkingSteps || 0);
    });
    return { totalWalkingKm, totalWalkingSteps, daysCount: points.length };
  }, [periodPoints]);

  const compareWindowDays = useMemo(() => {
    if (period === 'all') return Math.max(30, Number(periodSummary.daysCount || 0));
    const w = getRecapDateWindow(period, new Date());
    if (!w?.start || !w?.end) return 30;
    const start = new Date(`${w.start}T00:00:00`).getTime();
    const end = new Date(`${w.end}T00:00:00`).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 30;
    return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1);
  }, [period, periodSummary.daysCount]);

  const compare = useMemo(
    () => buildWindowCompare(dataset.points || [], todayIsoLocal(), compareWindowDays, NUM_BARS),
    [dataset.points, compareWindowDays]
  );
  const chartData = useMemo(
    () =>
      (compare.chartData || []).map((p) => ({
        label: p.label,
        currentValue: Math.max(6, p.currentPct),
        previousValue: Math.max(4, p.previousPct)
      })),
    [compare.chartData]
  );
  const detailed = useMemo(() => {
    const enduranceLoaded = loadEnduranceDataService(data?.enduranceData || {});
    const enduranceRunning = Array.isArray(enduranceLoaded?.sessions?.running) ? enduranceLoaded.sessions.running : [];
    const walkingActivities = (cardioActivities || []).filter((act) => classifyCardioActivityAsWalking(act));
    const garminById = new Map();
    (cardioActivities || []).forEach((act) => {
      const id = act?.garminId ?? act?.id;
      if (id == null) return;
      garminById.set(String(id), act);
    });

    const fromDefis = enduranceRunning
      .filter((s) => {
        const key = String(s?.garminId ?? s?.id ?? '');
        const garmin = key ? garminById.get(key) || null : null;
        return isWalkingLikeRunningSession(s, garmin);
      })
      .map((s) => {
        const km = Number(String(s?.distance ?? '').replace(',', '.'));
        const durationMin = parseDurationToMinutes(s?.duration, 'GarminWalkingStatsCard') || 0;
        return {
          key: s?.garminId != null ? `g-${String(s.garminId)}` : `d-${String(s.id ?? '')}-${s.date || ''}-${s.time || ''}`,
          garminId: s?.garminId != null ? String(s.garminId) : null,
          km: Number.isFinite(km) && km > 0 ? km : 0,
          sec: Math.max(0, durationMin * 60),
          date: String(s?.date || '').slice(0, 10)
        };
      });

    const fromGarmin = (walkingActivities || []).map((act) => {
      const id = act?.garminId ?? act?.id;
      return {
        key: `g-${String(id ?? '')}`,
        garminId: id != null ? String(id) : null,
        km: distanceKmFromActivity(act),
        sec: durationSecFromActivity(act),
        date: String(act?.date || act?.startTimeLocal || '').slice(0, 10)
      };
    });

    const mergedByKey = new Map();
    [...fromGarmin, ...fromDefis].forEach((row) => {
      if (!row?.key) return;
      if (!mergedByKey.has(row.key)) {
        mergedByKey.set(row.key, row);
        return;
      }
      const prev = mergedByKey.get(row.key);
      mergedByKey.set(row.key, {
        ...prev,
        km: Math.max(Number(prev?.km || 0), Number(row?.km || 0)),
        sec: Math.max(Number(prev?.sec || 0), Number(row?.sec || 0)),
        date: row?.date || prev?.date
      });
    });
    const mergedSessions = Array.from(mergedByKey.values());

    const points = Array.isArray(periodPoints) ? periodPoints : [];
    const activeDays = points.filter((p) => Number(p?.walkingKm) > 0 || Number(p?.walkingSteps) > 0);
    let bestDay = null;
    activeDays.forEach((p) => {
      if (!bestDay || Number(p.walkingKm) > Number(bestDay.walkingKm)) bestDay = p;
    });

    let longestDurationSession = null;
    let longestDistanceSession = null;
    let totalSessionDistance = 0;
    let totalSessionDuration = 0;
    let totalSessionSteps = 0;
    const mergedByDate = new Map();
    mergedSessions.forEach((session) => {
      const dk = String(session?.date || '').slice(0, 10);
      if (!dk) return;
      const prev = mergedByDate.get(dk) || { km: 0, sec: 0 };
      mergedByDate.set(dk, {
        km: Number(prev.km || 0) + Number(session?.km || 0),
        sec: Number(prev.sec || 0) + Number(session?.sec || 0)
      });
    });

    // Une "session marche" = un jour actif net, pour rester cohérent avec meilleur jour/moyennes.
    activeDays.forEach((day) => {
      const date = String(day?.date || '').slice(0, 10);
      const dayKm = Number(day?.walkingKm || 0);
      const daySteps = Number(day?.walkingSteps || 0);
      const explicit = mergedByDate.get(date) || { km: 0, sec: 0 };
      const explicitKm = Number(explicit.km || 0);
      const explicitSec = Number(explicit.sec || 0);
      const explicitStepsEstimated = explicitKm > 0 ? explicitKm * Number(dataset?.stepsPerKm || 1312) : 0;
      const residualSteps = Math.max(0, daySteps - explicitStepsEstimated);
      const residualSec = residualSteps > 0 ? (residualSteps / DEFAULT_WALKING_CADENCE_SPM) * 60 : 0;
      const daySec = explicitSec + residualSec;

      totalSessionDistance += dayKm;
      totalSessionDuration += daySec;
      totalSessionSteps += daySteps;

      if (!longestDistanceSession || dayKm > longestDistanceSession.km) {
        longestDistanceSession = { km: dayKm, date };
      }
      if (!longestDurationSession || daySec > longestDurationSession.sec) {
        longestDurationSession = { sec: daySec, date };
      }
    });

    const sessionsCount = activeDays.length;

    return {
      totalSessions: sessionsCount,
      activeDaysCount: activeDays.length,
      avgWalkKmPerDay: points.length > 0 ? dataset.totalWalkingKm / points.length : 0,
      avgWalkKmPerActiveDay: activeDays.length > 0 ? dataset.totalWalkingKm / activeDays.length : 0,
      avgDistancePerSession: sessionsCount > 0 ? totalSessionDistance / sessionsCount : 0,
      avgDurationPerSessionSec: sessionsCount > 0 ? totalSessionDuration / sessionsCount : 0,
      avgStepsPerSession: sessionsCount > 0 ? totalSessionSteps / sessionsCount : 0,
      longestDistanceSession,
      longestDurationSession,
      bestDay
    };
  }, [dataset, cardioActivities, data?.enduranceData, periodPoints]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border-2 border-[#0F4C5C]/60 bg-black text-sm text-teal-600">
        Chargement de la marche...
      </div>
    );
  }

  if (!dataset?.points?.length) {
    return (
      <div className="w-full rounded-xl border-2 border-[#0F4C5C]/60 bg-black p-4 text-sm text-teal-600">
        Aucune donnée Garmin exploitable pour la marche.
      </div>
    );
  }

  const mainValue =
    periodSummary.totalWalkingKm >= 1
      ? `${periodSummary.totalWalkingKm.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} km`
      : `${Math.round(periodSummary.totalWalkingKm * 1000)} m`;

  const showChartCard = contentMode !== 'detailsOnly';
  const showDetailPanels = contentMode !== 'chartOnly';

  return (
    <div className="space-y-3">
      {showPeriodSelector && showChartCard ? (
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {RECAP_VIEW_PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriodChange?.(p.id)}
              aria-pressed={period === p.id}
              className={`rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                period === p.id
                  ? 'border-[#0F5C45] bg-[#0F5C45]/35 text-white'
                  : 'border-[#0F4C5C]/60 bg-black text-teal-200/90 hover:border-[#0F5C45]/60'
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      ) : null}
      {showChartCard ? (
        <ActivityStatsCard
          title="Marche (Garmin)"
          icon={<Footprints className="h-6 w-6" />}
          mainValue={mainValue}
          changeValue={Number(compare.changeValue.toFixed(2))}
          changeDescription="vs période précédente"
          chartData={chartData}
          sportShell={variant === 'embedded'}
          primaryBarClassName="bg-[#0F4C5C]"
          secondaryBarClassName="bg-[#1E7FA3]/55"
        />
      ) : null}
      {showDetailPanels ? (
        <>
          <div className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3 text-xs text-teal-200/85">
            <p>
              Base all-time: <strong className="text-white">{dataset.totalSteps.toLocaleString('fr-FR')} pas</strong>. La
              course est retirée en déduisant les pas de course (directs ou estimés cadence x durée), la distance de course
              et la durée de course sur chaque journée.
            </p>
          </div>
          <div className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3">
            <div className="grid grid-cols-1 gap-2 text-xs text-teal-200/85 sm:grid-cols-2">
              <div>Total sessions marche: <strong className="text-white">{detailed.totalSessions}</strong></div>
              <div>Pas marche cumulés: <strong className="text-white">{Math.round(Number(periodSummary.totalWalkingSteps || 0)).toLocaleString('fr-FR')}</strong></div>
              <div>Jours avec marche: <strong className="text-white">{detailed.activeDaysCount}</strong></div>
              <div>Moyenne / jour: <strong className="text-white">{detailed.avgWalkKmPerDay.toFixed(2)} km</strong></div>
              <div>Moyenne / jour actif: <strong className="text-white">{detailed.avgWalkKmPerActiveDay.toFixed(2)} km</strong></div>
              <div>Moyenne / session: <strong className="text-white">{detailed.avgDistancePerSession.toFixed(2)} km</strong></div>
              <div>Pas moyens / session: <strong className="text-white">{Math.round(Number(detailed.avgStepsPerSession || 0)).toLocaleString('fr-FR')}</strong></div>
              <div>Moy. durée / session: <strong className="text-white">{formatDurationFromSec(detailed.avgDurationPerSessionSec)}</strong></div>
              <div>
                Plus longue distance: <strong className="text-white">{Number(detailed.longestDistanceSession?.km || 0).toFixed(2)} km</strong>{' '}
                <span className="text-teal-300/65">({formatDateFr(detailed.longestDistanceSession?.date)})</span>
              </div>
              <div>
                Plus longue session: <strong className="text-white">{formatDurationFromSec(detailed.longestDurationSession?.sec || 0)}</strong>{' '}
                <span className="text-teal-300/65">({formatDateFr(detailed.longestDurationSession?.date)})</span>
              </div>
              <div className="sm:col-span-2">
                Meilleur jour marche: <strong className="text-white">{Number(detailed.bestDay?.walkingKm || 0).toFixed(2)} km</strong>{' '}
                <span className="text-teal-300/65">({formatDateFr(detailed.bestDay?.date)})</span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
