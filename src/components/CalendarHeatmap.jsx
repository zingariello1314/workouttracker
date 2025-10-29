import React, { useState, useMemo } from 'react';
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
import { getDateStr } from '../utils/dateUtils';
import { workoutProgram } from '../data/workoutProgram';

const CalendarHeatmap = ({ workoutHistory = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('year'); // 'month', 'year', 'streaks'
  const [selectedDate, setSelectedDate] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Récupérer les données du contexte pour le calcul du temps réel
  const { data, getCurrentData } = useWorkout();
  // Utiliser getCurrentData() pour accéder aux données actuelles (temp + sauvegardées)
  const allData = getCurrentData();

  // Fonction pour obtenir le nom du jour
  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
  };

  // Calculer les seuils dynamiques basés sur toutes les données existantes
  const calculateDynamicThresholds = () => {
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
  };

  // Calculer le niveau d'intensité basé sur les seuils dynamiques
  const calculateDynamicIntensityLevel = (totalReps, thresholds) => {
    if (totalReps === 0) return 0;
    if (totalReps <= thresholds[1]) return 1; // Léger (vert)
    if (totalReps <= thresholds[2]) return 2; // Modéré (jaune)
    if (totalReps <= thresholds[3]) return 3; // Intense (orange)
    return 4; // Extrême (rouge)
  };

  // Calculer les seuils dynamiques pour la durée (temps)
  const calculateDynamicTimeThresholds = () => {
    if (!allData) return { min: 0, max: 0, thresholds: [0, 30, 60, 90] };
    
    const durations = [];
    
    // Collecter toutes les durées des activités complémentaires et d'endurance
    Object.keys(allData.checkedExercises || {}).forEach(key => {
      if (allData.checkedExercises[key]) {
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const dayName = getDayName(new Date(dateStr));
          const workout = workoutProgram[dayName];
          
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
    
    // Ajouter les durées d'endurance
    const enduranceData = allData?.enduranceData || {};
    const enduranceSessions = enduranceData.sessions || {};
    Object.entries(enduranceSessions).forEach(([activityType, sessions]) => {
      if (Array.isArray(sessions)) {
        sessions.forEach(session => {
          if (session.duration) {
            durations.push(session.duration);
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
  };

  // Calculer le niveau d'intensité basé sur les seuils dynamiques de temps
  const calculateDynamicTimeIntensityLevel = (duration, thresholds) => {
    if (duration === 0) return 0;
    if (duration <= thresholds[1]) return 1; // Léger (vert)
    if (duration <= thresholds[2]) return 2; // Modéré (jaune)
    if (duration <= thresholds[3]) return 3; // Intense (orange)
    return 4; // Extrême (rouge)
  };
  const getIntensityForDate = (date) => {
    const dateStr = getDateStr(date);
    const dayName = getDayName(date);
    const workout = workoutProgram[dayName];
    
    // Debug pour le 28 octobre 2025
    if (dateStr === '2025-10-28') {
      console.log('🔍 DEBUG CalendarHeatmap - 28 octobre 2025:');
      console.log('Date string:', dateStr);
      console.log('Day name:', dayName);
      console.log('Workout found:', workout?.name);
      console.log('All data:', allData);
      console.log('Checked exercises:', allData?.checkedExercises);
      console.log('Reps data:', allData?.reps);
    }
    
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
      Object.values(sessions).forEach(activitySessions => {
        if (Array.isArray(activitySessions)) {
          activitySessions.forEach(session => {
            // Normaliser la date de la session pour la comparaison
            let sessionDateStr = session.date;
            if (sessionDateStr) {
              // Si la date contient 'T', prendre seulement la partie date
              if (sessionDateStr.includes('T')) {
                sessionDateStr = sessionDateStr.split('T')[0];
              }
              // Si c'est un format autre, essayer de parser
              if (sessionDateStr.length > 10) {
                try {
                  sessionDateStr = new Date(sessionDateStr).toISOString().split('T')[0];
                } catch (e) {
                  // Ignorer si le parsing échoue
                }
              }
              
              // Comparer les dates normalisées
              if (sessionDateStr === dateStr) {
                enduranceSessions++;
                
                // Ajouter les répétitions (pompes, boxe)
                if (session.count || session.reps) enduranceReps += parseInt(session.count || session.reps) || 0;
                if (session.duration) enduranceDuration += parseInt(session.duration) || 0;
                
                // Ajouter la distance (natation, course)
                if (session.distance) enduranceDistance += parseFloat(session.distance) || 0;
                if (session.laps && Array.isArray(session.laps)) {
                  session.laps.forEach(lap => {
                    enduranceDistance += parseFloat(lap.distance) || 0;
                  });
                }
                
                // Ajouter les sauts (corde à sauter)
                if (session.jumps) enduranceJumps += parseInt(session.jumps) || 0;
              }
            }
          });
        }
      });
      
      return {
        reps: enduranceReps,
        duration: enduranceDuration,
        distance: enduranceDistance,
        jumps: enduranceJumps,
        sessions: enduranceSessions
      };
    };
    
    const enduranceData = getEnduranceDataForDate();
    
    // Si pas de programme pour ce jour ET pas de données d'endurance, retourner des valeurs par défaut
    if (!workout && enduranceData.sessions === 0) {
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

    // Obtenir la liste des exercices - CORRECTION: inclure TOUTES les variantes
    let exercisesList = [];
    
    if (workout?.salleVariants) {
      // Pour les jours avec variantes de salle, inclure TOUS les exercices possibles
      const semaineA = workout.salleVariants.semaineA?.exercices || [];
      const semaineB = workout.salleVariants.semaineB?.exercices || [];
      const streetExercices = workout.exercices || [];
      
      // Combiner tous les exercices possibles (salle A, salle B, street)
      exercisesList = [...semaineA, ...semaineB, ...streetExercices];
    } else if (workout?.exercices) {
      // Pour les jours sans variantes, utiliser les exercices de base
      exercisesList = workout.exercices || [];
    }
    
    let totalReps = enduranceData.reps; // Commencer avec les reps d'endurance
    let completedExercises = 0;
    let totalPlannedExercises = exercisesList.length;
    
    // Calculer les répétitions réelles et exercices accomplis (exercices classiques)
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
      
      reps = parseInt(allData?.reps?.[actualKey] || 0);
      isCompleted = allData?.checkedExercises?.[actualKey] || false;
      
      if (isCompleted) {
        completedExercises++;
        totalReps += reps; // Ajouter aux reps d'endurance
      }
    });

    // Calculer la durée réelle basée sur les exercices accomplis ET l'endurance
    const calculateRealDuration = () => {
      let totalDurationMinutes = enduranceData.duration; // Commencer avec la durée d'endurance
      
      // Ajouter la durée des activités complémentaires cochées dans l'onglet Aujourd'hui
      if (workout?.complementaryActivity) {
        const complementaryKey = `${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`;
        const isComplementaryChecked = allData?.checkedExercises?.[complementaryKey] || false;
        
        // Debug pour le 28 octobre 2025
        if (dateStr === '2025-10-28') {
          console.log('🔍 DEBUG Activité complémentaire:');
          console.log('Complementary key:', complementaryKey);
          console.log('Is checked:', isComplementaryChecked);
          console.log('Complementary activity:', workout.complementaryActivity);
        }
        
        if (isComplementaryChecked) {
          // Vérifier s'il y a des minutes saisies manuellement
          const minutesKey = `${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`;
          const manualMinutes = parseInt(allData?.reps?.[minutesKey] || 0);
          
          // Debug pour le 28 octobre 2025
          if (dateStr === '2025-10-28') {
            console.log('🔍 DEBUG Minutes:');
            console.log('Minutes key:', minutesKey);
            console.log('Manual minutes:', manualMinutes);
          }
          
          if (manualMinutes > 0) {
            // Utiliser les minutes saisies manuellement
            totalDurationMinutes += manualMinutes;
            if (dateStr === '2025-10-28') {
              console.log('✅ Utilisation des minutes manuelles:', manualMinutes);
            }
          } else {
            // Utiliser la durée prévue par défaut
            totalDurationMinutes += workout.complementaryActivity.duration || 90;
            if (dateStr === '2025-10-28') {
              console.log('✅ Utilisation de la durée par défaut:', workout.complementaryActivity.duration);
            }
          }
        }
      }
      
      if (completedExercises === 0 && enduranceData.sessions === 0 && totalDurationMinutes === 0) return 0;
      
      exercisesList.forEach(exercise => {
        const baseKey = `${dateStr}_${exercise.id}`;
        
        // Utiliser la même logique de recherche de clé que pour les répétitions
        let actualKey = baseKey;
        let isCompleted = false;
        
        // Vérifier d'abord la clé de base
        if (allData?.checkedExercises?.[baseKey] !== undefined) {
          actualKey = baseKey;
        } else {
          // Chercher avec les suffixes
          const possibleKeys = [
            `${baseKey}_semaineA`,
            `${baseKey}_semaineB`
          ];
          
          for (const possibleKey of possibleKeys) {
            if (allData?.checkedExercises?.[possibleKey] !== undefined) {
              actualKey = possibleKey;
              break;
            }
          }
        }
        
        isCompleted = allData?.checkedExercises?.[actualKey] || false;
        
        if (isCompleted && exercise.series) {
          // Calculer le temps pour cet exercice
          let exerciseDuration = 0;
          
          // Extraire le nombre de séries et répétitions
          const seriesMatch = exercise.series.match(/(\d+)×(\d+)(?:-(\d+))?/);
          if (seriesMatch) {
            const sets = parseInt(seriesMatch[1]);
            const minReps = parseInt(seriesMatch[2]);
            const maxReps = seriesMatch[3] ? parseInt(seriesMatch[3]) : minReps;
            const avgReps = (minReps + maxReps) / 2;
            
            // Temps par répétition (en secondes) selon le type d'exercice
            let timePerRep = 3; // défaut 3 secondes par rep
            
            if (exercise.name.toLowerCase().includes('planche') || 
                exercise.name.toLowerCase().includes('gainage')) {
              // Exercices isométriques : temps en secondes directement
              if (exercise.series.includes('sec') || exercise.series.includes('min')) {
                const timeMatch = exercise.series.match(/(\d+)\s*(sec|min)/);
                if (timeMatch) {
                  const timeValue = parseInt(timeMatch[1]);
                  const timeUnit = timeMatch[2];
                  exerciseDuration = timeUnit === 'min' ? timeValue * 60 : timeValue;
                }
              } else {
                exerciseDuration = avgReps; // Pour les planches en secondes
              }
            } else {
              // Exercices dynamiques
              exerciseDuration = sets * avgReps * timePerRep; // en secondes
              
              // Ajouter le temps de repos entre séries
              const restTime = exercise.rest || 90; // repos par défaut 90s
              exerciseDuration += (sets - 1) * restTime;
            }
            
            totalDurationMinutes += exerciseDuration / 60; // convertir en minutes
          } else if (exercise.series.includes('sec')) {
            // Exercices en secondes (circuits, etc.)
            const timeMatch = exercise.series.match(/(\d+)\s*sec/);
            if (timeMatch) {
              totalDurationMinutes += parseInt(timeMatch[1]) / 60;
            }
          } else if (exercise.series.includes('min')) {
            // Exercices en minutes
            const timeMatch = exercise.series.match(/(\d+)\s*min/);
            if (timeMatch) {
              totalDurationMinutes += parseInt(timeMatch[1]);
            }
          }
        }
      });
      
      return Math.round(totalDurationMinutes);
    };

    const realDuration = calculateRealDuration();
    
    // Vérifier si une activité complémentaire est cochée
    const isComplementaryChecked = workout?.complementaryActivity && 
      allData?.checkedExercises?.[`${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`];
    
        // Les sessions d'endurance détaillées n'impactent PAS l'intensité du calendrier
        // Seules les activités complémentaires de l'onglet Aujourd'hui comptent
        const totalActivities = completedExercises + (isComplementaryChecked ? 1 : 0);
        const completionRate = totalPlannedExercises > 0 ? completedExercises / totalPlannedExercises : 0;
        
        // Debug pour le 28 octobre 2025
        if (dateStr === '2025-10-28') {
          console.log('🔍 DEBUG Calcul intensité:');
          console.log('Completed exercises:', completedExercises);
          console.log('Endurance sessions:', enduranceData.sessions);
          console.log('Is complementary checked:', isComplementaryChecked);
          console.log('Total activities:', totalActivities);
          console.log('Real duration:', realDuration);
          console.log('Total reps:', totalReps);
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
            const { thresholds } = calculateDynamicThresholds();
            intensityLevel = calculateDynamicIntensityLevel(totalReps, thresholds);
            
            // Debug pour le 28 octobre 2025
            if (dateStr === '2025-10-28') {
              console.log('🔍 DEBUG Logique REPS DYNAMIQUE:');
              console.log('Total reps:', totalReps);
              console.log('Thresholds:', thresholds);
              console.log('Final intensity level:', intensityLevel);
            }
          } else {
            // BASÉ SUR LE TEMPS : Utiliser des seuils dynamiques pour la durée
            // Seulement les activités complémentaires de l'onglet Aujourd'hui
            const { thresholds: timeThresholds } = calculateDynamicTimeThresholds();
            intensityLevel = calculateDynamicTimeIntensityLevel(realDuration, timeThresholds);
            
            // Debug pour le 28 octobre 2025
            if (dateStr === '2025-10-28') {
              console.log('🔍 DEBUG Logique TEMPS DYNAMIQUE:');
              console.log('Real duration:', realDuration);
              console.log('Time thresholds:', timeThresholds);
              console.log('Final intensity level:', intensityLevel);
            }
          }
        }
    
    // L'intensité ne dépend que des activités complémentaires de l'onglet Aujourd'hui
    const intensityScore = completionRate * 100 + (totalReps * 0.1) + (isComplementaryChecked ? 50 : 0);
    
    return {
      level: intensityLevel,
      reps: totalReps,
      duration: realDuration,
      exerciseCount: totalPlannedExercises,
      completedCount: completedExercises,
      intensityScore,
      completionRate: Math.round(completionRate * 100),
      enduranceData: enduranceData,
      // Garder la compatibilité avec l'ancien format
      exercises: completedExercises,
      session: completedExercises > 0 ? { 
        exercises: exercisesList.filter(ex => allData.checkedExercises[`${dateStr}_${ex.id}`]).map(ex => ({
          name: ex.name,
          reps: parseInt(allData.reps[`${dateStr}_${ex.id}`]) || 0
        }))
      } : null
    };
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
    const { thresholds } = calculateDynamicThresholds();
    
    // Générer 6 semaines (42 jours) pour couvrir tout le mois
    for (let i = 0; i < 42; i++) {
      const intensity = getIntensityForDate(currentDay);
      // Ne pas écraser l'intensité calculée par getIntensityForDate
      // qui prend déjà en compte les activités complémentaires et la durée
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.toDateString() === new Date().toDateString(),
        intensity
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
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

  const getIntensityLabel = (level) => {
    const labels = {
      4: 'Extrême',
      3: 'Intense',
      2: 'Modéré', 
      1: 'Léger',
      0: 'Repos'
    };
    return labels[level];
  };

  // Données calculées
  const monthDays = useMemo(() => generateMonthDays(currentDate), [currentDate, allData]);
  const { months: yearMonths, yearStats } = useMemo(() => generateYearData(currentDate), [currentDate, allData]);
  const streaks = useMemo(() => calculateStreaks(), [workoutHistory]);

  // Constantes pour l'affichage
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
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
                {mode === 'month' ? 'Mois' : mode === 'year' ? 'Année' : 'Streaks'}
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
              : 'Analyse des Streaks'
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
            <span className="text-slate-300 text-sm">Intensité:</span>
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
            {showStats ? 'Masquer stats' : 'Afficher stats'}
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
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square rounded-lg border-2 cursor-pointer transition-all duration-200 relative
                  ${getIntensityColor(day.intensity.level, day.isToday)}
                  ${day.isCurrentMonth ? 'border-transparent' : 'border-slate-600 opacity-30'}
                  ${selectedDate?.date.toDateString() === day.date.toDateString() 
                    ? 'ring-2 ring-purple-400' : ''
                  }
                  hover:ring-2 hover:ring-purple-300 hover:scale-105
                `}
                title={`${day.date.toLocaleDateString('fr-FR')} - ${getIntensityLabel(day.intensity.level)} (${day.intensity.duration}min)`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center">
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
                </div>
                {day.isToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vue annuelle complète */}
      {viewMode === 'year' && (
        <div className="space-y-6">
          {/* Résumé annuel */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-400" />
              Résumé {currentDate.getFullYear()}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Meilleur mois</div>
                <div className="text-xl font-bold text-white">
                  {yearStats.bestMonth ? monthNames[yearStats.bestMonth.date.getMonth()] : 'N/A'}
                </div>
                <div className="text-sm text-slate-300">
                  {yearStats.bestMonth?.totalReps || 0} reps
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Meilleur jour</div>
                <div className="text-xl font-bold text-white">
                  {yearStats.bestDay ? yearStats.bestDay.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : 'N/A'}
                </div>
                <div className="text-sm text-slate-300">
                  {yearStats.bestDay?.intensity.reps || 0} reps
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Moyenne/séance</div>
                <div className="text-xl font-bold text-white">{yearStats.avgIntensity}</div>
                <div className="text-sm text-slate-300">reps par séance</div>
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
                      {month.sessionsCount} séances
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
                            ${getIntensityColor(day.intensity.level)}
                            ${day.isCurrentMonth ? '' : 'opacity-20'}
                            hover:ring-1 hover:ring-purple-300 hover:scale-110
                          `}
                          onClick={() => {
                            setCurrentDate(new Date(day.date));
                            setViewMode('month');
                          }}
                          title={`${day.date.toLocaleDateString('fr-FR')} - ${getIntensityLabel(day.intensity.level)} (${day.intensity.reps} reps)`}
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
                      <div className="text-slate-400">reps + endurance</div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2 text-center">
                      <div className="text-white font-bold">{month.totalDuration}min</div>
                      <div className="text-slate-400">temps total</div>
                    </div>
                  </div>
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
              <div className="text-slate-300">Streak actuel</div>
              <div className="text-sm text-slate-400 mt-2">
                {streaks.currentStreak > 0 ? 'Jours consécutifs' : 'Aucun streak en cours'}
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-6 text-center">
              <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">{streaks.longestStreak}</div>
              <div className="text-slate-300">Record personnel</div>
              <div className="text-sm text-slate-400 mt-2">Plus long streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Détails de la date sélectionnée */}
      {selectedDate && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              {selectedDate.date.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{selectedDate.intensity.reps}</div>
              <div className="text-slate-400 text-sm">Répétitions totales</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{selectedDate.intensity.completedCount}</div>
              <div className="text-slate-400 text-sm">Exercices classiques</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{selectedDate.intensity.duration}min</div>
              <div className="text-slate-400 text-sm">Durée totale</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{getIntensityLabel(selectedDate.intensity.level)}</div>
              <div className="text-slate-400 text-sm">Intensité globale</div>
            </div>
          </div>
          
          {/* Données d'endurance détaillées */}
          {selectedDate.intensity.enduranceData && selectedDate.intensity.enduranceData.sessions > 0 && (
            <div className="mt-6">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Activity className="mr-2" size={16} />
                Activités d'endurance
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-orange-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-200">{selectedDate.intensity.enduranceData.sessions}</div>
                  <div className="text-orange-300 text-sm">Sessions</div>
                </div>
                <div className="bg-blue-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-200">{selectedDate.intensity.enduranceData.distance}m</div>
                  <div className="text-blue-300 text-sm">Distance</div>
                </div>
                <div className="bg-green-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-200">{selectedDate.intensity.enduranceData.jumps}</div>
                  <div className="text-green-300 text-sm">Sauts</div>
                </div>
                <div className="bg-purple-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-200">{selectedDate.intensity.enduranceData.duration}min</div>
                  <div className="text-purple-300 text-sm">Durée endurance</div>
                </div>
              </div>
            </div>
          )}
          
          {selectedDate.intensity.session && (
            <div className="mt-4">
              <h4 className="text-white font-medium mb-2">Exercices réalisés:</h4>
              <div className="space-y-2">
                {selectedDate.intensity.session.exercises.map((exercise, index) => (
                  <div key={index} className="bg-slate-700/30 rounded p-2 flex justify-between">
                    <span className="text-slate-300">{exercise.name}</span>
                    <span className="text-white font-medium">{exercise.reps} reps</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarHeatmap;