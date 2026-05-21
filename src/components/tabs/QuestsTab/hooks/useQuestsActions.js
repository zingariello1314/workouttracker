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
import { CATEGORIES, snapDureeToValidOption } from '../constants';

const DEFAULT_MULTI_SLOTS = [
  { slot: 'matin', enabled: false, heure: '' },
  { slot: 'midi', enabled: false, heure: '' },
  { slot: 'apres-midi', enabled: false, heure: '' },
  { slot: 'soir', enabled: false, heure: '' }
];

const SLOT_SUFFIX = {
  matin: '(matin)',
  midi: '(midi)',
  'apres-midi': '(après-midi)',
  soir: '(soir)'
};

const createDefaultMultiSlots = () => DEFAULT_MULTI_SLOTS.map((slot) => ({ ...slot }));

const stripMultiSlotFields = (quest) => {
  const payload = { ...quest };
  delete payload.multiSlotsEnabled;
  delete payload.multiSlots;
  return payload;
};

/**
 * Hook pour gérer les actions CRUD sur les quêtes
 * 
 * @param {Array} allQuests - Liste de toutes les quêtes
 * @param {Function} setAllQuests - Fonction pour mettre à jour les quêtes
 * @returns {Object} { questForm, setQuestForm, showQuestPopup, setShowQuestPopup, editingQuestId, ...actions }
 */
export const useQuestsActions = (allQuests = [], setAllQuests, flushQuestsPersistence) => {
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
    heureType: 'precise',
    creneau: '',
    priere: '',
    heure: '',
    active: true,
    multiSlotsEnabled: false,
    multiSlots: createDefaultMultiSlots(),
    completeWithTodaySportExercise: false,
    completeWithTodaySportStretch: false,
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
      heureType: 'precise',
      creneau: '',
      priere: '',
      heure: '',
      active: true,
      multiSlotsEnabled: false,
      multiSlots: createDefaultMultiSlots(),
      completeWithTodaySportExercise: false,
      completeWithTodaySportStretch: false,
    });
    setShowQuestPopup(true);
  }, []);

  const openEditQuestPopup = useCallback((id) => {
    const quest = allQuests.find((q) => String(q.id) === String(id));
    if (!quest) return;
    setEditingQuestId(id);
    setQuestForm({
      nom: quest.nom || '',
      description: quest.description || '',
      categorie: quest.categorie || CATEGORIES[0],
      difficulte: quest.difficulte || 1,
      duree: snapDureeToValidOption(quest.duree),
      type: quest.type || 'recurrente',
      jours: Array.isArray(quest.jours) ? [...quest.jours] : [],
      date: quest.date || '',
      heureType: quest.creneau ? 'creneau' : 'precise',
      creneau: quest.creneau || '',
      priere: quest.priere || '',
      heure: quest.heure || '',
      active: quest.active !== false,
      multiSlotsEnabled: false,
      multiSlots: createDefaultMultiSlots(),
      completeWithTodaySportExercise: quest.completeWithTodaySportExercise === true,
      completeWithTodaySportStretch: quest.completeWithTodaySportStretch === true,
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
    if (!editingQuestId && questForm.multiSlotsEnabled) {
      const selectedSlots = (questForm.multiSlots || []).filter((slot) => slot?.enabled);
      if (selectedSlots.length === 0) {
        showError('Sélectionne au moins un créneau (matin, midi ou soir).');
        return;
      }
    }
    
    const validatedQuest = validation.data;
    const isEditing = editingQuestId != null;
    
    setAllQuests((prev) => {
      if (isEditing) {
        const payload = stripMultiSlotFields(validatedQuest);
        const updated = prev.map((q) =>
          String(q.id) === String(editingQuestId)
            ? {
                ...q,
                ...payload,
                xp: calculateQuestXP({ ...q, ...payload }),
              }
            : q
        );
        
        emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, {
          questId: editingQuestId,
          skipQuietQuestListRefetch: true,
        });
        return updated;
      }

      const payload = stripMultiSlotFields(validatedQuest);
      const selectedSlots = validatedQuest.multiSlotsEnabled
        ? (validatedQuest.multiSlots || []).filter((slot) => slot?.enabled)
        : [];
      const nextId = prev.length ? Math.max(...prev.map((q) => q.id || 0)) + 1 : 1;
      const createdOn = new Date().toISOString().slice(0, 10);
      const baseOrder = prev.length + 1;

      if (selectedSlots.length === 0) {
        const baseQuest = {
          id: nextId,
          ...payload,
          creeLe: createdOn,
          ordre: baseOrder,
        };
        const newQuest = {
          ...baseQuest,
          xp: calculateQuestXP(baseQuest),
        };
        emitSidebarEvent(SIDEBAR_EVENTS.QUEST_CREATED, {
          questId: nextId,
          skipQuietQuestListRefetch: true,
        });
        return [...prev, newQuest];
      }

      const generatedQuests = selectedSlots.map((slotCfg, idx) => {
        const slot = slotCfg.slot;
        const slotQuest = {
          id: nextId + idx,
          ...payload,
          nom: `${payload.nom} ${SLOT_SUFFIX[slot] || `(${slot})`}`.trim(),
          creneau: slot,
          heureType: slotCfg.heure ? 'precise' : 'creneau',
          heure: slotCfg.heure || '',
          creeLe: createdOn,
          ordre: baseOrder + idx
        };
        return {
          ...slotQuest,
          xp: calculateQuestXP(slotQuest)
        };
      });

      emitSidebarEvent(SIDEBAR_EVENTS.QUEST_CREATED, {
        questId: generatedQuests[0]?.id,
        skipQuietQuestListRefetch: true,
      });
      return [...prev, ...generatedQuests];
    });

    showSuccess(isEditing ? 'Quête modifiée avec succès' : 'Quête créée avec succès');
    setShowQuestPopup(false);
    if (typeof flushQuestsPersistence === 'function') {
      flushQuestsPersistence();
    }
  }, [questForm, editingQuestId, setAllQuests, flushQuestsPersistence, showSuccess, showError]);

  const toggleQuestActive = useCallback((id) => {
    setAllQuests((prev) =>
      prev.map((q) =>
        String(q.id) === String(id) ? { ...q, active: !q.active } : q
      )
    );
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { questId: id, skipQuietQuestListRefetch: true });
  }, [setAllQuests]);

  const deleteQuest = useCallback((id) => {
    const quest = allQuests.find((q) => String(q.id) === String(id));
    const questName = quest?.nom || 'cette quête';
    if (
      !window.confirm(
        `Supprimer définitivement "${questName}" ?\n\nCette action est irréversible. Toutes les validations associées seront également supprimées.`
      )
    )
      return;
    setAllQuests((prev) => prev.filter((q) => String(q.id) !== String(id)));
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, {
      questId: id,
      deleted: true,
      skipQuietQuestListRefetch: true,
    });
    showSuccess(`Quête "${questName}" supprimée`);
  }, [allQuests, setAllQuests, showSuccess]);

  const duplicateQuest = useCallback((id) => {
    const original = allQuests.find((q) => String(q.id) === String(id));
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
      
      emitSidebarEvent(SIDEBAR_EVENTS.QUEST_CREATED, {
        questId: nextId,
        skipQuietQuestListRefetch: true,
      });
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
