import React, { useMemo, useState } from 'react';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import {
  filterRunningSessionsByPeriod,
  filterRunningSessionsByTimeOfDay,
  formatPaceMinPerKm,
  parseRunningSessionDurationMinutes
} from '../../../../utils/runningPersonalRecords';
import { getGarminForRunningSession, deriveCadenceSpmFromGarmin } from '../../../../utils/runningGarminMetrics';

const PERIOD_OPTIONS = [
  { id: 'all', label: 'Tout le temps' },
  { id: 'year', label: 'Année en cours' },
  { id: '365', label: '365 derniers jours' },
  { id: '90', label: '90 derniers jours' },
  { id: '30', label: '30 derniers jours' },
  { id: '7', label: '7 derniers jours' }
];

const TIME_BAND_OPTIONS = [
  { id: 'all', label: 'Toute la journée' },
  { id: 'morning', label: 'Matin (avant 12 h)' },
  { id: 'afternoon', label: 'Après-midi (12 h – 18 h)' },
  { id: 'evening', label: 'Soir (après 18 h)' }
];

function sessionDistKm(session) {
  const km = Number(String(session?.distance ?? '').replace(',', '.'));
  return Number.isFinite(km) && km > 0 ? km : 0;
}

function sessionDurMin(session) {
  return Math.max(0, Number(parseRunningSessionDurationMinutes(session?.duration)) || 0);
}

function paceMinPerKm(session) {
  const dist = sessionDistKm(session);
  const dur = sessionDurMin(session);
  if (dist <= 0 || dur <= 0) return null;
  return dur / dist;
}

function formatDurationMin(min) {
  if (!min || min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

export default function WalkingStatsPanel({ sessions = [], garminById = null }) {
  const { formatDate } = useFormatters();
  const [period, setPeriod] = useState('all');
  const [timeBand, setTimeBand] = useState('all');
  const filtered = useMemo(() => {
    const byPeriod = filterRunningSessionsByPeriod(sessions, period);
    return filterRunningSessionsByTimeOfDay(byPeriod, timeBand);
  }, [sessions, period, timeBand]);

  const stats = useMemo(() => {
    const rows = filtered.map((s) => {
      const dist = sessionDistKm(s);
      const dur = sessionDurMin(s);
      const pace = paceMinPerKm(s);
      return { s, dist, dur, pace };
    }).filter((r) => r.dist > 0 && r.dur > 0);
    if (rows.length === 0) {
      return {
        bestPace: null,
        longestDistance: null,
        longestDuration: null,
        totalKm: 0,
        totalMin: 0,
        bestCadence: null
      };
    }
    let bestPace = null;
    let longestDistance = rows[0];
    let longestDuration = rows[0];
    let totalKm = 0;
    let totalMin = 0;
    let bestCadence = null;
    rows.forEach((r) => {
      totalKm += r.dist;
      totalMin += r.dur;
      if (r.pace != null && (!bestPace || r.pace < bestPace.pace)) bestPace = r;
      if (r.dist > longestDistance.dist) longestDistance = r;
      if (r.dur > longestDuration.dur) longestDuration = r;
      const g = getGarminForRunningSession(r.s, garminById);
      const cad = deriveCadenceSpmFromGarmin(g);
      if (cad && (!bestCadence || cad.spm > bestCadence.spm)) {
        bestCadence = { ...cad, session: r.s };
      }
    });
    return { bestPace, longestDistance, longestDuration, totalKm, totalMin, bestCadence };
  }, [filtered, garminById]);

  return (
    <section style={{ marginBottom: 48 }}>
      <div className="sec-h">
        <div>
          <h2>Records & stats marche</h2>
          <p>Filtrez par période et par moment de la journée.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="fld" style={{ width: 180 }}>
            <label className="lab" htmlFor="defis-walk-period">Période</label>
            <select
              id="defis-walk-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="fld" style={{ width: 210 }}>
            <label className="lab" htmlFor="defis-walk-tod">Moment (heure de départ)</label>
            <select
              id="defis-walk-tod"
              value={timeBand}
              onChange={(e) => setTimeBand(e.target.value)}
            >
              {TIME_BAND_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="tiny">Aucune marche dans cette sélection.</p>
      ) : (
        <>
          <div className="grp">
            <h3>Records de séance <span>filtrés par période et moment de la journée</span></h3>
            <div className="plq">
              <div>
                <div className="l">Meilleure allure</div>
                <b className="num">{stats.bestPace ? formatPaceMinPerKm(stats.bestPace.pace) : '—'}</b>
                {stats.bestPace ? (
                  <p>{formatDate(stats.bestPace.s.date)} · {stats.bestPace.s.time || '—'}</p>
                ) : null}
              </div>
              <div>
                <div className="l">Plus longue distance</div>
                <b className="num">
                  {stats.longestDistance ? stats.longestDistance.dist.toFixed(2) : '—'}
                  {stats.longestDistance ? <i>km</i> : null}
                </b>
                {stats.longestDistance ? (
                  <p>{formatDate(stats.longestDistance.s.date)} · {stats.longestDistance.s.time || '—'}</p>
                ) : null}
              </div>
              <div>
                <div className="l">Plus longue durée</div>
                <b className="num">{stats.longestDuration ? formatDurationMin(stats.longestDuration.dur) : '—'}</b>
                {stats.longestDuration ? <p>{stats.longestDuration.dist.toFixed(2)} km</p> : null}
              </div>
            </div>
          </div>
          <div className="grp">
            <h3>Cumul <span>période filtrée</span></h3>
            <div className="plq">
              <div>
                <div className="l">Distance cumulée</div>
                <b className="num">{stats.totalKm.toFixed(1)}<i>km</i></b>
              </div>
              <div>
                <div className="l">Temps cumulé</div>
                <b className="num">{formatDurationMin(stats.totalMin)}</b>
              </div>
              <div>
                <div className="l">Meilleure cadence</div>
                <b className="num">{stats.bestCadence ? stats.bestCadence.spm : '—'}{stats.bestCadence ? <i>pas/min</i> : null}</b>
              </div>
            </div>
          </div>
          <p className="tiny" style={{ marginTop: 14 }}>
            Statistiques calculées à partir des séances classées « marche » dans Défis.
          </p>
        </>
      )}
    </section>
  );
}

