import React, { useState, useRef, useCallback, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Input from './ui/Input';
import { History, ChevronDown, ChevronUp, Calendar, Save, Check, ChevronRight, Search, Activity } from 'lucide-react';
import { workoutProgram } from '../data/workoutProgram';
import { useWorkout } from '../context/WorkoutContext';
import { typography } from '../styles/typography';
import { calculateAutoReps } from '../utils/exerciseCalculations';
import { normalizeStretchSlots } from '../utils/stretchUtils';
import './WorkoutHistorySection.css';

/**
 * Section pour la saisie quotidienne des exercices organisée par jour de la semaine
 */
const WorkoutHistorySection = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [collapsedDays, setCollapsedDays] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const { data, updateReps, getDateStr, getDayName, getCurrentData, updateTempExerciseData, saveExerciseChanges, updateTempStretchData, saveStretchChanges, getTodayWorkout } = useWorkout();

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

  // Fonction pour obtenir tous les étirements d'un jour.
  // Compatible avec les 3 formats : tableau (nouveau), string legacy, objet enrichi.
  const getAllStretchesForDay = (dayWorkout) => {
    if (!dayWorkout || !dayWorkout.etirements) return [];

    const slots = normalizeStretchSlots(dayWorkout.etirements);
    const moments = ['matin', 'midi', 'soir'];
    const out = [];
    for (const moment of moments) {
      const items = slots[moment] || [];
      items.forEach((item) => {
        out.push({
          id: `stretch_${moment}_${item.id}`,
          name: item.name,
          type: 'stretch',
          stretchType: moment,
          stretchItemId: item.id,
          description: item.instructions || item.legacyText || ''
        });
      });
    }
    return out;
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

  // ✅ Gestionnaire pour l'auto-remplissage au focus/clic
  const handleInputFocus = (exerciseId, dateStr, exercise) => {
    try {
      // Validation de base
      if (!exerciseId || !dateStr) {
        console.warn('Paramètres invalides pour handleInputFocus');
        return;
      }

      const currentData = getCurrentData();
      if (!currentData) {
        console.error('Données actuelles non disponibles');
        return;
      }

      const key = `${dateStr}_${exerciseId}`;
      const currentValue = currentData.reps[key] || '';
      
      // ✅ Si le champ est vide, calculer et remplir automatiquement
      if (!currentValue && exercise && exercise.series) {
        const autoReps = calculateAutoReps(exercise.series);
        if (autoReps) {
          // Mettre à jour les données avec le calcul automatique
          const newData = {
            ...currentData,
            reps: {
              ...currentData.reps,
              [key]: autoReps.toString()
            }
          };
          
          updateTempExerciseData(newData);
          // Utiliser le système de debounce unifié
          debouncedSave();
        }
      }
    } catch (error) {
      console.error('Erreur dans handleInputFocus:', error);
    }
  };

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

  // Fonctions de gestion des étirements
  const handleStretchToggle = (stretchType, dateStr) => {
    try {
      const currentData = getCurrentData();
      if (!currentData) {
        console.error('Données actuelles non disponibles');
        return;
      }

      const key = `${dateStr}_${stretchType}`;
      const newData = {
        ...currentData,
        checkedStretches: {
          ...currentData.checkedStretches,
          [key]: !currentData.checkedStretches[key]
        }
      };
      
      updateTempStretchData(newData);
      // Utiliser le système de debounce unifié
      debouncedSave();
    } catch (error) {
      console.error('Erreur dans handleStretchToggle:', error);
    }
  };

  // Vérifier si un étirement est marqué comme terminé
  const isStretchCompleted = (stretchType, dateStr) => {
    const currentData = getCurrentData();
    const key = `${dateStr}_${stretchType}`;
    return currentData.checkedStretches[key] || false;
  };

  // Obtenir les moments d'étirements ayant au moins 1 item planifié pour ce jour.
  // Robuste à n'importe quel format (tableau / string / objet enrichi).
  const getStretchTypes = (dayWorkout) => {
    if (!dayWorkout || !dayWorkout.etirements) return [];
    const slots = normalizeStretchSlots(dayWorkout.etirements);
    return ['matin', 'midi', 'soir'].filter((m) => (slots[m]?.length || 0) > 0);
  };

  // Obtenir la couleur de bordure selon le type d'exercice
  const getExerciseBorderColor = (exercise) => {
    switch (exercise.type) {
      case 'semaineA':
        return 'border-l-[#0F5C45]';
      case 'semaineB':
        return 'border-l-sky-500';
      case 'stretch':
        return 'border-l-emerald-500';
      default:
        return 'border-l-[#0F4C5C]';
    }
  };

  const getExerciseBadgeColor = (exercise) => {
    switch (exercise.type) {
      case 'semaineA':
        return 'border border-[#0F5C45]/60 bg-[#0F5C45]/25 text-teal-50';
      case 'semaineB':
        return 'border border-sky-500/50 bg-sky-950/40 text-sky-100';
      case 'stretch':
        return 'border border-emerald-500/50 bg-emerald-950/30 text-emerald-100';
      default:
        return 'border border-[#0F4C5C]/60 bg-black text-teal-100';
    }
  };

  // Calculer les statistiques globales
  const calculateStats = () => {
    let totalExercises = 0;
    let totalStretches = 0;
    let totalDaysWithWorkouts = 0;

    daysOrder.forEach(day => {
      const dayKey = dayMapping[day];
      // ✅ Utiliser getTodayWorkout pour obtenir le workout du jour (inclut le programme actif)
      // Utiliser une date représentative (le prochain jour de ce type)
      const today = new Date();
      const dayIndex = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'].indexOf(dayKey);
      const nextDayDate = new Date(today);
      const daysUntilNext = (dayIndex - today.getDay() + 7) % 7 || 7;
      nextDayDate.setDate(today.getDate() + daysUntilNext);
      
      const dayWorkoutRaw = getTodayWorkout ? getTodayWorkout(nextDayDate, false) : (workoutProgram[dayKey] || null);
      const dayWorkout = dayWorkoutRaw ? {
        ...dayWorkoutRaw,
        exercices: dayWorkoutRaw.exercices || dayWorkoutRaw.exercises || [],
        salleVariants: dayWorkoutRaw.salleVariants
      } : null;
      
      if (dayWorkout) {
        totalDaysWithWorkouts++;
        totalExercises += getAllExercisesForDay(dayWorkout).length;
        totalStretches += getAllStretchesForDay(dayWorkout).length;
      }
    });

    return { totalExercises, totalStretches, totalDaysWithWorkouts };
  };

  // Fonction pour filtrer les exercices selon le terme de recherche
  const filterExercises = (exercises) => {
    if (!searchTerm.trim()) return exercises;
    
    const searchLower = searchTerm.toLowerCase();
    return exercises.filter(exercise => 
      exercise.name.toLowerCase().includes(searchLower) ||
      (exercise.materiel && exercise.materiel.toLowerCase().includes(searchLower)) ||
      (exercise.notes && exercise.notes.toLowerCase().includes(searchLower)) ||
      (exercise.description && exercise.description.toLowerCase().includes(searchLower))
    );
  };

  const stats = calculateStats();

  return (
    <div className="workout-history-section">
      {/* En-tête de la section */}
      <Card variant="sport" className="history-header">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="text-teal-400" size={24} />
              <div>
                <CardTitle className={`${typography.presets.h2} text-white`}>
                  Saisies passées par jour
                </CardTitle>
                <p className={`${typography.presets.bodySmall} mt-1 text-teal-700`}>
                  Tableau de saisie organisé par jour de la semaine avec historique
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1 border-[#0F4C5C]/60 text-teal-200">
                <Calendar size={12} />
                {stats.totalDaysWithWorkouts} jours • {stats.totalExercises} exercices • {stats.totalStretches} étirements
              </Badge>
              {isExpanded ? <ChevronUp size={20} className="text-teal-600" /> : <ChevronDown size={20} className="text-teal-600" />}
            </div>
          </div>
        </CardHeader>
        
        {/* Champ de recherche */}
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-teal-600" size={20} />
              <Input
                type="text"
                placeholder="Rechercher un exercice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-[#0F4C5C]/50 bg-black pl-10 text-white placeholder:text-teal-800 focus:border-[#0F5C45]/55 focus:ring-1 focus:ring-[#0F5C45]/40"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contenu des jours */}
      {isExpanded && (
        <div className="space-y-4 mt-4">
          {daysOrder.map((day) => {
            const dayKey = dayMapping[day];
            // ✅ Utiliser getTodayWorkout pour obtenir le workout du jour (inclut le programme actif)
            // Utiliser une date représentative (le prochain jour de ce type)
            const today = new Date();
            const dayIndex = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'].indexOf(dayKey);
            const nextDayDate = new Date(today);
            const daysUntilNext = (dayIndex - today.getDay() + 7) % 7 || 7;
            nextDayDate.setDate(today.getDate() + daysUntilNext);
            
            const dayWorkoutRaw = getTodayWorkout ? getTodayWorkout(nextDayDate, false) : (workoutProgram[dayKey] || null);
            const dayWorkout = dayWorkoutRaw ? {
              ...dayWorkoutRaw,
              exercices: dayWorkoutRaw.exercices || dayWorkoutRaw.exercises || [],
              salleVariants: dayWorkoutRaw.salleVariants
            } : null;
            const isCollapsed = collapsedDays[day];
            const allExercises = getAllExercisesForDay(dayWorkout);
            const allStretches = getAllStretchesForDay(dayWorkout);
            const allItems = [...allExercises, ...allStretches];
            const filteredItems = filterExercises(allItems);
            const pastDates = generatePastDatesForDay(day);

            // Ne pas afficher le jour s'il n'y a pas d'éléments correspondant à la recherche
            if (dayWorkout && filteredItems.length === 0 && searchTerm.trim()) {
              return null;
            }

            if (!dayWorkout) {
              return (
                <Card key={day} variant="sport" className="opacity-90">
                  <CardHeader className="cursor-pointer" onClick={() => toggleDayCollapse(day)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-teal-900" />
                        <CardTitle className={`${typography.presets.h3} text-teal-700`}>
                          {day}
                        </CardTitle>
                        <Badge variant="outline" className="border-[#0F4C5C]/45 text-teal-700">
                          Repos
                        </Badge>
                      </div>
                      {isCollapsed ? <ChevronRight size={16} className="text-teal-600" /> : <ChevronDown size={16} className="text-teal-600" />}
                    </div>
                  </CardHeader>
                </Card>
              );
            }

            return (
              <Card key={day} variant="sport">
                <CardHeader className="cursor-pointer" onClick={() => toggleDayCollapse(day)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-[#0F5C45]" />
                      <CardTitle className={`${typography.presets.h3} text-white`}>
                        {day}
                      </CardTitle>
                      <Badge className="bg-[#0F5C45]/40 text-teal-50 ring-1 ring-[#0F4C5C]/50">
                        {dayWorkout.name}
                      </Badge>
                      <Badge variant="outline" className="border-[#0F4C5C]/50 text-teal-200/90">
                        {searchTerm.trim() ? `${filteredItems.length}/${allItems.length}` : allItems.length} éléments
                      </Badge>
                    </div>
                    {isCollapsed ? <ChevronRight size={16} className="text-teal-600" /> : <ChevronDown size={16} className="text-teal-600" />}
                  </div>
                </CardHeader>

                {!isCollapsed && (
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        {/* En-tête du tableau pour ce jour */}
                        <thead>
                          <tr className="border-b border-[#0F4C5C]/45">
                            <th className="sticky left-0 min-w-[300px] bg-black p-4 text-left font-medium text-teal-50">
                              Exercice
                            </th>
                            <th className="min-w-[80px] p-2 text-center font-medium text-teal-50">
                              Séries
                            </th>
                            {pastDates.map((dateInfo) => (
                              <th key={dateInfo.dateStr} className="min-w-[80px] p-2 text-center font-medium text-teal-50">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs uppercase text-teal-700">
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
                          {filteredItems.map((item) => (
                            <tr
                              key={item.id}
                              className={`border-b border-[#0F4C5C]/25 hover:bg-[#0F4C5C]/10 ${getExerciseBorderColor(item)} border-l-2`}
                            >
                              <td className="sticky left-0 bg-black p-4">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">
                                      {item.name}
                                    </span>
                                    <Badge className={`text-xs ${getExerciseBadgeColor(item)}`}>
                                      {item.type === 'semaineA' ? 'Sem A' : 
                                       item.type === 'semaineB' ? 'Sem B' : 
                                       item.type === 'stretch' ? 'Étirement' : 'Principal'}
                                    </Badge>
                                  </div>
                                  {item.materiel && (
                                    <span className="text-xs text-teal-700">
                                      {item.materiel}
                                    </span>
                                  )}
                                  {item.notes && (
                                    <span className="text-xs text-teal-600/90">
                                      {item.notes}
                                    </span>
                                  )}
                                  {item.description && (
                                    <span className="max-w-xs truncate text-xs text-teal-700">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Colonne séries/période */}
                              <td className="p-2 text-center">
                                <Badge
                                  variant="outline"
                                  className="border-[#0F4C5C]/55 bg-black text-xs text-teal-100"
                                >
                                  {item.series || item.stretchType || '—'}
                                </Badge>
                              </td>

                              {/* Colonnes de dates passées pour ce jour */}
                              {pastDates.map((dateInfo) => {
                                if (item.type === 'stretch') {
                                  // Gestion des étirements
                                  const isCompleted = isStretchCompleted(item.stretchType, dateInfo.isoDateStr);
                                  
                                  return (
                                    <td key={`${item.id}_${dateInfo.isoDateStr}`} className="p-3">
                                      <div className="flex flex-col items-center gap-2">
                                        {/* Case à cocher pour étirement */}
                                        <button
                                          onClick={() => handleStretchToggle(item.stretchType, dateInfo.isoDateStr)}
                                          className={`flex h-8 w-8 items-center justify-center rounded border-2 transition-colors ${
                                            isCompleted
                                              ? 'border-emerald-500 bg-emerald-600'
                                              : 'border-[#0F4C5C]/60 bg-black hover:border-[#0F5C45]/70'
                                          }`}
                                        >
                                          {isCompleted && (
                                            <Check size={16} className="text-white" />
                                          )}
                                        </button>
                                        {isCompleted && (
                                          <div className="text-green-400 text-xs">✓</div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                } else {
                                  // Gestion des exercices (code existant)
                                  const repsValue = getRepsValue(item.id, dateInfo.isoDateStr);
                                  const isCompleted = isExerciseCompleted(item.id, dateInfo.isoDateStr);
                                  
                                  return (
                                    <td key={`${item.id}_${dateInfo.isoDateStr}`} className="p-3">
                                      <div className="flex flex-col items-center gap-2">
                                        {/* ✅ Champ de saisie avec auto-remplissage au focus */}
                                        <Input
                                          type="number"
                                          value={repsValue}
                                          onChange={(e) => handleRepsChange(item.id, dateInfo.isoDateStr, e.target.value)}
                                          onFocus={() => handleInputFocus(item.id, dateInfo.isoDateStr, item)}
                                          placeholder="0"
                                          className="h-10 w-16 border border-[#0F4C5C]/55 bg-black text-center text-sm font-medium text-white placeholder:text-teal-800 focus:border-[#0F5C45]/70 focus:ring-1 focus:ring-[#0F5C45]/40"
                                          min="0"
                                        />
                                        
                                        {/* Case à cocher */}
                                        <button
                                          onClick={() => handleCompletedToggle(item.id, dateInfo.isoDateStr)}
                                          className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-colors ${
                                            isCompleted
                                              ? 'border-emerald-500 bg-emerald-600'
                                              : 'border-[#0F4C5C]/60 bg-black hover:border-[#0F5C45]/70'
                                          }`}
                                        >
                                          {isCompleted && (
                                            <Check size={14} className="text-white" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                  );
                                }
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
              className="border-[#0F4C5C]/55 text-teal-100 hover:border-[#0F5C45]/60 hover:bg-[#0F4C5C]/10"
              onClick={saveExerciseChanges}
            >
              <Save size={16} className="mr-2" />
              Sauvegarder les exercices
            </Button>
            <Button 
              variant="outline" 
              className="border-green-600 text-green-300 hover:bg-green-700"
              onClick={saveStretchChanges}
            >
              <Activity size={16} className="mr-2" />
              Sauvegarder les étirements
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutHistorySection;