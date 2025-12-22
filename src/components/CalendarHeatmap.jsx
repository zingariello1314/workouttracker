import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Flame, 
  TrendingUp,
  Award,
  Target,
  Clock,
  Zap,
  BarChart3
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { getDateStr, getDayName } from '../utils/dateUtils';
import JustificationModal from './modals/JustificationModal';
import { workoutProgram } from '../data/workoutProgram';
import { calculateDayIntensityWithGarmin, getGarminActivityIcons } from '../utils/garminCalendarUtils';
import { 
  isMockEnduranceSession, 
  parseDurationToMinutes, 
  normalizeDateString,
  calculateIntensityLevel,
  calculateTimeIntensityLevel,
  validateDuration,
  validateDate,
  validateNumericValue
} from '../utils/calendarUtils';
import {
  getDayJustification,
  isDayWithoutActivity,
  JUSTIFICATION_REASONS,
  JUSTIFICATION_COLORS,
  JUSTIFICATION_ICONS
} from '../utils/dayJustificationUtils';
import { useTranslation } from '../utils/translations';
import { useFormatters } from '../utils/translations/formatters-hook';

const CalendarHeatmap = ({ workoutHistory = [], garminData = null }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('year'); // 'month', 'year', 'streaks'
  const [selectedDate, setSelectedDate] = useState(null);
  const [showStats, setShowStats] = useState(false);
  // ✅ NOUVEAU : État pour la modal de justification
  const [justificationModalDate, setJustificationModalDate] = useState(null);

  // Récupérer les données du contexte pour le calcul du temps réel
  const { data, getCurrentData, getTodayWorkout, programs, getExerciseNameById } = useWorkout();
  // Utiliser getCurrentData() pour accéder aux données actuelles (temp + sauvegardées)
  const allData = getCurrentData();
  
  // ✅ NOUVEAU : Traductions
  const t = useTranslation();
  const { formatDate: formatLocaleDate } = useFormatters();

  // ✅ PHASE 2.3 : Cache pour les intensités calculées (useRef pour persister entre renders)
  const intensityCache = useRef({});
  
  // ✅ PHASE 2.3 : Invalider le cache lorsque les données sources changent
  useEffect(() => {
    // Vider le cache lorsque allData change (les données sources ont changé)
    // ✅ NOUVEAU : Invalider aussi si les justifications changent
    intensityCache.current = {};
  }, [allData, garminData, allData?.dayJustifications]);

  // Fonction pour obtenir le nom du jour
  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
  };

  // ✅ PHASE 2.1 : Mémoriser les seuils dynamiques basés sur toutes les données existantes
  // Recalcul uniquement si allData.reps change (évite les recalculs inutiles)
  const dynamicThresholds = useMemo(() => {
    if (!allData?.reps) return { min: 0, max: 100, thresholds: [0, 25, 50, 75, 100] };
    
    // Récupérer toutes les répétitions par jour
    const dailyReps = {};
    Object.keys(allData.reps).forEach(key => {
      const reps = parseInt(allData.reps[key]) || 0;
      if (reps > 0) {
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const date = dateMatch[1];
          dailyReps[date] = (dailyReps[date] || 0) + reps;
        }
      }
    });
    
    const repValues = Object.values(dailyReps).filter(reps => reps > 0);
    
    if (repValues.length === 0) {
      return { min: 0, max: 100, thresholds: [0, 25, 50, 75, 100] };
    }
    
    const min = Math.min(...repValues);
    const max = Math.max(...repValues);
    
    // Créer des seuils proportionnels
    const range = max - min;
    const thresholds = [
      0, // Pas d'exercice
      min, // Minimum enregistré (vert)
      min + range * 0.33, // Modéré (jaune)
      min + range * 0.66, // Intense (orange)
      max // Maximum (rouge)
    ];
    
    return { min, max, thresholds, dailyReps };
  }, [allData?.reps]);

  // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
  // calculateDynamicIntensityLevel remplacé par calculateIntensityLevel (importée)

  // ✅ PHASE 2.2 : Mémoriser les seuils dynamiques pour la durée (temps)
  // Recalcul uniquement si allData.checkedExercises, allData.enduranceData.sessions, ou allData.reps change
  const dynamicTimeThresholds = useMemo(() => {
    if (!allData) return { min: 0, max: 0, thresholds: [0, 30, 60, 90] };
    
    const durations = [];
    
    // Collecter toutes les durées des activités complémentaires et d'endurance
    Object.keys(allData.checkedExercises || {}).forEach(key => {
      if (allData.checkedExercises[key]) {
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const dayDate = new Date(dateStr);
          const dayName = getDayName(dayDate);
          // ✅ Utiliser getTodayWorkout pour obtenir le workout du jour (inclut le programme actif)
          const workoutRaw = getTodayWorkout ? getTodayWorkout(dayDate, false) : (workoutProgram[dayName] || null);
          const workout = workoutRaw ? {
            ...workoutRaw,
            exercices: workoutRaw.exercices || workoutRaw.exercises || [],
            salleVariants: workoutRaw.salleVariants,
            complementaryActivity: workoutRaw.complementaryActivity
          } : null;
          
          if (workout?.complementaryActivity) {
            const complementaryKey = `${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`;
            if (allData.checkedExercises[complementaryKey]) {
              const minutesKey = `${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`;
              const manualMinutes = parseInt(allData.reps?.[minutesKey] || 0);
              const duration = manualMinutes > 0 ? manualMinutes : workout.complementaryActivity.duration || 90;
              durations.push(duration);
            }
          }
        }
      }
    });
    
    // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
    // isMockSessionForThresholds remplacé par isMockEnduranceSession (importée)
    
    const enduranceData = allData?.enduranceData || {};
    const enduranceSessions = enduranceData.sessions || {};
    Object.entries(enduranceSessions).forEach(([activityType, sessions]) => {
      if (Array.isArray(sessions)) {
        sessions.forEach(session => {
          // ✅ PHASE 1 : Exclure les sessions mock du calcul des seuils (fonction centralisée)
          if (isMockEnduranceSession(session)) {
            return; // Ignorer cette session mock
          }
          
          if (session.duration) {
            // ✅ PHASE 1 : Utiliser parseDurationToMinutes pour cohérence
            const durationMinutes = parseDurationToMinutes(session.duration, 'calculateDynamicTimeThresholds');
            
            if (durationMinutes > 0) {
              durations.push(Math.round(durationMinutes));
            }
          }
        });
      }
    });
    
    if (durations.length === 0) {
      return { min: 0, max: 0, thresholds: [0, 30, 60, 90] };
    }
    
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    // Calculer les seuils basés sur les données réelles
    const thresholds = [
      min, // Niveau 1 (vert) - minimum
      min + (max - min) * 0.25, // Niveau 2 (jaune) - 25%
      min + (max - min) * 0.5,  // Niveau 3 (orange) - 50%
      min + (max - min) * 0.75  // Niveau 4 (rouge) - 75%
    ];
    
    return { min, max, thresholds };
  }, [allData?.checkedExercises, allData?.enduranceData?.sessions, allData?.reps]);

  // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
  // calculateDynamicTimeIntensityLevel remplacé par calculateTimeIntensityLevel (importée)
  const getIntensityForDate = (date) => {
    const dateStr = getDateStr(date);
    
    // ✅ PHASE 2.3 : Vérifier le cache avant de calculer
    const cacheKey = dateStr;
    if (intensityCache.current[cacheKey]) {
      const cached = intensityCache.current[cacheKey];
      // ✅ NOUVEAU : Ajouter justification si absente du cache (pour éviter recalcul)
      if (!cached.justification) {
        cached.justification = getDayJustification(allData, dateStr);
      }
      return cached;
    }
    
    const dayName = getDayName(date);
    
    // ✅ NOUVEAU : Récupérer les exercices de TOUS les programmes pour cette date
    const getAllExercisesForDate = () => {
      const allExercises = [];
      const exercisesIdsSeen = new Set();
      
      // 1. Ajouter les exercices du programme par défaut (workoutProgram)
      const defaultWorkout = workoutProgram[dayName];
      if (defaultWorkout?.exercices) {
        defaultWorkout.exercices.forEach(ex => {
          if (!exercisesIdsSeen.has(ex.id)) {
            exercisesIdsSeen.add(ex.id);
            allExercises.push({
              ...ex,
              programName: 'Cycle 3+1',
              programId: 'default'
            });
          }
        });
      }
      
      // 2. Ajouter les exercices de tous les programmes personnalisés
      if (programs && Array.isArray(programs)) {
        programs.forEach(program => {
          if (program.schedule && program.schedule[dayName]) {
            const daySchedule = program.schedule[dayName];
            if (daySchedule.exercises) {
              daySchedule.exercises.forEach((ex, index) => {
                // Convertir l'ID string en ID numérique (comme dans getTodayWorkoutWrapper)
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
                
                if (!exercisesIdsSeen.has(numericId)) {
                  exercisesIdsSeen.add(numericId);
                  allExercises.push({
                    id: numericId,
                    name: ex.name,
                    series: ex.series,
                    type: ex.type || 'standard',
                    materiel: ex.materiel || 'poids du corps',
                    notes: ex.notes || '',
                    programName: program.name || 'Programme personnalisé',
                    programId: program.id
                  });
                }
              });
            }
          }
        });
      }
      
      return allExercises;
    };
    
    const allExercisesForDate = getAllExercisesForDate();
    
    // Pour compatibilité avec le code existant, créer un workout "virtuel" avec tous les exercices
    const workout = allExercisesForDate.length > 0 ? {
      exercices: allExercisesForDate,
      name: 'Tous les programmes',
      isGymMode: false
    } : null;
    
    // ✅ LOGS DE DEBUG DÉSACTIVÉS pour réduire le bruit (33k messages)
    // Debug pour le 28 octobre 2025 (réactiver uniquement si nécessaire)
    // if (dateStr === '2025-10-28') {
    //   console.log('🔍 DEBUG CalendarHeatmap - 28 octobre 2025:');
    //   console.log('Date string:', dateStr);
    //   console.log('Day name:', dayName);
    //   console.log('Workout found:', workout?.name);
    //   console.log('All data:', allData);
    //   console.log('Checked exercises:', allData?.checkedExercises);
    //   console.log('Reps data:', allData?.reps);
    // }
    
    // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
    // isMockSession remplacé par isMockEnduranceSession (importée)

    // Calculer les données d'endurance pour cette date
    // NOTE: Les sessions d'endurance détaillées n'impactent PAS l'intensité du calendrier
    // Elles servent uniquement à fournir des détails sur ce qui s'est passé
    const getEnduranceDataForDate = () => {
      const enduranceData = allData?.enduranceData || {};
      const sessions = enduranceData.sessions || {};
      
      let enduranceReps = 0;
      let enduranceDuration = 0;
      let enduranceDistance = 0;
      let enduranceJumps = 0;
      let enduranceSessions = 0;
      
      // Parcourir toutes les activités d'endurance (pour les détails uniquement)
      // ✅ FIX : Filtrer les sessions mock
      Object.entries(sessions).forEach(([activityType, activitySessions]) => {
        if (Array.isArray(activitySessions)) {
          activitySessions.forEach(session => {
            // ✅ PHASE 1 : Exclure les sessions mock (fonction centralisée)
            if (isMockEnduranceSession(session)) {
              return; // Ignorer cette session mock
            }
            // ✅ PHASE 4 : Valider la date (vérifier si future et normaliser)
            const dateValidation = validateDate(session.date, `getEnduranceDataForDate.${activityType}.${session.id || 'unknown'}`);
            const sessionDateStr = dateValidation.normalizedDate;
            
            // Ignorer les sessions avec dates futures (sauf si on veut les inclure pour le futur)
            if (dateValidation.isFuture) {
              return; // Ignorer cette session (date future)
            }
              
            // Comparer les dates normalisées
            if (sessionDateStr && sessionDateStr === dateStr) {
              enduranceSessions++;
              
              // ✅ CORRECTION : Ajouter les répétitions (pompes, boxe) - EXCLURE jumprope
              // Les sauts (jumprope) ne sont PAS des répétitions d'exercices, ils sont comptés séparément dans enduranceJumps
              // Seulement les activités avec count (pushups, boxing) ou reps (boxing) sont des répétitions
              // ✅ Les sessions créées depuis les défis (TodayTab) ont maintenant count ET reps (normalisé)
              // ✅ Les sessions créées depuis EnduranceTab ont count
              // ✅ Cette logique gère les deux cas : count (prioritaire) ou reps (fallback)
              if (activityType !== 'jumprope') {
                // Priorité : count > reps (pour éviter d'ajouter les deux si les deux existent)
                // Si count existe, l'utiliser (priorité pour cohérence avec EnduranceTab)
                // Sinon, utiliser reps (fallback pour compatibilité avec anciennes sessions ou défis)
                const rawReps = session.count !== undefined && session.count !== null
                  ? session.count
                  : (session.reps !== undefined && session.reps !== null ? session.reps : 0);
                // ✅ PHASE 4 : Valider la valeur numérique (rejette négatif, NaN)
                const repsValidation = validateNumericValue(rawReps, `getEnduranceDataForDate.${dateStr}.${activityType}.reps`, false);
                if (repsValidation.normalizedValue > 0) {
                  enduranceReps += repsValidation.normalizedValue;
                }
              }
              // ✅ PHASE 4 : Utiliser parseDurationToMinutes + validation centralisée
              if (session.duration) {
                const durationMinutes = parseDurationToMinutes(session.duration, `getEnduranceDataForDate.${dateStr}`);
                const durationValidation = validateDuration(durationMinutes, `getEnduranceDataForDate.${dateStr}.${activityType}.${session.id || 'unknown'}`);
                enduranceDuration += Math.round(durationValidation.clampedValue);
              }
              
              // ✅ PHASE 4 : Ajouter la distance avec validation
              if (session.distance) {
                const distValidation = validateNumericValue(session.distance, `getEnduranceDataForDate.${dateStr}.${activityType}.distance`, false);
                if (distValidation.normalizedValue > 0) {
                  enduranceDistance += distValidation.normalizedValue;
                }
              }
              if (session.laps && Array.isArray(session.laps)) {
                session.laps.forEach((lap, lapIdx) => {
                  const lapDistValidation = validateNumericValue(lap.distance, `getEnduranceDataForDate.${dateStr}.${activityType}.lap[${lapIdx}].distance`, false);
                  if (lapDistValidation.normalizedValue > 0) {
                    enduranceDistance += lapDistValidation.normalizedValue;
                  }
                });
              }
              
              // ✅ PHASE 4 : Ajouter les sauts avec validation
              // ✅ CORRECTION : Pour jumprope, les sauts peuvent être dans jumps OU reps
              if (activityType === 'jumprope') {
                const rawJumps = session.jumps || session.reps || 0;
                const jumpsValidation = validateNumericValue(rawJumps, `getEnduranceDataForDate.${dateStr}.jumprope.jumps`, false);
                if (jumpsValidation.normalizedValue > 0) {
                  enduranceJumps += jumpsValidation.normalizedValue;
                }
              } else if (session.jumps) {
                // Pour les autres activités, utiliser jumps si présent
                const jumpsValidation = validateNumericValue(session.jumps, `getEnduranceDataForDate.${dateStr}.${activityType}.jumps`, false);
                if (jumpsValidation.normalizedValue > 0) {
                  enduranceJumps += jumpsValidation.normalizedValue;
                }
              }
            }
          });
        }
      });
      
      // Arrondir la distance pour éviter les erreurs de précision flottante
      enduranceDistance = Math.round(enduranceDistance * 10) / 10;
      
      return {
        reps: enduranceReps,
        duration: enduranceDuration,
        distance: enduranceDistance,
        jumps: enduranceJumps,
        sessions: enduranceSessions
      };
    };
    
    const enduranceData = getEnduranceDataForDate();
    
    // Si pas d'exercices pour ce jour ET pas de données d'endurance, retourner des valeurs par défaut
    if (allExercisesForDate.length === 0 && enduranceData.sessions === 0) {
      return { 
        level: 0, 
        reps: 0, 
        duration: 0, 
        exerciseCount: 0, 
        completedCount: 0, 
        intensityScore: 0,
        enduranceData: enduranceData
      };
    }

    // ✅ NOUVEAU : Utiliser tous les exercices de tous les programmes (déjà récupérés dans getAllExercisesForDate)
    const exercisesList = allExercisesForDate;
    
    // ✅ CORRECTION : Calculer les répétitions totales de manière séquentielle et claire
    // Le total doit être : exercices classiques COCHÉS + reps d'endurance (pompes, boxe, défis complétés)
    let totalReps = 0; // ✅ CORRECTION : Commencer à 0 au lieu de enduranceData.reps
    let completedExercises = 0;
    let totalPlannedExercises = exercisesList.length;
    let exercisesReps = 0; // Pour debug : somme des reps des exercices classiques
    
    // ✅ ÉTAPE 1 : Calculer les répétitions des exercices classiques COCHÉS
    // Seulement les exercices avec checkedExercises = true ET reps > 0
    exercisesList.forEach(exercise => {
      const baseKey = `${dateStr}_${exercise.id}`;
      
      // Chercher la clé avec les suffixes possibles (_semaineA, _semaineB, ou sans suffixe)
      let actualKey = baseKey;
      let reps = 0;
      let isCompleted = false;
      
      // Vérifier d'abord la clé de base
      if (allData?.reps?.[baseKey] !== undefined || allData?.checkedExercises?.[baseKey] !== undefined) {
        actualKey = baseKey;
      } else {
        // Chercher avec les suffixes
        const possibleKeys = [
          `${baseKey}_semaineA`,
          `${baseKey}_semaineB`
        ];
        
        for (const possibleKey of possibleKeys) {
          if (allData?.reps?.[possibleKey] !== undefined || allData?.checkedExercises?.[possibleKey] !== undefined) {
            actualKey = possibleKey;
            break;
          }
        }
      }
      
      const rawReps = allData?.reps?.[actualKey] || 0;
      isCompleted = allData?.checkedExercises?.[actualKey] || false;
      
      // ✅ PHASE 4 : Valider la valeur numérique (rejette négatif, NaN)
      const repsValidation = validateNumericValue(rawReps, `getIntensityForDate.${dateStr}.${exercise.id}.reps`, false);
      reps = repsValidation.normalizedValue;
      
      // ✅ CORRECTION : Seulement si complété ET avec des reps > 0
      if (isCompleted && reps > 0) {
        completedExercises++;
        exercisesReps += reps;
        totalReps += reps;
      }
    });
    
    // ✅ ÉTAPE 2 : Ajouter les reps d'endurance (pompes, boxe, défis complétés)
    // Les défis complétés sont déjà inclus dans enduranceData.reps via les sessions d'endurance
    // (voir getEnduranceDataForDate qui parcourt enduranceData.sessions)
    const enduranceRepsValue = enduranceData.reps || 0;
    
    // 🔍 DEBUG : Vérifier si enduranceRepsValue est suspect et tracer les sessions problématiques
    if (enduranceRepsValue > 1000) {
      console.warn(`⚠️ [getIntensityForDate] ${dateStr} - enduranceRepsValue suspect: ${enduranceRepsValue}`);
      // Tracer chaque session d'endurance pour cette date pour identifier la source
      const enduranceDataRawDebug = allData?.enduranceData || {};
      const sessionsDebug = enduranceDataRawDebug.sessions || {};
      const problematicSessions = [];
      Object.entries(sessionsDebug).forEach(([activityType, activitySessions]) => {
        if (Array.isArray(activitySessions)) {
          activitySessions.forEach(session => {
            if (isMockEnduranceSession(session)) return;
            const sessionDateStr = normalizeDateString(session.date);
            if (sessionDateStr && sessionDateStr === dateStr) {
              // ✅ CORRECTION : Exclure jumprope du calcul des reps (comme dans getEnduranceDataForDate)
              if (activityType !== 'jumprope') {
                const sessionReps = session.count !== undefined && session.count !== null
                  ? parseInt(session.count) || 0
                  : (session.reps !== undefined && session.reps !== null ? parseInt(session.reps) || 0 : 0);
                if (sessionReps > 0) {
                  problematicSessions.push({
                    activityType,
                    count: session.count,
                    reps: session.reps,
                    sessionReps,
                    session: session // Session complète pour inspection
                  });
                }
              }
            }
          });
        }
      });
      console.warn(`   Sessions d'endurance trouvées pour ${dateStr}:`, problematicSessions);
      console.warn(`   enduranceData calculé (getEnduranceDataForDate):`, enduranceData);
      console.warn(`   enduranceDataRaw (allData.enduranceData):`, enduranceDataRawDebug);
      
      // 🔍 LOG DÉTAILLÉ : Afficher chaque session avec tous ses champs pour identifier la source
      console.warn(`   🔍 ANALYSE DÉTAILLÉE DES ${problematicSessions.length} SESSION(S) PROBLÉMATIQUE(S):`);
      problematicSessions.forEach((sessionInfo, index) => {
        const totalRepsFromThisSession = sessionInfo.sessionReps || 0;
        console.warn(`   📊 Session ${index + 1}/${problematicSessions.length} (${sessionInfo.activityType}):`);
        console.warn(`      - count: ${sessionInfo.count}`);
        console.warn(`      - reps: ${sessionInfo.reps}`);
        console.warn(`      - sessionReps calculé: ${totalRepsFromThisSession} (utilisé dans le total)`);
        console.warn(`      - date: ${sessionInfo.session?.date}`);
        console.warn(`      - duration: ${sessionInfo.session?.duration}`);
        console.warn(`      - validatedChallenges:`, sessionInfo.session?.validatedChallenges);
        console.warn(`      - Session complète:`, sessionInfo.session);
      });
      
      // Calculer la somme des reps des sessions pour vérifier
      const totalRepsFromSessions = problematicSessions.reduce((sum, s) => sum + (s.sessionReps || 0), 0);
      console.warn(`   ✅ VÉRIFICATION: Somme des reps des ${problematicSessions.length} session(s) = ${totalRepsFromSessions} (doit correspondre à enduranceRepsValue = ${enduranceRepsValue})`);
    }
    
    totalReps += enduranceRepsValue;
    
    // 🔍 DEBUG : Logger les détails du calcul pour diagnostiquer les problèmes
    // ✅ CORRECTION : Définir enduranceDataRaw avant le bloc if pour éviter les erreurs de scope
    const enduranceDataRaw = allData?.enduranceData || {}; // ✅ CORRECTION : Renommer pour éviter conflit avec enduranceData du getEnduranceDataForDate
    
    if (dateStr === '2025-11-03' || dateStr === '2025-11-04' || totalReps > 1000 || enduranceRepsValue > 1000) { // Log pour les dates problématiques ou valeurs suspectes
      // 🔍 DEBUG DÉTAILLÉ : Tracer chaque exercice compté
      const exercisesDetails = [];
      exercisesList.forEach(exercise => {
        const baseKey = `${dateStr}_${exercise.id}`;
        let actualKey = baseKey;
        if (allData?.reps?.[baseKey] !== undefined || allData?.checkedExercises?.[baseKey] !== undefined) {
          actualKey = baseKey;
        } else {
          const possibleKeys = [`${baseKey}_semaineA`, `${baseKey}_semaineB`];
          for (const possibleKey of possibleKeys) {
            if (allData?.reps?.[possibleKey] !== undefined || allData?.checkedExercises?.[possibleKey] !== undefined) {
              actualKey = possibleKey;
              break;
            }
          }
        }
        const reps = parseInt(allData?.reps?.[actualKey] || 0);
        const isCompleted = allData?.checkedExercises?.[actualKey] || false;
        if (isCompleted && reps > 0) {
          exercisesDetails.push({ exerciseId: exercise.id, name: exercise.name, key: actualKey, reps, isCompleted });
        }
      });
      
      // 🔍 DEBUG DÉTAILLÉ : Tracer chaque session d'endurance
      const enduranceSessionsDetails = [];
      const sessions = enduranceDataRaw.sessions || {};
      Object.entries(sessions).forEach(([activityType, activitySessions]) => {
        if (Array.isArray(activitySessions)) {
          activitySessions.forEach(session => {
            if (isMockEnduranceSession(session)) return;
            const sessionDateStr = normalizeDateString(session.date);
            if (sessionDateStr && sessionDateStr === dateStr) {
              // ✅ CORRECTION : Exclure jumprope du calcul des reps (comme dans getEnduranceDataForDate)
              if (activityType !== 'jumprope') {
                const sessionReps = session.count !== undefined && session.count !== null
                  ? parseInt(session.count) || 0
                  : (session.reps !== undefined && session.reps !== null ? parseInt(session.reps) || 0 : 0);
                if (sessionReps > 0) {
                  enduranceSessionsDetails.push({
                    activityType: activityType || session.activityType || 'unknown',
                    count: session.count,
                    reps: session.reps,
                    sessionReps,
                    duration: session.duration,
                    validatedChallenges: session.validatedChallenges
                  });
                }
              }
            }
          });
        }
      });
      
      console.log(`🔍 [getIntensityForDate] ${dateStr} - CALCUL DÉTAILLÉ DES RÉPÉTITIONS:`, {
        exercisesReps,
        exercisesDetails,
        enduranceReps: enduranceRepsValue,
        enduranceSessionsDetails,
        totalReps,
        completedExercises,
        totalPlannedExercises,
        exercisesListLength: exercisesList.length,
        enduranceDataDetails: {
          sessions: enduranceDataRaw.sessions,
          reps: enduranceDataRaw.reps,
          sessionsCount: Object.values(enduranceDataRaw.sessions || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
          enduranceDataCalculated: enduranceData // Valeur retournée par getEnduranceDataForDate
        }
      });
    }

    // ✅ CORRECTION PB 2: Calculer la durée réelle avec PRIORITÉ Garmin > Programme
    // Principe: Si Garmin a une durée pour cette date, utiliser Garmin (plus précis), sinon utiliser la durée prévue du programme
    const calculateRealDuration = () => {
      // ✅ PRIORITÉ 1.1: Vérifier les dailyMetrics Garmin (durée totale d'activité de la journée)
      if (garminData?.dailyMetrics && typeof garminData.dailyMetrics === 'object') {
        // dailyMetrics est un objet avec clés de date: { "YYYY-MM-DD": {...metrics} }
        const dailyMetric = garminData.dailyMetrics[dateStr];
        
        if (dailyMetric) {
          let metricsDurationMinutes = 0;
          
          // Vérifier activeTime (durée d'activité active en minutes)
          if (dailyMetric.activeTime !== undefined && dailyMetric.activeTime !== null) {
            const rawActiveTime = typeof dailyMetric.activeTime === 'number' 
              ? dailyMetric.activeTime 
              : parseInt(dailyMetric.activeTime) || 0;
            // ✅ PHASE 4 : Valider la durée (vérifier > 24h)
            const activeTimeValidation = validateDuration(rawActiveTime, `calculateRealDuration.GarminDailyMetrics.${dateStr}.activeTime`);
            metricsDurationMinutes = activeTimeValidation.clampedValue;
          }
          // Sinon vérifier activeDurationMinutes
          else if (dailyMetric.activeDurationMinutes !== undefined && dailyMetric.activeDurationMinutes !== null) {
            const rawActiveDurationMinutes = typeof dailyMetric.activeDurationMinutes === 'number'
              ? dailyMetric.activeDurationMinutes
              : parseInt(dailyMetric.activeDurationMinutes) || 0;
            // ✅ PHASE 4 : Valider la durée (vérifier > 24h)
            const activeDurationValidation = validateDuration(rawActiveDurationMinutes, `calculateRealDuration.GarminDailyMetrics.${dateStr}.activeDurationMinutes`);
            metricsDurationMinutes = activeDurationValidation.clampedValue;
          }
          // Sinon vérifier totalActivityDuration (en secondes généralement)
          else if (dailyMetric.totalActivityDuration !== undefined && dailyMetric.totalActivityDuration !== null) {
            const totalActivityDuration = typeof dailyMetric.totalActivityDuration === 'number'
              ? dailyMetric.totalActivityDuration
              : parseInt(dailyMetric.totalActivityDuration) || 0;
            // ✅ PHASE 3 : Utiliser parseDurationToMinutes pour cohérence absolue
            const parsedDuration = parseDurationToMinutes(totalActivityDuration, `calculateRealDuration.GarminDailyMetrics.${dateStr}`);
            // ✅ PHASE 4 : Valider la durée (vérifier > 24h)
            const durationValidation = validateDuration(parsedDuration, `calculateRealDuration.GarminDailyMetrics.${dateStr}.totalActivityDuration`);
            metricsDurationMinutes = durationValidation.clampedValue;
          }
          
          // Si durée trouvée dans dailyMetrics, l'utiliser (plus précise)
          if (metricsDurationMinutes > 0) {
            // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
            // console.log(`✅ [calculateRealDuration] Retour depuis dailyMetrics: ${metricsDurationMinutes} min`);
            return Math.round(metricsDurationMinutes);
          } else {
            // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
            // console.log(`🔍 [calculateRealDuration] dailyMetrics trouvé pour ${dateStr} mais aucune durée valide`);
          }
        }
      }
      
      // ✅ PRIORITÉ 1.2: Vérifier les activités Garmin détaillées pour cette date
      if (garminData?.activities) {
        // Calculer la durée totale des activités Garmin pour cette date
        let garminDurationMinutes = 0;
        
        // Cardio
        const activitésCardio = (garminData.activities.cardio || []).filter(act => {
          // ✅ PHASE 4 : Valider la date de l'activité (exclure dates futures)
          const actDateInput = act.date || act.startTime || act.start;
          const dateValidation = validateDate(actDateInput, `calculateRealDuration.Cardio.filter`);
          if (!dateValidation.isValid || dateValidation.isFuture) {
            return false; // Ignorer les activités avec dates invalides ou futures
          }
          return dateValidation.normalizedDate === dateStr;
        });
        // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
        // console.log(`🔍 [calculateRealDuration] Trouvé ${activitésCardio.length} activité(s) cardio pour ${dateStr}`);
        activitésCardio.forEach((act, idx) => {
          // ✅ PHASE 1 : Utiliser parseDurationToMinutes pour cohérence absolue
          const actId = act.id || act.activityId || `cardio-${idx}`;
          const actDate = act.date || act.startTime || act.start || 'unknown';
          
          let actDurationMinutes = 0;
          
          // Priorité : duration > totalTime > elapsedTime
          if (act.duration) {
            actDurationMinutes = parseDurationToMinutes(act.duration, `calculateRealDuration.Cardio[${idx}].${actId}`);
          } else if (act.totalTime) {
            // totalTime généralement en secondes (convertir en minutes)
            actDurationMinutes = parseDurationToMinutes(act.totalTime, `calculateRealDuration.Cardio[${idx}].${actId}.totalTime`);
          } else if (act.elapsedTime) {
            // elapsedTime généralement en secondes (convertir en minutes)
            actDurationMinutes = parseDurationToMinutes(act.elapsedTime, `calculateRealDuration.Cardio[${idx}].${actId}.elapsedTime`);
          } else {
            // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Garder uniquement les warnings critiques
            // console.log(`⚠️ [calculateRealDuration] Cardio[${idx}] (${actId}) - Aucune durée trouvée`);
          }
          
          // ✅ PHASE 4 : Utiliser la fonction centralisée de validation
          const durationValidation = validateDuration(actDurationMinutes, `calculateRealDuration.Cardio[${idx}].${actId}`);
          if (!durationValidation.isValid && durationValidation.warnings.length > 0) {
            // Ajouter les détails de l'activité aux warnings
            console.warn(`⚠️ [calculateRealDuration] Cardio[${idx}] (${actId}) - Données brutes:`, {
              duration: act.duration,
              totalTime: act.totalTime,
              elapsedTime: act.elapsedTime,
              date: actDate,
              name: act.name || act.activityName || 'unknown'
            });
          }
          actDurationMinutes = durationValidation.clampedValue;
          
          garminDurationMinutes += actDurationMinutes;
        });
        // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
        // console.log(`🔍 [calculateRealDuration] Durée totale cardio (après ${activitésCardio.length} activité(s)): ${garminDurationMinutes} min`);
        
        // Natation
        const activitésNatation = (garminData.activities.swimming || []).filter(act => {
          // ✅ PHASE 4 : Valider la date de l'activité (exclure dates futures)
          const actDateInput = act.date || act.startTime || act.start;
          const dateValidation = validateDate(actDateInput, `calculateRealDuration.Swimming.filter`);
          if (!dateValidation.isValid || dateValidation.isFuture) {
            return false; // Ignorer les activités avec dates invalides ou futures
          }
          return dateValidation.normalizedDate === dateStr;
        });
        activitésNatation.forEach((act, idx) => {
          // ✅ PHASE 1 : Utiliser parseDurationToMinutes pour cohérence absolue
          const actId = act.id || act.activityId || `swimming-${idx}`;
          
          let actDurationMinutes = 0;
          
          // Priorité : duration > totalTime > elapsedTime
          if (act.duration) {
            actDurationMinutes = parseDurationToMinutes(act.duration, `calculateRealDuration.Swimming[${idx}].${actId}`);
          } else if (act.totalTime) {
            actDurationMinutes = parseDurationToMinutes(act.totalTime, `calculateRealDuration.Swimming[${idx}].${actId}.totalTime`);
          } else if (act.elapsedTime) {
            actDurationMinutes = parseDurationToMinutes(act.elapsedTime, `calculateRealDuration.Swimming[${idx}].${actId}.elapsedTime`);
          }
          
          // ✅ PHASE 4 : Utiliser la fonction centralisée de validation
          const durationValidation = validateDuration(actDurationMinutes, `calculateRealDuration.Swimming[${idx}].${actId}`);
          actDurationMinutes = durationValidation.clampedValue;
          if (!durationValidation.isValid && durationValidation.warnings.length > 0) {
            console.warn(`⚠️ [calculateRealDuration] Swimming[${idx}] (${actId}) - Données brutes:`, {
              duration: act.duration,
              totalTime: act.totalTime,
              elapsedTime: act.elapsedTime,
              date: actDate,
              name: act.name || act.activityName || 'unknown'
            });
          }
          
          garminDurationMinutes += actDurationMinutes;
        });
        
        // Corde à sauter
        const activitésCorde = (garminData.activities.jumpRope || []).filter(act => {
          // ✅ PHASE 4 : Valider la date de l'activité (exclure dates futures)
          const actDateInput = act.date || act.startTime || act.start;
          const dateValidation = validateDate(actDateInput, `calculateRealDuration.JumpRope.filter`);
          if (!dateValidation.isValid || dateValidation.isFuture) {
            return false; // Ignorer les activités avec dates invalides ou futures
          }
          return dateValidation.normalizedDate === dateStr;
        });
        activitésCorde.forEach((act, idx) => {
          // ✅ PHASE 1 : Utiliser parseDurationToMinutes pour cohérence absolue
          const actId = act.id || act.activityId || `jumpRope-${idx}`;
          
          let actDurationMinutes = 0;
          
          // Priorité : durationSec > duration > totalTime > elapsedTime
          const dur = act.durationSec || act.duration;
          if (dur) {
            actDurationMinutes = parseDurationToMinutes(dur, `calculateRealDuration.JumpRope[${idx}].${actId}`);
          } else if (act.totalTime) {
            actDurationMinutes = parseDurationToMinutes(act.totalTime, `calculateRealDuration.JumpRope[${idx}].${actId}.totalTime`);
          } else if (act.elapsedTime) {
            actDurationMinutes = parseDurationToMinutes(act.elapsedTime, `calculateRealDuration.JumpRope[${idx}].${actId}.elapsedTime`);
          }
          
          // ✅ PHASE 4 : Utiliser la fonction centralisée de validation
          const durationValidation = validateDuration(actDurationMinutes, `calculateRealDuration.JumpRope[${idx}].${actId}`);
          actDurationMinutes = durationValidation.clampedValue;
          if (!durationValidation.isValid && durationValidation.warnings.length > 0) {
            console.warn(`⚠️ [calculateRealDuration] JumpRope[${idx}] (${actId}) - Données brutes:`, {
              duration: act.duration,
              durationSec: act.durationSec,
              totalTime: act.totalTime,
              elapsedTime: act.elapsedTime,
              date: actDate,
              name: act.name || act.activityName || 'unknown'
            });
          }
          
          garminDurationMinutes += actDurationMinutes;
        });
        
        // ✅ Si durée Garmin trouvée, l'utiliser ET RETOURNER DIRECTEMENT (sans rien ajouter)
        // Les données Garmin sont la source de vérité absolue pour la durée d'entraînement
        if (garminDurationMinutes > 0) {
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`✅ [calculateRealDuration] Retour depuis activités Garmin: ${garminDurationMinutes} min`);
          return Math.round(garminDurationMinutes);
        } else {
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`🔍 [calculateRealDuration] Pas d'activités Garmin trouvées pour ${dateStr}`);
        }
      }
      
      // ✅ PRIORITÉ 2: Si PAS de données Garmin, utiliser la durée prévue du programme
      // Ne PAS ajouter enduranceData.duration car cela peut inclure des valeurs mock
      // Le programme est la source de vérité quand Garmin n'est pas disponible
      if (workout) {
        let programDurationMinutes = 0;
        
        // Priorité 1: workout.duration (nombre en minutes)
        if (workout.duration && typeof workout.duration === 'number') {
          programDurationMinutes = workout.duration;
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`🔍 [calculateRealDuration] workout.duration trouvé: ${programDurationMinutes} min`);
        }
        // Priorité 2: workout.estimatedDuration (nombre en minutes)
        else if (workout.estimatedDuration && typeof workout.estimatedDuration === 'number') {
          programDurationMinutes = workout.estimatedDuration;
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`🔍 [calculateRealDuration] workout.estimatedDuration trouvé: ${programDurationMinutes} min`);
        }
        // Priorité 3: parser workout.duree (format texte comme "1h", "45-55 min", etc.)
        else if (workout.duree && typeof workout.duree === 'string') {
          const dureeStr = workout.duree.trim();
          
          // Parser différents formats
          // Format "1h" ou "~1 h"
          const hourMatch = dureeStr.match(/(\d+)\s*h/);
          if (hourMatch) {
            programDurationMinutes = parseInt(hourMatch[1]) * 60;
            // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
            // console.log(`🔍 [calculateRealDuration] workout.duree (heures) parsé: ${hourMatch[1]}h → ${programDurationMinutes} min`);
          }
          // Format "45-55 min" ou "45 min"
          else {
            const minMatch = dureeStr.match(/(\d+)(?:\s*-\s*(\d+))?\s*min/);
            if (minMatch) {
              const minMin = parseInt(minMatch[1]);
              const minMax = minMatch[2] ? parseInt(minMatch[2]) : minMin;
              programDurationMinutes = Math.round((minMin + minMax) / 2); // Moyenne si plage
              // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
              // console.log(`🔍 [calculateRealDuration] workout.duree (minutes) parsé: ${minMin}-${minMax} min → ${programDurationMinutes} min`);
            }
            // Sinon essayer de parser un nombre simple
            else {
              const simpleNum = parseInt(dureeStr);
              if (!isNaN(simpleNum) && simpleNum > 0 && simpleNum < 300) {
                programDurationMinutes = simpleNum; // Assumons que c'est en minutes si raisonnable
                // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
                // console.log(`🔍 [calculateRealDuration] workout.duree (nombre simple) parsé: ${simpleNum} min`);
              }
            }
          }
        }
        
        // ✅ Si durée du programme trouvée, la retourner directement
        if (programDurationMinutes > 0) {
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`✅ [calculateRealDuration] Retour depuis programme: ${programDurationMinutes} min`);
          return Math.round(programDurationMinutes);
        } else {
          // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log(`🔍 [calculateRealDuration] Aucune durée trouvée dans workout pour ${dateStr}`);
        }
      }

      // ✅ Si aucune durée n'a été trouvée (ni Garmin, ni programme), retourner 0
      // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Garder uniquement les warnings critiques
      // console.log(`⚠️ [calculateRealDuration] Aucune durée trouvée (ni Garmin, ni programme) pour ${dateStr}, retour 0`);
      return 0;
    };

    const realDuration = calculateRealDuration();
    
    // Vérifier si une activité complémentaire est cochée (depuis le programme par défaut ou actif)
    const defaultWorkout = workoutProgram[dayName];
    const activeWorkoutRaw = getTodayWorkout ? getTodayWorkout(date, false) : null;
    const activeWorkout = activeWorkoutRaw ? {
      ...activeWorkoutRaw,
      exercices: activeWorkoutRaw.exercices || activeWorkoutRaw.exercises || [],
      complementaryActivity: activeWorkoutRaw.complementaryActivity
    } : null;
    
    const complementaryActivity = activeWorkout?.complementaryActivity || defaultWorkout?.complementaryActivity;
    const isComplementaryChecked = complementaryActivity && 
      allData?.checkedExercises?.[`${dateStr}_complementary_${complementaryActivity.name.toLowerCase()}`];
    
        // Les sessions d'endurance détaillées n'impactent PAS l'intensité du calendrier
        // Seules les activités complémentaires de l'onglet Aujourd'hui comptent
        const totalActivities = completedExercises + (isComplementaryChecked ? 1 : 0);
        const completionRate = totalPlannedExercises > 0 ? completedExercises / totalPlannedExercises : 0;
        
        // Debug pour le 28 octobre 2025
        if (dateStr === '2025-10-28') {
          // ✅ LOGS DE DEBUG DÉSACTIVÉS pour réduire le bruit (33k messages)
          // console.log('🔍 DEBUG Calcul intensité:');
          // console.log('Completed exercises:', completedExercises);
          // console.log('Endurance sessions:', enduranceData.sessions);
          // console.log('Is complementary checked:', isComplementaryChecked);
          // console.log('Total activities:', totalActivities);
          // console.log('Real duration:', realDuration);
          // console.log('Total reps:', totalReps);
        }
        
        // Calculer le niveau d'intensité avec logique hiérarchique et seuils dynamiques
        let intensityLevel = 0;
        if (totalActivities > 0) {
          // LOGIQUE HIÉRARCHIQUE :
          // 1. Si il y a des reps → priorité aux reps (seuils dynamiques)
          // 2. Si il y a que du temps → basé sur le temps (seuils dynamiques)
          // 3. Les sessions d'endurance détaillées n'impactent PAS l'intensité du calendrier
          
          if (totalReps > 0) {
            // PRIORITÉ AUX REPS : Utiliser les seuils dynamiques basés sur les données réelles
            // ✅ PHASE 2.1 : Utiliser les seuils mémorisés (évite les recalculs inutiles)
            const { thresholds } = dynamicThresholds;
            // ✅ PHASE 1 : Utiliser la fonction centralisée
            intensityLevel = calculateIntensityLevel(totalReps, thresholds);
            
            // ✅ LOGS DE DEBUG DÉSACTIVÉS pour réduire le bruit (33k messages)
            // Debug pour le 28 octobre 2025 (réactiver uniquement si nécessaire)
            // if (dateStr === '2025-10-28') {
            //   console.log('🔍 DEBUG Logique REPS DYNAMIQUE:');
            //   console.log('Total reps:', totalReps);
            //   console.log('Thresholds:', thresholds);
            //   console.log('Final intensity level:', intensityLevel);
            // }
          } else {
            // BASÉ SUR LE TEMPS : Utiliser des seuils dynamiques pour la durée
            // Seulement les activités complémentaires de l'onglet Aujourd'hui
            // ✅ PHASE 2.2 : Utiliser les seuils mémorisés (évite les recalculs inutiles)
            const { thresholds: timeThresholds } = dynamicTimeThresholds;
            // ✅ PHASE 1 : Utiliser la fonction centralisée
            intensityLevel = calculateTimeIntensityLevel(realDuration, timeThresholds);
            
            // ✅ LOGS DE DEBUG DÉSACTIVÉS pour réduire le bruit (33k messages)
            // Debug pour le 28 octobre 2025 (réactiver uniquement si nécessaire)
            // if (dateStr === '2025-10-28') {
            //   console.log('🔍 DEBUG Logique TEMPS DYNAMIQUE:');
            //   console.log('Real duration:', realDuration);
            //   console.log('Time thresholds:', timeThresholds);
            //   console.log('Final intensity level:', intensityLevel);
            // }
          }
        }
        
        // PHASE 5.3 : Appliquer les ajustements Garmin (recalibrage, records, etc.)
        let adjustedIntensity = intensityLevel;
        if (garminData && intensityLevel > 0) {
          const workoutIntensity = {
            level: intensityLevel,
            duration: realDuration,
            reps: totalReps
          };
          
          const garminAdjusted = calculateDayIntensityWithGarmin(dateStr, workoutIntensity, garminData);
          adjustedIntensity = garminAdjusted.level;
          
          // ✅ LOGS DE DEBUG DÉSACTIVÉS pour réduire le bruit (33k messages)
          // Debug pour le 28 octobre 2025 (réactiver uniquement si nécessaire)
          // if (dateStr === '2025-10-28' && garminAdjusted.multiplier !== 1.0) {
          //   console.log('🔍 DEBUG Ajustements Garmin:');
          //   console.log('Niveau original:', intensityLevel);
          //   console.log('Niveau ajusté:', adjustedIntensity);
          //   console.log('Multiplicateur:', garminAdjusted.multiplier);
          //   console.log('Ajustements:', garminAdjusted.adjustments);
          // }
        }
    
    // L'intensité ne dépend que des activités complémentaires de l'onglet Aujourd'hui
    const intensityScore = completionRate * 100 + (totalReps * 0.1) + (isComplementaryChecked ? 50 : 0);
    
    // PHASE 5.3 : Récupérer les icônes Garmin pour cette date
    const garminIcons = garminData ? getGarminActivityIcons(garminData, dateStr) : [];
    
    const result = {
      level: adjustedIntensity, // Utiliser le niveau ajusté par Garmin
      reps: totalReps,
      duration: realDuration,
      exerciseCount: totalPlannedExercises,
      completedCount: completedExercises,
      intensityScore,
      completionRate: Math.round(completionRate * 100),
      enduranceData: enduranceData,
      // PHASE 5.3 : Ajouter les icônes Garmin
      garminIcons: garminIcons,
      // Garder la compatibilité avec l'ancien format
      exercises: completedExercises,
      // ✅ CORRECTION : Utiliser la même logique que pour le calcul du total
      // (chercher les variantes _semaineA, _semaineB, et vérifier reps > 0)
      session: completedExercises > 0 ? { 
        exercises: exercisesList
          .filter(ex => {
            // Chercher la clé avec les variantes (même logique que pour le calcul)
            const baseKey = `${dateStr}_${ex.id}`;
            let actualKey = baseKey;
            
            if (allData?.reps?.[baseKey] !== undefined || allData?.checkedExercises?.[baseKey] !== undefined) {
              actualKey = baseKey;
            } else {
              const possibleKeys = [`${baseKey}_semaineA`, `${baseKey}_semaineB`];
              for (const possibleKey of possibleKeys) {
                if (allData?.reps?.[possibleKey] !== undefined || allData?.checkedExercises?.[possibleKey] !== undefined) {
                  actualKey = possibleKey;
                  break;
                }
              }
            }
            
            const reps = parseInt(allData?.reps?.[actualKey] || 0);
            const isCompleted = allData?.checkedExercises?.[actualKey] || false;
            // ✅ CORRECTION : Seulement si complété ET avec des reps > 0 (même logique que le calcul)
            return isCompleted && reps > 0;
          })
          .map(ex => {
            // Chercher la clé avec les variantes (même logique que pour le calcul)
            const baseKey = `${dateStr}_${ex.id}`;
            let actualKey = baseKey;
            
            if (allData?.reps?.[baseKey] !== undefined || allData?.checkedExercises?.[baseKey] !== undefined) {
              actualKey = baseKey;
            } else {
              const possibleKeys = [`${baseKey}_semaineA`, `${baseKey}_semaineB`];
              for (const possibleKey of possibleKeys) {
                if (allData?.reps?.[possibleKey] !== undefined || allData?.checkedExercises?.[possibleKey] !== undefined) {
                  actualKey = possibleKey;
                  break;
                }
              }
            }
            
            return {
              name: ex.name,
              reps: parseInt(allData?.reps?.[actualKey] || 0),
              exerciseId: ex.id,
              programName: ex.programName || 'Programme inconnu',
              programId: ex.programId
            };
          })
      } : null
    };
    
    // ✅ PHASE 2.3 : Mettre en cache le résultat avant de le retourner
    intensityCache.current[cacheKey] = result;
    
    // Limiter la taille du cache (garder seulement les 90 derniers jours)
    const cacheKeys = Object.keys(intensityCache.current);
    if (cacheKeys.length > 90) {
      const oldestKeys = cacheKeys.sort().slice(0, cacheKeys.length - 90);
      oldestKeys.forEach(key => delete intensityCache.current[key]);
    }
    
    return result;
  };

  // Calcul des streaks
  const calculateStreaks = () => {
    const today = new Date();
    const sortedHistory = [...workoutHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Calculer le streak actuel
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = getDateStr(checkDate);
      
      const hasWorkout = sortedHistory.some(session => session.date === dateStr);
      
      if (hasWorkout) {
        if (i === 0 || currentStreak > 0) currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculer le plus long streak
    let consecutiveDays = 0;
    for (const session of sortedHistory) {
      consecutiveDays++;
      tempStreak = Math.max(tempStreak, consecutiveDays);
      
      // Vérifier s'il y a une interruption
      const nextIndex = sortedHistory.indexOf(session) + 1;
      if (nextIndex < sortedHistory.length) {
        const currentDate = new Date(session.date);
        const nextDate = new Date(sortedHistory[nextIndex].date);
        const dayDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
          consecutiveDays = 0;
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { currentStreak, longestStreak };
  };

  // Navigation
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (viewMode === 'year') {
      newDate.setFullYear(currentDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  // Génération des jours du mois avec intensité dynamique
  const generateMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Commencer par le lundi de la semaine contenant le 1er du mois
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - mondayOffset);
    
    const days = [];
    const currentDay = new Date(startDate);
    // ✅ PHASE 2.1 : Utiliser les seuils mémorisés (évite les recalculs inutiles)
    const { thresholds } = dynamicThresholds;
    
    // Générer 6 semaines (42 jours) pour couvrir tout le mois
    for (let i = 0; i < 42; i++) {
      const isCurrentMonthDay = currentDay.getMonth() === month;
      
      // ✅ CORRECTION PB 1: Ne calculer l'intensité QUE pour les jours du mois courant
      // Évite de colorer les jours des mois précédents/suivants
      let intensity;
      if (isCurrentMonthDay) {
        intensity = getIntensityForDate(currentDay);
      } else {
        // Pour les jours hors mois, utiliser des valeurs neutres (pas d'intensité)
        intensity = {
          level: 0,
          reps: 0,
          duration: 0,
          exerciseCount: 0,
          completedCount: 0,
          intensityScore: 0,
          completionRate: 0,
          enduranceData: { reps: 0, duration: 0, distance: 0, jumps: 0, sessions: 0 },
          garminIcons: [],
          exercises: 0,
          session: null
        };
      }
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth: isCurrentMonthDay,
        isToday: currentDay.toDateString() === new Date().toDateString(),
        intensity
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };
  
  // ✅ NOUVEAU : Fonction pour calculer les statistiques de justifications par mois
  const calculateMonthJustificationStats = (monthDays) => {
    const stats = {
      [JUSTIFICATION_REASONS.MALADIE]: 0,
      [JUSTIFICATION_REASONS.FLEMME]: 0,
      [JUSTIFICATION_REASONS.PAS_LE_TEMPS]: 0,
      [JUSTIFICATION_REASONS.AUTRE]: 0
    };
    
    monthDays.forEach(day => {
      if (day.isCurrentMonth && day.intensity?.justification) {
        const reason = day.intensity.justification.reason;
        if (stats[reason] !== undefined) {
          stats[reason]++;
        }
      }
    });
    
    return stats;
  };

  // Génération complète de l'année avec statistiques
  const generateYearData = (date) => {
    const year = date.getFullYear();
    const months = [];
    let yearStats = {
      totalSessions: 0,
      totalReps: 0,
      totalDuration: 0,
      avgIntensity: 0,
      bestMonth: null,
      bestDay: null
    };
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      const monthDays = generateMonthDays(monthDate);
      
      // Calculer les stats du mois
      const monthSessions = monthDays.filter(day => 
        day.isCurrentMonth && day.intensity.level > 0
      );
      
      const monthTotalReps = monthSessions.reduce((sum, day) => sum + day.intensity.reps, 0);
      const monthTotalDuration = monthSessions.reduce((sum, day) => sum + day.intensity.duration, 0);
      const avgIntensity = monthSessions.length > 0 
        ? monthSessions.reduce((sum, day) => sum + day.intensity.level, 0) / monthSessions.length
        : 0;
      
      const monthData = {
        date: monthDate,
        days: monthDays,
        sessionsCount: monthSessions.length,
        totalReps: monthTotalReps,
        totalDuration: monthTotalDuration,
        avgIntensity: Math.round(avgIntensity * 10) / 10,
        bestDay: monthSessions.reduce((best, day) => 
          day.intensity.intensityScore > (best?.intensity.intensityScore || 0) ? day : best, null
        )
      };
      
      months.push(monthData);
      
      // Mettre à jour les stats annuelles
      yearStats.totalSessions += monthData.sessionsCount;
      yearStats.totalReps += monthData.totalReps;
      yearStats.totalDuration += monthData.totalDuration;
      
      if (!yearStats.bestMonth || monthData.totalReps > yearStats.bestMonth.totalReps) {
        yearStats.bestMonth = monthData;
      }
      
      if (monthData.bestDay && (!yearStats.bestDay || 
          monthData.bestDay.intensity.intensityScore > yearStats.bestDay.intensity.intensityScore)) {
        yearStats.bestDay = monthData.bestDay;
      }
    }
    
    yearStats.avgIntensity = yearStats.totalSessions > 0 
      ? Math.round((yearStats.totalReps / yearStats.totalSessions) * 10) / 10
      : 0;
    
    return { months, yearStats };
  };

  const getIntensityColor = (level, isToday = false) => {
    const baseColors = {
      4: 'bg-red-500 border-red-400', // Extrême (maximum)
      3: 'bg-orange-500 border-orange-400', // Intense
      2: 'bg-yellow-500 border-yellow-400', // Modéré
      1: 'bg-green-500 border-green-400', // Léger (minimum enregistré)
      0: 'bg-gray-200 border-gray-300' // Pas d'exercice
    };
    
    const todayRing = isToday ? ' ring-2 ring-blue-400' : '';
    return `${baseColors[level]}${todayRing}`;
  };
  
  // ✅ NOUVEAU : Fonction de couleur combinée (priorité justification > intensité)
  const getDayColor = (intensity, isToday = false) => {
    // Si justification existe, utiliser sa couleur
    if (intensity?.justification) {
      const reason = intensity.justification.reason;
      const baseColor = JUSTIFICATION_COLORS[reason] || JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE];
      const todayRing = isToday ? ' ring-2 ring-blue-400' : '';
      return `${baseColor}${todayRing}`;
    }
    
    // Sinon, utiliser la couleur d'intensité existante
    return getIntensityColor(intensity?.level || 0, isToday);
  };
  
  // ✅ NOUVEAU : Fonction pour obtenir le tooltip avec justification
  const getDayTooltip = (day, intensity) => {
    const dateStr = day.date.toLocaleDateString('fr-FR');
    const baseTooltip = `${dateStr} - ${getIntensityLabel(intensity?.level || 0)}${intensity?.duration > 0 ? ` (${intensity.duration}min)` : ''}${intensity?.reps > 0 ? ` - ${intensity.reps} reps` : ''}`;
    
    // Si justification existe, l'ajouter au tooltip
    if (intensity?.justification) {
      const reasonLabel = t(`justification.${intensity.justification.reason}`) || t('justification.autre');
      const note = intensity.justification.note ? ` : ${intensity.justification.note}` : '';
      return `${baseTooltip}\n${t('justification.button.dayJustified')} : ${reasonLabel}${note}`;
    }
    
    return baseTooltip;
  };

  const getIntensityLabel = (level) => {
    const labels = {
      4: t('calendar.heatmap.intensityLabels.extreme'),
      3: t('calendar.heatmap.intensityLabels.intense'),
      2: t('calendar.heatmap.intensityLabels.moderate'), 
      1: t('calendar.heatmap.intensityLabels.light'),
      0: t('calendar.heatmap.intensityLabels.rest')
    };
    return labels[level];
  };

  // Données calculées
  const monthDays = useMemo(() => generateMonthDays(currentDate), [currentDate, allData, garminData]);
  const { months: yearMonths, yearStats } = useMemo(() => generateYearData(currentDate), [currentDate, allData, garminData]);
  const streaks = useMemo(() => calculateStreaks(), [workoutHistory]);

  // Constantes pour l'affichage
  const monthNames = useMemo(() => [
    t('calendar.heatmap.monthNames.january'),
    t('calendar.heatmap.monthNames.february'),
    t('calendar.heatmap.monthNames.march'),
    t('calendar.heatmap.monthNames.april'),
    t('calendar.heatmap.monthNames.may'),
    t('calendar.heatmap.monthNames.june'),
    t('calendar.heatmap.monthNames.july'),
    t('calendar.heatmap.monthNames.august'),
    t('calendar.heatmap.monthNames.september'),
    t('calendar.heatmap.monthNames.october'),
    t('calendar.heatmap.monthNames.november'),
    t('calendar.heatmap.monthNames.december')
  ], [t]);
  
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className="space-y-6">
      {/* En-tête avec navigation */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {['month', 'year', 'streaks'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewMode === mode 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {mode === 'month' ? t('calendar.heatmap.viewModes.month') : mode === 'year' ? t('calendar.heatmap.viewModes.year') : t('calendar.heatmap.viewModes.streaks')}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          
          <h3 className="text-xl font-bold text-white">
            {viewMode === 'month' 
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : viewMode === 'year'
              ? currentDate.getFullYear()
              : t('calendar.heatmap.streaksAnalysis')
            }
          </h3>
          
          <button
            onClick={() => navigateDate(1)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Légende améliorée */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm">{t('calendar.heatmap.intensity')}</span>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(level => (
                <div key={level} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded border ${getIntensityColor(level)}`} />
                  <span className="text-xs text-slate-400">{getIntensityLabel(level)}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            {showStats ? t('calendar.heatmap.hideStats') : t('calendar.heatmap.showStats')}
          </button>
        </div>
      </div>

      {/* Vue mensuelle détaillée */}
      {viewMode === 'month' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day, index) => (
              <div key={`weekday-${index}`} className="text-center text-slate-400 text-sm font-medium p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day, index) => (
              <div
                key={index}
                onClick={() => {
                  // ✅ CORRECTION : Seulement les jours BLANCS (sans activité ET sans justification) ouvrent la modal
                  // Un jour est "blanc" si : level === 0 ET pas de justification
                  const dateStr = getDateStr(day.date);
                  const hasJustification = !!day.intensity?.justification;
                  const isWhiteDay = day.intensity.level === 0 && !hasJustification;
                  
                  if (isWhiteDay && isDayWithoutActivity(allData, dateStr)) {
                    // Jour blanc sans activité → ouvrir modal de justification
                    setJustificationModalDate(day.date);
                  } else {
                    // Jour avec activité OU justifié → afficher le recap normal
                    setSelectedDate(day);
                  }
                }}
                className={`
                  aspect-square rounded-lg border-2 cursor-pointer transition-all duration-200 relative
                  ${getDayColor(day.intensity, day.isToday)}
                  ${day.isCurrentMonth ? 'border-transparent' : 'border-slate-600 opacity-30'}
                  ${selectedDate?.date.toDateString() === day.date.toDateString() 
                    ? 'ring-2 ring-purple-400' : ''
                  }
                  hover:ring-2 hover:ring-purple-300 hover:scale-105
                `}
                  title={getDayTooltip(day, day.intensity)}
              >
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <span className={`text-sm font-medium ${
                    day.intensity.level > 0 ? 'text-white' : 'text-slate-400'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  {day.intensity.level > 0 && (
                    <div className="text-xs text-white/80">
                      {day.intensity.reps}
                    </div>
                  )}
                  {/* PHASE 5.3 : Icônes Garmin (discret, en bas à droite) */}
                  {day.intensity.garminIcons && day.intensity.garminIcons.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                      {day.intensity.garminIcons.map((iconData, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] leading-none"
                          title={iconData.label}
                        >
                          {iconData.icon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {day.isToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* ✅ NOUVEAU : Compteurs de justifications en bas du mois */}
          {(() => {
            const monthStats = calculateMonthJustificationStats(monthDays);
            const hasJustifications = Object.values(monthStats).some(count => count > 0);
            
            if (!hasJustifications) return null;
            
            return (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="text-xs text-slate-400 mb-2">{t('calendar.heatmap.monthlyJustifications')}</div>
                <div className="flex flex-wrap gap-2">
                  {monthStats[JUSTIFICATION_REASONS.MALADIE] > 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.MALADIE]}`}>
                      <span>{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.MALADIE]}</span>
                      <span className="text-white font-medium">{monthStats[JUSTIFICATION_REASONS.MALADIE]}</span>
                      <span className="text-white/80">{t(`justification.${JUSTIFICATION_REASONS.MALADIE}`)}</span>
                    </div>
                  )}
                  {monthStats[JUSTIFICATION_REASONS.FLEMME] > 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.FLEMME]}`}>
                      <span>{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.FLEMME]}</span>
                      <span className="text-white font-medium">{monthStats[JUSTIFICATION_REASONS.FLEMME]}</span>
                      <span className="text-white/80">{t(`justification.${JUSTIFICATION_REASONS.FLEMME}`)}</span>
                    </div>
                  )}
                  {monthStats[JUSTIFICATION_REASONS.PAS_LE_TEMPS] > 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}`}>
                      <span>{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}</span>
                      <span className="text-white font-medium">{monthStats[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}</span>
                      <span className="text-white/80">{t(`justification.${JUSTIFICATION_REASONS.PAS_LE_TEMPS}`)}</span>
                    </div>
                  )}
                  {monthStats[JUSTIFICATION_REASONS.AUTRE] > 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE]}`}>
                      <span>{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.AUTRE]}</span>
                      <span className="text-white font-medium">{monthStats[JUSTIFICATION_REASONS.AUTRE]}</span>
                      <span className="text-white/80">{t(`justification.${JUSTIFICATION_REASONS.AUTRE}`)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Vue annuelle complète */}
      {viewMode === 'year' && (
        <div className="space-y-6">
          {/* Résumé annuel */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-400" />
              {t('calendar.heatmap.yearSummary', { year: currentDate.getFullYear() })}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">{t('calendar.heatmap.bestMonth')}</div>
                <div className="text-xl font-bold text-white">
                  {yearStats.bestMonth ? monthNames[yearStats.bestMonth.date.getMonth()] : 'N/A'}
                </div>
                <div className="text-sm text-slate-300">
                  {yearStats.bestMonth?.totalReps || 0} reps
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">{t('calendar.heatmap.bestDay')}</div>
                <div className="text-xl font-bold text-white">
                  {yearStats.bestDay ? yearStats.bestDay.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : 'N/A'}
                </div>
                <div className="text-sm text-slate-300">
                  {yearStats.bestDay?.intensity.reps || 0} reps
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">{t('calendar.heatmap.avgPerSession')}</div>
                <div className="text-xl font-bold text-white">{yearStats.avgIntensity}</div>
                <div className="text-sm text-slate-300">{t('calendar.heatmap.repsPerSession')}</div>
              </div>
            </div>
          </div>

          {/* Grille des mois */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {yearMonths.map((month, monthIndex) => (
                <div key={monthIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">
                      {monthNames[month.date.getMonth()]}
                    </h4>
                    <div className="text-xs text-slate-400">
                      {t('calendar.stats.sessions', { count: month.sessionsCount })}
                    </div>
                  </div>
                  
                  {/* Mini calendrier */}
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {weekDays.map((day, index) => (
                        <div key={`year-weekday-${index}`} className="text-center text-slate-500 text-xs">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {month.days.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`
                            aspect-square rounded-sm cursor-pointer transition-all text-xs flex items-center justify-center
                            ${getDayColor(day.intensity)}
                            ${day.isCurrentMonth ? '' : 'opacity-20'}
                            hover:ring-1 hover:ring-purple-300 hover:scale-110
                          `}
                          onClick={() => {
                            // ✅ CORRECTION : Dans la vue 12 mois, toujours changer de vue (comportement normal)
                            // La modal de justification s'ouvrira seulement si on clique sur un jour blanc dans la vue mois
                            setCurrentDate(new Date(day.date));
                            setViewMode('month');
                          }}
                          title={getDayTooltip(day, day.intensity)}
                        >
                          {day.isCurrentMonth && day.intensity.level > 0 && (
                            <span className="text-white font-bold">
                              {day.date.getDate()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Stats du mois */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-700/50 rounded p-2 text-center">
                      <div className="text-white font-bold">{month.totalReps}</div>
                      <div className="text-slate-400">{t('calendar.stats.reps_endurance')}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2 text-center">
                      <div className="text-white font-bold">{month.totalDuration}min</div>
                      <div className="text-slate-400">{t('calendar.stats.total_time')}</div>
                    </div>
                  </div>
                  
                  {/* ✅ NOUVEAU : Compteurs de justifications en dessous des stats */}
                  {(() => {
                    const monthStats = calculateMonthJustificationStats(month.days);
                    const hasJustifications = Object.values(monthStats).some(count => count > 0);
                    
                    if (!hasJustifications) return null;
                    
                    return (
                      <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {monthStats[JUSTIFICATION_REASONS.MALADIE] > 0 && (
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.MALADIE]}`}>
                              <span className="text-[10px]">{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.MALADIE]}</span>
                              <span className="text-white font-medium">{monthStats[JUSTIFICATION_REASONS.MALADIE]}</span>
                            </div>
                          )}
                          {monthStats[JUSTIFICATION_REASONS.FLEMME] > 0 && (
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.FLEMME]}`}>
                              <span className="text-[10px]">{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.FLEMME]}</span>
                              <span className="text-white font-medium">{monthStats[JUSTIFICATION_REASONS.FLEMME]}</span>
                            </div>
                          )}
                          {monthStats[JUSTIFICATION_REASONS.PAS_LE_TEMPS] > 0 && (
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}`}>
                              <span className="text-[10px]">{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}</span>
                              <span className="text-white font-medium">{monthStats[JUSTIFICATION_REASONS.PAS_LE_TEMPS]}</span>
                            </div>
                          )}
                          {monthStats[JUSTIFICATION_REASONS.AUTRE] > 0 && (
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE]}`}>
                              <span className="text-[10px]">{JUSTIFICATION_ICONS[JUSTIFICATION_REASONS.AUTRE]}</span>
                              <span className="text-white font-medium">{monthStats[JUSTIFICATION_REASONS.AUTRE]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vue Streaks */}
      {viewMode === 'streaks' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 rounded-lg p-6 text-center">
              <Flame className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">{streaks.currentStreak}</div>
              <div className="text-slate-300">{t('calendar.heatmap.streaks.currentStreak')}</div>
              <div className="text-sm text-slate-400 mt-2">
                {streaks.currentStreak > 0 ? t('calendar.heatmap.streaks.consecutiveDays') : t('calendar.heatmap.streaks.noStreak')}
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-6 text-center">
              <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">{streaks.longestStreak}</div>
              <div className="text-slate-300">{t('calendar.heatmap.streaks.longestStreak')}</div>
              <div className="text-sm text-slate-400 mt-2">{t('calendar.heatmap.streaks.longestStreakDesc')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Détails de la date sélectionnée */}
      {selectedDate && (() => {
        const dateStr = getDateStr(selectedDate.date);
        const dailyMetrics = garminData?.dailyMetrics?.[dateStr];
        const swimming = (garminData?.activities?.swimming || []).filter(a => a.date === dateStr);
        const jumpRope = (garminData?.activities?.jumpRope || []).filter(a => a.date === dateStr);
        const cardio = (garminData?.activities?.cardio || []).filter(a => a.date === dateStr);
        // ✅ NOUVEAU : Récupérer la justification pour ce jour
        const justification = selectedDate.intensity?.justification || getDayJustification(allData, dateStr);
        
        // Calculer les ajustements Garmin pour cette date
        let garminAdjustments = null;
        if (garminData && selectedDate.intensity.level > 0) {
          const workoutIntensity = {
            level: selectedDate.intensity.level,
            duration: selectedDate.intensity.duration,
            reps: selectedDate.intensity.reps
          };
          const adjusted = calculateDayIntensityWithGarmin(dateStr, workoutIntensity, garminData);
          if (adjusted.multiplier !== 1.0) {
            garminAdjustments = adjusted;
          }
        }
        
        return (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {formatLocaleDate(selectedDate.date, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-slate-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* ✅ NOUVEAU : Bandeau de justification si le jour est justifié */}
            {justification && (
              <div className={`mb-4 p-4 rounded-lg border-2 ${JUSTIFICATION_COLORS[justification.reason] || JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE]} flex items-start gap-3`}>
                <span className="text-2xl" aria-hidden="true">{JUSTIFICATION_ICONS[justification.reason] || '❓'}</span>
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">
                    {t(`justification.${justification.reason}`) || t('justification.autre')}
                  </div>
                  {justification.note && (
                    <div className="text-white/90 text-sm">
                      {justification.note}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setJustificationModalDate(selectedDate.date);
                  }}
                  className="text-white/70 hover:text-white text-sm underline"
                  title={t('calendar.heatmap.dayDetails.modifyJustification')}
                >
                  {t('calendar.heatmap.dayDetails.modify')}
                </button>
              </div>
            )}
            
            {/* Statistiques principales - Masquer si jour justifié */}
            {!justification && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Activity className="mr-2" size={16} />
                  {t('calendar.heatmap.dayDetails.workoutStats')}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{selectedDate.intensity.reps}</div>
                    <div className="text-slate-400 text-sm">{t('calendar.heatmap.dayDetails.totalReps')}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{selectedDate.intensity.completedCount}</div>
                    <div className="text-slate-400 text-sm">{t('calendar.heatmap.dayDetails.classicExercises')}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{selectedDate.intensity.duration}min</div>
                    <div className="text-slate-400 text-sm">{t('calendar.heatmap.dayDetails.totalDuration')}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{getIntensityLabel(selectedDate.intensity.level)}</div>
                    <div className="text-slate-400 text-sm">{t('calendar.heatmap.dayDetails.globalIntensity')}</div>
                    {garminAdjustments && (
                      <div className="text-xs text-green-400 mt-1">
                        {garminAdjustments.multiplier > 1 ? '⬆' : '⬇'} {t('calendar.heatmap.dayDetails.garminAdjusted')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* ✅ NOUVEAU : Message si jour justifié (pas d'entraînement) */}
            {justification && (
              <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                <div className="text-slate-400 text-sm">
                  {t('calendar.heatmap.dayDetails.noWorkoutJustified')}
                </div>
              </div>
            )}

            {/* Ajustements Garmin appliqués - Masquer si jour justifié */}
            {!justification && garminAdjustments && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2 flex items-center">
                  <Target className="mr-2" size={16} />
                  {t('calendar.heatmap.dayDetails.garminAdjustments')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {garminAdjustments.adjustments.timeReal && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-300">⏱️ {t('calendar.heatmap.dayDetails.realTime')}</div>
                      <div className="text-white">
                        {garminAdjustments.adjustments.timeReal.réel.toFixed(0)}min ({t('calendar.heatmap.dayDetails.planned')}: {garminAdjustments.adjustments.timeReal.prévu}min)
                      </div>
                    </div>
                  )}
                  {garminAdjustments.adjustments.swimmingRecord && garminAdjustments.adjustments.swimmingRecord.distance > garminAdjustments.adjustments.swimmingRecord.record && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-300">🏊 {t('calendar.heatmap.dayDetails.swimmingRecord')}</div>
                      <div className="text-white">
                        {garminAdjustments.adjustments.swimmingRecord.distance}m ({t('calendar.heatmap.dayDetails.record')}: {garminAdjustments.adjustments.swimmingRecord.record}m)
                      </div>
                    </div>
                  )}
                  {garminAdjustments.adjustments.jumpRopeRecord && garminAdjustments.adjustments.jumpRopeRecord.sauts > garminAdjustments.adjustments.jumpRopeRecord.record && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-300">🪢 {t('calendar.heatmap.dayDetails.jumpRopeRecord')}</div>
                      <div className="text-white">
                        {garminAdjustments.adjustments.jumpRopeRecord.sauts} {t('calendar.heatmap.dayDetails.jumps')} ({t('calendar.heatmap.dayDetails.record')}: {garminAdjustments.adjustments.jumpRopeRecord.record})
                      </div>
                    </div>
                  )}
                  {garminAdjustments.adjustments.caloriesActive && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-300">🔥 {t('calendar.heatmap.dayDetails.activeCalories')}</div>
                      <div className="text-white">
                        {Math.round(garminAdjustments.adjustments.caloriesActive.calories)} ({t('calendar.heatmap.dayDetails.average')}: {Math.round(garminAdjustments.adjustments.caloriesActive.moyenne)})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Activités Garmin - Masquer si jour justifié */}
            {!justification && (swimming.length > 0 || jumpRope.length > 0 || cardio.length > 0 || dailyMetrics) && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Zap className="mr-2 text-green-400" size={16} />
                  {t('calendar.heatmap.dayDetails.garminData')}
                </h4>
                <div className="space-y-4">
                  {/* Natation */}
                  {swimming.length > 0 && (
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                      <div className="text-cyan-400 font-medium mb-2">🏊 {t('calendar.heatmap.dayDetails.swimming')} ({swimming.length} {swimming.length > 1 ? t('calendar.heatmap.dayDetails.sessions') : t('calendar.heatmap.dayDetails.session')})</div>
                      {swimming.map((act, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded p-2 mt-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400">{t('calendar.heatmap.dayDetails.distance')}:</span>
                              <span className="text-white ml-2">{act.distance || act.totalDistance || 0}m</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Durée:</span>
                              <span className="text-white ml-2">
                                {parseDurationToMinutes(act.duration || act.totalTime || 0, `GarminActivities.Swimming[${idx}]`)}min
                              </span>
                            </div>
                            {act.avgHR && (
                              <div>
                                <span className="text-slate-400">{t('calendar.heatmap.dayDetails.avgHR')}:</span>
                                <span className="text-white ml-2">{act.avgHR} bpm</span>
                              </div>
                            )}
                            {act.calories?.active && (
                              <div>
                                <span className="text-slate-400">Calories:</span>
                                <span className="text-white ml-2">{act.calories.active}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Corde à sauter */}
                  {jumpRope.length > 0 && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <div className="text-green-400 font-medium mb-2">🪢 {t('calendar.heatmap.dayDetails.jumpRope')} ({jumpRope.length} {jumpRope.length > 1 ? t('calendar.heatmap.dayDetails.sessions') : t('calendar.heatmap.dayDetails.session')})</div>
                      {jumpRope.map((act, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded p-2 mt-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400">{t('calendar.heatmap.dayDetails.jumps')}:</span>
                              <span className="text-white ml-2">{act.jumps || 0}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Durée:</span>
                              <span className="text-white ml-2">
                                {parseDurationToMinutes(act.duration || act.totalTime || 0, `GarminActivities.JumpRope[${idx}]`)}min
                              </span>
                            </div>
                            {act.speed && (
                              <div>
                                <span className="text-slate-400">{t('calendar.heatmap.dayDetails.speed')}:</span>
                                <span className="text-white ml-2">{act.speed.toFixed(1)} {t('calendar.heatmap.dayDetails.jumps')}/min</span>
                              </div>
                            )}
                            {act.maxContinuous && (
                              <div>
                                <span className="text-slate-400">{t('calendar.heatmap.dayDetails.maxContinuous')}:</span>
                                <span className="text-white ml-2">{act.maxContinuous}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cardio */}
                  {cardio.length > 0 && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <div className="text-red-400 font-medium mb-2">❤️ {t('calendar.heatmap.dayDetails.cardioActivities')} ({cardio.length} {cardio.length > 1 ? t('calendar.heatmap.dayDetails.sessions') : t('calendar.heatmap.dayDetails.session')})</div>
                      {cardio.map((act, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded p-2 mt-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400">Durée:</span>
                              <span className="text-white ml-2">
                                {parseDurationToMinutes(act.duration || act.totalTime || 0, `GarminActivities.Cardio[${idx}]`)}min
                              </span>
                            </div>
                            {act.calories?.active && (
                              <div>
                                <span className="text-slate-400">Calories:</span>
                                <span className="text-white ml-2">{act.calories.active}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Métriques quotidiennes */}
                  {dailyMetrics && (
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-purple-400 font-medium mb-2">📊 {t('calendar.heatmap.dayDetails.dailyMetrics')}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {dailyMetrics.steps > 0 && (
                          <div className="bg-slate-800/50 rounded p-2">
                            <div className="text-slate-400">{t('calendar.heatmap.dayDetails.steps')}</div>
                            <div className="text-white font-semibold">{dailyMetrics.steps.toLocaleString()}</div>
                          </div>
                        )}
                        {dailyMetrics.distance > 0 && (
                          <div className="bg-slate-800/50 rounded p-2">
                            <div className="text-slate-400">{t('calendar.heatmap.dayDetails.distance')}</div>
                            <div className="text-white font-semibold">{dailyMetrics.distance.toFixed(1)} km</div>
                          </div>
                        )}
                        {dailyMetrics.calories?.active > 0 && (
                          <div className="bg-slate-800/50 rounded p-2">
                            <div className="text-slate-400">{t('calendar.heatmap.dayDetails.activeCalories')}</div>
                            <div className="text-white font-semibold">{Math.round(dailyMetrics.calories.active)}</div>
                          </div>
                        )}
                        {dailyMetrics.heartRate?.resting > 0 && (
                          <div className="bg-slate-800/50 rounded p-2">
                            <div className="text-slate-400">{t('calendar.heatmap.dayDetails.restingHR')}</div>
                            <div className="text-white font-semibold">{dailyMetrics.heartRate.resting} bpm</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          
            {/* Données d'endurance détaillées */}
            {selectedDate.intensity.enduranceData && selectedDate.intensity.enduranceData.sessions > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Activity className="mr-2" size={16} />
                  {t('calendar.heatmap.dayDetails.enduranceActivities')}
                </h4>
                <div className={`grid gap-4 ${selectedDate.intensity.enduranceData.reps > 0 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
                  <div className="bg-orange-700/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-orange-200">{selectedDate.intensity.enduranceData.sessions}</div>
                    <div className="text-orange-300 text-sm">{t('calendar.heatmap.dayDetails.enduranceSessions')}</div>
                  </div>
                  {selectedDate.intensity.enduranceData.reps > 0 && (
                    <div className="bg-red-700/30 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-red-200">{selectedDate.intensity.enduranceData.reps}</div>
                      <div className="text-red-300 text-sm">{t('calendar.heatmap.dayDetails.pushups')}</div>
                    </div>
                  )}
                  <div className="bg-blue-700/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-200">
                      {selectedDate.intensity.enduranceData.distance % 1 === 0 
                        ? selectedDate.intensity.enduranceData.distance 
                        : parseFloat(selectedDate.intensity.enduranceData.distance.toFixed(1))
                      }m
                    </div>
                    <div className="text-blue-300 text-sm">{t('calendar.heatmap.dayDetails.enduranceDistance')}</div>
                  </div>
                  <div className="bg-green-700/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-200">{selectedDate.intensity.enduranceData.jumps}</div>
                    <div className="text-green-300 text-sm">{t('calendar.heatmap.dayDetails.enduranceJumps')}</div>
                  </div>
                  <div className="bg-purple-700/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-200">{selectedDate.intensity.enduranceData.duration}min</div>
                    <div className="text-purple-300 text-sm">{t('calendar.heatmap.dayDetails.enduranceDuration')}</div>
                  </div>
                </div>
              </div>
            )}
          
            {/* Exercices réalisés - Masquer si jour justifié */}
            {!justification && selectedDate.intensity.session && selectedDate.intensity.session.exercises.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-2">{t('calendar.heatmap.dayDetails.exercisesCompleted')}</h4>
                <div className="space-y-2">
                  {selectedDate.intensity.session.exercises.map((exercise, index) => {
                    // Récupérer le nom du programme depuis l'exercice ou via getExerciseNameById
                    const programName = exercise.programName || 'Programme inconnu';
                    const exerciseName = exercise.name || (getExerciseNameById ? getExerciseNameById(exercise.exerciseId || exercise.id) : `Exercice ${exercise.exerciseId || exercise.id}`);
                    
                    return (
                      <div key={index} className="bg-slate-700/30 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-300 font-medium">{exerciseName}</span>
                          <span className="text-white font-medium">{exercise.reps} {t('calendar.heatmap.dayDetails.reps')}</span>
                        </div>
                        {programName && (
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="text-purple-400">📋</span>
                            <span>{programName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}
      
      {/* ✅ NOUVEAU : Modal de justification */}
      {justificationModalDate && (
        <JustificationModal
          isOpen={!!justificationModalDate}
          onClose={() => setJustificationModalDate(null)}
          date={justificationModalDate}
          existingJustification={getDayJustification(allData, getDateStr(justificationModalDate))}
        />
      )}
    </div>
  );
};

export default CalendarHeatmap;