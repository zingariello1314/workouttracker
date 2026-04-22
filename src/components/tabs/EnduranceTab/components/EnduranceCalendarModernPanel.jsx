import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { parseDurationToMinutes } from '../../../../utils/calendarUtils';

const MONTHS_FR = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const WEEKDAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildSessionRows(sessions = {}, filter = 'all') {
  const rows = [];
  const push = (type, list, mapFn) => {
    (Array.isArray(list) ? list : []).forEach((s, index) => {
      if (!s?.date) return;
      if (filter !== 'all' && filter !== type) return;
      rows.push(mapFn(s, index));
    });
  };

  push('boxing', sessions.boxing, (s, idx) => ({
    type: 'boxing',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Boxe',
    durationMin: Math.max(0, Number(s.duration) || 0),
    details: `${Math.max(0, Number(s.duration) || 0)} min`
  }));
  push('pushups', sessions.pushups, (s, idx) => ({
    type: 'pushups',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Pompes',
    durationMin: parseDurationToMinutes(s.duration, 'EnduranceCalendarModernPanel.pushups') || 0,
    details: `${Number(s.count || 0)} reps`
  }));
  push('swimming', sessions.swimming, (s, idx) => ({
    type: 'swimming',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Natation',
    durationMin: Math.max(0, Number(s.totalTime || 0) / 60),
    details: `${Number(s.totalDistance || 0)} m`
  }));
  push('jumprope', sessions.jumprope, (s, idx) => ({
    type: 'jumprope',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Corde',
    durationMin: parseDurationToMinutes(s.duration, 'EnduranceCalendarModernPanel.jumprope') || 0,
    details: `${Number(s.jumps || 0)} sauts`
  }));
  push('gainage', sessions.gainage, (s, idx) => ({
    type: 'gainage',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Gainage',
    durationMin: Math.max(0, Number(s.duration) || 0),
    details: `${Number(s.count || 0)} sec`
  }));
  push('running', sessions.running, (s, idx) => ({
    type: 'running',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Course / Marche',
    durationMin: parseDurationToMinutes(s.duration, 'EnduranceCalendarModernPanel.running') || 0,
    details: `${Number(s.distance || 0)} km`
  }));

  return rows;
}

function levelClass(level) {
  if (level <= 0) return 'bg-black border-[#0F4C5C]/45 text-slate-500';
  if (level === 1) return 'bg-[#0F4C5C]/35 border-[#0F4C5C]/75 text-teal-100';
  if (level === 2) return 'bg-[#1E7FA3]/45 border-[#1E7FA3]/80 text-white';
  if (level === 3) return 'bg-amber-500/45 border-amber-400/80 text-white';
  return 'bg-red-500/55 border-red-400/85 text-white';
}

export default function EnduranceCalendarModernPanel({
  sessions = {},
  selectedYear,
  selectedActivityFilter,
  onYearChange,
  onActivityFilterChange,
  onEditSession
}) {
  const [viewMode, setViewMode] = useState('annee');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const rows = useMemo(() => buildSessionRows(sessions, selectedActivityFilter), [sessions, selectedActivityFilter]);

  const byDate = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const list = map.get(r.date) || [];
      list.push(r);
      map.set(r.date, list);
    });
    return map;
  }, [rows]);

  const maxScore = useMemo(() => {
    let max = 1;
    byDate.forEach((list) => {
      const count = list.length;
      const score = count;
      if (score > max) max = score;
    });
    return max;
  }, [byDate]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const first = new Date(selectedYear, monthIdx, 1);
      const days = new Date(selectedYear, monthIdx + 1, 0).getDate();
      const firstWeekDay = (first.getDay() + 6) % 7;
      const cells = [];
      for (let i = 0; i < firstWeekDay; i += 1) cells.push(null);
      for (let d = 1; d <= days; d += 1) cells.push(new Date(selectedYear, monthIdx, d));
      return { monthIdx, label: MONTHS_FR[monthIdx], cells };
    });
  }, [selectedYear]);

  const selectedRows = selectedDateKey ? (byDate.get(selectedDateKey) || []) : [];

  const yearStats = useMemo(() => {
    const activeDays = new Set(rows.map((r) => r.date)).size;
    const totalDuration = rows.reduce((sum, r) => sum + Number(r.durationMin || 0), 0);
    return {
      sessions: rows.length,
      activeDays,
      totalDuration: Math.round(totalDuration)
    };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {['mois', 'annee', 'streaks'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  viewMode === mode
                    ? 'border-[#1E7FA3]/85 bg-[#1E7FA3]/25 text-white'
                    : 'border-[#0F4C5C]/50 bg-black text-teal-100'
                }`}
              >
                {mode === 'mois' ? 'Mois' : mode === 'annee' ? 'Annee' : 'Streaks'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onYearChange?.(selectedYear - 1)}
              className="rounded-lg border border-[#0F4C5C]/60 bg-black p-2 text-teal-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[92px] text-center text-lg font-semibold text-white">{selectedYear}</div>
            <button
              type="button"
              onClick={() => onYearChange?.(selectedYear + 1)}
              className="rounded-lg border border-[#0F4C5C]/60 bg-black p-2 text-teal-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={selectedActivityFilter}
            onChange={(e) => onActivityFilterChange?.(e.target.value)}
            className="rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="all">Toutes disciplines</option>
            <option value="boxing">Boxe</option>
            <option value="pushups">Pompes</option>
            <option value="swimming">Natation</option>
            <option value="jumprope">Corde</option>
            <option value="gainage">Gainage</option>
            <option value="running">Course / Marche</option>
          </select>
          <div className="text-xs text-teal-200/75">
            Intensite = uniquement le nombre de sessions Defis enregistrees par jour.
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs">
          <span className="text-slate-400">Intensite:</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span key={lvl} className={`h-3 w-6 rounded-sm border ${levelClass(lvl)}`} />
          ))}
        </div>

        <div className={viewMode === 'mois' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'}>
          {(viewMode === 'mois' ? [months[selectedMonthIndex]] : months).map((month) => (
            <div key={month.monthIdx} className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{month.label}</div>
                <div className="text-[11px] text-teal-200/70">seances</div>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAYS_FR.map((w) => (
                  <div key={`${month.monthIdx}-${w}`} className="text-center text-[10px] text-slate-500">{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {month.cells.map((d, idx) => {
                  if (!d) return <div key={`empty-${month.monthIdx}-${idx}`} className="h-8 rounded border border-transparent" />;
                  const key = toDateKey(d);
                  const list = byDate.get(key) || [];
                  const count = list.length;
                  const score = count;
                  const normalized = maxScore > 0 ? score / maxScore : 0;
                  const level = count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(normalized * 4)));
                  const isSelected = selectedDateKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedDateKey(key);
                        setSelectedMonthIndex(month.monthIdx);
                        setViewMode('mois');
                      }}
                      className={`h-8 rounded border text-[11px] transition ${levelClass(level)} ${isSelected ? 'ring-2 ring-sky-400/70' : ''}`}
                      title={`${key} · ${count} session(s)`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3">
          <div className="text-xs text-teal-200/70">Total activites</div>
          <div className="text-2xl font-bold text-white">{yearStats.sessions}</div>
        </div>
        <div className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3">
          <div className="text-xs text-teal-200/70">Jours actifs</div>
          <div className="text-2xl font-bold text-white">{yearStats.activeDays}</div>
        </div>
        <div className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3">
          <div className="text-xs text-teal-200/70">Temps cumule</div>
          <div className="text-2xl font-bold text-white">{yearStats.totalDuration} min</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-4">
        <div className="mb-3 text-sm font-semibold text-white">
          {selectedDateKey ? `Details du ${selectedDateKey}` : 'Clique sur une case pour voir les details'}
        </div>
        {selectedRows.length === 0 ? (
          <div className="text-sm text-slate-400">Aucune activite ce jour.</div>
        ) : (
          <div className="space-y-2">
            {selectedRows
              .slice()
              .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
              .map((row) => (
                <div key={`${row.type}-${row.id}-${row.originalIndex}`} className="flex items-center justify-between rounded-lg border border-[#0F4C5C]/40 bg-black p-3">
                  <div>
                    <div className="text-sm font-medium text-white">{row.title}</div>
                    <div className="text-xs text-teal-200/70">
                      {row.time ? `${row.time} · ` : ''}{row.details} · {Math.round(Number(row.durationMin || 0))} min
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditSession?.(row.type, row.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#1E7FA3]/70 bg-[#1E7FA3]/20 px-2.5 py-1.5 text-xs font-medium text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

