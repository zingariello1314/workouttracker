/**
 * Hook pour les actions en lot sur les quêtes
 * 
 * ✅ PHASE 4 : Extraction de la logique d'actions en lot
 * 
 * @module components/tabs/QuestsTab/hooks/useQuestsBulkActions
 */

import { useCallback } from 'react';
import { useToast } from '../../../../components/ui/Toast';
import { emitSidebarEvent, SIDEBAR_EVENTS } from '../../../../utils/sidebarEvents';

/**
 * Hook pour gérer les actions en lot sur les quêtes
 * 
 * @param {Array} allQuests - Liste de toutes les quêtes
 * @param {Function} setAllQuests - Fonction pour mettre à jour les quêtes
 * @param {Set} selectedQuests - Set des IDs des quêtes sélectionnées
 * @param {Function} setSelectedQuests - Fonction pour mettre à jour la sélection
 * @returns {Object} { bulkActivate, bulkDeactivate, bulkDelete }
 */
export const useQuestsBulkActions = (allQuests = [], setAllQuests, selectedQuests, setSelectedQuests) => {
  const { showSuccess } = useToast();

  const bulkActivate = useCallback(() => {
    if (selectedQuests.size === 0) return;
    const count = selectedQuests.size;
    setAllQuests((prev) =>
      prev.map((q) =>
        selectedQuests.has(q.id)
          ? { ...q, active: true }
          : q
      )
    );
    
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, {
      bulk: true,
      count,
      skipQuietQuestListRefetch: true,
    });
    setSelectedQuests(new Set());
    showSuccess(`${count} quête${count > 1 ? 's' : ''} activée${count > 1 ? 's' : ''}`);
  }, [selectedQuests, setAllQuests, setSelectedQuests, showSuccess]);

  const bulkDeactivate = useCallback(() => {
    if (selectedQuests.size === 0) return;
    const count = selectedQuests.size;
    setAllQuests((prev) =>
      prev.map((q) =>
        selectedQuests.has(q.id)
          ? { ...q, active: false }
          : q
      )
    );
    
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, {
      bulk: true,
      count,
      skipQuietQuestListRefetch: true,
    });
    setSelectedQuests(new Set());
    showSuccess(`${count} quête${count > 1 ? 's' : ''} désactivée${count > 1 ? 's' : ''}`);
  }, [selectedQuests, setAllQuests, setSelectedQuests, showSuccess]);

  const bulkDelete = useCallback(() => {
    if (selectedQuests.size === 0) return;
    const count = selectedQuests.size;
    const questNames = allQuests
      .filter((q) => selectedQuests.has(q.id))
      .map((q) => q.nom)
      .join(', ');
    
    if (
      !window.confirm(
        `Supprimer définitivement ${count} quête${count > 1 ? 's' : ''} ?\n\n${questNames}\n\nCette action est irréversible.`
      )
    )
      return;
    
    setAllQuests((prev) => prev.filter((q) => !selectedQuests.has(q.id)));
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, {
      bulk: true,
      count,
      deleted: true,
      skipQuietQuestListRefetch: true,
    });
    setSelectedQuests(new Set());
    showSuccess(`${count} quête${count > 1 ? 's' : ''} supprimée${count > 1 ? 's' : ''}`);
  }, [selectedQuests, allQuests, setAllQuests, setSelectedQuests, showSuccess]);

  return {
    bulkActivate,
    bulkDeactivate,
    bulkDelete,
  };
};
