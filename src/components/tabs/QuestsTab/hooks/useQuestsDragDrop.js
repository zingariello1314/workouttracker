/**
 * Hook pour la gestion du drag & drop des quêtes
 * 
 * ✅ PHASE 4 : Extraction de la logique de drag & drop
 * 
 * @module components/tabs/QuestsTab/hooks/useQuestsDragDrop
 */

import { useState, useCallback } from 'react';

/**
 * Hook pour gérer le drag & drop des quêtes
 * 
 * @param {Array} allQuests - Liste de toutes les quêtes
 * @param {Function} setAllQuests - Fonction pour mettre à jour les quêtes
 * @returns {Object} { draggedQuestId, startDrag, onDrop }
 */
export const useQuestsDragDrop = (allQuests = [], setAllQuests) => {
  const [draggedQuestId, setDraggedQuestId] = useState(null);

  const startDrag = useCallback((id) => {
    setDraggedQuestId(id);
  }, []);

  const onDrop = useCallback((targetId) => {
    if (!draggedQuestId || draggedQuestId === targetId) {
      setDraggedQuestId(null);
      return;
    }

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
  }, [draggedQuestId, setAllQuests]);

  return {
    draggedQuestId,
    startDrag,
    onDrop,
  };
};
