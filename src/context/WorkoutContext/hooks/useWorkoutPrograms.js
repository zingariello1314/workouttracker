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
  const addProgram = useCallback(
    (program) => {
      const newProgram = {
        ...program,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: PROGRAM_STATUS.INACTIVE,
      };
      setPrograms((prev) => {
        const next = [...prev, newProgram];
        if (persistProgramsPartial) {
          queueMicrotask(() => persistProgramsPartial({ programs: next, activeProgram }));
        }
        return next;
      });
      return newProgram;
    },
    [setPrograms, persistProgramsPartial, activeProgram]
  );

  const activateProgram = useCallback(
    (programId) => {
      const program = programs.find((p) => p.id === programId);
      if (!program) return;
      const updatedProgram = {
        ...program,
        status: PROGRAM_STATUS.ACTIVE,
        startDate: program.startDate || new Date().toISOString(),
      };
      setPrograms((prev) => {
        let next = prev.map((p) =>
          activeProgram && p.id === activeProgram.id ? { ...p, status: PROGRAM_STATUS.INACTIVE } : p
        );
        next = next.map((p) => (p.id === programId ? updatedProgram : p));
        if (persistProgramsPartial) {
          queueMicrotask(() =>
            persistProgramsPartial({ programs: next, activeProgram: updatedProgram })
          );
        }
        return next;
      });
      setActiveProgram(updatedProgram);
    },
    [programs, activeProgram, setPrograms, setActiveProgram, persistProgramsPartial]
  );

  const deactivateProgram = useCallback(() => {
    if (!activeProgram) return;
    const id = activeProgram.id;
    setPrograms((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, status: PROGRAM_STATUS.INACTIVE } : p
      );
      if (persistProgramsPartial) {
        queueMicrotask(() => persistProgramsPartial({ programs: next, activeProgram: null }));
      }
      return next;
    });
    setActiveProgram(null);
  }, [activeProgram, setPrograms, setActiveProgram, persistProgramsPartial]);

  const deleteProgram = useCallback(
    (programId) => {
      setPrograms((prev) => {
        const next = prev.filter((p) => p.id !== programId);
        const nextActive = activeProgram && activeProgram.id === programId ? null : activeProgram;
        if (persistProgramsPartial) {
          queueMicrotask(() =>
            persistProgramsPartial({ programs: next, activeProgram: nextActive })
          );
        }
        return next;
      });
      if (activeProgram && activeProgram.id === programId) {
        setActiveProgram(null);
      }
    },
    [setPrograms, activeProgram, setActiveProgram, persistProgramsPartial]
  );

  const updateProgram = useCallback(
    (updatedProgram) => {
      setPrograms((prev) => {
        const next = prev.map((p) => (p.id === updatedProgram.id ? updatedProgram : p));
        const nextActive =
          activeProgram && activeProgram.id === updatedProgram.id ? updatedProgram : activeProgram;
        if (persistProgramsPartial) {
          queueMicrotask(() =>
            persistProgramsPartial({ programs: next, activeProgram: nextActive })
          );
        }
        return next;
      });
      if (activeProgram && activeProgram.id === updatedProgram.id) {
        setActiveProgram(updatedProgram);
      }
    },
    [setPrograms, activeProgram, setActiveProgram, persistProgramsPartial]
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
