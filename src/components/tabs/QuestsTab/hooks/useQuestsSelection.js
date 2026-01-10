/**
 * Hook pour la gestion de la sélection multiple des quêtes
 * 
 * ✅ PHASE 4 : Extraction de la logique de sélection
 * 
 * @module components/tabs/QuestsTab/hooks/useQuestsSelection
 */

import { useState, useCallback } from 'react';

/**
 * Hook pour gérer la sélection multiple des quêtes
 * 
 * @param {Array} filteredAndSortedQuests - Liste de quêtes filtrées et triées
 * @returns {Object} { selectedQuests, setSelectedQuests, toggleQuestSelection, selectAllQuests, hasSelectedQuests }
 */
export const useQuestsSelection = (filteredAndSortedQuests = []) => {
  const [selectedQuests, setSelectedQuests] = useState(new Set());

  const toggleQuestSelection = useCallback((id) => {
    setSelectedQuests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllQuests = useCallback(() => {
    setSelectedQuests((prev) => {
      if (prev.size === filteredAndSortedQuests.length) {
        return new Set();
      }
      return new Set(filteredAndSortedQuests.map((q) => q.id));
    });
  }, [filteredAndSortedQuests]);

  const hasSelectedQuests = selectedQuests.size > 0;

  return {
    selectedQuests,
    setSelectedQuests,
    toggleQuestSelection,
    selectAllQuests,
    hasSelectedQuests,
  };
};
