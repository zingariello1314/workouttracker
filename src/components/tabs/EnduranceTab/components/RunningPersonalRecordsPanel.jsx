import React, { useMemo, useState } from 'react';
import { Trophy, Timer, Activity, Clock } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import {
  filterRunningSessionsByPeriod,
  filterRunningSessionsByTimeOfDay,
  computeRunningPersonalRecords,
  formatPaceMinPerKm,
  parseRunningSessionDurationMinutes
} from '../../../../utils/runningPersonalRecords';
import GarminRunningStatsCard from '../../../garmin/GarminRunningStatsCard';

const PERIOD_OPTIONS = [
  { id: 'all', labelKey: 'endurance.running.records.periodAll' },
  { id: 'year', labelKey: 'endurance.running.records.periodYear' },
  { id: '365', labelKey: 'endurance.running.records.period365' },
  { id: '90', labelKey: 'endurance.running.records.period90' },
  { id: '30', labelKey: 'endurance.running.records.period30' },
  { id: '7', labelKey: 'endurance.running.records.period7' }
];

const TIME_BAND_OPTIONS = [
  { id: 'all', labelKey: 'endurance.running.records.todAll' },
  { id: 'morning', labelKey: 'endurance.running.records.todMorning' },
  { id: 'afternoon', labelKey: 'endurance.running.records.todAfternoon' },
  { id: 'evening', labelKey: 'endurance.running.records.todEvening' }
];

function formatDurationMin(min) {
  if (!min || min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

const RunningPersonalRecordsPanel = ({ sessions = [], garminById = null }) => {
  const t = useTranslation();
  const { formatDate } = useFormatters();
  const [period, setPeriod] = useState('all');
  const [timeBand, setTimeBand] = useState('all');

  const filtered = useMemo(() => {
    const byPeriod = filterRunningSessionsByPeriod(sessions, period);
    return filterRunningSessionsByTimeOfDay(byPeriod, timeBand);
  }, [sessions, period, timeBand]);

  const records = useMemo(
    () => computeRunningPersonalRecords(filtered, garminById || null),
    [filtered, garminById]
  );

  const cardClass =
    'rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-5 shadow-lg shadow-black/30';

  return (
    <div className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-white">
          <Trophy className="h-6 w-6 text-sky-400" />
          <h3 className="text-lg font-bold">{t('endurance.running.records.title')}</h3>
        </div>
        <p className="text-xs text-teal-700 sm:max-w-md">{t('endurance.running.records.subtitle')}</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-teal-700">
            {t('endurance.running.records.periodLabel')}
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40 lg:max-w-xs"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-teal-700">
            {t('endurance.running.records.todLabel')}
          </label>
          <select
            value={timeBand}
            onChange={(e) => setTimeBand(e.target.value)}
            className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40 lg:max-w-xs"
          >
            {TIME_BAND_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-teal-800">{t('endurance.running.records.empty')}</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-4">
            <GarminRunningStatsCard
              variant="embedded"
              sessions={filtered}
              garminById={garminById}
              sessionsPreFiltered
              timeBand={timeBand}
              showPeriodSelector={false}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClass}>
              <div className="mb-2 flex items-center gap-2 text-teal-200">
                <Timer className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{t('endurance.running.records.bestPace')}</span>
              </div>
              {records.bestPace ? (
                <>
                  <div className="text-2xl font-bold text-white">{formatPaceMinPerKm(records.bestPace.pace)}</div>
                  <div className="mt-2 space-y-1 text-xs text-teal-800">
                    <div>
                      {formatDate(records.bestPace.session.date)} · {records.bestPace.session.time || '—'}
                    </div>
                    <div>
                      {parseFloat(String(records.bestPace.session.distance).replace(',', '.')) || 0} km ·{' '}
                      {formatDurationMin(parseRunningSessionDurationMinutes(records.bestPace.session.duration))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-teal-800">{t('endurance.running.records.insufficient')}</p>
              )}
            </div>

            <div className={cardClass}>
              <div className="mb-2 flex items-center gap-2 text-sky-200">
                <Activity className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{t('endurance.running.records.longestDistance')}</span>
              </div>
              {records.longestDistance ? (
                <>
                  <div className="text-2xl font-bold text-white">
                    {records.longestDistance.dist.toFixed(2)} km
                  </div>
                  <div className="mt-1 text-sm text-cyan-200/90">
                    {t('endurance.running.records.atPace')} {records.longestDistance.paceStr}
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-teal-800">
                    <div>
                      {formatDate(records.longestDistance.session.date)} ·{' '}
                      {records.longestDistance.session.time || '—'}
                    </div>
                    <div>{formatDurationMin(records.longestDistance.durMin)}</div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-teal-800">{t('endurance.running.records.insufficient')}</p>
              )}
            </div>

            <div className={cardClass}>
              <div className="mb-2 flex items-center gap-2 text-cyan-200">
                <Clock className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{t('endurance.running.records.longestTime')}</span>
              </div>
              {records.longestDuration ? (
                <>
                  <div className="text-2xl font-bold text-white">
                    {formatDurationMin(records.longestDuration.durMin)}
                  </div>
                  <div className="mt-1 text-sm text-cyan-200/90">
                    {records.longestDuration.dist.toFixed(2)} km · {records.longestDuration.paceStr}
                  </div>
                  <div className="mt-2 text-xs text-teal-800">
                    {formatDate(records.longestDuration.session.date)} ·{' '}
                    {records.longestDuration.session.time || '—'}
                  </div>
                </>
              ) : (
                <p className="text-sm text-teal-800">{t('endurance.running.records.insufficient')}</p>
              )}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-teal-800/90">
            Le bloc Garmin ci-dessus couvre déjà cadence, VO₂, EF et fractionné. Les cartes ci-dessous restent focalisées sur
            les records de séances filtrées (période + moment de journée).
          </p>
        </div>
      )}
    </div>
  );
};

export default RunningPersonalRecordsPanel;
