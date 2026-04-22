import React, { useMemo, useState } from 'react';
import { Footprints, Timer, Activity, Clock, Gauge } from 'lucide-react';
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
  const cardClass = 'rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-5 shadow-lg shadow-black/30';

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
    <div className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-white">
          <Footprints className="h-6 w-6 text-sky-400" />
          <h3 className="text-lg font-bold">Records & stats marche</h3>
        </div>
        <p className="text-xs text-teal-700">Filtrez par période et par moment de la journée.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-teal-700">Période</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-3 py-2.5 text-sm text-white lg:max-w-xs"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-teal-700">Moment (heure de départ)</label>
          <select
            value={timeBand}
            onChange={(e) => setTimeBand(e.target.value)}
            className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-3 py-2.5 text-sm text-white lg:max-w-xs"
          >
            {TIME_BAND_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-teal-800">Aucune marche dans cette sélection.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClass}>
              <div className="mb-2 flex items-center gap-2 text-teal-200"><Timer className="h-5 w-5" /><span className="text-sm font-semibold">Meilleure allure</span></div>
              <div className="text-2xl font-bold text-white">{stats.bestPace ? formatPaceMinPerKm(stats.bestPace.pace) : '—'}</div>
              {stats.bestPace && <div className="mt-2 text-xs text-teal-800">{formatDate(stats.bestPace.s.date)} · {stats.bestPace.s.time || '—'}</div>}
            </div>
            <div className={cardClass}>
              <div className="mb-2 flex items-center gap-2 text-sky-200"><Activity className="h-5 w-5" /><span className="text-sm font-semibold">Plus longue distance</span></div>
              <div className="text-2xl font-bold text-white">{stats.longestDistance ? `${stats.longestDistance.dist.toFixed(2)} km` : '—'}</div>
              {stats.longestDistance && <div className="mt-2 text-xs text-teal-800">{formatDate(stats.longestDistance.s.date)} · {stats.longestDistance.s.time || '—'}</div>}
            </div>
            <div className={cardClass}>
              <div className="mb-2 flex items-center gap-2 text-cyan-200"><Clock className="h-5 w-5" /><span className="text-sm font-semibold">Plus longue durée</span></div>
              <div className="text-2xl font-bold text-white">{stats.longestDuration ? formatDurationMin(stats.longestDuration.dur) : '—'}</div>
              {stats.longestDuration && <div className="mt-2 text-xs text-teal-800">{stats.longestDuration.dist.toFixed(2)} km</div>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClass}>
              <div className="mb-2 flex items-center gap-2 text-emerald-200"><Footprints className="h-5 w-5" /><span className="text-sm font-semibold">Distance cumulée</span></div>
              <div className="text-2xl font-bold text-white">{stats.totalKm.toFixed(1)} km</div>
            </div>
            <div className={cardClass}>
              <div className="mb-2 flex items-center gap-2 text-violet-200"><Clock className="h-5 w-5" /><span className="text-sm font-semibold">Temps cumulé</span></div>
              <div className="text-2xl font-bold text-white">{formatDurationMin(stats.totalMin)}</div>
            </div>
            <div className={cardClass}>
              <div className="mb-2 flex items-center gap-2 text-rose-200"><Gauge className="h-5 w-5" /><span className="text-sm font-semibold">Meilleure cadence</span></div>
              <div className="text-2xl font-bold text-white">{stats.bestCadence ? `${stats.bestCadence.spm} pas/min` : '—'}</div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-teal-800/90">Statistiques calculées à partir des séances classées « marche » dans Défis.</p>
        </div>
      )}
    </div>
  );
}

