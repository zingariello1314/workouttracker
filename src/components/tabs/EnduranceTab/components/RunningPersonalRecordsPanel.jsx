import React, { useMemo, useState } from 'react';
import { Timer, Activity, Clock } from 'lucide-react';
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

  return (
    <section style={{ marginBottom: 64 }}>
      <div className="sec-h">
        <div>
          <h2>{t('endurance.running.records.title')}</h2>
          <p>{t('endurance.running.records.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="fld" style={{ width: 180 }}>
            <label className="lab" htmlFor="defis-rec-period">
              {t('endurance.running.records.periodLabel')}
            </label>
            <select
              id="defis-rec-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="fld" style={{ width: 210 }}>
            <label className="lab" htmlFor="defis-rec-tod">
              {t('endurance.running.records.todLabel')}
            </label>
            <select
              id="defis-rec-tod"
              value={timeBand}
              onChange={(e) => setTimeBand(e.target.value)}
            >
              {TIME_BAND_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="tiny">{t('endurance.running.records.empty')}</p>
      ) : (
        <>
          <div className="grp">
            <h3>
              Garmin <span>cadence, VO₂, endurance, fractionné</span>
            </h3>
            <GarminRunningStatsCard
              variant="embedded"
              sessions={filtered}
              garminById={garminById}
              sessionsPreFiltered
              timeBand={timeBand}
              showPeriodSelector={false}
            />
          </div>
          <div className="grp">
            <h3>
              Records de séance <span>filtrés par période et moment de la journée</span>
            </h3>
            <div className="plq">
              <div>
                <div className="l">
                  <Timer className="ic" />
                  {t('endurance.running.records.bestPace')}
                </div>
                {records.bestPace ? (
                  <>
                    <b className="num">{formatPaceMinPerKm(records.bestPace.pace)}</b>
                    <p>
                      {formatDate(records.bestPace.session.date)} · {records.bestPace.session.time || '—'}
                      <br />
                      {parseFloat(String(records.bestPace.session.distance).replace(',', '.')) || 0} km ·{' '}
                      {formatDurationMin(parseRunningSessionDurationMinutes(records.bestPace.session.duration))}
                    </p>
                  </>
                ) : (
                  <p>{t('endurance.running.records.insufficient')}</p>
                )}
              </div>
              <div>
                <div className="l">
                  <Activity className="ic" />
                  {t('endurance.running.records.longestDistance')}
                </div>
                {records.longestDistance ? (
                  <>
                    <b className="num">
                      {records.longestDistance.dist.toFixed(2)}
                      <i>km</i>
                    </b>
                    <p>
                      {t('endurance.running.records.atPace')} {records.longestDistance.paceStr}
                      <br />
                      {formatDate(records.longestDistance.session.date)} · {records.longestDistance.session.time || '—'}
                      <br />
                      {formatDurationMin(records.longestDistance.durMin)}
                    </p>
                  </>
                ) : (
                  <p>{t('endurance.running.records.insufficient')}</p>
                )}
              </div>
              <div>
                <div className="l">
                  <Clock className="ic" />
                  {t('endurance.running.records.longestTime')}
                </div>
                {records.longestDuration ? (
                  <>
                    <b className="num">
                      {formatDurationMin(records.longestDuration.durMin)}
                    </b>
                    <p>
                      {records.longestDuration.dist.toFixed(2)} km · {records.longestDuration.paceStr}
                      <br />
                      {formatDate(records.longestDuration.session.date)} · {records.longestDuration.session.time || '—'}
                    </p>
                  </>
                ) : (
                  <p>{t('endurance.running.records.insufficient')}</p>
                )}
              </div>
            </div>
          </div>
          <p className="tiny" style={{ marginTop: 14 }}>
            Le bloc Garmin ci-dessus couvre déjà cadence, VO₂, EF et fractionné. Les cartes « Records de séance »
            restent focalisées sur les records de séances filtrées (période + moment de journée).
          </p>
        </>
      )}
    </section>
  );
};

export default RunningPersonalRecordsPanel;
