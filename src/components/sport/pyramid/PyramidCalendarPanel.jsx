import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkout } from '../../../context/WorkoutContext';

const MONTHS_FR = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const WEEKDAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function collectPyramidActivityByDate(data) {
  const map = new Map();
  const log = Array.isArray(data?.pyramidSessionLog) ? data.pyramidSessionLog : [];
  for (const row of log) {
    const d = String(row?.dateStr || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const cur = map.get(d) || { sessions: 0, planned: 0 };
    cur.sessions += 1;
    map.set(d, cur);
  }
  const dv = data?.dailyVariations && typeof data.dailyVariations === 'object' ? data.dailyVariations : {};
  for (const [d, v] of Object.entries(dv)) {
    const n =
      v?.exerciseTrainingPatterns && typeof v.exerciseTrainingPatterns === 'object'
        ? Object.keys(v.exerciseTrainingPatterns).length
        : 0;
    if (!n) continue;
    const cur = map.get(d) || { sessions: 0, planned: 0 };
    cur.planned += n;
    map.set(d, cur);
  }
  return map;
}

function levelClass(level) {
  if (level <= 0) return 'bg-black border-[#0F4C5C]/45 text-slate-500';
  if (level === 1) return 'bg-[#0F4C5C]/35 border-[#0F4C5C]/75 text-teal-100';
  if (level === 2) return 'bg-[#1E7FA3]/45 border-[#1E7FA3]/80 text-white';
  if (level === 3) return 'bg-amber-500/45 border-amber-400/80 text-white';
  return 'bg-red-500/55 border-red-400/85 text-white';
}

const PyramidCalendarPanel = () => {
  const { getCurrentData, data } = useWorkout();
  const live = typeof getCurrentData === 'function' ? getCurrentData() : data;
  const byDate = useMemo(() => collectPyramidActivityByDate(live), [live]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [viewMode, setViewMode] = useState('annee');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const maxScore = useMemo(() => {
    let max = 1;
    byDate.forEach((v) => {
      const score = (v.sessions || 0) * 2 + (v.planned || 0);
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

  const selectedDetail = selectedDateKey ? byDate.get(selectedDateKey) : null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {['mois', 'annee'].map((mode) => (
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
                {mode === 'mois' ? 'Mois' : 'Annee'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="rounded-lg border border-[#0F4C5C]/60 bg-black p-2 text-teal-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[92px] text-center text-lg font-semibold text-white">{selectedYear}</div>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="rounded-lg border border-[#0F4C5C]/60 bg-black p-2 text-teal-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-4 text-xs text-teal-200/75">
          Intensité = séances pyramide enregistrées (×2) + plans du jour (variation) sur la date.
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
                <div className="text-[11px] text-teal-200/70">pyramides</div>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAYS_FR.map((w) => (
                  <div key={`${month.monthIdx}-${w}`} className="text-center text-[10px] text-slate-500">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {month.cells.map((d, idx) => {
                  if (!d) return <div key={`empty-${month.monthIdx}-${idx}`} className="h-8 rounded border border-transparent" />;
                  const key = toDateKey(d);
                  const v = byDate.get(key) || { sessions: 0, planned: 0 };
                  const score = (v.sessions || 0) * 2 + (v.planned || 0);
                  const normalized = maxScore > 0 ? score / maxScore : 0;
                  const level = score === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(normalized * 4)));
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
                      title={`${key} · ${v.sessions} séance(s) · ${v.planned} plan(s) jour`}
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

      <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-4">
        <div className="mb-3 text-sm font-semibold text-white">
          {selectedDateKey ? `Détail du ${selectedDateKey}` : 'Clique sur une case'}
        </div>
        {!selectedDateKey ? (
          <div className="text-sm text-slate-400">Choisis une date dans la grille.</div>
        ) : (
          <div className="text-sm text-slate-200 space-y-1">
            <div>Séances pyramide enregistrées : {selectedDetail?.sessions ?? 0}</div>
            <div>Plans pyramide (variation du jour) : {selectedDetail?.planned ?? 0}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PyramidCalendarPanel;
