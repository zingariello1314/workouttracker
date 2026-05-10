/**
 * CircuitsHubPanel — hub Défis > Circuits.
 *
 * Liaisons garanties (bidirectionnelles, déjà plombées dans `WorkoutContext`) :
 *   - Création/édition d'un circuit (ici ou depuis Programme) → `data.circuitDefinitions`
 *     (bibliothèque globale unique). Visible immédiatement dans Programme + Hub + "Aujourd'hui".
 *   - Assignation à un jour → `program.schedule[day].circuitIds`. Visible dans Programme,
 *     dans "Aujourd'hui" (jour actif), et listée ci-dessous dans la sous-vue Sessions.
 *   - Suppression définition → nettoyage de toutes les références programmes
 *     + de `circuitProgress` (XP recalculée).
 *   - L'XP utilise `data.circuitProgress` × `data.circuitDefinitions` via
 *     `circuitsXpService` (cache invalidé par `useSportXP` via checksums).
 *
 * Style aligné sur la charte sport (PushupTrophiesPanel / EnduranceCalendarModernPanel) :
 *   - panneau principal `rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6`
 *   - sections `rounded-2xl border border-[#0F4C5C]/55 bg-black p-5`
 *   - inputs `rounded-xl border border-[#0F4C5C]/50 bg-black ... focus:ring-[#0F5C45]/40`
 *   - heatmap : même palette que le calendrier endurance
 *
 * Calendrier : vue année par défaut (12 mini-mois). Clic sur un jour →
 * bascule auto vers la vue mois sur le mois ciblé (comme Pompes/Course).
 */

import React, { useMemo, useState } from 'react';
import {
  Repeat,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Trophy,
  Layers,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Link2,
  Unlink,
  BarChart3
} from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import CircuitEditor from '../../../circuits/CircuitEditor';
import {
  listCircuits,
  getCircuitDailyHistory,
  getCircuitProgramAssignments
} from '../../../../utils/circuits/circuitDefinitionUtils';
import { computeCircuitsXp, computeCircuitXpForDay } from '../../../../services/xp/circuitsXpService';
import { evaluateCircuitTrophies } from '../../../../services/circuits/circuitTrophiesService';
import { getDateStr } from '../../../../utils/dateUtils';
import EnduranceDisciplineStatsPanel from '../../../sport/charts/EnduranceDisciplineStatsPanel.jsx';

const SUB_VIEWS = [
  { id: 'sessions', label: 'Sessions', icon: Repeat },
  { id: 'stats', label: 'Statistiques', icon: BarChart3 },
  { id: 'calendar', label: 'Calendrier', icon: Calendar },
  { id: 'trophies', label: 'Trophées', icon: Trophy }
];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const WEEKDAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAY_LABELS = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche'
};

const tabBtn = (active) =>
  `rounded-xl border px-4 py-2 text-sm font-medium transition ${
    active
      ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
      : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-sky-500/40'
  }`;

const calendarModeBtn = (active) =>
  `rounded-lg border px-3 py-1.5 text-sm transition ${
    active
      ? 'border-[#1E7FA3]/85 bg-[#1E7FA3]/25 text-white'
      : 'border-[#0F4C5C]/50 bg-black text-teal-100 hover:border-sky-500/40'
  }`;

const heatmapLevelClass = (level) => {
  if (level <= 0) return 'bg-black border-[#0F4C5C]/45 text-slate-500';
  if (level === 1) return 'bg-[#0F4C5C]/35 border-[#0F4C5C]/75 text-teal-100';
  if (level === 2) return 'bg-[#1E7FA3]/45 border-[#1E7FA3]/80 text-white';
  if (level === 3) return 'bg-amber-500/45 border-amber-400/80 text-white';
  return 'bg-red-500/55 border-red-400/85 text-white';
};

const computeHeatmapLevel = (entry) => {
  if (!entry) return 0;
  if ((entry.completedCircuits || 0) >= 1 && (entry.tripleAchievedCount || 0) >= 1) return 4;
  if ((entry.completedCircuits || 0) >= 1) return 3;
  if ((entry.totalRounds || 0) >= 3) return 2;
  if ((entry.totalRounds || 0) >= 1) return 1;
  return 0;
};

const enrichDailyHistory = (history, circuitProgress, circuitDefinitions) => {
  return history.map((d) => {
    const day = circuitProgress?.[d.date] || {};
    let tripleAchievedCount = 0;
    Object.entries(day).forEach(([cid, val]) => {
      const def = circuitDefinitions?.[cid];
      if (!def) return;
      const target = Math.max(1, Math.round(Number(def.targetRounds) || 1));
      const rounds = Math.max(0, Math.round(Number(val?.roundsCompleted) || 0));
      if (rounds >= target * 3) tripleAchievedCount += 1;
    });
    return { ...d, tripleAchievedCount };
  });
};

const CircuitsHubPanel = () => {
  const {
    data,
    programs,
    activeProgram,
    saveCircuitDefinition,
    deleteCircuitDefinition,
    assignCircuitToProgramDay
  } = useWorkout();

  const circuitDefinitions = data?.circuitDefinitions || {};
  const circuitProgress = data?.circuitProgress || {};
  const todayStr = getDateStr(new Date());

  const [view, setView] = useState('sessions');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editorState, setEditorState] = useState(null); // { definition? }

  // Calendrier : vue année par défaut, comme Pompes/Course
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMode, setCalendarMode] = useState('annee'); // 'annee' | 'mois'
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const allMuscles = useMemo(() => {
    const set = new Set();
    Object.values(circuitDefinitions).forEach((c) =>
      (c.primaryMuscles || []).forEach((m) => set.add(m))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [circuitDefinitions]);

  const filteredCircuits = useMemo(
    () => listCircuits(circuitDefinitions, { muscle: muscleFilter, search }),
    [circuitDefinitions, muscleFilter, search]
  );

  const xpSummary = useMemo(
    () => computeCircuitsXp(circuitProgress, circuitDefinitions),
    [circuitProgress, circuitDefinitions]
  );

  const dailyHistory = useMemo(() => {
    const base = getCircuitDailyHistory(circuitProgress, circuitDefinitions);
    return enrichDailyHistory(base, circuitProgress, circuitDefinitions);
  }, [circuitProgress, circuitDefinitions]);

  const dailyByDate = useMemo(() => {
    const map = new Map();
    dailyHistory.forEach((d) => map.set(d.date, d));
    return map;
  }, [dailyHistory]);

  const programOptions = useMemo(() => {
    const arr = Array.isArray(programs) ? [...programs] : [];
    if (activeProgram && !arr.some((p) => p?.id === activeProgram.id)) arr.push(activeProgram);
    return arr;
  }, [programs, activeProgram]);

  // ───────────────────────────────────────────────
  // SOUS-VUE : SESSIONS
  // ───────────────────────────────────────────────
  const renderSessions = () => {
    if (Object.keys(circuitDefinitions).length === 0) {
      return (
        <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-6 text-center">
          <div className="mx-auto mb-3 inline-flex rounded-xl bg-[#0F4C5C]/25 p-3">
            <Repeat className="h-6 w-6 text-sky-300" />
          </div>
          <p className="text-sm text-white">Aucun circuit créé pour le moment.</p>
          <p className="mt-1 text-xs text-teal-200/80">
            Créez votre premier circuit (ex. « Tabata core 4 tours ») et assignez-le à un jour de programme.
          </p>
          <button
            type="button"
            onClick={() => setEditorState({ definition: null })}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#0F5C45]/60 bg-[#0F5C45]/20 px-4 py-2 text-sm font-semibold text-teal-50 hover:border-[#0F5C45]/80 hover:bg-[#0F5C45]/30"
          >
            <Plus size={14} /> Créer un circuit
          </button>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <label className="mb-1 block text-xs font-medium text-teal-700">Recherche</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom de circuit, exercice…"
                className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
              />
            </div>
          </div>
          <div className="w-full shrink-0 lg:max-w-xs">
            <label className="mb-1 block text-xs font-medium text-teal-700">Muscle ciblé</label>
            <select
              value={muscleFilter}
              onChange={(e) => setMuscleFilter(e.target.value)}
              className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
            >
              <option value="">Tous</option>
              {allMuscles.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setEditorState({ definition: null })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F5C45]/60 bg-[#0F5C45]/20 px-4 py-2.5 text-sm font-semibold text-teal-50 hover:border-[#0F5C45]/80 hover:bg-[#0F5C45]/30"
          >
            <Plus size={14} /> Nouveau circuit
          </button>
        </div>

        {filteredCircuits.length === 0 ? (
          <p className="rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40 px-4 py-6 text-center text-sm text-teal-200/70">
            Aucun circuit ne correspond aux filtres.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {filteredCircuits.map((c) => {
              const todayProg = circuitProgress?.[todayStr]?.[c.id];
              const todayRounds = Math.max(0, Math.round(Number(todayProg?.roundsCompleted) || 0));
              const todayInfo = computeCircuitXpForDay(todayRounds, c.targetRounds);
              const status = todayInfo.isCompleted
                ? todayInfo.isTripleAchieved
                  ? 'triple'
                  : 'done'
                : todayRounds > 0
                  ? 'ongoing'
                  : 'todo';
              const isHighlighted = status === 'done' || status === 'triple';
              const assignments = getCircuitProgramAssignments(c.id, programOptions);
              return (
                <li
                  key={c.id}
                  className={`scroll-mt-24 rounded-xl border p-4 transition ${
                    isHighlighted
                      ? 'border-emerald-500/50 bg-emerald-950/15'
                      : 'border-[#0F4C5C]/40 bg-slate-950/40'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                        <Layers size={14} className="text-sky-300" />
                        {c.name}
                        {status === 'triple' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100">
                            <Sparkles size={10} /> 3× cible
                          </span>
                        )}
                        {status === 'done' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/55 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100">
                            fait aujourd'hui
                          </span>
                        )}
                        {status === 'ongoing' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#1E7FA3]/65 bg-[#1E7FA3]/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-100">
                            en cours
                          </span>
                        )}
                        {status === 'todo' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#0F4C5C]/55 bg-black px-2 py-0.5 text-[10px] uppercase tracking-wide text-teal-200/80">
                            à faire
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-teal-200/70">
                        {c.targetRounds} tours cibles · {(c.items || []).length} exos
                        {(c.primaryMuscles || []).length > 0
                          ? ` · ${c.primaryMuscles.join(', ')}`
                          : ''}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Aujourd'hui : <span className="font-semibold text-white">{todayRounds}/{c.targetRounds}</span>{' '}
                        <span className="text-amber-200/85">({todayInfo.xp} XP)</span>
                      </p>

                      {/* Liaison Programme : assignations existantes */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        {assignments.length === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-[#0F4C5C]/45 bg-black px-2 py-0.5 text-teal-200/60">
                            <Unlink size={9} /> non assigné
                          </span>
                        ) : (
                          assignments.map((a) => (
                            <span
                              key={`${a.programId}-${a.dayName}`}
                              className="group inline-flex items-center gap-1 rounded-md border border-[#0F5C45]/55 bg-[#0F5C45]/15 px-2 py-0.5 text-teal-100"
                              title={`${a.programName} · ${DAY_LABELS[a.dayName] || a.dayName}`}
                            >
                              <Link2 size={9} className="text-teal-300" />
                              <span className="font-medium">{DAY_LABELS[a.dayName] || a.dayName}</span>
                              <span className="opacity-60">· {a.programName}</span>
                              <button
                                type="button"
                                onClick={() => assignCircuitToProgramDay(a.programId, a.dayName, c.id, false)}
                                className="ml-0.5 rounded text-red-300/80 opacity-60 transition hover:bg-red-950/40 hover:text-red-200 hover:opacity-100"
                                title="Retirer cette assignation"
                                aria-label={`Retirer ${c.name} du jour ${a.dayName}`}
                              >
                                <Unlink size={10} />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditorState({ definition: c })}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#0F4C5C]/50 bg-black px-2.5 py-1.5 text-xs text-teal-100 hover:border-sky-500/40"
                      >
                        <Edit3 size={12} /> Modifier
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Supprimer définitivement ce circuit (toutes assignations comprises) ?')) return;
                          await deleteCircuitDefinition(c.id);
                        }}
                        className="rounded-lg border border-red-500/40 bg-black p-2 text-red-200 hover:border-red-400/70 hover:bg-red-950/40"
                        title="Supprimer la définition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  // ───────────────────────────────────────────────
  // SOUS-VUE : CALENDRIER
  // (Vue année par défaut. Clic sur un jour → bascule vue mois sur ce mois.)
  // ───────────────────────────────────────────────
  const monthsForYear = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const first = new Date(calendarYear, monthIdx, 1);
      const days = new Date(calendarYear, monthIdx + 1, 0).getDate();
      const firstWeekDay = (first.getDay() + 6) % 7; // L=0
      const cells = [];
      for (let i = 0; i < firstWeekDay; i += 1) cells.push(null);
      for (let d = 1; d <= days; d += 1) cells.push(new Date(calendarYear, monthIdx, d));
      return { monthIdx, label: MONTHS_FR[monthIdx], cells };
    });
  }, [calendarYear]);

  const yearStats = useMemo(() => {
    const acc = { totalRounds: 0, activeDays: 0, completedDays: 0, tripleDays: 0 };
    dailyHistory.forEach((d) => {
      const date = new Date(`${d.date}T12:00:00`);
      if (date.getFullYear() !== calendarYear) return;
      acc.totalRounds += d.totalRounds;
      acc.activeDays += 1;
      if (d.completedCircuits > 0) acc.completedDays += 1;
      if (d.tripleAchievedCount > 0) acc.tripleDays += 1;
    });
    return acc;
  }, [dailyHistory, calendarYear]);

  const monthStats = useMemo(() => {
    const acc = { totalRounds: 0, activeDays: 0, completedDays: 0, tripleDays: 0 };
    dailyHistory.forEach((d) => {
      const date = new Date(`${d.date}T12:00:00`);
      if (date.getFullYear() !== calendarYear || date.getMonth() !== calendarMonth) return;
      acc.totalRounds += d.totalRounds;
      acc.activeDays += 1;
      if (d.completedCircuits > 0) acc.completedDays += 1;
      if (d.tripleAchievedCount > 0) acc.tripleDays += 1;
    });
    return acc;
  }, [dailyHistory, calendarYear, calendarMonth]);

  const renderDayCell = (cell, monthIdx, sizeClass = 'h-9') => {
    if (!cell) return null;
    const dateStr = getDateStr(cell);
    const entry = dailyByDate.get(dateStr);
    const level = computeHeatmapLevel(entry);
    const isToday = dateStr === todayStr;
    const isSelected = selectedDateKey === dateStr;

    return (
      <button
        type="button"
        key={dateStr}
        onClick={() => {
          setSelectedDateKey(dateStr);
          setCalendarMonth(monthIdx);
          setCalendarMode('mois');
        }}
        title={
          entry
            ? `${dateStr} — ${entry.totalRounds} tour(s), ${entry.completedCircuits} cible(s), ${entry.tripleAchievedCount} 3× cible`
            : `${dateStr} — aucun circuit`
        }
        className={`${sizeClass} flex flex-col items-center justify-center rounded-md border text-[11px] font-medium transition ${heatmapLevelClass(level)} ${
          isSelected ? 'ring-2 ring-amber-400/80' : isToday ? 'ring-2 ring-sky-400/70' : ''
        }`}
      >
        <span>{cell.getDate()}</span>
        {entry?.totalRounds ? (
          <span className="text-[9px] opacity-90">{entry.totalRounds}t</span>
        ) : null}
      </button>
    );
  };

  const renderSelectedDayDetails = () => {
    if (!selectedDateKey) {
      return (
        <p className="text-sm text-teal-200/70">
          Cliquez sur une case du calendrier pour voir le détail des circuits réalisés ce jour-là.
        </p>
      );
    }
    const dayProgress = circuitProgress?.[selectedDateKey] || {};
    const entries = Object.entries(dayProgress);
    if (entries.length === 0) {
      return <p className="text-sm text-teal-200/70">Aucun circuit ce jour.</p>;
    }
    return (
      <div className="space-y-2">
        {entries.map(([cid, val]) => {
          const def = circuitDefinitions[cid];
          if (!def) return null;
          const rounds = Math.max(0, Math.round(Number(val?.roundsCompleted) || 0));
          const xpInfo = computeCircuitXpForDay(rounds, def.targetRounds);
          return (
            <div
              key={cid}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#0F4C5C]/45 bg-slate-950/40 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  <Layers size={14} className="mr-1 inline text-sky-300" />
                  {def.name}
                </p>
                <p className="text-[11px] text-teal-200/70">
                  {rounds}/{def.targetRounds} tours
                  {xpInfo.isCompleted && (
                    xpInfo.isTripleAchieved
                      ? ' · cible + palier 3× atteints'
                      : ' · cible atteinte'
                  )}
                </p>
              </div>
              <span
                className={`rounded-md border px-2 py-1 text-xs font-semibold tabular-nums ${
                  xpInfo.isTripleAchieved
                    ? 'border-amber-400/60 bg-amber-950/30 text-amber-100'
                    : xpInfo.isCompleted
                      ? 'border-emerald-500/55 bg-emerald-950/25 text-emerald-100'
                      : 'border-[#0F4C5C]/55 bg-black text-teal-200/70'
                }`}
              >
                {xpInfo.xp > 0 ? `+${xpInfo.xp} XP` : '0 XP'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCalendar = () => {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-5">
          {/* Barre supérieure : mode + navigation année */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {[
                { id: 'annee', label: 'Année' },
                { id: 'mois', label: 'Mois' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCalendarMode(m.id)}
                  className={calendarModeBtn(calendarMode === m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (calendarMode === 'annee') {
                    setCalendarYear((y) => y - 1);
                  } else {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear((y) => y - 1);
                    } else {
                      setCalendarMonth((m) => m - 1);
                    }
                  }
                }}
                className="rounded-lg border border-[#0F4C5C]/60 bg-black p-2 text-teal-100 hover:border-sky-500/40"
                aria-label={calendarMode === 'annee' ? 'Année précédente' : 'Mois précédent'}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="min-w-[180px] text-center text-lg font-semibold text-white">
                {calendarMode === 'mois'
                  ? `${MONTHS_FR[calendarMonth]} ${calendarYear}`
                  : calendarYear}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (calendarMode === 'annee') {
                    setCalendarYear((y) => y + 1);
                  } else {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear((y) => y + 1);
                    } else {
                      setCalendarMonth((m) => m + 1);
                    }
                  }
                }}
                className="rounded-lg border border-[#0F4C5C]/60 bg-black p-2 text-teal-100 hover:border-sky-500/40"
                aria-label={calendarMode === 'annee' ? 'Année suivante' : 'Mois suivant'}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* KPIs (cohérents avec EnduranceCalendarModernPanel) */}
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3">
              <div className="text-xs text-teal-200/70">Jours actifs</div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {(calendarMode === 'mois' ? monthStats : yearStats).activeDays}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-500/45 bg-emerald-950/25 p-3">
              <div className="text-xs text-emerald-200/85">Cibles atteintes</div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {(calendarMode === 'mois' ? monthStats : yearStats).completedDays}
              </div>
            </div>
            <div className="rounded-xl border border-amber-400/55 bg-amber-950/25 p-3">
              <div className="text-xs text-amber-200/85">3× cible</div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {(calendarMode === 'mois' ? monthStats : yearStats).tripleDays}
              </div>
            </div>
            <div className="rounded-xl border border-[#1E7FA3]/55 bg-[#1E7FA3]/15 p-3">
              <div className="text-xs text-sky-200/85">Tours réalisés</div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {(calendarMode === 'mois' ? monthStats : yearStats).totalRounds}
              </div>
            </div>
          </div>

          {/* Légende intensité */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-teal-200/80">
            <span className="text-slate-400">Intensité :</span>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <span key={lvl} className={`h-3 w-6 rounded-sm border ${heatmapLevelClass(lvl)}`} />
            ))}
            <span className="ml-2 text-slate-500">0 → 1-2 → ≥3 → cible → 3× cible</span>
          </div>

          {/* Vue année : 12 mini-mois */}
          {calendarMode === 'annee' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {monthsForYear.map((month) => {
                const monthLevel = (() => {
                  let count = 0;
                  month.cells.forEach((c) => {
                    if (!c) return;
                    if (dailyByDate.get(getDateStr(c))) count += 1;
                  });
                  return count;
                })();
                return (
                  <div
                    key={month.monthIdx}
                    className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarMonth(month.monthIdx);
                          setCalendarMode('mois');
                        }}
                        className="text-sm font-semibold text-white hover:text-sky-200"
                      >
                        {month.label}
                      </button>
                      <span className="text-[11px] text-teal-200/70">{monthLevel} jour(s)</span>
                    </div>
                    <div className="mb-1 grid grid-cols-7 gap-1">
                      {WEEKDAYS_FR.map((w, i) => (
                        <div
                          key={`${month.monthIdx}-h-${i}`}
                          className="text-center text-[10px] text-slate-500"
                        >
                          {w}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {month.cells.map((cell, idx) =>
                        cell
                          ? renderDayCell(cell, month.monthIdx, 'h-7')
                          : <div key={`empty-${month.monthIdx}-${idx}`} className="h-7 rounded border border-transparent" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Vue mois : un grand mois */}
          {calendarMode === 'mois' && (
            <div className="rounded-xl border border-[#0F4C5C]/45 bg-black p-3">
              <div className="grid grid-cols-7 gap-1 text-[11px] uppercase tracking-wide text-teal-200/70">
                {WEEKDAYS_FR.map((wd, i) => (
                  <div key={`wd-${i}`} className="px-1 py-0.5 text-center">
                    {wd}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1.5">
                {monthsForYear[calendarMonth].cells.map((cell, idx) =>
                  cell
                    ? renderDayCell(cell, calendarMonth, 'h-12')
                    : <div key={`empty-month-${idx}`} className="h-12 rounded border border-transparent" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Détail jour sélectionné */}
        <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
          <h4 className="mb-3 text-sm font-semibold text-white">
            {selectedDateKey ? `Détail du ${selectedDateKey}` : 'Détail du jour sélectionné'}
          </h4>
          {renderSelectedDayDetails()}
        </div>

        {/* Historique récent */}
        <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
          <h4 className="mb-4 text-lg font-semibold text-white">Historique récent</h4>
          {dailyHistory.length === 0 ? (
            <p className="rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40 px-4 py-6 text-center text-sm text-teal-200/70">
              Aucun tour de circuit enregistré pour le moment.
            </p>
          ) : (
            <ul className="divide-y divide-[#0F4C5C]/30 rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40">
              {dailyHistory.slice(0, 30).map((d) => (
                <li
                  key={d.date}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const dt = new Date(`${d.date}T12:00:00`);
                      setSelectedDateKey(d.date);
                      setCalendarYear(dt.getFullYear());
                      setCalendarMonth(dt.getMonth());
                      setCalendarMode('mois');
                    }}
                    className="font-mono text-white hover:text-sky-200"
                  >
                    {d.date}
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[#1E7FA3]/55 bg-[#1E7FA3]/20 px-2 py-0.5 text-sky-100">
                      {d.totalRounds} tour(s)
                    </span>
                    <span className="rounded-md border border-emerald-500/45 bg-emerald-950/25 px-2 py-0.5 text-emerald-100">
                      {d.completedCircuits} cible(s)
                    </span>
                    {d.tripleAchievedCount > 0 && (
                      <span className="rounded-md border border-amber-400/60 bg-amber-950/30 px-2 py-0.5 text-amber-100">
                        {d.tripleAchievedCount} × 3× cible
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  // ───────────────────────────────────────────────
  // SOUS-VUE : TROPHÉES
  // ───────────────────────────────────────────────
  const renderTrophies = () => {
    const trophies = evaluateCircuitTrophies(data);
    const tierGroups = [
      { id: 'completed', title: 'Cibles atteintes', items: trophies.completedTiers, accent: 'emerald' },
      { id: 'triple', title: '3× cible', items: trophies.tripleTiers, accent: 'amber' },
      { id: 'bonus', title: 'Tours-bonus', items: trophies.bonusRoundTiers, accent: 'sky' },
      { id: 'xp', title: 'XP cumulée', items: trophies.xpTiers, accent: 'amber' }
    ];

    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
          <h4 className="mb-4 text-lg font-semibold text-white">
            Paliers débloqués ({trophies.unlockedCount}/{trophies.totalCount})
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            {tierGroups.map((group) => (
              <section
                key={group.id}
                className="rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40 p-4"
              >
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-teal-200/80">
                  {group.title}
                </p>
                <ul className="space-y-1.5">
                  {group.items.map((tier) => {
                    const pct = tier.threshold > 0 ? Math.min(100, (tier.current / tier.threshold) * 100) : 0;
                    const unlockedClass = tier.unlocked
                      ? group.accent === 'amber'
                        ? 'border-amber-400/60 bg-amber-950/25 text-amber-100'
                        : group.accent === 'sky'
                          ? 'border-sky-500/55 bg-sky-950/25 text-sky-100'
                          : 'border-emerald-500/55 bg-emerald-950/25 text-emerald-100'
                      : 'border-[#0F4C5C]/45 bg-black/60 text-teal-200/70';
                    return (
                      <li
                        key={tier.id}
                        className={`rounded-lg border px-3 py-2 ${unlockedClass}`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            {tier.unlocked ? <Sparkles size={11} /> : <Repeat size={11} />}
                            <span>{tier.label}</span>
                          </span>
                          <span className="tabular-nums">
                            {tier.current.toLocaleString('fr-FR')} / {tier.threshold.toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/60">
                          <div
                            className={`h-full ${
                              tier.unlocked
                                ? group.accent === 'amber'
                                  ? 'bg-amber-400/85'
                                  : group.accent === 'sky'
                                    ? 'bg-sky-400/85'
                                    : 'bg-emerald-400/85'
                                : 'bg-[#0F4C5C]/55'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
          <h4 className="mb-3 text-lg font-semibold text-white">Top circuits (par XP cumulée)</h4>
          {xpSummary.perCircuit.length === 0 ? (
            <p className="rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40 px-4 py-6 text-center text-sm text-teal-200/70">
              Aucun circuit terminé pour le moment.
            </p>
          ) : (
            <ul className="divide-y divide-[#0F4C5C]/30 rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40">
              {xpSummary.perCircuit.slice(0, 8).map((row) => {
                const def = circuitDefinitions[row.circuitId];
                if (!def) return null;
                return (
                  <li
                    key={row.circuitId}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-white">{def.name}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-emerald-500/45 bg-emerald-950/25 px-2 py-0.5 text-emerald-100">
                        {row.completedDays} cible
                      </span>
                      <span className="rounded-md border border-amber-400/55 bg-amber-950/30 px-2 py-0.5 text-amber-100">
                        {row.tripleDays} × 3×
                      </span>
                      <span className="rounded-md border border-[#0F5C45]/60 bg-[#0F5C45]/15 px-2 py-0.5 font-semibold text-white">
                        +{row.xp} XP
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  };

  // ───────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#0F4C5C]/25 p-3">
              <Repeat className="h-7 w-7 text-sky-300" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Défis · Circuits</h3>
              <p className="mt-1 text-sm text-teal-200/80">
                Crée tes circuits, suis les tours réalisés et accumule l'XP. Cible atteinte = 100 XP, chaque tour bonus = 100 XP, palier 3× cible = 250 XP (remplace le bonus standard).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-emerald-600/50 bg-emerald-950/25 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-emerald-200/80">XP circuits</div>
              <div className="text-3xl font-bold text-white tabular-nums">+{xpSummary.totalXp.toLocaleString('fr-FR')}</div>
              <div className="text-[11px] text-emerald-300/75">comptée dans la barre Sport</div>
            </div>
            <div className="rounded-xl border border-[#0F5C45]/60 bg-[#0F5C45]/15 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-teal-200/80">Cibles atteintes</div>
              <div className="text-3xl font-bold text-white tabular-nums">{xpSummary.completedCircuitDays}</div>
              <div className="text-[11px] text-teal-300/70">{xpSummary.tripleAchievedDays} × 3× cible</div>
            </div>
            <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-sky-200/80">Circuits</div>
              <div className="text-3xl font-bold text-white tabular-nums">
                {Object.keys(circuitDefinitions).length}
              </div>
              <div className="text-[11px] text-sky-200/70">en bibliothèque</div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUB_VIEWS.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={tabBtn(view === v.id)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon size={14} /> {v.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 text-xs text-slate-300">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p>
            Les circuits sont partagés : un circuit créé ici ou depuis l'onglet
            <span className="font-medium text-teal-100"> Programme </span>
            apparaît partout (hub, programme, "Aujourd'hui"). Une assignation à un jour de programme
            le fait apparaître automatiquement dans
            <span className="font-medium text-teal-100"> Aujourd'hui </span>
            avec un compteur de tours, et ajoute un badge ci-dessus pour visualiser la liaison.
          </p>
        </div>
      </div>

      {view === 'sessions' && renderSessions()}
      {view === 'stats' && (
        <EnduranceDisciplineStatsPanel
          kind="circuits"
          sessions={[]}
          circuitPayload={{ circuitProgress, circuitDefinitions }}
        />
      )}
      {view === 'calendar' && renderCalendar()}
      {view === 'trophies' && renderTrophies()}

      {editorState && (
        <CircuitEditor
          initialDefinition={editorState.definition}
          programs={programOptions}
          onSave={saveCircuitDefinition}
          onCancel={() => setEditorState(null)}
          onAssignToDay={async (programId, dayName, circuitId) => {
            await assignCircuitToProgramDay(programId, dayName, circuitId, true);
          }}
        />
      )}
    </div>
  );
};

export default CircuitsHubPanel;
