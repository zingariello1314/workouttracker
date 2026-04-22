/**
 * Hook pour la gestion des programmes d'entraînement
 * 
 * ✅ PHASE 4 : Extraction de la logique des programmes
 * 
 * @module context/WorkoutContext/hooks/useWorkoutPrograms
 */

import { useCallback } from 'react';
import { getDateStr, getDayName } from '../../../utils/dateUtils';
import { PROGRAM_STATUS } from '../constants';
import { purgeSoftRemovedExercisesFromProgram } from '../../../utils/programPersistenceUtils';

/**
 * @param {Function} [persistProgramsPartial] — Sauvegarde IndexedDB immédiate après mutation (programmes + actif).
 */
export const useWorkoutPrograms = (
  programs,
  setPrograms,
  activeProgram,
  setActiveProgram,
  data,
  persistProgramsPartial
) => {
  const persistNow = useCallback(
    (nextPrograms, nextActiveProgram) => {
      if (!persistProgramsPartial) return;
      Promise.resolve(
        persistProgramsPartial({
          programs: nextPrograms,
          activeProgram: nextActiveProgram
        })
      ).catch((error) => {
        console.error('❌ [useWorkoutPrograms] Échec persistance immédiate:', error);
      });
    },
    [persistProgramsPartial]
  );

  const addProgram = useCallback(
    (program) => {
      const newProgram = {
        ...program,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: PROGRAM_STATUS.INACTIVE,
      };
      let nextProgramsRef = null;
      setPrograms((prev) => {
        const next = [...prev, purgeSoftRemovedExercisesFromProgram(newProgram)];
        nextProgramsRef = next;
        return next;
      });
      if (nextProgramsRef) persistNow(nextProgramsRef, activeProgram);
      return newProgram;
    },
    [setPrograms, activeProgram, persistNow]
  );

  const activateProgram = useCallback(
    (programId) => {
      const program = programs.find((p) => p.id === programId);
      if (!program) return;
      const updatedProgram = {
        ...purgeSoftRemovedExercisesFromProgram(program),
        status: PROGRAM_STATUS.ACTIVE,
        startDate: program.startDate || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      let nextProgramsRef = null;
      setPrograms((prev) => {
        let next = prev.map((p) =>
          activeProgram && p.id === activeProgram.id ? { ...p, status: PROGRAM_STATUS.INACTIVE } : p
        );
        next = next.map((p) => (p.id === programId ? updatedProgram : p));
        nextProgramsRef = next;
        return next;
      });
      if (nextProgramsRef) persistNow(nextProgramsRef, updatedProgram);
      setActiveProgram(updatedProgram);
    },
    [programs, activeProgram, setPrograms, setActiveProgram, persistNow]
  );

  const deactivateProgram = useCallback(() => {
    if (!activeProgram) return;
    const id = activeProgram.id;
    let nextProgramsRef = null;
    setPrograms((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, status: PROGRAM_STATUS.INACTIVE } : p
      );
      nextProgramsRef = next;
      return next;
    });
    if (nextProgramsRef) persistNow(nextProgramsRef, null);
    setActiveProgram(null);
  }, [activeProgram, setPrograms, setActiveProgram, persistNow]);

  const deleteProgram = useCallback(
    (programId) => {
      let nextProgramsRef = null;
      let nextActiveRef = activeProgram && activeProgram.id === programId ? null : activeProgram;
      setPrograms((prev) => {
        const next = prev.filter((p) => p.id !== programId);
        nextProgramsRef = next;
        return next;
      });
      if (nextProgramsRef) persistNow(nextProgramsRef, nextActiveRef);
      if (activeProgram && activeProgram.id === programId) {
        setActiveProgram(null);
      }
    },
    [setPrograms, activeProgram, setActiveProgram, persistNow]
  );

  const updateProgram = useCallback(
    (updatedProgram) => {
      const normalizedProgram = {
        ...purgeSoftRemovedExercisesFromProgram(updatedProgram),
        updatedAt: new Date().toISOString()
      };
      let nextProgramsRef = null;
      let nextActiveRef = activeProgram && activeProgram.id === normalizedProgram.id ? normalizedProgram : activeProgram;
      setPrograms((prev) => {
        const next = prev.map((p) => (p.id === normalizedProgram.id ? normalizedProgram : p));
        nextProgramsRef = next;
        return next;
      });
      if (nextProgramsRef) persistNow(nextProgramsRef, nextActiveRef);
      if (activeProgram && activeProgram.id === normalizedProgram.id) {
        setActiveProgram(normalizedProgram);
      }
    },
    [setPrograms, activeProgram, setActiveProgram, persistNow]
  );

  const calculateRealUsageDays = useCallback((programId, startDate) => {
    if (!startDate || !data?.checkedExercises) return 0;
    const start = new Date(startDate);
    let usageDays = 0;
    const today = new Date();

    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = getDateStr(d);
      const dayName = getDayName(d);
      const program = programs.find(p => p.id === programId);

      if (program && program.schedule && program.schedule[dayName]) {
        const daySchedule = program.schedule[dayName];
        const hasCompletedExercise = (daySchedule.exercises || []).some(ex => {
          let numericId;
          if (typeof ex.id === 'string') {
            let hash = 0;
            for (let i = 0; i < ex.id.length; i++) {
              const char = ex.id.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash;
            }
            numericId = Math.abs(hash) + 10000;
          } else {
            numericId = ex.id;
          }
          
          const exerciseKey = `${dateStr}_${numericId}`;
          return data.checkedExercises[exerciseKey];
        });
        if (hasCompletedExercise) {
          usageDays++;
        }
      }
    }
    return usageDays;
  }, [data?.checkedExercises, programs]);

  return {
    addProgram,
    activateProgram,
    deactivateProgram,
    deleteProgram,
    updateProgram,
    calculateRealUsageDays,
  };
};
