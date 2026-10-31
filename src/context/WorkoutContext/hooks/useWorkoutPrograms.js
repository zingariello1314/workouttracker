/**
 * Hook pour la gestion des programmes d'entraînement
 *
 * P3.4 : file d’attente de mutations — journal + seal persistés avant
 * l’application de la nouvelle structure (évite révision avec contenu suivant).
 *
 * @module context/WorkoutContext/hooks/useWorkoutPrograms
 */

import { useCallback, useRef } from 'react';
import { getDateStr, getDayName } from '../../../utils/dateUtils';
import { PROGRAM_STATUS } from '../constants';
import { purgeSoftRemovedExercisesFromProgram } from '../../../utils/programPersistenceUtils';
import { normalizeProgramRestConfig } from '../../../utils/restDayUtils';
import { REVISION_MUTATION_KIND } from '../../../utils/programRevisionJournalP34';

/**
 * @param {Function} [persistProgramsPartial] — Sauvegarde IndexedDB immédiate après mutation (programmes + actif).
 * @param {Function} [prepareAndPersistBeforeMutation] — P3.3/P3.4 : async (ctx) => { ok, uncertain? }
 */
export const useWorkoutPrograms = (
  programs,
  setPrograms,
  activeProgram,
  setActiveProgram,
  data,
  persistProgramsPartial,
  prepareAndPersistBeforeMutation = null
) => {
  const mutationChainRef = useRef(Promise.resolve());

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

  const enqueueMutation = useCallback((fn) => {
    const run = mutationChainRef.current.then(() => fn());
    mutationChainRef.current = run.catch((error) => {
      console.error('❌ [useWorkoutPrograms] Mutation en file échouée:', error);
    });
    return run;
  }, []);

  const runPrepareBeforeMutation = useCallback(
    async (ctx) => {
      if (typeof prepareAndPersistBeforeMutation !== 'function') {
        return { ok: true, skipped: true };
      }
      try {
        return await prepareAndPersistBeforeMutation(ctx);
      } catch (error) {
        console.error('❌ [useWorkoutPrograms] Échec prepare/persist P3.4:', error);
        return { ok: false, uncertain: true, error };
      }
    },
    [prepareAndPersistBeforeMutation]
  );

  const addProgram = useCallback(
    (program) => {
      const newProgram = normalizeProgramRestConfig({
        ...program,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: PROGRAM_STATUS.INACTIVE,
      });
      let nextProgramsRef = null;
      setPrograms((prev) => {
        const next = [...prev, purgeSoftRemovedExercisesFromProgram(newProgram)];
        nextProgramsRef = next;
        return next;
      });
      if (nextProgramsRef) persistNow(nextProgramsRef, activeProgram);
      // Première structure : journalisée à l’activation, pas à l’ajout inactif.
      return newProgram;
    },
    [setPrograms, activeProgram, persistNow]
  );

  const activateProgram = useCallback(
    (programId) => {
      void enqueueMutation(async () => {
        const program = programs.find((p) => p.id === programId);
        if (!program) return;
        const updatedProgram = {
          ...normalizeProgramRestConfig(purgeSoftRemovedExercisesFromProgram(program)),
          status: PROGRAM_STATUS.ACTIVE,
          startDate: program.startDate || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await runPrepareBeforeMutation({
          previousActiveProgram: activeProgram,
          nextActiveProgram: updatedProgram,
          nextProgramForRevision: updatedProgram,
          source: 'activate',
          mutationKind: REVISION_MUTATION_KIND.ACTIVATION
        });
        let nextProgramsRef = null;
        setPrograms((prev) => {
          let next = prev.map((p) =>
            activeProgram && p.id === activeProgram.id
              ? { ...p, status: PROGRAM_STATUS.INACTIVE }
              : p
          );
          next = next.map((p) => (p.id === programId ? updatedProgram : p));
          nextProgramsRef = next;
          return next;
        });
        if (nextProgramsRef) persistNow(nextProgramsRef, updatedProgram);
        setActiveProgram(updatedProgram);
      });
    },
    [
      programs,
      activeProgram,
      setPrograms,
      setActiveProgram,
      persistNow,
      enqueueMutation,
      runPrepareBeforeMutation
    ]
  );

  const deactivateProgram = useCallback(() => {
    if (!activeProgram) return;
    void enqueueMutation(async () => {
      const prev = activeProgram;
      await runPrepareBeforeMutation({
        previousActiveProgram: prev,
        nextActiveProgram: null,
        source: 'deactivate',
        mutationKind: REVISION_MUTATION_KIND.DEACTIVATION
      });
      const id = prev.id;
      let nextProgramsRef = null;
      setPrograms((p) => {
        const next = p.map((x) =>
          x.id === id ? { ...x, status: PROGRAM_STATUS.INACTIVE } : x
        );
        nextProgramsRef = next;
        return next;
      });
      if (nextProgramsRef) persistNow(nextProgramsRef, null);
      setActiveProgram(null);
    });
  }, [
    activeProgram,
    setPrograms,
    setActiveProgram,
    persistNow,
    enqueueMutation,
    runPrepareBeforeMutation
  ]);

  const deleteProgram = useCallback(
    (programId) => {
      void enqueueMutation(async () => {
        const touchesActive = Boolean(activeProgram && activeProgram.id === programId);
        if (touchesActive) {
          await runPrepareBeforeMutation({
            previousActiveProgram: activeProgram,
            nextActiveProgram: null,
            source: 'delete',
            mutationKind: REVISION_MUTATION_KIND.DELETION
          });
        }
        let nextProgramsRef = null;
        let nextActiveRef = touchesActive ? null : activeProgram;
        setPrograms((prev) => {
          const next = prev.filter((p) => p.id !== programId);
          nextProgramsRef = next;
          return next;
        });
        if (nextProgramsRef) persistNow(nextProgramsRef, nextActiveRef);
        if (touchesActive) setActiveProgram(null);
      });
    },
    [
      setPrograms,
      activeProgram,
      setActiveProgram,
      persistNow,
      enqueueMutation,
      runPrepareBeforeMutation
    ]
  );

  const updateProgram = useCallback(
    (updatedProgram) => {
      void enqueueMutation(async () => {
        const touchesActive = Boolean(
          activeProgram && updatedProgram?.id && activeProgram.id === updatedProgram.id
        );
        const normalizedProgram = {
          ...normalizeProgramRestConfig(purgeSoftRemovedExercisesFromProgram(updatedProgram)),
          updatedAt: new Date().toISOString()
        };
        if (touchesActive) {
          await runPrepareBeforeMutation({
            previousActiveProgram: activeProgram,
            nextActiveProgram: normalizedProgram,
            nextProgramForRevision: normalizedProgram,
            source: 'update',
            mutationKind: null // détecté via empreinte (structural vs metadata)
          });
        }
        const nextActive =
          activeProgram && activeProgram.id === normalizedProgram.id
            ? normalizedProgram
            : activeProgram;
        const nextPrograms = programs.map((p) =>
          p.id === normalizedProgram.id ? normalizedProgram : p
        );
        setPrograms(nextPrograms);
        if (activeProgram && activeProgram.id === normalizedProgram.id) {
          setActiveProgram(normalizedProgram);
        }
        persistNow(nextPrograms, nextActive);
      });
    },
    [
      programs,
      setPrograms,
      activeProgram,
      setActiveProgram,
      persistNow,
      enqueueMutation,
      runPrepareBeforeMutation
    ]
  );

  const calculateRealUsageDays = useCallback((programId, startDate) => {
    if (!startDate || !data?.checkedExercises) return 0;
    const start = new Date(startDate);
    let usageDays = 0;
    const today = new Date();

    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = getDateStr(d);
      const dayName = getDayName(d);
      const program = programs.find((p) => p.id === programId);

      if (program && program.schedule && program.schedule[dayName]) {
        const daySchedule = program.schedule[dayName];
        const hasCompletedExercise = (daySchedule.exercises || []).some((ex) => {
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
