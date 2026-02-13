/**
 * Hook pour les actions CRUD sur les quêtes
 * 
 * ✅ PHASE 4 : Extraction de la logique métier
 * 
 * @module components/tabs/QuestsTab/hooks/useQuestsActions
 */

import { useState, useCallback } from 'react';
import { useToast } from '../../../../components/ui/Toast';
import { questSchema, validateWithSchema } from '../../../../utils/validation/schemas';
import { calculateQuestXP } from '../../../../hooks/useQuietQuestEngine';
import { emitSidebarEvent, SIDEBAR_EVENTS } from '../../../../utils/sidebarEvents';
import { CATEGORIES } from '../constants';

/**
 * Hook pour gérer les actions CRUD sur les quêtes
 * 
 * @param {Array} allQuests - Liste de toutes les quêtes
 * @param {Function} setAllQuests - Fonction pour mettre à jour les quêtes
 * @returns {Object} { questForm, setQuestForm, showQuestPopup, setShowQuestPopup, editingQuestId, ...actions }
 */
export const useQuestsActions = (allQuests = [], setAllQuests) => {
  const { showSuccess, showError } = useToast();
  
  const [showQuestPopup, setShowQuestPopup] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState(null);
  const [questForm, setQuestForm] = useState({
    nom: '',
    description: '',
    categorie: CATEGORIES[0],
    difficulte: 1,
    duree: 30,
    type: 'recurrente',
    jours: [1, 2, 3, 4, 5],
    date: '',
    heure: '',
    active: true,
  });

  const openNewQuestPopup = useCallback(() => {
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
      heure: '',
      active: true,
    });
    setShowQuestPopup(true);
  }, []);

  const openEditQuestPopup = useCallback((id) => {
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
      heure: quest.heure || '',
      active: quest.active !== false,
    });
    setShowQuestPopup(true);
  }, [allQuests]);

  const closeQuestPopup = useCallback(() => {
    setShowQuestPopup(false);
  }, []);

  const saveQuestFromForm = useCallback(() => {
    // ✅ PHASE 1 : Validation avec Zod
    const validation = validateWithSchema(questSchema, questForm);
    
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      showError(firstError || 'Erreur de validation');
      return;
    }
    
    // Validation supplémentaire pour la cohérence type/jours/date
    if (questForm.type === 'recurrente' && (!questForm.jours || questForm.jours.length === 0)) {
      showError('Sélectionne au moins un jour pour une quête récurrente.');
      return;
    }
    if (questForm.type === 'exceptionnelle' && !questForm.date) {
      showError('Choisis une date pour une quête exceptionnelle.');
      return;
    }
    
    const validatedQuest = validation.data;
    const isEditing = editingQuestId != null;
    
    setAllQuests((prev) => {
      if (isEditing) {
        const updated = prev.map((q) =>
          q.id === editingQuestId
            ? {
                ...q,
                ...validatedQuest,
                xp: calculateQuestXP({ ...q, ...validatedQuest }),
              }
            : q
        );
        
        emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { questId: editingQuestId });
        return updated;
      }

      const nextId = prev.length ? Math.max(...prev.map((q) => q.id || 0)) + 1 : 1;
      const baseQuest = {
        id: nextId,
        ...validatedQuest,
        creeLe: new Date().toISOString().slice(0, 10),
        ordre: prev.length + 1,
      };
      const newQuest = {
        ...baseQuest,
        xp: calculateQuestXP(baseQuest),
      };
      
      emitSidebarEvent(SIDEBAR_EVENTS.QUEST_CREATED, { questId: nextId });
      return [...prev, newQuest];
    });

    showSuccess(isEditing ? 'Quête modifiée avec succès' : 'Quête créée avec succès');
    setShowQuestPopup(false);
  }, [questForm, editingQuestId, setAllQuests, showSuccess, showError]);

  const toggleQuestActive = useCallback((id) => {
    setAllQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, active: !q.active } : q))
    );
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { questId: id });
  }, [setAllQuests]);

  const deleteQuest = useCallback((id) => {
    const quest = allQuests.find((q) => q.id === id);
    const questName = quest?.nom || 'cette quête';
    if (
      !window.confirm(
        `Supprimer définitivement "${questName}" ?\n\nCette action est irréversible. Toutes les validations associées seront également supprimées.`
      )
    )
      return;
    setAllQuests((prev) => prev.filter((q) => q.id !== id));
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { questId: id, deleted: true });
    showSuccess(`Quête "${questName}" supprimée`);
  }, [allQuests, setAllQuests, showSuccess]);

  const duplicateQuest = useCallback((id) => {
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
      
      emitSidebarEvent(SIDEBAR_EVENTS.QUEST_CREATED, { questId: nextId });
      return [...prev, copy];
    });
    showSuccess(`Quête "${original.nom}" dupliquée`);
  }, [allQuests, setAllQuests, showSuccess]);

  return {
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
  };
};
