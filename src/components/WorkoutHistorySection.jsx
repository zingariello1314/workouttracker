import React, { useState, useRef, useCallback, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Input from './ui/Input';
import { History, ChevronDown, ChevronUp, Calendar, Save, Check, ChevronRight } from 'lucide-react';
import { workoutProgram } from '../data/workoutProgram';
import { useWorkout } from '../context/WorkoutContext';
import { typography } from '../styles/typography';
import './WorkoutHistorySection.css';

/**
 * Section pour la saisie quotidienne des exercices organisée par jour de la semaine
 */
const WorkoutHistorySection = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [collapsedDays, setCollapsedDays] = useState({});
  const { data, updateReps, getDateStr, getDayName, getCurrentData, updateTempExerciseData, saveExerciseChanges } = useWorkout();

  // Ordre chronologique des jours
  const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  // Mapping des jours français vers les clés du workoutProgram
  const dayMapping = {
    'Lundi': 'lundi',
    'Mardi': 'mardi', 
    'Mercredi': 'mercredi',
    'Jeudi': 'jeudi',
    'Vendredi': 'vendredi',
    'Samedi': 'samedi',
    'Dimanche': 'dimanche'
  };

  // Fonction pour basculer l'état plié/déplié d'un jour
  const toggleDayCollapse = (day) => {
    setCollapsedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  // Générer les dates passées pour un jour spécifique de la semaine
  const generatePastDatesForDay = (dayName) => {
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const targetDayIndex = dayNames.indexOf(dayName.toLowerCase());
    
    if (targetDayIndex === -1) {
      return [];
    }

    const dates = [];
    const today = new Date();
    
    // Chercher les 6 dernières occurrences de ce jour (au lieu de 4) pour inclure plus de dates récentes
    for (let i = 0; i < 42; i++) { // Chercher sur 6 semaines
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      if (checkDate.getDay() === targetDayIndex) {
        dates.push({
          date: new Date(checkDate),
          dateStr: checkDate.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          isoDateStr: getDateStr(checkDate), // Utiliser la fonction du contexte pour le format ISO
          fullDateStr: checkDate.toLocaleDateString('fr-FR', { 
            weekday: 'long',
            day: '2-digit', 
            month: '2-digit' 
          })
        });
        
        if (dates.length === 6) break; // Augmenté de 4 à 6 pour plus de flexibilité
      }
    }
    
    return dates.reverse(); // Inverser pour avoir les plus récents en dernier
  };

  // Fonction pour obtenir tous les exercices d'un jour (incluant les variantes)
  const getAllExercisesForDay = (dayWorkout) => {
    if (!dayWorkout) return [];
    
    let allExercises = dayWorkout.exercices.map(ex => ({
      ...ex,
      type: 'principal'
    }));
    
    // Ajouter les variantes de salle si elles existent
    if (dayWorkout.salleVariants) {
      allExercises = [
        ...allExercises,
        ...dayWorkout.salleVariants.semaineA.exercices.map(ex => ({
          ...ex,
          id: `${ex.id}_semaineA`,
          name: `${ex.name} (Semaine A)`,
          type: 'semaineA'
        })),
        ...dayWorkout.salleVariants.semaineB.exercices.map(ex => ({
          ...ex,
          id: `${ex.id}_semaineB`,
          name: `${ex.name} (Semaine B)`,
          type: 'semaineB'
        }))
      ];
    }
    
    return allExercises;
  };

  // Référence pour le debounce de sauvegarde
  const saveTimeoutRef = useRef(null);

  // Fonction de sauvegarde avec debounce optimisé
  const debouncedSave = useCallback(() => {
    // Annuler la sauvegarde précédente si elle existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Programmer une nouvelle sauvegarde après 1.5 secondes d'inactivité
    saveTimeoutRef.current = setTimeout(() => {
      saveExerciseChanges();
    }, 1500);
  }, [saveExerciseChanges]);

  // Nettoyer le timeout lors du démontage
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Gérer la saisie des répétitions
  const handleRepsChange = (exerciseId, dateStr, value) => {
    try {
      // Validation de base
      if (!exerciseId || !dateStr) {
        console.warn('Paramètres invalides pour handleRepsChange');
        return;
      }

      const currentData = getCurrentData();
      if (!currentData) {
        console.error('Données actuelles non disponibles');
        return;
      }

      const key = `${dateStr}_${exerciseId}`;
      const newData = {
        ...currentData,
        reps: {
          ...currentData.reps,
          [key]: value
        }
      };
      
      updateTempExerciseData(newData);
      // Utiliser le système de debounce unifié
      debouncedSave();
    } catch (error) {
      console.error('Erreur dans handleRepsChange:', error);
    }
  };

  // Gérer les cases à cocher
  const handleCompletedToggle = (exerciseId, dateStr) => {
    try {
      // Validation de base
      if (!exerciseId || !dateStr) {
        console.warn('Paramètres invalides pour handleCompletedToggle');
        return;
      }

      const currentData = getCurrentData();
      if (!currentData) {
        console.error('Données actuelles non disponibles');
        return;
      }

      const key = `${dateStr}_${exerciseId}`;
      const newData = {
        ...currentData,
        checkedExercises: {
          ...currentData.checkedExercises,
          [key]: !currentData.checkedExercises[key]
        }
      };
      
      updateTempExerciseData(newData);
      // Utiliser le système de debounce unifié
      debouncedSave();
    } catch (error) {
      console.error('Erreur dans handleCompletedToggle:', error);
    }
  };

  // Obtenir la valeur saisie
  const getRepsValue = (exerciseId, dateStr) => {
    const currentData = getCurrentData();
    const key = `${dateStr}_${exerciseId}`;
    return currentData.reps[key] || '';
  };

  // Vérifier si un exercice est marqué comme terminé
  const isExerciseCompleted = (exerciseId, dateStr) => {
    const currentData = getCurrentData();
    const key = `${dateStr}_${exerciseId}`;
    return currentData.checkedExercises[key] || false;
  };

  // Obtenir la couleur de bordure selon le type d'exercice
  const getExerciseBorderColor = (exercise) => {
    switch (exercise.type) {
      case 'semaineA': return 'border-l-orange-400';
      case 'semaineB': return 'border-l-purple-400';
      default: return 'border-l-blue-400';
    }
  };

  // Obtenir la couleur du badge selon le type d'exercice
  const getExerciseBadgeColor = (exercise) => {
    switch (exercise.type) {
      case 'semaineA': return 'bg-orange-600 text-white';
      case 'semaineB': return 'bg-purple-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  // Calculer les statistiques globales
  const calculateStats = () => {
    let totalExercises = 0;
    let totalDaysWithWorkouts = 0;

    daysOrder.forEach(day => {
      const dayKey = dayMapping[day];
      const dayWorkout = workoutProgram[dayKey];
      if (dayWorkout) {
        totalDaysWithWorkouts++;
        totalExercises += getAllExercisesForDay(dayWorkout).length;
      }
    });

    return { totalExercises, totalDaysWithWorkouts };
  };

  const stats = calculateStats();

  return (
    <div className="workout-history-section">
      {/* En-tête de la section */}
      <Card className="history-header bg-slate-800/50 border-slate-700">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="text-blue-400" size={24} />
              <div>
                <CardTitle className={`${typography.presets.h2} text-white`}>
                  Saisies passées par jour
                </CardTitle>
                <p className={`${typography.presets.bodySmall} text-slate-400 mt-1`}>
                  Tableau de saisie organisé par jour de la semaine avec historique
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-blue-500 text-blue-400 flex items-center gap-1">
                <Calendar size={12} />
                {stats.totalDaysWithWorkouts} jours • {stats.totalExercises} exercices
              </Badge>
              {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contenu des jours */}
      {isExpanded && (
        <div className="space-y-4 mt-4">
          {daysOrder.map((day) => {
            const dayKey = dayMapping[day];
            const dayWorkout = workoutProgram[dayKey];
            const isCollapsed = collapsedDays[day];
            const allExercises = getAllExercisesForDay(dayWorkout);
            const pastDates = generatePastDatesForDay(day);

            if (!dayWorkout) {
              return (
                <Card key={day} className="bg-slate-800/30 border-slate-700">
                  <CardHeader className="cursor-pointer" onClick={() => toggleDayCollapse(day)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                        <CardTitle className={`${typography.presets.h3} text-slate-500`}>
                          {day}
                        </CardTitle>
                        <Badge variant="outline" className="border-slate-600 text-slate-500">
                          Repos
                        </Badge>
                      </div>
                      {isCollapsed ? <ChevronRight size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                    </div>
                  </CardHeader>
                </Card>
              );
            }

            return (
              <Card key={day} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="cursor-pointer" onClick={() => toggleDayCollapse(day)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <CardTitle className={`${typography.presets.h3} text-white`}>
                        {day}
                      </CardTitle>
                      <Badge className="bg-blue-600 text-white">
                        {dayWorkout.name}
                      </Badge>
                      <Badge variant="outline" className="border-slate-500 text-slate-400">
                        {allExercises.length} exercices
                      </Badge>
                    </div>
                    {isCollapsed ? <ChevronRight size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </CardHeader>

                {!isCollapsed && (
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        {/* En-tête du tableau pour ce jour */}
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-4 text-white font-medium min-w-[300px] sticky left-0 bg-slate-800/50">
                              Exercice
                            </th>
                            <th className="text-center p-2 text-white font-medium min-w-[80px]">
                              Séries
                            </th>
                            {pastDates.map((dateInfo) => (
                              <th key={dateInfo.dateStr} className="text-center p-2 text-white font-medium min-w-[80px]">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-slate-400 uppercase">
                                    {day.substring(0, 3)}
                                  </span>
                                  <span className="text-sm">
                                    {dateInfo.dateStr}
                                  </span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        {/* Corps du tableau pour ce jour */}
                        <tbody>
                          {allExercises.map((exercise) => (
                            <tr key={exercise.id} className={`border-b border-slate-700/50 hover:bg-slate-700/20 ${getExerciseBorderColor(exercise)} border-l-2`}>
                              {/* Colonne exercice */}
                              <td className="p-4 sticky left-0 bg-slate-800/50">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium text-sm">
                                      {exercise.name}
                                    </span>
                                    <Badge className={`text-xs ${getExerciseBadgeColor(exercise)}`}>
                                      {exercise.type === 'semaineA' ? 'Sem A' : 
                                       exercise.type === 'semaineB' ? 'Sem B' : 'Principal'}
                                    </Badge>
                                  </div>
                                  {exercise.materiel && (
                                    <span className="text-xs text-slate-500">
                                      {exercise.materiel}
                                    </span>
                                  )}
                                  {exercise.notes && (
                                    <span className="text-xs text-slate-400">
                                      {exercise.notes}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Colonne séries */}
                              <td className="p-2 text-center">
                                <Badge variant="outline" className="border-slate-500 text-slate-300 text-xs">
                                  {exercise.series || '—'}
                                </Badge>
                              </td>

                              {/* Colonnes de dates passées pour ce jour */}
                              {pastDates.map((dateInfo) => {
                                const repsValue = getRepsValue(exercise.id, dateInfo.isoDateStr);
                                const isCompleted = isExerciseCompleted(exercise.id, dateInfo.isoDateStr);
                                
                                return (
                                  <td key={`${exercise.id}_${dateInfo.isoDateStr}`} className="p-3">
                                    <div className="flex flex-col items-center gap-2">
                                      {/* Champ de saisie */}
                                      <Input
                                        type="number"
                                        value={repsValue}
                                        onChange={(e) => handleRepsChange(exercise.id, dateInfo.isoDateStr, e.target.value)}
                                        placeholder="0"
                                        className="w-16 h-10 text-center text-sm bg-slate-700 border-slate-600 text-white font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                        min="0"
                                      />
                                      
                                      {/* Case à cocher */}
                                      <button
                                        onClick={() => handleCompletedToggle(exercise.id, dateInfo.isoDateStr)}
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                          isCompleted 
                                            ? 'bg-green-500 border-green-500' 
                                            : 'border-slate-500 hover:border-green-400'
                                        }`}
                                      >
                                        {isCompleted && (
                                          <Check size={14} className="text-white" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Boutons d'action */}
          <div className="mt-4 flex justify-end gap-2">
            <Button 
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={saveExerciseChanges}
            >
              <Save size={16} className="mr-2" />
              Sauvegarder toutes les saisies
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutHistorySection;