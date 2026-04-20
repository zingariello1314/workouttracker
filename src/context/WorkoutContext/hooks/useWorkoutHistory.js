/**
 * Hook pour la gestion de l'historique des entraînements
 * 
 * ✅ PHASE 4 : Extraction de la logique de l'historique
 * 
 * @module context/WorkoutContext/hooks/useWorkoutHistory
 */

import { useCallback } from 'react';
import { getDateStr, getDayName } from '../../../utils/dateUtils';
import { normalizeRepsValue } from '../utils';
import { resolveExerciseIntensityCoeff } from '../../../utils/trainingLoadUtils';
import { isSessionFeedbackFilled } from '../../../utils/sessionFeedbackUtils';

/**
 * Hook pour gérer l'historique des entraînements
 * 
 * @param {Function} getCurrentData - Fonction pour obtenir les données actuelles
 * @param {Function} getExerciseNameById - Fonction pour obtenir le nom d'un exercice par son ID
 * @returns {Object} { getWorkoutHistory }
 */
export const useWorkoutHistory = (getCurrentData, getExerciseNameById) => {
  const getWorkoutHistory = useCallback(() => {
    const currentData = getCurrentData();
    
    if (!currentData) {
      return [];
    }

    const history = [];
    
    // ✅ Grouper les données par date (structure enrichie pour variations)
    const dataByDate = {};
    
    // ✅ ============================================
    // PHASE 1 : TRAITER LES EXERCICES NORMAUX (code existant préservé)
    // ============================================
    try {
      if (currentData.reps) {
        Object.keys(currentData.reps).forEach(key => {
          const reps = normalizeRepsValue(currentData.reps[key]);
          
          if (reps > 0) {
            const parts = key.split('_');
            if (parts.length >= 2) {
              const dateStr = parts[0];
              const exerciseId = parts[1];
              const variant = parts[2] || '';
              
              // ✅ Ignorer les clés non-numériques (endurance, complementary, etc.)
              if (!/^\d+$/.test(exerciseId)) {
                return;
              }
              
              if (!dataByDate[dateStr]) {
                dataByDate[dateStr] = { exercises: {}, stretches: {}, variations: null };
              }
              
              dataByDate[dateStr].exercises[key] = {
                exerciseId: exerciseId,
                reps: reps,
                completed: currentData.checkedExercises?.[key] || false,
                variant: variant
              };
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Erreur Phase 1 (Exercices normaux):', error);
    }
    
    // ✅ ============================================
    // PHASE 2 : TRAITER LES DAILY VARIATIONS
    // ============================================
    try {
      Object.entries(currentData.dailyVariations || {}).forEach(([dateStr, variation]) => {
        if (!variation || typeof variation !== 'object') {
          console.warn(`⚠️ Variation invalide pour ${dateStr}:`, variation);
          return;
        }
        
        if (!dataByDate[dateStr]) {
          dataByDate[dateStr] = { exercises: {}, stretches: {}, variations: variation };
        } else {
          dataByDate[dateStr].variations = variation;
        }
        
        const additionalExercises = Array.isArray(variation.additionalExercises) 
          ? variation.additionalExercises 
          : [];
        
        additionalExercises.forEach(ex => {
          if (!ex || typeof ex !== 'object' || !ex.id) {
            console.warn(`⚠️ Exercice exceptionnel invalide pour ${dateStr}:`, ex);
            return;
          }
          
          if (ex.completed === true) {
            const exerciseKey = `exceptional_${ex.id}`;
            
            let reps = 0;
            let actualReps = null;
            let totalReps = null;
            
            if (ex.type === 'reps') {
              if (Array.isArray(ex.actualReps) && ex.actualReps.length > 0) {
                actualReps = ex.actualReps;
                totalReps = ex.actualReps.reduce((sum, r) => sum + (typeof r === 'number' ? r : 0), 0);
                reps = totalReps;
              } else if (ex.totalReps && typeof ex.totalReps === 'number' && ex.totalReps > 0) {
                totalReps = ex.totalReps;
                reps = totalReps;
              } else if (Array.isArray(ex.repsPerSeries) && ex.repsPerSeries.length > 0) {
                actualReps = ex.repsPerSeries;
                totalReps = ex.repsPerSeries.reduce((sum, r) => sum + (typeof r === 'number' ? r : 0), 0);
                reps = totalReps;
              }
            }
            
            let duration = null;
            if (ex.type === 'duration') {
              duration = ex.actualDuration || ex.duration || null;
            }
            
            dataByDate[dateStr].exercises[exerciseKey] = {
              exerciseId: ex.id,
              name: ex.name || 'Exercice exceptionnel',
              reps: reps,
              duration: duration,
              completed: true,
              isExceptional: true,
              type: ex.type,
              actualReps: actualReps,
              totalReps: totalReps,
              materiel: ex.materiel,
              notes: ex.notes
            };
          }
        });
      });
    } catch (error) {
      console.error('❌ Erreur Phase 2 (DailyVariations):', error);
    }
    
    // ✅ ============================================
    // PHASE 3 : TRAITER LES ÉTIREMENTS
    // ============================================
    try {
      if (currentData.checkedStretches) {
        Object.keys(currentData.checkedStretches).forEach(key => {
          if (currentData.checkedStretches[key]) {
            const parts = key.split('_');
            if (parts.length >= 2) {
              const dateStr = parts[0];
              const stretchType = parts[1];
              
              if (!dataByDate[dateStr]) {
                dataByDate[dateStr] = { exercises: {}, stretches: {}, variations: null };
              }
              
              dataByDate[dateStr].stretches[key] = {
                stretchType: stretchType,
                completed: true
              };
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Erreur Phase 3 (Étirements):', error);
    }
    
    // ✅ ============================================
    // PHASE 4 : TRAITER LES SESSIONS D'ENDURANCE
    // ============================================
    try {
      const enduranceData = currentData?.enduranceData || {};
      const enduranceSessions = enduranceData.sessions || {};
      
      Object.entries(enduranceSessions).forEach(([activityType, sessions]) => {
        if (Array.isArray(sessions)) {
          sessions.forEach(session => {
            if (session.date) {
              let dateStr = session.date;
              if (session.date.includes('T')) {
                dateStr = session.date.split('T')[0];
              }
              
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                if (!dataByDate[dateStr]) {
                  dataByDate[dateStr] = { exercises: {}, stretches: {}, variations: null };
                }
                
                const enduranceKey = `${dateStr}_endurance_${activityType}_${session.id || Date.now()}`;
                dataByDate[dateStr].exercises[enduranceKey] = {
                  exerciseId: `endurance_${activityType}`,
                  reps: activityType === 'jumprope' ? 0 : (session.reps || session.count || 0),
                  jumps: activityType === 'jumprope' ? (session.jumps || 0) : undefined,
                  completed: true,
                  variant: '',
                  activityType: activityType,
                  duration: session.duration || 0,
                  distance: session.distance || 0,
                  notes: session.notes || ''
                };
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Erreur Phase 4 (Endurance):', error);
    }
    
    // ✅ ============================================
    // PHASE 5 : FUSION INTELLIGENTE AVEC MÉTADONNÉES ENRICHIES
    // ============================================
    try {
      Object.keys(dataByDate).forEach(dateStr => {
        const date = new Date(dateStr);
        const dayName = getDayName(date);
        
        const dateData = dataByDate[dateStr];
        const variation = dateData.variations;
        const exercises = [];
        const stretches = [];
        
        // ✅ Créer les exercices depuis les données normales ET exceptionnelles
        Object.keys(dateData.exercises || {}).forEach(key => {
          const exerciseData = dateData.exercises[key];
          
          if (exerciseData.isExceptional) {
            exercises.push({
              id: exerciseData.exerciseId,
              name: exerciseData.name || 'Exercice exceptionnel',
              reps: normalizeRepsValue(exerciseData.reps),
              duration: exerciseData.duration || null,
              completed: true,
              isExceptional: true,
              type: exerciseData.type,
              actualReps: exerciseData.actualReps,
              totalReps: normalizeRepsValue(exerciseData.totalReps),
              materiel: exerciseData.materiel,
              notes: exerciseData.notes
            });
          } else {
            const exerciseName = getExerciseNameById(exerciseData.exerciseId);
            
            exercises.push({
              id: exerciseData.exerciseId,
              name: exerciseName,
              reps: normalizeRepsValue(exerciseData.reps),
              completed: exerciseData.completed || false,
              variant: exerciseData.variant || '',
              ...(exerciseData.activityType && {
                activityType: exerciseData.activityType,
                jumps: exerciseData.jumps,
                duration: exerciseData.duration,
                distance: exerciseData.distance,
                notes: exerciseData.notes
              })
            });
          }
        });

        // ✅ Créer les étirements
        Object.keys(dateData.stretches || {}).forEach(key => {
          const stretchData = dateData.stretches[key];
          
          stretches.push({
            type: stretchData.stretchType,
            completed: stretchData.completed
          });
        });

        // ✅ Ajouter les exercices supprimés
        if (variation && Array.isArray(variation.suppressedExercises) && variation.suppressedExercises.length > 0) {
          variation.suppressedExercises.forEach(exId => {
            if (typeof exId !== 'number' || isNaN(exId) || exId <= 0) {
              console.warn(`⚠️ ID d'exercice supprimé invalide: ${exId}`);
              return;
            }
            
            const exerciseName = getExerciseNameById(exId.toString());
            exercises.push({
              id: exId.toString(),
              name: exerciseName,
              reps: 0,
              completed: false,
              isSuppressed: true,
              suppressionReason: variation.reason || null
            });
          });
        }

        const userCoeffs = currentData.exerciseIntensityCoeffs || {};
        const totalReps = exercises
          .filter(ex => !ex.isSuppressed && ex.completed)
          .reduce((sum, ex) => {
            const normalizedReps = normalizeRepsValue(ex.reps);
            return sum + normalizedReps;
          }, 0);

        const totalLoad = exercises
          .filter(ex => !ex.isSuppressed && ex.completed)
          .reduce((sum, ex) => {
            const normalizedReps = normalizeRepsValue(ex.reps);
            if (normalizedReps <= 0) return sum;
            const coeff = resolveExerciseIntensityCoeff(
              {
                id: ex.id,
                name: ex.name,
                nom: ex.name,
                series: ex.series,
                type: ex.type
              },
              userCoeffs
            );
            return sum + normalizedReps * coeff;
          }, 0);
        
        const completedExercises = exercises.filter(ex => ex.completed).length;
        const completedStretches = stretches.filter(stretch => stretch.completed).length;

        // ✅ Récupérer intensity depuis sessionFeedbacks
        const sessionFeedback = currentData.sessionFeedbacks?.[dateStr];
        const intensity = sessionFeedback?.difficulte || null;

        // ✅ Calculer duration (en minutes)
        let duration = null;
        
        const totalDurationFromExercises = exercises
          .filter(ex => ex.completed && ex.duration != null)
          .reduce((sum, ex) => {
            const exDuration = normalizeRepsValue(ex.duration);
            return sum + (exDuration < 60 ? exDuration : Math.round(exDuration / 60));
          }, 0);
        
        if (totalDurationFromExercises > 0) {
          duration = totalDurationFromExercises;
        } else if (completedExercises > 0) {
          duration = completedExercises * 5;
        } else {
          duration = null;
        }

        // ✅ Inclure dans l'historique si au moins une activité
        if (totalReps > 0 || completedExercises > 0 || completedStretches > 0 || exercises.length > 0) {
          const sessionData = {
            date: dateStr,
            dayName: dayName,
            exercises: exercises,
            stretches: stretches,
            totalReps: totalReps,
            totalLoad,
            completedExercises: completedExercises,
            completedStretches: completedStretches,
            totalExercises: exercises.length,
            totalStretches: stretches.length,
            intensity: intensity,
            duration: duration,
            hasVariations: !!variation,
            suppressedCount: variation && Array.isArray(variation.suppressedExercises) 
              ? variation.suppressedExercises.length 
              : 0,
            exceptionalCount: variation && Array.isArray(variation.additionalExercises)
              ? variation.additionalExercises.filter(ex => ex && ex.completed === true).length
              : 0,
            variationReason: variation?.reason || null,
            feedback: sessionFeedback || null
          };
          
          history.push(sessionData);
        }
      });
    } catch (error) {
      console.error('❌ Erreur Phase 5 (Fusion):', error);
    }

    try {
      const seenDates = new Set(history.map((h) => h.date));
      const feedMap = currentData.sessionFeedbacks || {};
      Object.entries(feedMap).forEach(([dateStr, fb]) => {
        if (!fb || seenDates.has(dateStr)) return;
        if (!isSessionFeedbackFilled(fb)) return;
        const d = new Date(`${dateStr}T12:00:00`);
        history.push({
          date: dateStr,
          dayName: getDayName(d),
          exercises: [],
          stretches: [],
          totalReps: 0,
          totalLoad: 0,
          completedExercises: 0,
          completedStretches: 0,
          totalExercises: 0,
          totalStretches: 0,
          intensity: fb.difficulte ?? null,
          duration: fb.sessionDuration ?? null,
          hasVariations: false,
          suppressedCount: 0,
          exceptionalCount: 0,
          variationReason: null,
          feedback: fb,
          feedbackOnly: true
        });
        seenDates.add(dateStr);
      });
    } catch (e) {
      console.error('[useWorkoutHistory] sessionFeedbacks merge:', e);
    }

    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [getCurrentData, getExerciseNameById]);

  return {
    getWorkoutHistory,
  };
};
