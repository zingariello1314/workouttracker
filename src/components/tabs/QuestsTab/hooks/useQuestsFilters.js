/**
 * Hook pour la gestion des filtres et recherche des quêtes
 * 
 * ✅ PHASE 4 : Extraction de la logique de filtres
 * 
 * @module components/tabs/QuestsTab/hooks/useQuestsFilters
 */

import { useState, useMemo, useEffect } from 'react';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../../../hooks/useQuietQuestEngine';

/**
 * Hook pour gérer les filtres et la recherche des quêtes
 * 
 * @param {Array} allQuests - Liste de toutes les quêtes
 * @returns {Object} { searchQuery, setSearchQuery, questFilters, setQuestFilters, filteredQuests }
 */
export const useQuestsFilters = (allQuests = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [questFilters, setQuestFilters] = useState({
    categorie: 'all',
    difficulte: 'all',
    jour: 'all',
    showInactive: false,
  });

  // Charger les filtres sauvegardés
  useEffect(() => {
    const appState = loadFromStorage(STORAGE_KEYS.appState, {});
    if (appState.questFilters) {
      setQuestFilters(appState.questFilters);
    }
  }, []);

  // Sauvegarder les filtres
  useEffect(() => {
    const appState = loadFromStorage(STORAGE_KEYS.appState, {});
    saveToStorage(STORAGE_KEYS.appState, {
      ...appState,
      version: 1,
      questFilters,
    });
  }, [questFilters]);

  // Filtrer les quêtes
  const filteredQuests = useMemo(() => {
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

    return result;
  }, [allQuests, questFilters, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    questFilters,
    setQuestFilters,
    filteredQuests,
  };
};
