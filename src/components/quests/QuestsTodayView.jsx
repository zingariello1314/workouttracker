import React, { useState, useMemo } from 'react';
import { GripVertical, Trash2, LayoutList, Layers, Clock } from 'lucide-react';
import {
  getTodayDateStr,
  calculateQuestXP,
} from '../../hooks/useQuietQuestEngine';
import QuestsXPBar from './QuestsXPBar';

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
  startDrag,
  onReorderToday,
  draggedQuestId,
  clearDrag,
  deleteQuest,
  todayDate: todayDateProp,
}) => {
  const [groupByCategory, setGroupByCategory] = useState(false);
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
    if (!groupByCategory || questsToday.length === 0) return null;
    const map = new Map();
    questsToday.forEach((q) => {
      const cat = q.categorie || 'Autre';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(q);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [groupByCategory, questsToday]);

  const renderQuestCard = (quest, index, listForDrag) => {
    const completed = isQuestCompletedOnDate(quest.id, today);
    const xp = quest.xp ?? calculateQuestXP(quest);
    const isDragging = draggedQuestId != null && draggedQuestId === quest.id;
    const canDrag = Boolean(onReorderToday && listForDrag.length > 1);
    return (
      <div
        key={`quest-today-${String(quest.id)}-${index}`}
        draggable={canDrag}
        onDragStart={(e) => canDrag && handleDragStart(e, quest.id)}
        onDragOver={(e) => canDrag && handleDragOver(e, quest.id)}
        onDrop={(e) => canDrag && handleDrop(e, quest.id)}
        onDragEnd={handleDragEnd}
        className={`relative rounded-2xl border px-4 py-3 text-xs bg-slate-900/70 border-slate-700/80 hover:border-emerald-400/70 hover:bg-slate-900 transition-all ${
          completed ? 'ring-1 ring-emerald-400/60' : ''
        } ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-60 scale-[0.98]' : ''}`}
      >
        <div className="flex items-start gap-3">
          {canDrag && (
            <span
              className="mt-1 shrink-0 text-slate-500 hover:text-slate-400 cursor-grab active:cursor-grabbing select-none"
              title="Glisser pour réordonner"
              aria-hidden
            >
              <GripVertical className="w-4 h-4" />
            </span>
          )}
          <button
            type="button"
            onClick={() => toggleQuestValidation(quest.id, today)}
            className={`gradient-button-premium gradient-button-premium-sm rounded-full mt-1 w-5 h-5 flex items-center justify-center text-[10px] shrink-0 ${
              completed ? 'gradient-button-premium-variant' : ''
            }`}
          >
            {completed ? '✓' : ''}
          </button>
          <div className="flex-1 space-y-1 min-w-0 pr-6">
            <div className="font-semibold text-slate-100 line-clamp-2 flex items-center gap-2 flex-wrap">
              {quest.heure && (
                <span className="shrink-0 text-amber-400/90 text-[11px] font-mono" title="Heure prévue">
                  {quest.heure}
                </span>
              )}
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
              onClick={(e) => handleDelete(e, quest.id)}
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
                onClick={() => setGroupByCategory(false)}
                className={`rounded-lg inline-flex items-center gap-2 px-3 py-2 text-sm border transition-colors ${
                  !groupByCategory
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                    : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
                title="Ordre par heure prévue (emploi du temps)"
              >
                <Clock className="w-4 h-4" />
                <span>Par heure</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupByCategory(true)}
                className={`rounded-lg inline-flex items-center gap-2 px-3 py-2 text-sm border transition-colors ${
                  groupByCategory
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
                title="Grouper par catégorie"
              >
                {groupByCategory ? <LayoutList className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                <span>Par catégorie</span>
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
      ) : groupByCategory && questsByCategory ? (
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
    prevProps.startDrag === nextProps.startDrag &&
    prevProps.onReorderToday === nextProps.onReorderToday &&
    prevProps.draggedQuestId === nextProps.draggedQuestId &&
    prevProps.clearDrag === nextProps.clearDrag &&
    prevProps.deleteQuest === nextProps.deleteQuest
  );
});

