/**
 * Pont Quêtes ↔ étirements (Sport → Aujourd’hui) : actif tant que l’app est montée.
 * Quand une quête « Étirements » liée est cochée/décochée dans l’onglet Quêtes,
 * met à jour les coches étirements du jour correspondant.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useQuietQuestEngine } from '../../hooks/useQuietQuestEngine';
import { getDateStr, getDayName } from '../../utils/dateUtils';
import { resolveEtirementsForDay } from '../../utils/stretchUtils';
import {
  applyQuestValidationToStretchData,
  STRETCH_SYNC_ORIGIN,
} from '../../utils/questStretchSync';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../utils/sidebarEvents';

export default function QuestStretchSyncBridge() {
  const {
    getCurrentData,
    updateTempStretchData,
    currentDate,
    getTodayWorkout,
    isGymMode,
    workoutProgram,
    workoutDayOverride,
  } = useWorkout();

  const { allQuests, todayDate: quietEngineToday } = useQuietQuestEngine();

  const allQuestsRef = useRef(allQuests);
  useEffect(() => {
    allQuestsRef.current = allQuests;
  }, [allQuests]);

  const applyQuestToStretches = useCallback(
    (questId, dateStr, completed) => {
      if (!dateStr || dateStr !== quietEngineToday) return;
      const quest = allQuestsRef.current.find((q) => q.id === questId);
      if (!quest) return;

      const date = currentDate;
      const dayName = getDayName(date);
      const effectiveStretchDay = workoutDayOverride || dayName;
      const workout = getTodayWorkout(date, isGymMode);
      const resolved = resolveEtirementsForDay(
        workout?.etirements,
        effectiveStretchDay,
        workoutProgram
      );

      const currentData = getCurrentData();
      const next = applyQuestValidationToStretchData({
        quest,
        completed: completed === true,
        date,
        dataSnapshot: currentData,
        resolvedEtirements: resolved,
        effectiveStretchDay,
      });
      if (next !== currentData) {
        updateTempStretchData(next);
      }
    },
    [
      quietEngineToday,
      currentDate,
      workoutDayOverride,
      getTodayWorkout,
      isGymMode,
      workoutProgram,
      getCurrentData,
      updateTempStretchData,
    ]
  );

  useEffect(() => {
    const onQuestEvent = (payload) => {
      if (!payload || payload.origin === STRETCH_SYNC_ORIGIN) return;
      const { questId, date, completed } = payload;
      if (questId == null || !date) return;
      applyQuestToStretches(questId, date, completed !== false);
    };

    const unsubDone = sidebarEvents.on(SIDEBAR_EVENTS.QUEST_COMPLETED, (payload) => {
      onQuestEvent({ ...payload, completed: true });
    });
    const unsubUpd = sidebarEvents.on(SIDEBAR_EVENTS.QUEST_UPDATED, (payload) => {
      onQuestEvent(payload);
    });

    return () => {
      unsubDone();
      unsubUpd();
    };
  }, [applyQuestToStretches]);

  return null;
}
