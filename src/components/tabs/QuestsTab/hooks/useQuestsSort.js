/**
 * Hook pour la gestion du tri des quêtes
 * 
 * ✅ PHASE 4 : Extraction de la logique de tri
 * 
 * @module components/tabs/QuestsTab/hooks/useQuestsSort
 */

import { useState, useMemo, useEffect } from 'react';
import { loadFromStorage, saveToStorage, STORAGE_KEYS, calculateQuestXP } from '../../../../hooks/useQuietQuestEngine';

function heureToMinutes(heure) {
  if (!heure || typeof heure !== 'string') return 24 * 60;
  const m = heure.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 24 * 60;
}

/**
 * Hook pour gérer le tri des quêtes
 * 
 * @param {Array} filteredQuests - Liste de quêtes filtrées
 * @returns {Object} { sortConfig, setSortConfig, sortQuests, getSortIcon, sortedQuests }
 */
export const useQuestsSort = (filteredQuests = []) => {
  const [sortConfig, setSortConfig] = useState({
    column: null,
    direction: 'asc',
  });

  // Charger la configuration de tri sauvegardée
  useEffect(() => {
    const appState = loadFromStorage(STORAGE_KEYS.appState, {});
    if (appState.questSortConfig) {
      setSortConfig(appState.questSortConfig);
    }
  }, []);

  // Sauvegarder la configuration de tri
  useEffect(() => {
    const appState = loadFromStorage(STORAGE_KEYS.appState, {});
    saveToStorage(STORAGE_KEYS.appState, {
      ...appState,
      version: 1,
      questSortConfig: sortConfig,
    });
  }, [sortConfig]);

  // Trier les quêtes
  const sortedQuests = useMemo(() => {
    if (!sortConfig.column) {
      // Pas de tri, juste trier par ordre manuel
      return [...filteredQuests].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }

    const { column, direction } = sortConfig;
    const factor = direction === 'asc' ? 1 : -1;

    const result = [...filteredQuests].sort((a, b) => {
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
          case 'heure':
            return heureToMinutes(a.heure);
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
          case 'heure':
            return heureToMinutes(b.heure);
          default:
            return 0;
        }
      })();

      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return 0;
    });

    // Tiebreak global par ordre manuel si présent
    result.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

    return result;
  }, [filteredQuests, sortConfig]);

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

  return {
    sortConfig,
    setSortConfig,
    sortQuests,
    getSortIcon,
    sortedQuests,
  };
};
