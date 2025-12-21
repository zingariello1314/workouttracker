import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../ui/Toast';
import {
  useQuietQuestEngine,
  STORAGE_KEYS,
  META_KEYS,
  defaultUserData,
  loadFromStorage,
  saveToStorage,
  calculateQuestXP,
  getTodayDateStr,
} from '../../hooks/useQuietQuestEngine';
import {
  exportQuietQuestData,
  importQuietQuestData,
  validateQuietQuestExport,
} from '../../utils/quietQuestExportImport';
import { openQuietQuestDB, clearQuietQuestStores } from '../../utils/quietQuestIndexedDB';
import { emitSidebarEvent, SIDEBAR_EVENTS } from '../../utils/sidebarEvents';
import QuestsTodayView from '../quests/QuestsTodayView';
import QuestsWeekView from '../quests/QuestsWeekView';
import QuestsStatsView from '../quests/stats/QuestsStatsView';

// Formatage durée (ex : 90 → "1h30")
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

const CATEGORIES = ['Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Ménage', 'Spirituel'];

const DIFFICULTIES = [
  { value: 1, label: 'Facile' },
  { value: 2, label: 'Moyen' },
  { value: 3, label: 'Difficile' },
  { value: 4, label: 'Épique' },
];

const JOUR_OPTIONS = [
  { value: 'all', label: 'Tous les jours' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

const recurrencePresets = [
  { label: 'Tous les jours', jours: [1, 2, 3, 4, 5, 6, 7] },
  { label: 'Semaine', jours: [1, 2, 3, 4, 5] },
  { label: 'Week‑end', jours: [6, 7] },
];

// Génère les options de durée (5 à 420 min, pas de 10)
const durationOptions = Array.from({ length: (420 - 5) / 10 + 1 }, (_, i) => 5 + i * 10);

const QuestsTab = () => {
  // Onglet interne QuietQuest (today / week / quests / stats / security)
  const [currentSubTab, setCurrentSubTab] = useState('today');

  // Émettre un événement lors du changement de sous-onglet pour la rotation des images de profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: currentSubTab, isSubTab: true } 
    }));
  }, [currentSubTab]);

  // Toast notifications
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // Moteur QuietQuest centralisé
  const {
    allQuests,
    setAllQuests,
    userData,
    setUserData,
    validations,
    dailyPerformances,
    validationsByDate,
    isQuestCompletedOnDate,
    toggleQuestValidation,
    getQuestsForDate: getQuestsForDateMemoized,
  } = useQuietQuestEngine();

  // État de filtres / recherche / tri
  const [searchQuery, setSearchQuery] = useState('');
  const [questFilters, setQuestFilters] = useState({
    categorie: 'all',
    difficulte: 'all',
    jour: 'all',
    showInactive: false,
  });

  const [sortConfig, setSortConfig] = useState({
    column: null,
    direction: 'asc',
  });

  const [selectedPeriod, setSelectedPeriod] = useState('30d'); // '7d' | '30d' | '90d' | '180d' | '365d' | 'all'

  // Sélection multiple
  const [selectedQuests, setSelectedQuests] = useState(new Set());

  // Drag & drop
  const [draggedQuestId, setDraggedQuestId] = useState(null);

  // Popup de création / édition
  const [showQuestPopup, setShowQuestPopup] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState(null);
  const [questForm, setQuestForm] = useState({
    nom: '',
    description: '',
    categorie: CATEGORIES[0],
    difficulte: 1,
    duree: 30,
    type: 'recurrente', // 'recurrente' | 'exceptionnelle'
    jours: [1, 2, 3, 4, 5],
    date: '',
    active: true,
  });

  // Chargement / sauvegarde de l’état d’UI Quêtes (filtres + tri)
  useEffect(() => {
    const appState = loadFromStorage(STORAGE_KEYS.appState, {});
    saveToStorage(STORAGE_KEYS.appState, {
      ...appState,
      version: 1,
      questFilters,
      questSortConfig: sortConfig,
    });
  }, [questFilters, sortConfig]);

  // --- Filtres + tri -------------------------------------------------------

  const filteredAndSortedQuests = useMemo(() => {
    let result = [...allQuests];

    // Filtre catégorie
    if (questFilters.categorie !== 'all') {
      result = result.filter((q) => q.categorie === questFilters.categorie);
    }

    // Filtre difficulté
    if (questFilters.difficulte !== 'all') {
      const d = parseInt(questFilters.difficulte, 10);
      result = result.filter((q) => q.difficulte === d);
    }

    // Filtre jour / exceptionnelles
    if (questFilters.jour === 'exceptionnelles') {
      result = result.filter((q) => q.type === 'exceptionnelle');
    } else if (questFilters.jour !== 'all') {
      const day = Number(questFilters.jour);
      result = result.filter(
        (q) => q.type === 'recurrente' && Array.isArray(q.jours) && q.jours.includes(day)
      );
    }

    // Filtre actifs / inactifs
    if (!questFilters.showInactive) {
      result = result.filter((q) => q.active !== false);
    }

    // Recherche textuelle
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((quest) => {
        const nom = quest.nom?.toLowerCase() || '';
        const desc = quest.description?.toLowerCase() || '';
        const cat = quest.categorie?.toLowerCase() || '';
        return nom.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    // Tri
    if (sortConfig.column) {
      const { column, direction } = sortConfig;
      const factor = direction === 'asc' ? 1 : -1;

      result.sort((a, b) => {
        const va = (() => {
          switch (column) {
            case 'nom':
              return a.nom?.toLowerCase() || '';
            case 'categorie':
              return a.categorie || '';
            case 'difficulte':
              return a.difficulte || 0;
            case 'duree':
              return a.duree || 0;
            case 'xp':
              return a.xp ?? calculateQuestXP(a);
            case 'recurrence':
              return Array.isArray(a.jours) ? a.jours.length : 0;
            default:
              return 0;
          }
        })();

        const vb = (() => {
          switch (column) {
            case 'nom':
              return b.nom?.toLowerCase() || '';
            case 'categorie':
              return b.categorie || '';
            case 'difficulte':
              return b.difficulte || 0;
            case 'duree':
              return b.duree || 0;
            case 'xp':
              return b.xp ?? calculateQuestXP(b);
            case 'recurrence':
              return Array.isArray(b.jours) ? b.jours.length : 0;
            default:
              return 0;
          }
        })();

        if (va < vb) return -1 * factor;
        if (va > vb) return 1 * factor;
        return 0;
      });
    }

    // Tiebreak global par ordre manuel si présent
    result.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

    return result;
  }, [allQuests, questFilters, searchQuery, sortConfig]);

  const hasSelectedQuests = selectedQuests.size > 0;

  // --- Gestion du tri ------------------------------------------------------

  const sortQuests = (column) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { column, direction: 'asc' };
    });
  };

  const getSortIcon = (column) => {
    if (sortConfig.column !== column) return '↕️';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  // --- Sélection multiple --------------------------------------------------

  const toggleQuestSelection = (id) => {
    setSelectedQuests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllQuests = () => {
    if (selectedQuests.size === filteredAndSortedQuests.length) {
      setSelectedQuests(new Set());
      return;
    }
    setSelectedQuests(new Set(filteredAndSortedQuests.map((q) => q.id)));
  };

  // --- CRUD sur les quêtes -------------------------------------------------

  const openNewQuestPopup = () => {
    setEditingQuestId(null);
    setQuestForm({
      nom: '',
      description: '',
      categorie: CATEGORIES[0],
      difficulte: 1,
      duree: 30,
      type: 'recurrente',
      jours: [1, 2, 3, 4, 5],
      date: '',
      active: true,
    });
    setShowQuestPopup(true);
  };

  const openEditQuestPopup = (id) => {
    const quest = allQuests.find((q) => q.id === id);
    if (!quest) return;
    setEditingQuestId(id);
    setQuestForm({
      nom: quest.nom || '',
      description: quest.description || '',
      categorie: quest.categorie || CATEGORIES[0],
      difficulte: quest.difficulte || 1,
      duree: quest.duree || 30,
      type: quest.type || 'recurrente',
      jours: Array.isArray(quest.jours) ? [...quest.jours] : [],
      date: quest.date || '',
      active: quest.active !== false,
    });
    setShowQuestPopup(true);
  };

  const closeQuestPopup = () => {
    setShowQuestPopup(false);
  };

  const saveQuestFromForm = () => {
    // Validation minimale (nom + cohérence type)
    if (!questForm.nom.trim()) {
      showError('Le nom de la quête est obligatoire.');
      return;
    }
    if (questForm.type === 'recurrente' && (!questForm.jours || questForm.jours.length === 0)) {
      showError('Sélectionne au moins un jour pour une quête récurrente.');
      return;
    }
    if (questForm.type === 'exceptionnelle' && !questForm.date) {
      showError('Choisis une date pour une quête exceptionnelle.');
      return;
    }

    const isEditing = editingQuestId != null;
    setAllQuests((prev) => {
      if (isEditing) {
        // Edition
        const updated = prev.map((q) =>
          q.id === editingQuestId
            ? {
                ...q,
                ...questForm,
                xp: calculateQuestXP({ ...q, ...questForm }),
              }
            : q
        );
        
        // Emit sidebar event for quest update
        emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { questId: editingQuestId });
        
        return updated;
      }

      // Création
      const nextId = prev.length ? Math.max(...prev.map((q) => q.id || 0)) + 1 : 1;
      const baseQuest = {
        id: nextId,
        ...questForm,
        creeLe: new Date().toISOString().slice(0, 10),
        ordre: prev.length + 1,
      };
      const newQuest = {
        ...baseQuest,
        xp: calculateQuestXP(baseQuest),
      };
      
      // Emit sidebar event for quest creation
      emitSidebarEvent(SIDEBAR_EVENTS.QUEST_CREATED, { questId: nextId });
      
      return [...prev, newQuest];
    });

    showSuccess(isEditing ? 'Quête modifiée avec succès' : 'Quête créée avec succès');
    setShowQuestPopup(false);
  };

  const toggleQuestActive = (id) => {
    setAllQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, active: !q.active } : q))
    );
    
    // Emit sidebar event for quest update (affects today's quests if it's a today quest)
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { questId: id });
  };

  const deleteQuest = (id) => {
    const quest = allQuests.find((q) => q.id === id);
    const questName = quest?.nom || 'cette quête';
    if (
      !window.confirm(
        `Supprimer définitivement "${questName}" ?\n\nCette action est irréversible. Toutes les validations associées seront également supprimées.`
      )
    )
      return;
    setAllQuests((prev) => prev.filter((q) => q.id !== id));
    setSelectedQuests((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    
    // Emit sidebar event for quest deletion (affects today's count if it was a today quest)
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { questId: id, deleted: true });
    
    showSuccess(`Quête "${questName}" supprimée`);
  };

  const duplicateQuest = (id) => {
    const original = allQuests.find((q) => q.id === id);
    if (!original) return;

    setAllQuests((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((q) => q.id || 0)) + 1 : 1;
      const copy = {
        ...original,
        id: nextId,
        nom: `${original.nom} (copie)`,
        creeLe: new Date().toISOString().slice(0, 10),
        ordre: prev.length + 1,
      };
      
      // Emit sidebar event for quest creation
      emitSidebarEvent(SIDEBAR_EVENTS.QUEST_CREATED, { questId: nextId });
      
      return [...prev, copy];
    });
    showSuccess(`Quête "${original.nom}" dupliquée`);
  };

  // --- Actions en lot ------------------------------------------------------

  const bulkActivate = () => {
    if (!hasSelectedQuests) return;
    const count = selectedQuests.size;
    setAllQuests((prev) =>
      prev.map((q) =>
        selectedQuests.has(q.id)
          ? {
              ...q,
              active: true,
            }
          : q
      )
    );
    
    // Emit sidebar event for bulk quest update
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { bulk: true, count });
    
    setSelectedQuests(new Set());
    showSuccess(`${count} quête${count > 1 ? 's' : ''} activée${count > 1 ? 's' : ''}`);
  };

  const bulkDeactivate = () => {
    if (!hasSelectedQuests) return;
    const count = selectedQuests.size;
    setAllQuests((prev) =>
      prev.map((q) =>
        selectedQuests.has(q.id)
          ? {
              ...q,
              active: false,
            }
          : q
      )
    );
    
    // Emit sidebar event for bulk quest update
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { bulk: true, count });
    
    setSelectedQuests(new Set());
    showInfo(`${count} quête${count > 1 ? 's' : ''} désactivée${count > 1 ? 's' : ''}`);
  };

  const bulkDelete = () => {
    if (!hasSelectedQuests) return;
    const count = selectedQuests.size;
    if (
      !window.confirm(
        `Supprimer définitivement ${count} quête${count > 1 ? 's' : ''} ?\n\nCette action est irréversible. Toutes les validations associées seront également supprimées.`
      )
    )
      return;
    setAllQuests((prev) => prev.filter((q) => !selectedQuests.has(q.id)));
    
    // Emit sidebar event for bulk quest deletion
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { bulk: true, count, deleted: true });
    
    setSelectedQuests(new Set());
    showSuccess(`${count} quête${count > 1 ? 's' : ''} supprimée${count > 1 ? 's' : ''}`);
  };

  // --- Drag & drop ---------------------------------------------------------

  const startDrag = (id) => {
    setDraggedQuestId(id);
  };

  const onDrop = (targetId) => {
    if (!draggedQuestId || draggedQuestId === targetId) return;

    setAllQuests((prev) => {
      const sourceIndex = prev.findIndex((q) => q.id === draggedQuestId);
      const targetIndex = prev.findIndex((q) => q.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const copy = [...prev];
      const [moved] = copy.splice(sourceIndex, 1);
      copy.splice(targetIndex, 0, moved);

      // Recalcul des ordres
      return copy.map((q, index) => ({
        ...q,
        ordre: index + 1,
      }));
    });

    setDraggedQuestId(null);
  };

  // --- Rendu des onglets QuietQuest ---------------------------------------

  const renderSubTabNav = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {[
        { id: 'today', label: "Aujourd'hui" },
        { id: 'week', label: 'Cette semaine' },
        { id: 'quests', label: 'Mes quêtes' },
        { id: 'stats', label: 'Statistiques' },
        { id: 'security', label: 'Sécurité' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setCurrentSubTab(tab.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            currentSubTab === tab.id
              ? 'bg-emerald-400 text-slate-900 border-emerald-300 shadow-lg shadow-emerald-500/30'
              : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderQuestsView = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Arsenal de <span className="text-emerald-400">Missions</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Centralise toutes tes quêtes, filtre, trie, duplique et organise ton système QuietQuest.
          </p>
        </div>
        <button
          onClick={openNewQuestPopup}
          className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:-translate-y-0.5 transition-all"
        >
          <span>＋</span>
          <span>Nouvelle quête</span>
        </button>
      </div>

      {/* Barre de filtres */}
      <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl px-4 py-3 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Rechercher une quête..."
          className="flex-1 min-w-[200px] bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />

        <select
          value={questFilters.categorie}
          onChange={(e) => setQuestFilters((prev) => ({ ...prev, categorie: e.target.value }))}
          className="bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-100"
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={questFilters.difficulte}
          onChange={(e) => setQuestFilters((prev) => ({ ...prev, difficulte: e.target.value }))}
          className="bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-100"
        >
          <option value="all">Toutes difficultés</option>
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        <select
          value={questFilters.jour}
          onChange={(e) => setQuestFilters((prev) => ({ ...prev, jour: e.target.value }))}
          className="bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-100"
        >
          {JOUR_OPTIONS.map((j) => (
            <option key={j.label} value={j.value}>
              {j.label}
            </option>
          ))}
          <option value="exceptionnelles">Exceptionnelles</option>
        </select>

        <label className="flex items-center gap-1 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={questFilters.showInactive}
            onChange={(e) =>
              setQuestFilters((prev) => ({ ...prev, showInactive: e.target.checked }))
            }
            className="rounded border-slate-600 bg-slate-900"
          />
          Inactives
        </label>
      </div>

      {/* Actions en lot */}
      {hasSelectedQuests && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
          <span className="text-slate-400 mr-1">
            {selectedQuests.size} quête(s) sélectionnée(s)
          </span>
          <button
            onClick={bulkActivate}
            className="px-2 py-1 rounded-full bg-emerald-500/90 text-slate-900 font-semibold hover:bg-emerald-400"
          >
            Activer
          </button>
          <button
            onClick={bulkDeactivate}
            className="px-2 py-1 rounded-full bg-amber-500/90 text-slate-900 font-semibold hover:bg-amber-400"
          >
            Désactiver
          </button>
          <button
            onClick={bulkDelete}
            className="px-2 py-1 rounded-full bg-rose-600/90 text-slate-50 font-semibold hover:bg-rose-500"
          >
            Supprimer
          </button>
        </div>
      )}

      {/* Tableau des quêtes */}
      <div className="bg-slate-900/70 border border-slate-700/80 rounded-2xl overflow-hidden">
        <table className="min-w-full text-xs text-slate-100">
          <thead className="bg-slate-900/90">
            <tr className="border-b border-slate-700/80">
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  onChange={selectAllQuests}
                  checked={
                    filteredAndSortedQuests.length > 0 &&
                    selectedQuests.size === filteredAndSortedQuests.length
                  }
                  className="rounded border-slate-600 bg-slate-900"
                />
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('nom')}
              >
                Nom {getSortIcon('nom')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('categorie')}
              >
                Catégorie {getSortIcon('categorie')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('difficulte')}
              >
                Niveau {getSortIcon('difficulte')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('duree')}
              >
                Temps {getSortIcon('duree')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('recurrence')}
              >
                Répétition {getSortIcon('recurrence')}
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer select-none"
                onClick={() => sortQuests('xp')}
              >
                XP {getSortIcon('xp')}
              </th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedQuests.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-sm text-slate-400 bg-slate-900/60"
                >
                  Aucune quête trouvée. Ajuste tes filtres ou crée une nouvelle quête.
                </td>
              </tr>
            ) : (
              filteredAndSortedQuests.map((quest) => (
                <tr
                  key={quest.id}
                  className={`border-t border-slate-800/70 hover:bg-slate-800/80 transition-colors ${
                    quest.active === false ? 'opacity-60' : ''
                  }`}
                  draggable
                  onDragStart={() => startDrag(quest.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(quest.id)}
                >
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      checked={selectedQuests.has(quest.id)}
                      onChange={() => toggleQuestSelection(quest.id)}
                      className="rounded border-slate-600 bg-slate-900"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="font-semibold text-slate-100">{quest.nom}</div>
                    {quest.description && (
                      <div className="text-[11px] text-slate-400 line-clamp-2">
                        {quest.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-slate-200 text-[11px]">
                    {quest.categorie}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {'★'.repeat(quest.difficulte || 1)}
                    <span className="text-slate-500 text-[10px] ml-1">
                      ({quest.difficulte || 1})
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-200">
                    {formatDuration(quest.duree || 0)}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-200">
                    {quest.type === 'exceptionnelle'
                      ? `Exceptionnelle – ${quest.date || 'date ?'}`
                      : Array.isArray(quest.jours) && quest.jours.length
                      ? `Jours : ${quest.jours.join(', ')}`
                      : 'Récurrente'}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-emerald-300 font-semibold">
                    {(quest.xp ?? calculateQuestXP(quest))} XP
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => toggleQuestActive(quest.id)}
                        title={quest.active === false ? 'Activer' : 'Désactiver'}
                        className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                          quest.active === false
                            ? 'bg-emerald-500/90 text-slate-900'
                            : 'bg-amber-500/90 text-slate-900'
                        }`}
                      >
                        {quest.active === false ? '▶️' : '⏸️'}
                      </button>
                      <button
                        onClick={() => openEditQuestPopup(quest.id)}
                        className="px-2 py-1 rounded-full text-[11px] font-semibold bg-sky-500/90 text-slate-900"
                        title="Éditer"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => duplicateQuest(quest.id)}
                        className="px-2 py-1 rounded-full text-[11px] font-semibold bg-sky-700/90 text-slate-50"
                        title="Dupliquer"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => deleteQuest(quest.id)}
                        className="px-2 py-1 rounded-full text-[11px] font-semibold bg-rose-600/90 text-slate-50"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTodayView = () => (
    <QuestsTodayView
      allQuests={allQuests}
      isQuestCompletedOnDate={isQuestCompletedOnDate}
      toggleQuestValidation={toggleQuestValidation}
      getQuestsForDate={getQuestsForDateMemoized}
    />
  );

  const renderWeekView = () => (
    <QuestsWeekView
      allQuests={allQuests}
      validations={validations}
      toggleQuestValidation={toggleQuestValidation}
      getQuestsForDate={getQuestsForDateMemoized}
    />
  );

  const renderPlaceholder = (title, description) => (
    <div className="max-w-xl mx-auto text-center mt-10 space-y-3">
      <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
      <p className="text-slate-400 text-sm">{description}</p>
      <p className="text-slate-500 text-xs">
        Cette section sera remplie dans une prochaine phase d&apos;implémentation QuietQuest.
      </p>
    </div>
  );

  const renderStatsView = () => {
    if (!dailyPerformances.length) {
      return renderPlaceholder(
        'Statistiques QuietQuest',
        'Aucune donnée pour l’instant. Commence à cocher des quêtes dans les vues Aujourd’hui / Semaine.'
      );
    }

    // Filtrage par période
    const today = getTodayDateStr();
    const daysForPeriod = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365,
    };

    let periodStartDateStr = null;
    if (selectedPeriod !== 'all') {
      const days = daysForPeriod[selectedPeriod] || 30;
      const base = new Date(today);
      base.setDate(base.getDate() - days + 1);
      periodStartDateStr = base.toISOString().slice(0, 10);
    }

    const filteredPerfs =
      selectedPeriod === 'all'
        ? dailyPerformances
        : dailyPerformances.filter((d) => d.date >= periodStartDateStr);

    if (!filteredPerfs.length) {
      return renderPlaceholder(
        'Statistiques QuietQuest',
        "Aucune donnée dans la période sélectionnée. Essaie une période plus large ou coche de nouvelles quêtes."
      );
    }

    const totalXP = filteredPerfs.reduce(
      (sum, d) => sum + (d.xpTotal || 0),
      0
    );

    // Streak actuel et meilleur streak (jours consécutifs avec successRate > 0)
    const sorted = [...filteredPerfs].sort((a, b) =>
      a.date < b.date ? -1 : 1
    );

    let currentStreak = 0;
    let bestStreak = 0;
    let prevDate = null;

    for (const perf of sorted) {
      if (perf.successRate > 0) {
        if (!prevDate) {
          currentStreak = 1;
        } else {
          const dPrev = new Date(prevDate);
          const dCur = new Date(perf.date);
          const diff =
            (dCur.getTime() - dPrev.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
        }
        bestStreak = Math.max(bestStreak, currentStreak);
        prevDate = perf.date;
      } else {
        currentStreak = 0;
        prevDate = perf.date;
      }
    }

    const daysCount = sorted.length;
    const avgSuccess =
      daysCount > 0
        ? Math.round(
            sorted.reduce((sum, d) => sum + (d.successRate || 0), 0) / daysCount
          )
        : 0;

    const chartData = sorted.map((d) => ({
      date: d.date,
      xpTotal: d.xpTotal || 0,
      successRate: d.successRate || 0,
    }));

    // Répartition par catégorie (dans la période)
    const periodValidations =
      selectedPeriod === 'all'
        ? validations
        : validations.filter((v) => v.date >= periodStartDateStr);

    const xpByCategoryMap = new Map();
    for (const v of periodValidations) {
      const quest = allQuests.find((q) => q.id === v.queteId);
      if (!quest || !quest.categorie) continue;
      const prev = xpByCategoryMap.get(quest.categorie) || 0;
      xpByCategoryMap.set(quest.categorie, prev + (v.xpGagne || 0));
    }
    const categoryData = Array.from(xpByCategoryMap.entries()).map(
      ([categorie, xpTotal]) => ({
        categorie,
        xpTotal,
      })
    );

    // Insights automatiques
    const insights = [];
    if (categoryData.length > 0) {
      const topCategory = categoryData.reduce((a, b) => (a.xpTotal > b.xpTotal ? a : b));
      const categoryTotalXP = categoryData.reduce((sum, c) => sum + c.xpTotal, 0);
      const categoryPercentage = Math.round((topCategory.xpTotal / categoryTotalXP) * 100);
      insights.push(
        `Ta catégorie la plus productive est **${topCategory.categorie}** avec ${topCategory.xpTotal.toLocaleString('fr-FR')} XP (${categoryPercentage}% du total).`
      );
    }

    const activeDays = filteredPerfs.filter((d) => d.successRate > 0).length;
    if (activeDays > 0) {
      const avgXPPerActiveDay = Math.round(totalXP / activeDays);
      insights.push(
        `Tu gagnes en moyenne **${avgXPPerActiveDay.toLocaleString('fr-FR')} XP** par jour où tu valides au moins une quête.`
      );
    }

    // Jour le plus régulier (basé sur le nombre de jours avec activité)
    const dayOfWeekCounts = new Map();
    for (const perf of filteredPerfs) {
      if (perf.successRate > 0) {
        const dayOfWeek = getDayOfWeekFromDateStr(perf.date);
        dayOfWeekCounts.set(dayOfWeek, (dayOfWeekCounts.get(dayOfWeek) || 0) + 1);
      }
    }
    if (dayOfWeekCounts.size > 0) {
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const mostRegularDay = Array.from(dayOfWeekCounts.entries()).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );
      insights.push(
        `Ton jour le plus régulier est le **${dayNames[mostRegularDay[0]]}** avec ${mostRegularDay[1]} jour${mostRegularDay[1] > 1 ? 's' : ''} d'activité.`
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
              Statistiques <span className="text-emerald-400">QuietQuest</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Résumé de ton XP gagné, de tes streaks et de ta constance au fil du temps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-200">
            <span className="text-slate-400 mr-1">Période :</span>
            {['7d', '30d', '90d', '180d', '365d', 'all'].map((p) => {
              const labelMap = {
                '7d': '7 jours',
                '30d': '30 jours',
                '90d': '90 jours',
                '180d': '6 mois',
                '365d': '12 mois',
                all: 'Tout',
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2 py-1 rounded-full border text-xs transition-all ${
                    selectedPeriod === p
                      ? 'bg-emerald-400 text-slate-900 border-emerald-300'
                      : 'bg-slate-900/50 text-slate-200 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
            <div className="text-xs text-slate-400 mb-1">XP total gagné</div>
            <div className="text-xl font-semibold text-emerald-300">
              {totalXP.toLocaleString('fr-FR')} XP
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
            <div className="text-xs text-slate-400 mb-1">Streak actuel</div>
            <div className="text-xl font-semibold text-slate-100">
              {currentStreak} jour{currentStreak > 1 ? 's' : ''}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Meilleur streak : {bestStreak} jour{bestStreak > 1 ? 's' : ''}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
            <div className="text-xs text-slate-400 mb-1">Taux de réussite moyen</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                  style={{ width: `${Math.min(avgSuccess, 100)}%` }}
                />
              </div>
              <div className="text-lg font-semibold text-slate-100">
                {avgSuccess}%
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Basé sur {daysCount} jour{daysCount > 1 ? 's' : ''} avec activité.
            </div>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
            <div className="text-xs text-slate-400 mb-2">
              XP quotidien (toutes quêtes confondues)
            </div>
            <LazyChart height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                    }}
                    labelStyle={{ color: '#e5e7eb', fontSize: 12 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="xpTotal"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="XP gagné"
                  />
                </LineChart>
              </ResponsiveContainer>
            </LazyChart>
          </div>
        )}

        {categoryData.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
            <div className="text-xs text-slate-400 mb-2">
              Répartition de l’XP par catégorie
            </div>
            <LazyChart height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="categorie"
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                    }}
                    labelStyle={{ color: '#e5e7eb', fontSize: 12 }}
                  />
                  <Legend />
                  <Bar
                    dataKey="xpTotal"
                    name="XP total"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </LazyChart>
          </div>
        )}

        {/* Insights textuels */}
        {insights.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
            <div className="text-xs text-slate-400 mb-2 font-semibold">💡 Insights automatiques</div>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="text-sm text-slate-200 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-300">$1</strong>'),
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSecurityView = () => {
    const handleExport = async () => {
      try {
        showInfo('Export en cours...');
        
        const exportData = await exportQuietQuestData({
          includeMetadata: true,
          compress: false,
        });
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quietquest-export-${getTodayDateStr()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        const metadata = exportData.metadata || {};
        showSuccess(
          `Export réussi ! ${metadata.totalQuests || 0} quête${metadata.totalQuests !== 1 ? 's' : ''}, ` +
          `${metadata.totalValidations || 0} validation${metadata.totalValidations !== 1 ? 's' : ''}.`
        );
      } catch (error) {
        console.error('Erreur export:', error);
        showError('Erreur lors de l\'export. Vérifie la console.');
      }
    };

    const handleImport = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        const jsonData = JSON.parse(text);

        // Validation
        if (!validateQuietQuestExport(jsonData)) {
          showError('Format d\'export invalide. Vérifie que le fichier est un export QuietQuest valide.');
          return;
        }

        // Prévisualisation améliorée (utiliser métadonnées si disponibles)
        const metadata = jsonData.metadata || {};
        const preview = {
          quests: metadata.totalQuests || jsonData.data?.quests?.length || 0,
          validations: metadata.totalValidations || jsonData.data?.validations?.length || 0,
          dateRange: metadata.dateRange
            ? `${metadata.dateRange.earliest} → ${metadata.dateRange.latest}`
            : 'N/A',
          userLevel: metadata.userLevel || jsonData.data?.userData?.level || 'N/A',
          estimatedSizeKB: metadata.estimatedSizeKB || 'N/A',
        };

        const confirmMessage = `Remplacer entièrement les données QuietQuest ?\n\n` +
          `Résumé du fichier :\n` +
          `- ${preview.quests} quête${preview.quests > 1 ? 's' : ''}\n` +
          `- ${preview.validations} validation${preview.validations > 1 ? 's' : ''}\n` +
          `- Période : ${preview.dateRange}\n` +
          `- Niveau utilisateur : ${preview.userLevel}\n` +
          `- Taille estimée : ${preview.estimatedSizeKB} KB\n\n` +
          `⚠️ Cette action remplacera TOUTES tes données actuelles. Cette action est irréversible.`;

        if (!window.confirm(confirmMessage)) {
          return;
        }

        // Import avec backup automatique
        await importQuietQuestData(jsonData, {
          mode: 'replace',
          createBackup: true,
          validate: false, // Déjà validé
        });

        // Recharger les données (le hook devrait détecter le changement)
        // Forcer rechargement en réinitialisant les états
        window.location.reload(); // Solution simple pour recharger depuis IndexedDB

        showSuccess(
          `Import réussi ! ${preview.quests} quête${preview.quests > 1 ? 's' : ''} et ` +
          `${preview.validations} validation${preview.validations > 1 ? 's' : ''} chargée${preview.validations > 1 ? 's' : ''}.`
        );
      } catch (error) {
        console.error('Erreur import:', error);
        showError('Fichier invalide ou corrompu. Vérifie que le fichier est un export QuietQuest valide.');
      } finally {
        event.target.value = '';
      }
    };

    const handleReset = async () => {
      const questsCount = allQuests.length;
      const validationsCount = validations.length;
      const confirmMessage = `Réinitialiser complètement toutes les données QuietQuest ?\n\n⚠️ Cette action supprimera définitivement :\n- ${questsCount} quête${questsCount > 1 ? 's' : ''}\n- ${validationsCount} validation${validationsCount > 1 ? 's' : ''}\n- Toutes tes statistiques et ton XP\n- Toutes tes performances quotidiennes\n\nCette action est irréversible et ne peut pas être annulée.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      try {
        // Vider IndexedDB si disponible
        const db = await openQuietQuestDB();
        if (db) {
          await clearQuietQuestStores(db, 'main');
        }

        // Vider localStorage (fallback)
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(STORAGE_KEYS.quests);
          window.localStorage.removeItem(STORAGE_KEYS.validations);
          window.localStorage.removeItem(STORAGE_KEYS.userData);
          window.localStorage.removeItem(STORAGE_KEYS.dailyPerformances);
          window.localStorage.removeItem(STORAGE_KEYS.appState);
          window.localStorage.removeItem(META_KEYS.lastVisit);
          window.localStorage.removeItem(META_KEYS.lastCleanup);
        }

        // Réinitialiser les états
        setAllQuests([]);
        setValidations([]);
        setDailyPerformances([]);
        setUserData(defaultUserData);

        showWarning('Toutes les données QuietQuest ont été réinitialisées.');
      } catch (error) {
        console.error('Erreur reset:', error);
        showError('Erreur lors de la réinitialisation. Vérifie la console.');
      }
    };

    return (
      <div className="space-y-4 max-w-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Sécurité <span className="text-emerald-400">QuietQuest</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Sauvegarde, exporte ou réinitialise tes données de quêtes en un seul endroit.
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Export JSON complet
              </div>
              <div className="text-[11px] text-slate-400">
                Quêtes, validations, XP et performances quotidiennes.
              </div>
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-900 hover:bg-white"
            >
              Exporter
            </button>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Import JSON
              </div>
              <div className="text-[11px] text-slate-400">
                Remplace entièrement les données actuelles par un fichier exporté.
              </div>
            </div>
            <label className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-100 hover:bg-slate-700 cursor-pointer">
              Importer
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-rose-700 bg-rose-950/60 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-rose-100">
                Réinitialisation complète
              </div>
              <div className="text-[11px] text-rose-200/80">
                Supprime toutes les données QuietQuest et remet l’XP au niveau initial.
              </div>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-slate-50 hover:bg-rose-500"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentSubTab = () => {
    switch (currentSubTab) {
      case 'quests':
        return renderQuestsView();
      case 'today':
        return renderTodayView();
      case 'week':
        return renderWeekView();
      case 'stats':
        return <QuestsStatsView />;
      case 'security':
        return renderSecurityView();
      default:
        return null;
    }
  };

  // --- Rendu global --------------------------------------------------------

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 space-y-6 p-6">
        {/* Navigation interne QuietQuest */}
        {renderSubTabNav()}

      {/* Contenu de l’onglet courant */}
      {renderCurrentSubTab()}

      {/* Popup de création / édition de quête */}
      {showQuestPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">
                {editingQuestId ? 'Modifier la quête' : 'Nouvelle quête'}
              </h2>
              <button
                onClick={closeQuestPopup}
                className="text-slate-400 hover:text-slate-100 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-300 mb-1">Nom</label>
                <input
                  type="text"
                  value={questForm.nom}
                  onChange={(e) =>
                    setQuestForm((prev) => ({ ...prev, nom: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={questForm.description}
                  onChange={(e) =>
                    setQuestForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Catégorie</label>
                  <select
                    value={questForm.categorie}
                    onChange={(e) =>
                      setQuestForm((prev) => ({ ...prev, categorie: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Difficulté</label>
                  <select
                    value={questForm.difficulte}
                    onChange={(e) =>
                      setQuestForm((prev) => ({
                        ...prev,
                        difficulte: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Durée</label>
                  <select
                    value={questForm.duree}
                    onChange={(e) =>
                      setQuestForm((prev) => ({
                        ...prev,
                        duree: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
                  >
                    {durationOptions.map((m) => (
                      <option key={m} value={m}>
                        {formatDuration(m)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Type</label>
                  <select
                    value={questForm.type}
                    onChange={(e) =>
                      setQuestForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
                  >
                    <option value="recurrente">Récurrente</option>
                    <option value="exceptionnelle">Exceptionnelle</option>
                  </select>
                </div>
              </div>

              {questForm.type === 'recurrente' ? (
                <div className="space-y-2">
                  <label className="block text-slate-300">Jours</label>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {JOUR_OPTIONS.filter((j) => j.value !== 'all').map((j) => (
                      <button
                        key={j.value}
                        type="button"
                        onClick={() => {
                          const day = Number(j.value);
                          setQuestForm((prev) => {
                            const jours = Array.isArray(prev.jours) ? [...prev.jours] : [];
                            if (jours.includes(day)) {
                              return { ...prev, jours: jours.filter((d) => d !== day) };
                            }
                            return { ...prev, jours: [...jours, day].sort() };
                          });
                        }}
                        className={`px-2 py-1 rounded-full border ${
                          questForm.jours?.includes(Number(j.value))
                            ? 'bg-emerald-500/90 border-emerald-300 text-slate-900'
                            : 'bg-slate-950 border-slate-700 text-slate-200'
                        }`}
                      >
                        {j.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-300">
                    {recurrencePresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setQuestForm((prev) => ({ ...prev, jours: [...preset.jours] }))
                        }
                        className="px-2 py-1 rounded-full bg-slate-900 border border-slate-700 hover:bg-slate-800"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={questForm.date}
                    onChange={(e) =>
                      setQuestForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={questForm.active}
                  onChange={(e) =>
                    setQuestForm((prev) => ({ ...prev, active: e.target.checked }))
                  }
                  className="rounded border-slate-600 bg-slate-900"
                />
                Quête active
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={closeQuestPopup}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={saveQuestFromForm}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-900 hover:bg-emerald-400"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default QuestsTab;