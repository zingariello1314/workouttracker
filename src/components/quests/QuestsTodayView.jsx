import React, { useState, useMemo } from 'react';
import { GripVertical, Trash2, LayoutList, Layers, Clock, CalendarDays } from 'lucide-react';
import {
  getTodayDateStr,
  calculateQuestXP,
} from '../../hooks/useQuietQuestEngine';
import {
  getHeureDisplay,
  getCreneauForQuest,
  getHeureSortMinutes,
  getQuestDureeMinutes,
  CRENEAU_ORDER,
  CRENEAUX,
} from '../../utils/quests';
import QuestsXPBar from './QuestsXPBar';

function getCreneauLabel(value) {
  if (value === 'sans-heure') return 'Sans heure';
  const c = CRENEAUX.find((x) => x.value === value);
  return c ? c.label : value;
}

// ✅ PHASE 2 : Memoization pour éviter re-renders inutiles

// Formatage durée (ex : 90 → "1h30")
function formatDuration(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return '0 min';
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
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
  onReorderForDate,
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

  const handleDrop = (e, targetId, dateStr, slotStartMin) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    const draggedId = draggedQuestId ?? (raw ? (Number(raw) || raw) : null);
    if (draggedId && draggedId !== targetId) {
      // Vue emploi du temps : on passe aussi le créneau cible (slotStartMin)
      if (dateStr && typeof slotStartMin === 'number' && onReorderForDate) {
        onReorderForDate(dateStr, draggedId, targetId || null, slotStartMin);
      } else if (dateStr && targetId && onReorderForDate) {
        onReorderForDate(dateStr, draggedId, targetId);
      } else if (targetId && onReorderToday) {
        onReorderToday(draggedId, targetId);
      }
    }
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
    const importantMinutes = new Set(); // heures exactes de début/fin des quêtes
    dates.forEach((dateStr) => {
      const quests = getQuestsForDate(dateStr) || [];
      quests.forEach((quest) => {
        const startMin = getHeureSortMinutes(quest, dateStr, prayerLocation);
        if (startMin >= 0 && startMin < 24 * 60) {
          uniqueStartMinutes.add(startMin);
          importantMinutes.add(startMin);
        }

        // Ajouter aussi les heures de fin exactes pour les tâches avec durée
        const dureeMin = getQuestDureeMinutes(quest);
        if (startMin >= 0 && startMin < 24 * 60 && dureeMin > 0) {
          const endMin = startMin + dureeMin;
          if (endMin > 0 && endMin < 24 * 60) {
            uniqueStartMinutes.add(endMin);
            importantMinutes.add(endMin);
          }
        }
      });
    });
    // Grille de 15 minutes pour un rendu continu (de 06h00 à ~22h45)
    const dayStartMin = 6 * 60;
    const dayEndMin = 22 * 60 + 45;
    for (let min = dayStartMin; min <= dayEndMin; min += 15) {
      uniqueStartMinutes.add(min);
    }
    const minutesForSlots =
      uniqueStartMinutes.size > 0
        ? Array.from(uniqueStartMinutes).sort((a, b) => a - b)
        : [8 * 60, 12 * 60, 18 * 60];
    const slots = minutesForSlots.map((min) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return {
        startMin: min,
        isImportant: importantMinutes.has(min),
        label: `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`,
      };
    });
    slots.push({ startMin: 24 * 60, isImportant: false, label: 'Sans horaire' });

    const grid = dates.map((dateStr) => {
      const quests = getQuestsForDate(dateStr) || [];
      const row = slots.map(() => []);

      // Intervalles bloquants pour les prières (Maghrib, Isha, etc.)
      const prayerBlocks = [];
      quests.forEach((quest) => {
        const isPrayer = quest.priere || quest.categorie === 'Prière';
        if (!isPrayer) return;
        const startMin = getHeureSortMinutes(quest, dateStr, prayerLocation);
        if (startMin < 0 || startMin >= 24 * 60) return;
        const dureeMin = getQuestDureeMinutes(quest) || 15;
        const endMin = Math.min(24 * 60, startMin + dureeMin);
        prayerBlocks.push({ start: startMin, end: endMin });
      });

      quests.forEach((quest) => {
        const startMin = getHeureSortMinutes(quest, dateStr, prayerLocation);
        const dureeMin = getQuestDureeMinutes(quest);

        // Pas d'heure valide ou "sans horaire" → dernière ligne
        if (startMin >= 24 * 60 || startMin < 0) {
          row[row.length - 1].push({ quest, isStart: true });
          return;
        }

        const totalEndMin = Math.min(24 * 60, startMin + dureeMin);
        if (!dureeMin || totalEndMin <= startMin) {
          const startIndex = slots.findIndex((s) => s.startMin === startMin);
          if (startIndex >= 0) {
            row[startIndex].push({ quest, isStart: true });
          } else {
            row[row.length - 1].push({ quest, isStart: true });
          }
          return;
        }

        const isPrayerQuest = quest.priere || quest.categorie === 'Prière';

        // Construire des segments [segStart, segEnd] en soustrayant les blocs de prière
        const segments = [];
        if (isPrayerQuest || prayerBlocks.length === 0) {
          segments.push({ start: startMin, end: totalEndMin });
        } else {
          let currentStart = startMin;
          const sortedBlocks = [...prayerBlocks].sort((a, b) => a.start - b.start);
          sortedBlocks.forEach((b) => {
            if (b.end <= currentStart || b.start >= totalEndMin) {
              return;
            }
            if (b.start > currentStart) {
              segments.push({ start: currentStart, end: Math.min(b.start, totalEndMin) });
            }
            currentStart = Math.max(currentStart, b.end);
          });
          if (currentStart < totalEndMin) {
            segments.push({ start: currentStart, end: totalEndMin });
          }
        }

        segments.forEach(({ start, end }) => {
          slots.forEach((slot, idx) => {
            const t = slot.startMin;
            if (t < start || t >= end) return;
            const isStartSeg = t === start;
            row[idx].push({ quest, isStart: isStartSeg });
          });
        });
      });

      return row;
    });

    // Plages vides > 3 h : dans la marge, n'afficher que les heures (HHh00)
    const LONG_EMPTY_SLOTS = 12; // 12 × 15 min = 3 h
    const inLongEmptyGap = new Set();
    const numSlots = slots.length - 1; // exclure la ligne "Sans horaire"
    grid.forEach((dayRows) => {
      let runStart = -1;
      for (let i = 0; i < numSlots; i++) {
        const isEmpty = !(dayRows[i] && dayRows[i].length > 0);
        if (isEmpty) {
          if (runStart === -1) runStart = i;
        } else {
          if (runStart !== -1) {
            if (i - runStart >= LONG_EMPTY_SLOTS) {
              for (let j = runStart; j < i; j++) inLongEmptyGap.add(j);
            }
            runStart = -1;
          }
        }
      }
      if (runStart !== -1 && numSlots - runStart >= LONG_EMPTY_SLOTS) {
        for (let j = runStart; j < numSlots; j++) inLongEmptyGap.add(j);
      }
    });
    // Lignes globalement vides (aucune quête sur aucun jour)
    const fullyEmptySlots = Array.from({ length: slots.length }, () => true);
    grid.forEach((dayRows) => {
      dayRows.forEach((cellList, slotIndex) => {
        if (cellList && cellList.length > 0) {
          fullyEmptySlots[slotIndex] = false;
        }
      });
    });

    slots.forEach((slot, i) => {
      slot.inLongEmptyGap = inLongEmptyGap.has(i);
      slot.isFullyEmpty = i < numSlots ? fullyEmptySlots[i] : false;
    });

    return { timetableSlots: slots, timetableGrid: grid, timetableDates: dates };
  }, [viewMode, timetableScope, today, weekDates, getQuestsForDate, prayerLocation]);

  // Pré-calcul des cellules avec rowSpan pour que chaque quête apparaisse
  // comme un seul bloc vertical continu entre son heure de début et de fin.
  const timetableCells = useMemo(() => {
    if (!timetableGrid || !timetableSlots.length || !timetableDates.length) return null;

    const slotCount = timetableSlots.length;
    const dayCount = timetableDates.length;

    const cells = Array.from({ length: slotCount }, () =>
      Array.from({ length: dayCount }, () => ({ type: 'empty', span: 1, quest: null }))
    );

    for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
      const dayRows = timetableGrid[dayIndex] || [];
      for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
        if (cells[slotIndex][dayIndex].type !== 'empty') continue;
        const list = (dayRows[slotIndex] || []);
        if (!list.length) continue;
        const startCell = list.find((c) => c.isStart);
        if (!startCell) continue;

        const questId = startCell.quest.id;
        let span = 1;
        for (let nextSlot = slotIndex + 1; nextSlot < slotCount; nextSlot += 1) {
          const nextList = (dayRows[nextSlot] || []);
          if (nextList.some((c) => c.quest && c.quest.id === questId)) {
            span += 1;
          } else {
            break;
          }
        }

        cells[slotIndex][dayIndex] = { type: 'start', span, quest: startCell.quest };
        for (let covered = slotIndex + 1; covered < slotIndex + span; covered += 1) {
          cells[covered][dayIndex] = { type: 'skip', span: 0, quest: null };
        }
      }
    }

    return cells;
  }, [timetableGrid, timetableSlots, timetableDates]);

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
        className={`relative rounded-2xl border px-4 py-3 text-xs bg-black/80 border-amber-500/35 hover:border-amber-400/55 hover:bg-black/90 transition-all ${
          completed ? 'ring-1 ring-amber-400/50 bg-amber-500/10' : ''
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
            className={`rounded-full mt-1 w-5 h-5 flex items-center justify-center text-[10px] shrink-0 border-2 transition-colors ${
              completed
                ? 'border-amber-400 bg-amber-500 text-amber-950'
                : 'border-amber-700/50 bg-black/80 text-amber-700 hover:border-amber-500'
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
                <span>{formatDuration(getQuestDureeMinutes(quest))}</span>
                <span className="text-slate-500">•</span>
                <span>
                  {'★'.repeat(quest.difficulte || 1)}
                  <span className="text-slate-500 text-[10px] ml-1">({quest.difficulte || 1})</span>
                </span>
              </div>
              <span className="text-amber-300 font-semibold">{xp} XP</span>
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

  const renderTimetableQuestBlock = (quest, dateStr, rowSpan) => {
    const completed = isQuestCompletedOnDate(quest.id, dateStr);
    const xp = quest.xp ?? calculateQuestXP(quest);
    const isDragging = draggedQuestId != null && draggedQuestId === quest.id;
    const canDrag = Boolean((onReorderForDate || onReorderToday) && (timetableGrid?.length ?? 0) > 0);

    // Hauteur basée sur un nombre fixe de pixels par créneau pour rester parfaitement aligné à la grille
    const span = rowSpan && rowSpan > 0 ? rowSpan : 1;
    const baseRowHeight = 40; // doit correspondre à min-h-[2.5rem] des cellules
    const minHeight = 40;
    const blockHeight = Math.max(minHeight, span * baseRowHeight);

    const heureDisplay = getHeureDisplay(quest, dateStr, prayerLocation);

    return (
      <div
        key={`${quest.id}-${dateStr}`}
        role="button"
        tabIndex={0}
        draggable={canDrag}
        onDragStart={(e) => canDrag && handleDragStart(e, quest.id)}
        onDragOver={(e) => canDrag && handleDragOver(e, quest.id)}
        onDragEnd={handleDragEnd}
        onClick={() => openEditQuestPopup?.(quest.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditQuestPopup?.(quest.id); } }}
        className={`group flex items-center gap-2 rounded-lg border px-2 py-1 text-[10px] bg-black/85 border-amber-600/35 hover:border-amber-400/50 transition-colors ${
          completed ? 'ring-1 ring-amber-400/45 bg-amber-500/10' : ''
        } ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isDragging ? 'opacity-60 scale-[0.98]' : ''}`}
        style={{ minHeight: `${blockHeight}px` }}
        title={`${quest.nom} – Cliquer pour modifier`}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleQuestValidation(quest.id, dateStr); }}
          className={`shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] border ${
            completed ? 'bg-amber-500 border-amber-300 text-amber-950' : 'bg-black border-amber-800/50 text-amber-600'
          }`}
          title="Cocher / décocher"
        >
          {completed ? '✓' : ''}
        </button>
        <div className="flex-1 min-w-0 space-y-0">
          {heureDisplay && (
            <div className="text-[9px] text-amber-300/90 font-mono leading-tight">
              {heureDisplay}
            </div>
          )}
          <div className="truncate font-medium text-slate-200">
            {quest.nom}
          </div>
        </div>
        <span className="shrink-0 text-amber-300/95 text-[9px] font-semibold">{xp} XP</span>
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Missions du <span className="text-amber-400">jour</span>
          </h1>
          <p className="text-amber-200/70 text-sm mt-1">
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
                    : 'bg-black/60 border-amber-700/40 text-amber-200/85 hover:border-amber-500/50'
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
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'bg-black/60 border-amber-700/40 text-amber-200/85 hover:border-amber-500/50'
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
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'bg-black/60 border-amber-700/40 text-amber-200/85 hover:border-amber-500/50'
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
          <div className="rounded-2xl border-2 border-amber-400/75 bg-black px-4 py-3 text-xs text-amber-100 flex flex-col gap-1 min-w-[220px] shadow-md shadow-black/40">
          <div className="flex justify-between">
            <span className="text-amber-200/65">Quêtes</span>
            <span className="font-semibold tabular-nums text-amber-50">
              {completedCount}/{questsToday.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-200/65">XP théorique</span>
            <span className="text-amber-200 font-semibold tabular-nums">
              {totalXPTheorique} XP
            </span>
          </div>
          <div className="flex justify-between items-center gap-2 mt-1">
            <span className="text-amber-200/65">Taux de réussite</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-black border border-amber-800/45 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all"
                  style={{ width: `${Math.min(successRate, 100)}%` }}
                />
              </div>
              <span className="font-semibold tabular-nums text-amber-100">{successRate}%</span>
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
                  <th className="sticky left-0 z-10 w-16 min-w-[4rem] bg-slate-800/95 py-1.5 px-1.5 text-left text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
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
                        className={`min-w-[100px] py-1.5 px-1.5 text-center font-semibold border-l border-slate-700/80 text-[10px] ${
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
                {timetableSlots.map((slot, slotIndex) => {
                  const isSansHoraire = slot.startMin >= 24 * 60;
                  const inLongGap = !isSansHoraire && slot.inLongEmptyGap;
                  const isQuarterInLongGap = inLongGap && slot.startMin % 60 !== 0;
                  const showRowBorder =
                    // On enlève les interlignes des 15 minutes UNIQUEMENT dans les grands trous vides (> 3h)
                    !isQuarterInLongGap;
                  return (
                    <tr
                      key={slot.label}
                      className={`${showRowBorder ? 'border-b border-slate-700/80' : ''} hover:bg-slate-800/30 ${
                        isSansHoraire ? 'bg-slate-800/40' : ''
                      }`}
                    >
                      <td className="sticky left-0 z-10 px-1.5 py-2 bg-slate-800/95 border-r border-slate-700/80 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                        {isSansHoraire
                          ? slot.label
                          : slot.inLongEmptyGap
                            ? slot.startMin % 60 === 0
                              ? `${String(Math.floor(slot.startMin / 60)).padStart(2, '0')}h00`
                              : '\u00A0'
                            : slot.label}
                      </td>
                      {timetableDates.map((dateStr, dayIndex) => {
                      const cellInfo =
                        (timetableCells &&
                          timetableCells[slotIndex] &&
                          timetableCells[slotIndex][dayIndex]) ||
                        { type: 'empty', span: 1, quest: null };

                      // Cellule couverte par un rowSpan depuis une ligne précédente
                      if (cellInfo.type === 'skip') {
                        return null;
                      }

                      const isToday = dateStr === today;

                      if (cellInfo.type === 'start' && cellInfo.quest) {
                        return (
                          <td
                            key={dateStr}
                            rowSpan={cellInfo.span}
                            className={`align-top py-1.5 px-1.5 border-l border-slate-700/60 min-h-[2.5rem] ${
                              isToday ? 'bg-cyan-500/5' : ''
                            }`}
                            onDragOver={(e) => {
                              if (draggedQuestId != null && (onReorderForDate || onReorderToday)) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                              }
                            }}
                            onDrop={(e) => {
                              if (draggedQuestId != null) {
                                handleDrop(e, null, dateStr, slot.startMin);
                              }
                            }}
                          >
                            <div className="space-y-1">
                              {renderTimetableQuestBlock(
                                cellInfo.quest,
                                dateStr,
                                cellInfo.span
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Cellule vide (aucune quête sur ce créneau pour ce jour)
                      return (
                        <td
                          key={dateStr}
                          className={`align-top py-1.5 px-1.5 border-l border-slate-700/60 min-h-[2.5rem] ${
                            isToday ? 'bg-cyan-500/5' : ''
                          }`}
                          onDragOver={(e) => {
                            if (draggedQuestId != null && (onReorderForDate || onReorderToday)) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }
                          }}
                          onDrop={(e) => {
                            if (draggedQuestId != null) {
                              handleDrop(e, null, dateStr, slot.startMin);
                            }
                          }}
                        />
                      );
                    })}
                  </tr>
                );
              })}
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
    prevProps.onReorderForDate === nextProps.onReorderForDate &&
    prevProps.draggedQuestId === nextProps.draggedQuestId &&
    prevProps.clearDrag === nextProps.clearDrag &&
    prevProps.deleteQuest === nextProps.deleteQuest
  );
});

