/**
 * 🏋️ HOOK USE TODAY EXERCISES
 * 
 * Hook personnalisé pour gérer les exercices du jour avec variations journalières.
 * Optimisé avec Set pour lookup O(1), validation stricte, et métadonnées enrichies.
 * 
 * @module useTodayExercises
 */

import { useMemo } from 'react';
import { useTranslation } from '../utils/translations';
import { useWorkout } from '../context/WorkoutContext';
import { getDateStr } from '../utils/dateUtils';
import {
  getExerciseSeriesOverrides,
  getExerciseVariationOverrides,
  mergeSeriesIntoProgramExercises,
  mergeVariationOverridesIntoProgramExercises
} from '../utils/dailyVariationSeriesOverrides';
import {
  buildSupplementalExercisesForDate,
  mergeSupplementalWithProgram
} from '../utils/todaySupplementalExercises';
import { shouldHideProgramExerciseOnTodayTab } from '../utils/gtgProgramExerciseFilter';

/**
 * Hook pour obtenir les exercices du jour avec variations journalières
 * 
 * @param {Object} options - Options
 * @param {Date} options.date - Date à utiliser (défaut: currentDate du contexte)
 * @param {boolean} options.isGymMode - Mode salle activé (défaut: isGymMode du contexte)
 * @returns {Object} Objet contenant programExercises, additionalExercises, suppressedExerciseIds, et metadata
 * 
 * @example
 * const { programExercises, additionalExercises, metadata } = useTodayExercises();
 */
export const useTodayExercises = (options = {}) => {
  const {
    currentDate: contextCurrentDate,
    isGymMode: contextIsGymMode,
    data,
    getTodayWorkout,
    getDateStr: contextGetDateStr
  } = useWorkout();

  const t = useTranslation();

  const date = options.date || contextCurrentDate;
  const isGymMode = options.isGymMode !== undefined ? options.isGymMode : contextIsGymMode;

  // ✅ Mémoizer la date string (évite recalcul)
  const dateStr = useMemo(() => {
    if (contextGetDateStr) {
      return contextGetDateStr(date);
    }
    return getDateStr(date);
  }, [date, contextGetDateStr]);

  // ✅ Hook principal avec useMemo pour performance optimale
  const result = useMemo(() => {
    try {
      // ✅ Validation d'entrée robuste
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('⚠️ Date invalide dans useTodayExercises:', date);
        return {
          programExercises: [],
          supplementalExercises: [],
          additionalExercises: [],
          suppressedExerciseIds: [],
          metadata: {
            suppressedCount: 0,
            additionalCount: 0,
            hasVariations: false,
            variationReason: null,
            completionRate: 0,
            completedExceptional: 0,
            totalExercises: 0,
            variationDate: null,
            lastModified: null,
            error: 'Date invalide'
          }
        };
      }

      // ✅ Récupérer le workout du jour
      const baseWorkout = getTodayWorkout ? getTodayWorkout(date, isGymMode) : null;

      // ✅ Protection contre workout invalide
      if (!baseWorkout || !Array.isArray(baseWorkout.exercices)) {
        console.warn('⚠️ Workout invalide dans useTodayExercises:', baseWorkout);
        return {
          programExercises: [],
          supplementalExercises: [],
          additionalExercises: [],
          suppressedExerciseIds: [],
          metadata: {
            suppressedCount: 0,
            additionalCount: 0,
            hasVariations: false,
            variationReason: null,
            completionRate: 0,
            completedExceptional: 0,
            totalExercises: 0,
            variationDate: null,
            lastModified: null,
            error: 'Workout invalide'
          }
        };
      }

      // ✅ Récupérer la variation journalière
      const dailyVariation = data?.dailyVariations?.[dateStr];

      // ✅ OPTIMISATION : Set pour lookup O(1) avec validation stricte
      const suppressedIds = Array.isArray(dailyVariation?.suppressedExercises)
        ? dailyVariation.suppressedExercises.filter(id => 
            typeof id === 'number' && !isNaN(id) && id > 0
          )
        : [];
      const suppressedIdsSet = new Set(suppressedIds);

      // ✅ FILTRAGE INTELLIGENT : Préserver l'ordre original du programme
      // + Validation que chaque exercice a un ID valide
      const seriesOverrides = getExerciseSeriesOverrides(data?.dailyVariations, dateStr);
      const variationOverrides = getExerciseVariationOverrides(data?.dailyVariations, dateStr);

      const programExercises = mergeVariationOverridesIntoProgramExercises(
        mergeSeriesIntoProgramExercises(
        baseWorkout.exercices.filter((ex) => {
        // ✅ Protection contre exercices invalides
        if (!ex || typeof ex !== 'object') {
          console.warn('⚠️ Exercice invalide dans programme (not an object):', ex);
          return false;
        }
        if (typeof ex.id !== 'number' || isNaN(ex.id) || ex.id <= 0) {
          console.warn('⚠️ Exercice invalide dans programme (invalid ID):', ex);
          return false;
        }
        if (shouldHideProgramExerciseOnTodayTab(ex)) return false;
        // ✅ Filtrer les exercices supprimés (lookup O(1))
        return !suppressedIdsSet.has(ex.id);
        }),
        seriesOverrides
        ),
        variationOverrides
      );

      // ✅ VALIDATION RENFORCÉE : S'assurer que les exercices exceptionnels sont bien formés
      const additionalExercises = (Array.isArray(dailyVariation?.additionalExercises)
        ? dailyVariation.additionalExercises
        : []
      ).filter(ex => {
        // ✅ Validation complète de la structure
        if (!ex || typeof ex !== 'object') {
          console.warn('⚠️ Exercice exceptionnel invalide (not an object):', ex);
          return false;
        }
        
        // ✅ Validation ID (string, non vide, format correct)
        if (!ex.id || typeof ex.id !== 'string' || ex.id.trim().length === 0) {
          console.warn('⚠️ Exercice exceptionnel invalide (invalid ID):', ex);
          return false;
        }
        if (!ex.id.startsWith('exceptional_')) {
          console.warn('⚠️ Exercice exceptionnel invalide (ID format incorrect):', ex.id);
          return false;
        }
        
        // ✅ Validation nom (string, non vide, 2-100 chars)
        if (!ex.name || typeof ex.name !== 'string' || ex.name.trim().length < 2) {
          console.warn('⚠️ Exercice exceptionnel invalide (nom trop court):', ex);
          return false;
        }
        if (ex.name.trim().length > 100) {
          console.warn('⚠️ Exercice exceptionnel invalide (nom trop long):', ex);
          return false;
        }
        
        // ✅ Validation type (reps ou duration)
        if (!ex.type || !['reps', 'duration'].includes(ex.type)) {
          console.warn('⚠️ Exercice exceptionnel invalide (type incorrect):', ex);
          return false;
        }
        
        // ✅ Validation spécifique selon le type
        if (ex.type === 'reps') {
          // Si series défini, doit être valide
          if (ex.series !== undefined) {
            if (typeof ex.series !== 'number' || ex.series < 1 || ex.series > 50) {
              console.warn('⚠️ Nombre de séries invalide:', ex.series);
              return false;
            }
          }
          // Si repsPerSeries défini, doit être un array valide
          if (ex.repsPerSeries !== undefined) {
            if (!Array.isArray(ex.repsPerSeries)) {
              console.warn('⚠️ repsPerSeries doit être un array:', ex);
              return false;
            }
            // Validation de chaque valeur de rep
            if (ex.repsPerSeries.some(r => typeof r !== 'number' || r <= 0 || r > 1000)) {
              console.warn('⚠️ Valeurs de reps invalides:', ex.repsPerSeries);
              return false;
            }
          }
        } else if (ex.type === 'duration') {
          // Si duration défini, doit être valide
          if (ex.duration !== undefined) {
            if (typeof ex.duration !== 'number' || ex.duration <= 0) {
              console.warn('⚠️ Durée invalide:', ex.duration);
              return false;
            }
            if (ex.duration > 7200) {
              console.warn('⚠️ Durée trop longue (> 7200s):', ex.duration);
              return false;
            }
          }
        }
        
        return true;
      });

      // ✅ MÉTADONNÉES ENRICHIES avec calculs intelligents
      const suppressedCount = suppressedIdsSet.size;
      const additionalCount = additionalExercises.length;
      const hasVariations = suppressedCount > 0 || additionalCount > 0;

      // ✅ Calculer statistiques avancées
      const completedExceptional = additionalExercises.filter(ex => ex.completed === true).length;
      const completionRate = additionalCount > 0 
        ? parseFloat((completedExceptional / additionalCount * 100).toFixed(1))
        : 0;

      // ✅ Calculer total exercices (programme + exceptionnels)
      const totalExercises = programExercises.length + additionalCount;

      const supplementalExercises = mergeSupplementalWithProgram(
        programExercises,
        buildSupplementalExercisesForDate({
          dateStr,
          challenges: data?.enduranceData?.challenges,
          t
        })
      );

      return {
        programExercises,
        supplementalExercises,
        additionalExercises,
        suppressedExerciseIds: Array.from(suppressedIdsSet),
        // ✅ Métadonnées ultra-enrichies
        metadata: {
          suppressedCount,
          additionalCount,
          hasVariations,
          variationReason: dailyVariation?.reason || null,
          // ✅ Statistiques avancées
          completionRate,
          completedExceptional,
          totalExercises: totalExercises + supplementalExercises.length,
          variationDate: dailyVariation?.createdAt || null,
          lastModified: dailyVariation?.lastModifiedAt || null
        }
      };
    } catch (error) {
      // ✅ Gestion d'erreur robuste avec fallback
      console.error('❌ Erreur dans useTodayExercises:', error);
      return {
        programExercises: [],
        supplementalExercises: [],
        additionalExercises: [],
        suppressedExerciseIds: [],
        metadata: {
          suppressedCount: 0,
          additionalCount: 0,
          hasVariations: false,
          variationReason: null,
          completionRate: 0,
          completedExceptional: 0,
          totalExercises: 0,
          variationDate: null,
          lastModified: null,
          error: error?.message || 'Erreur inconnue'
        }
      };
    }
  }, [date, isGymMode, data?.dailyVariations, data?.enduranceData?.challenges, dateStr, getTodayWorkout, t]);

  return result;
};

export default useTodayExercises;

