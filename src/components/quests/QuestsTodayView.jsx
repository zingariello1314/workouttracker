import React, { useState, useMemo } from 'react';
import { GripVertical, Trash2, LayoutList, Layers, Clock, CalendarDays } from 'lucide-react';
import {
  getTodayDateStr,
  calculateQuestXP,
} from '../../hooks/useQuietQuestEngine';
import { getHeureDisplay, getCreneauForQuest, getHeureSortMinutes, CRENEAU_ORDER, CRENEAUX } from '../../utils/quests';
import QuestsXPBar from './QuestsXPBar';

function getCreneauLabel(value) {
  if (value === 'sans-heure') return 'Sans heure';
  const c = CRENEAUX.find((x) => x.value === value);
  return c ? c.label : value;
}

// ✅ PHASE 2 : Memoization pour éviter re-renders inutiles

// Formatage durée (ex : 90 → "1h30")
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

const QuestsTodayView = ({
  allQuests,
  isQuestCompletedOnDate,
  toggleQuestValidation,
  getQuestsForDate,
  userData,
  validations,
  isLoading,
  openNewQuestPopup,
  openEditQuestPopup,
  startDrag,
  onReorderToday,
  draggedQuestId,
  clearDrag,
  deleteQuest,
  todayDate: todayDateProp,
  prayerLocation,
}) => {
  const [viewMode, setViewMode] = useState('creneau'); // 'creneau' | 'category' | 'timetable'
  const [timetableScope, setTimetableScope] = useState('day'); // 'day' | 'week' — par défaut uniquement le jour
  // todayDate du moteur (mis à jour après minuit) pour afficher le bon jour et des quêtes décochées
  const today = todayDateProp != null ? todayDateProp : getTodayDateStr();
  const questsToday = getQuestsForDate(today);
  const completedCount = questsToday.filter((q) =>
    isQuestCompletedOnDate(q.id, today)
  ).length;
  const totalXPTheorique = questsToday.reduce(
    (sum, q) => sum + (q.xp ?? calculateQuestXP(q)),
    0
  );
  const successRate =
    questsToday.length > 0
      ? Math.round((completedCount / questsToday.length) * 100)
      : 0;

  const handleDragStart = (e, questId) => {
    if (startDrag) startDrag(questId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(questId));
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    const draggedId = draggedQuestId ?? (raw ? (Number(raw) || raw) : null);
    if (onReorderToday && draggedId && targetId && draggedId !== targetId) onReorderToday(draggedId, targetId);
    if (clearDrag) clearDrag();
  };

  const handleDragEnd = () => {
    if (clearDrag) clearDrag();
  };

  const handleDelete = (e, questId) => {
    e.stopPropagation();
    if (deleteQuest) deleteQuest(questId);
  };

  const questsByCategory = useMemo(() => {
    if (viewMode !== 'category' || questsToday.length === 0) return null;
    const map = new Map();
    questsToday.forEach((q) => {
      const cat = q.categorie || 'Autre';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(q);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [viewMode, questsToday]);

  const questsByCreneau = useMemo(() => {
    if (viewMode !== 'creneau' || questsToday.length === 0) return null;
    const groups = {};
    CRENEAU_ORDER.forEach((c) => { groups[c] = []; });
    questsToday.forEach((q) => {
      const creneau = getCreneauForQuest(q, today, prayerLocation);
      if (groups[creneau]) groups[creneau].push(q);
      else groups[creneau] = [q];
    });
    return groups;
  }, [viewMode, questsToday, today, prayerLocation]);

  // Semaine (Lun–Dim) contenant today, pour la vue emploi du temps
  const weekDates = useMemo(() => {
    const d = new Date(today + 'T12:00:00');
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(monday.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(monday);
      x.setDate(monday.getDate() + i);
      return x.toISOString().slice(0, 10);
    });
  }, [today]);

  // Emploi du temps : jour seul ou semaine, calé sur les heures réelles des quêtes
  const { timetableSlots, timetableGrid, timetableDates } = useMemo(() => {
    if (viewMode !== 'timetable' || !getQuestsForDate) {
      return { timetableSlots: [], timetableGrid: null, timetableDates: [] };
    }
    const dates = timetableScope === 'day' ? [today] : weekDates;
    const uniqueStartMinutes = new Set();
    dates.forEach((dateStr) => {
      const quests = getQuestsForDate(dateStr) || [];
      quests.forEach((quest) => {
        const startMin = getHeureSortMinutes(quest, dateStr, prayerLocation);
        if (startMin < 24 * 60) uniqueStartMinutes.add(startMin);
      });
    });
    const sortedMinutes = Array.from(uniqueStartMinutes).sort((a, b) => a - b);
    const minutesForSlots =
      sortedMinutes.length > 0 ? sortedMinutes : [8 * 60, 12 * 60, 18 * 60];
    const slots = minutesForSlots.map((min) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return {
        label: `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`,
        startMin: min,
      };
    });
    slots.push({ label: 'Sans horaire', startMin: 24 * 60 });

    const grid = dates.map((dateStr) => {
      const quests = getQuestsForDate(dateStr) || [];
      const row = slots.map(() => []);
      quests.forEach((quest) => {
        const startMin = getHeureSortMinutes(quest, dateStr, prayerLocation);
        if (startMin >= 24 * 60) {
          row[row.length - 1].push(quest);
        } else {
          const slotIndex = slots.findIndex((s) => s.startMin === startMin);
          if (slotIndex >= 0) row[slotIndex].push(quest);
          else row[row.length - 1].push(quest);
        }
      });
      return row;
    });
    return { timetableSlots: slots, timetableGrid: grid, timetableDates: dates };
  }, [viewMode, timetableScope, today, weekDates, getQuestsForDate, prayerLocation]);

  const renderQuestCard = (quest, index, listForDrag) => {
    const completed = isQuestCompletedOnDate(quest.id, today);
    const xp = quest.xp ?? calculateQuestXP(quest);
    const heureDisplay = getHeureDisplay(quest, today, prayerLocation);
    const isDragging = draggedQuestId != null && draggedQuestId === quest.id;
    const canDrag = Boolean(onReorderToday && listForDrag.length > 1);
    return (
      <div
        key={`quest-today-${String(quest.id)}-${index}`}
        role="button"
        tabIndex={0}
        draggable={canDrag}
        onDragStart={(e) => canDrag && handleDragStart(e, quest.id)}
        onDragOver={(e) => canDrag && handleDragOver(e, quest.id)}
        onDrop={(e) => canDrag && handleDrop(e, quest.id)}
        onDragEnd={handleDragEnd}
        onClick={() => openEditQuestPopup?.(quest.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditQuestPopup?.(quest.id); } }}
        className={`relative rounded-2xl border px-4 py-3 text-xs bg-slate-900/70 border-slate-700/80 hover:border-emerald-400/70 hover:bg-slate-900 transition-all ${
          completed ? 'ring-1 ring-emerald-400/60' : ''
        } ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isDragging ? 'opacity-60 scale-[0.98]' : ''}`}
        title="Cliquer pour modifier la quête"
      >
        <div className="flex items-start gap-3">
          {canDrag && (
            <span
              className="mt-1 shrink-0 text-slate-500 hover:text-slate-400 cursor-grab active:cursor-grabbing select-none"
              title="Glisser pour réordonner"
              aria-hidden
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </span>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleQuestValidation(quest.id, today); }}
            className={`gradient-button-premium gradient-button-premium-sm rounded-full mt-1 w-5 h-5 flex items-center justify-center text-[10px] shrink-0 ${
              completed ? 'gradient-button-premium-variant' : ''
            }`}
            title="Cocher / décocher"
          >
            {completed ? '✓' : ''}
          </button>
          <div className="flex-1 space-y-1 min-w-0 pr-6">
            <div className="font-semibold text-slate-100 line-clamp-2 flex items-center gap-2 flex-wrap">
              {heureDisplay ? (
                <span className="shrink-0 text-amber-400/90 text-[11px] font-mono" title="Heure prévue">
                  {heureDisplay}
                </span>
              ) : null}
              <span>{quest.nom}</span>
            </div>
            <div className="text-[10px] text-slate-400">{quest.categorie}</div>
            {quest.description && (
              <div className="text-[11px] text-slate-400 line-clamp-2">{quest.description}</div>
            )}
            <div className="flex justify-between items-center text-[11px] text-slate-300 mt-1">
              <div className="flex items-center gap-2">
                <span>{formatDuration(quest.duree || 0)}</span>
                <span className="text-slate-500">•</span>
                <span>
                  {'★'.repeat(quest.difficulte || 1)}
                  <span className="text-slate-500 text-[10px] ml-1">({quest.difficulte || 1})</span>
                </span>
              </div>
              <span className="text-emerald-300 font-semibold">{xp} XP</span>
            </div>
          </div>
          {deleteQuest && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDelete(e, quest.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors z-10"
              title="Supprimer la quête"
              aria-label={`Supprimer ${quest.nom}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
    </div>
  );
  };

  const renderTimetableQuestChip = (quest, dateStr) => {
    const completed = isQuestCompletedOnDate(quest.id, dateStr);
    const xp = quest.xp ?? calculateQuestXP(quest);
    return (
      <div
        key={quest.id}
        role="button"
        tabIndex={0}
        onClick={() => openEditQuestPopup?.(quest.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditQuestPopup?.(quest.id); } }}
        className={`group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[11px] bg-slate-800/90 border-slate-600 hover:border-emerald-400/60 cursor-pointer transition-colors ${
          completed ? 'ring-1 ring-emerald-400/50' : ''
        }`}
        title={`${quest.nom} – Cliquer pour modifier`}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleQuestValidation(quest.id, dateStr); }}
          className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
            completed ? 'bg-emerald-500/80 text-white' : 'bg-slate-600 text-slate-400'
          }`}
          title="Cocher / décocher"
        >
          {completed ? '✓' : ''}
        </button>
        <span className="flex-1 min-w-0 truncate font-medium text-slate-200">{quest.nom}</span>
        <span className="shrink-0 text-emerald-400/90 text-[10px]">{xp} XP</span>
        {deleteQuest && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(e, quest.id); }}
            className="shrink-0 p-0.5 rounded text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            title="Supprimer"
            aria-label={`Supprimer ${quest.nom}`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <QuestsXPBar userData={userData} validations={validations} allQuests={allQuests} isLoading={isLoading} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Missions du <span className="text-emerald-400">jour</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Vue rapide de toutes les quêtes actives prévues pour aujourd&apos;hui.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {questsToday.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setViewMode('creneau')}
                className={`rounded-lg inline-flex items-center gap-2 px-3 py-2 text-sm border transition-colors ${
                  viewMode === 'creneau'
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                    : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
                title="Ordre par heure prévue"
              >
                <Clock className="w-4 h-4" />
                <span>Par heure</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('category')}
                className={`rounded-lg inline-flex items-center gap-2 px-3 py-2 text-sm border transition-colors ${
                  viewMode === 'category'
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
                title="Grouper par catégorie"
              >
                {viewMode === 'category' ? <LayoutList className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                <span>Par catégorie</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timetable')}
                className={`rounded-lg inline-flex items-center gap-2 px-3 py-2 text-sm border transition-colors ${
                  viewMode === 'timetable'
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                    : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
                title="Vue emploi du temps (semaine)"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Emploi du temps</span>
              </button>
            </>
          )}
          {openNewQuestPopup && (
            <button
              type="button"
              onClick={openNewQuestPopup}
              className="gradient-button-premium gradient-button-premium-md rounded-lg inline-flex items-center gap-2"
            >
              <span>＋</span>
              <span>Nouvelle quête</span>
            </button>
          )}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-100 flex flex-col gap-1 min-w-[220px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Quêtes</span>
            <span>
              {completedCount}/{questsToday.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">XP théorique</span>
            <span className="text-emerald-300 font-semibold">
              {totalXPTheorique} XP
            </span>
          </div>
          <div className="flex justify-between items-center gap-2 mt-1">
            <span className="text-slate-400">Taux de réussite</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                  style={{ width: `${Math.min(successRate, 100)}%` }}
                />
              </div>
              <span className="font-semibold">{successRate}%</span>
            </div>
          </div>
          </div>
        </div>
      </div>

      {questsToday.length === 0 ? (
        <div className="mt-8 text-center text-sm text-slate-400">
          Aucune quête prévue pour aujourd&apos;hui.{' '}
          {openNewQuestPopup ? (
            <>Ajoute une mission avec le bouton <strong>Nouvelle quête</strong> ci-dessus.</>
          ) : (
            <>Crée une nouvelle mission dans l&apos;onglet &quot;Mes quêtes&quot;.</>
          )}
        </div>
      ) : viewMode === 'timetable' && timetableGrid ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setTimetableScope(timetableScope === 'day' ? 'week' : 'day')}
              className="rounded-lg inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-600 bg-slate-800/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
              title={timetableScope === 'day' ? 'Afficher les 7 jours de la semaine' : 'Revenir au jour seul'}
            >
              <CalendarDays className="w-4 h-4" />
              <span>{timetableScope === 'day' ? 'Voir la semaine' : 'Voir le jour seulement'}</span>
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/50">
            <table className="w-full min-w-[320px] text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="sticky left-0 z-10 w-20 min-w-[5rem] bg-slate-800/95 py-3 px-2 text-left text-slate-400 font-semibold uppercase tracking-wider">
                    Heure
                  </th>
                  {timetableDates.map((dateStr) => {
                    const d = new Date(dateStr + 'T12:00:00');
                    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                    const isToday = dateStr === today;
                    const label =
                      timetableScope === 'day'
                        ? "Aujourd'hui"
                        : `${dayNames[d.getDay()]} ${d.getDate()}`;
                    return (
                      <th
                        key={dateStr}
                        className={`min-w-[120px] py-3 px-2 text-center font-semibold border-l border-slate-700/80 ${
                          isToday ? 'bg-cyan-500/15 text-cyan-300' : 'bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        {label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timetableSlots.map((slot, slotIndex) => (
                  <tr
                    key={slot.label}
                    className={`border-b border-slate-700/80 hover:bg-slate-800/30 ${
                      slot.startMin >= 24 * 60 ? 'bg-slate-800/40' : ''
                    }`}
                  >
                    <td className="sticky left-0 z-10 py-2 px-2 bg-slate-800/95 border-r border-slate-700/80 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {slot.label}
                    </td>
                    {timetableDates.map((dateStr, dayIndex) => {
                      const quests = timetableGrid[dayIndex][slotIndex] || [];
                      const isToday = dateStr === today;
                      return (
                        <td
                          key={dateStr}
                          className={`align-top py-1.5 px-1.5 border-l border-slate-700/60 min-h-[2.5rem] ${
                            isToday ? 'bg-cyan-500/5' : ''
                          }`}
                        >
                          <div className="space-y-1">
                            {quests.map((quest) => renderTimetableQuestChip(quest, dateStr))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'category' && questsByCategory ? (
        <div className="space-y-6">
          {questsByCategory.map(([categorie, quests]) => (
            <div key={categorie}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-slate-600/80" />
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider px-2">
                  {categorie}
                </h2>
                <div className="h-px flex-1 bg-slate-600/80" />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {quests.map((quest, index) => renderQuestCard(quest, index, quests))}
              </div>
            </div>
          ))}
        </div>
      ) : questsByCreneau ? (
        <div className="space-y-6">
          {CRENEAU_ORDER.map((creneau) => {
            const quests = questsByCreneau[creneau] || [];
            if (quests.length === 0) return null;
            return (
              <div key={creneau}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-amber-500/30" />
                  <h2 className="text-sm font-semibold text-amber-400/95 uppercase tracking-wider px-2">
                    {getCreneauLabel(creneau)}
                  </h2>
                  <div className="h-px flex-1 bg-amber-500/30" />
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {quests.map((quest, index) => renderQuestCard(quest, index, quests))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {questsToday.map((quest, index) => renderQuestCard(quest, index, questsToday))}
        </div>
      )}
    </div>
  );
};

// ✅ PHASE 2 : Memoization pour éviter re-renders inutiles
// Inclure les validations pour que les coche/décoche se répercutent immédiatement
export default React.memo(QuestsTodayView, (prevProps, nextProps) => {
  return (
    prevProps.allQuests === nextProps.allQuests &&
    prevProps.userData === nextProps.userData &&
    prevProps.validations === nextProps.validations &&
    prevProps.isQuestCompletedOnDate === nextProps.isQuestCompletedOnDate &&
    prevProps.toggleQuestValidation === nextProps.toggleQuestValidation &&
    prevProps.getQuestsForDate === nextProps.getQuestsForDate &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.openNewQuestPopup === nextProps.openNewQuestPopup &&
    prevProps.openEditQuestPopup === nextProps.openEditQuestPopup &&
    prevProps.prayerLocation === nextProps.prayerLocation &&
    prevProps.todayDate === nextProps.todayDate &&
    prevProps.startDrag === nextProps.startDrag &&
    prevProps.onReorderToday === nextProps.onReorderToday &&
    prevProps.draggedQuestId === nextProps.draggedQuestId &&
    prevProps.clearDrag === nextProps.clearDrag &&
    prevProps.deleteQuest === nextProps.deleteQuest
  );
});

