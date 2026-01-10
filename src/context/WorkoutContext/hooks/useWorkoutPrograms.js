/**
 * Hook pour la gestion des programmes d'entraînement
 * 
 * ✅ PHASE 4 : Extraction de la logique des programmes
 * 
 * @module context/WorkoutContext/hooks/useWorkoutPrograms
 */

import { useState, useCallback } from 'react';
import { getDateStr, getDayName } from '../../../utils/dateUtils';
import { PROGRAM_STATUS } from '../constants';

/**
 * Hook pour gérer les programmes d'entraînement
 * 
 * @param {Array} programs - Liste des programmes
 * @param {Function} setPrograms - Fonction pour mettre à jour les programmes
 * @param {Object} activeProgram - Programme actif
 * @param {Function} setActiveProgram - Fonction pour définir le programme actif
 * @param {Object} data - Données actuelles
 * @returns {Object} { addProgram, activateProgram, deactivateProgram, deleteProgram, updateProgram, calculateRealUsageDays }
 */
export const useWorkoutPrograms = (programs, setPrograms, activeProgram, setActiveProgram, data) => {
  const addProgram = useCallback((program) => {
    const newProgram = {
      ...program,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: PROGRAM_STATUS.INACTIVE
    };
    setPrograms(prev => [...prev, newProgram]);
    return newProgram;
  }, [setPrograms]);

  const activateProgram = useCallback((programId) => {
    const program = programs.find(p => p.id === programId);
    if (program) {
      if (activeProgram) {
        setPrograms(prev => prev.map(p => 
          p.id === activeProgram.id 
            ? { ...p, status: PROGRAM_STATUS.INACTIVE }
            : p
        ));
      }
      
      const updatedProgram = {
        ...program,
        status: PROGRAM_STATUS.ACTIVE,
        startDate: program.startDate || new Date().toISOString()
      };
      setPrograms(prev => prev.map(p => 
        p.id === programId ? updatedProgram : p
      ));
      setActiveProgram(updatedProgram);
    }
  }, [programs, activeProgram, setPrograms, setActiveProgram]);

  const deactivateProgram = useCallback(() => {
    if (activeProgram) {
      setPrograms(prev => prev.map(p => 
        p.id === activeProgram.id 
          ? { ...p, status: PROGRAM_STATUS.INACTIVE }
          : p
      ));
      setActiveProgram(null);
    }
  }, [activeProgram, setPrograms, setActiveProgram]);

  const deleteProgram = useCallback((programId) => {
    setPrograms(prev => prev.filter(p => p.id !== programId));
    if (activeProgram && activeProgram.id === programId) {
      setActiveProgram(null);
    }
  }, [setPrograms, activeProgram, setActiveProgram]);

  const updateProgram = useCallback((updatedProgram) => {
    setPrograms(prev => prev.map(p => 
      p.id === updatedProgram.id ? updatedProgram : p
    ));
    if (activeProgram && activeProgram.id === updatedProgram.id) {
      setActiveProgram(updatedProgram);
    }
  }, [setPrograms, activeProgram, setActiveProgram]);

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
