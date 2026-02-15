/**
 * QuestsTab - Composant principal refactorisé
 * 
 * ✅ PHASE 4 : Refactoring complet avec hooks et composants extraits
 * 
 * @module components/tabs/QuestsTab/QuestsTab.refactored
 */

import React, { useEffect, useState, useCallback } from 'react';
import ErrorBoundary from '../ui/ErrorBoundary';
import { useQuietQuestEngine } from '../../hooks/useQuietQuestEngine';
import QuestsTodayView from '../quests/QuestsTodayView';
import QuestsWeekView from '../quests/QuestsWeekView';
import QuestsStatsView from '../quests/stats/QuestsStatsView';

// Hooks personnalisés
import { useQuestsFilters } from './QuestsTab/hooks/useQuestsFilters';
import { useQuestsSort } from './QuestsTab/hooks/useQuestsSort';
import { useQuestsActions } from './QuestsTab/hooks/useQuestsActions';
import { useQuestsSelection } from './QuestsTab/hooks/useQuestsSelection';
import { useQuestsBulkActions } from './QuestsTab/hooks/useQuestsBulkActions';
import { useQuestsDragDrop } from './QuestsTab/hooks/useQuestsDragDrop';

// Composants
import { QuestFormModal } from './QuestsTab/components/QuestFormModal';
import { QuestsTableView } from './QuestsTab/components/QuestsTableView';
import { SecurityView } from './QuestsTab/components/SecurityView';
import { useSidebarEvents, SIDEBAR_EVENTS } from '../../utils/sidebarEvents';

/**
 * Composant principal QuestsTab refactorisé
 * 
 * Utilise des hooks personnalisés pour :
 * - Filtres et recherche (useQuestsFilters)
 * - Tri (useQuestsSort)
 * - Actions CRUD (useQuestsActions)
 * - Sélection multiple (useQuestsSelection)
 * - Actions en lot (useQuestsBulkActions)
 * - Drag & drop (useQuestsDragDrop)
 */
const QuestsTab = () => {
  // ✅ PHASE 1 : Persistance de l'état actif dans localStorage
  const [currentSubTab, setCurrentSubTab] = useState(() => {
    try {
      const saved = localStorage.getItem('quests.activeSubTab');
      return saved || 'today';
    } catch (error) {
      console.warn('[QuestsTab] Erreur lecture localStorage:', error);
      return 'today';
    }
  });

  // ✅ PHASE 1 : Sauvegarder l'état actif dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('quests.activeSubTab', currentSubTab);
    } catch (error) {
      console.warn('[QuestsTab] Erreur sauvegarde localStorage:', error);
    }
  }, [currentSubTab]);

  // Émettre un événement lors du changement de sous-onglet pour la rotation des images de profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: currentSubTab, isSubTab: true } 
    }));
  }, [currentSubTab]);

  // Moteur QuietQuest centralisé (todayDate mis à jour après minuit)
  const {
    allQuests,
    setAllQuests,
    userData,
    validations,
    dailyPerformances,
    isQuestCompletedOnDate,
    toggleQuestValidation,
    getQuestsForDate: getQuestsForDateMemoized,
    todayDate,
    prayerLocation,
  } = useQuietQuestEngine();

  // ✅ PHASE 4 : Hooks personnalisés pour la logique métier
  const {
    searchQuery,
    setSearchQuery,
    questFilters,
    setQuestFilters,
    filteredQuests,
  } = useQuestsFilters(allQuests);

  const {
    sortConfig,
    setSortConfig,
    sortQuests,
    getSortIcon,
    sortedQuests,
  } = useQuestsSort(filteredQuests, todayDate, prayerLocation);

  const {
    questForm,
    setQuestForm,
    showQuestPopup,
    setShowQuestPopup,
    editingQuestId,
    setEditingQuestId,
    openNewQuestPopup,
    openEditQuestPopup,
    closeQuestPopup,
    saveQuestFromForm,
    toggleQuestActive,
    deleteQuest,
    duplicateQuest,
  } = useQuestsActions(allQuests, setAllQuests);

  const {
    selectedQuests,
    setSelectedQuests,
    toggleQuestSelection,
    selectAllQuests,
    hasSelectedQuests,
  } = useQuestsSelection(sortedQuests);

  const {
    bulkActivate,
    bulkDeactivate,
    bulkDelete,
  } = useQuestsBulkActions(allQuests, setAllQuests, selectedQuests, setSelectedQuests);

  const {
    draggedQuestId,
    startDrag,
    onDrop,
    clearDrag,
  } = useQuestsDragDrop(allQuests, setAllQuests);

  // Réordonnancement des quêtes du jour uniquement (vue Aujourd'hui)
  const reorderTodayQuests = useCallback((draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const questsToday = getQuestsForDateMemoized(todayDate);
    const fromIdx = questsToday.findIndex((q) => q.id === draggedId);
    const toIdx = questsToday.findIndex((q) => q.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...questsToday];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const todayIds = new Set(reordered.map((q) => q.id));
    const fullSorted = [...allQuests].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    const todayIndices = [];
    fullSorted.forEach((q, i) => {
      if (todayIds.has(q.id)) todayIndices.push(i);
    });
    const newFull = [...fullSorted];
    for (let j = 0; j < reordered.length; j++) {
      newFull[todayIndices[j]] = reordered[j];
    }
    setAllQuests(newFull.map((q, i) => ({ ...q, ordre: i + 1 })));
    clearDrag();
  }, [allQuests, setAllQuests, getQuestsForDateMemoized, todayDate, clearDrag]);

  // Synchroniser les toggles effectués depuis la sidebar (InteractiveQuestsModule)
  const handleExternalQuestToggle = useCallback((data) => {
    if (!data || data.origin !== 'interactive-quests') return;
    if (!data.questId || !data.date) return;
    // Rejouer le toggle dans ce moteur d'onglet (sans origine pour éviter les boucles)
    toggleQuestValidation(data.questId, data.date);
  }, [toggleQuestValidation]);

  useSidebarEvents(SIDEBAR_EVENTS.QUEST_COMPLETED, handleExternalQuestToggle);
  useSidebarEvents(SIDEBAR_EVENTS.QUEST_UPDATED, handleExternalQuestToggle);

  // Ouvrir le modal de création quand on arrive depuis la sidebar (bouton "Créer")
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('nav_params_quests');
      if (!raw) return;
      const params = JSON.parse(raw);
      if (params?.action === 'openCreate') {
        sessionStorage.removeItem('nav_params_quests');
        openNewQuestPopup();
      }
    } catch (_) {
      try { sessionStorage.removeItem('nav_params_quests'); } catch (_) {}
    }
  }, [openNewQuestPopup]);

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
          type="button"
          onClick={() => setCurrentSubTab(tab.id)}
          className={`gradient-button-premium gradient-button-premium-md rounded-lg ${
            currentSubTab === tab.id
              ? 'gradient-button-premium-variant'
              : ''
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderTodayView = () => (
    <QuestsTodayView
      allQuests={allQuests}
      isQuestCompletedOnDate={isQuestCompletedOnDate}
      toggleQuestValidation={toggleQuestValidation}
      getQuestsForDate={getQuestsForDateMemoized}
      userData={userData}
      validations={validations}
      isLoading={false}
      openNewQuestPopup={openNewQuestPopup}
      openEditQuestPopup={openEditQuestPopup}
      startDrag={startDrag}
      onReorderToday={reorderTodayQuests}
      draggedQuestId={draggedQuestId}
      clearDrag={clearDrag}
      deleteQuest={deleteQuest}
      todayDate={todayDate}
      prayerLocation={prayerLocation}
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

  const renderCurrentSubTab = () => {
    switch (currentSubTab) {
      case 'quests':
        return (
          <QuestsTableView
            sortedQuests={sortedQuests}
            sortConfig={sortConfig}
            questFilters={questFilters}
            setQuestFilters={setQuestFilters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortQuests={sortQuests}
            getSortIcon={getSortIcon}
            selectedQuests={selectedQuests}
            toggleQuestSelection={toggleQuestSelection}
            selectAllQuests={selectAllQuests}
            hasSelectedQuests={hasSelectedQuests}
            bulkActivate={bulkActivate}
            bulkDeactivate={bulkDeactivate}
            bulkDelete={bulkDelete}
            openNewQuestPopup={openNewQuestPopup}
            openEditQuestPopup={openEditQuestPopup}
            toggleQuestActive={toggleQuestActive}
            duplicateQuest={duplicateQuest}
            deleteQuest={deleteQuest}
            startDrag={startDrag}
            onDrop={onDrop}
            todayDate={todayDate}
            prayerLocation={prayerLocation}
          />
        );
      case 'today':
        return renderTodayView();
      case 'week':
        return renderWeekView();
      case 'stats':
        return <QuestsStatsView />;
      case 'security':
        return (
          <SecurityView
            allQuests={allQuests}
            validations={validations}
            dailyPerformances={dailyPerformances}
          />
        );
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

        {/* Contenu de l'onglet courant avec ErrorBoundary */}
        <ErrorBoundary
          context={{ currentSubTab, tab: 'quests' }}
          title={`Erreur dans ${currentSubTab}`}
          message="Une erreur s'est produite dans ce sous-onglet. Vous pouvez réessayer ou changer de sous-onglet."
        >
          {renderCurrentSubTab()}
        </ErrorBoundary>

        {/* Popup de création / édition de quête */}
        <QuestFormModal
          isOpen={showQuestPopup}
          onClose={closeQuestPopup}
          questForm={questForm}
          setQuestForm={setQuestForm}
          isEditing={editingQuestId != null}
          onSave={saveQuestFromForm}
        />
      </div>
    </div>
  );
};

export default QuestsTab;
