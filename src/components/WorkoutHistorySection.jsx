import React, { useState, useRef, useCallback, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Input from './ui/Input';
import { History, ChevronDown, ChevronUp, Calendar, Save, Check, ChevronRight, Search, Activity } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const { data, updateReps, getDateStr, getDayName, getCurrentData, updateTempExerciseData, saveExerciseChanges, updateTempStretchData, saveStretchChanges } = useWorkout();

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

  // Fonction pour obtenir tous les étirements d'un jour
  const getAllStretchesForDay = (dayWorkout) => {
    if (!dayWorkout || !dayWorkout.etirements) return [];
    
    const stretchTypes = getStretchTypes(dayWorkout);
    return stretchTypes.map(stretchType => ({
      id: `stretch_${stretchType}`,
      name: `Étirements ${stretchType.charAt(0).toUpperCase() + stretchType.slice(1)}`,
      type: 'stretch',
      stretchType: stretchType,
      description: dayWorkout.etirements[stretchType]
    }));
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

  // Obtenir les types d'étirements pour un jour
  const getStretchTypes = (dayWorkout) => {
    if (!dayWorkout || !dayWorkout.etirements) return [];
    return Object.keys(dayWorkout.etirements).filter(key => 
      dayWorkout.etirements[key] && dayWorkout.etirements[key].trim() !== ''
    );
  };

  // Obtenir la couleur de bordure selon le type d'exercice
  const getExerciseBorderColor = (exercise) => {
    switch (exercise.type) {
      case 'semaineA': return 'border-l-orange-400';
      case 'semaineB': return 'border-l-purple-400';
      case 'stretch': return 'border-l-green-400';
      default: return 'border-l-blue-400';
    }
  };

  // Obtenir la couleur du badge selon le type d'exercice
  const getExerciseBadgeColor = (exercise) => {
    switch (exercise.type) {
      case 'semaineA': return 'bg-orange-600 text-white';
      case 'semaineB': return 'bg-purple-600 text-white';
      case 'stretch': return 'bg-green-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  // Calculer les statistiques globales
  const calculateStats = () => {
    let totalExercises = 0;
    let totalStretches = 0;
    let totalDaysWithWorkouts = 0;

    daysOrder.forEach(day => {
      const dayKey = dayMapping[day];
      const dayWorkout = workoutProgram[dayKey];
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
                {stats.totalDaysWithWorkouts} jours • {stats.totalExercises} exercices • {stats.totalStretches} étirements
              </Badge>
              {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </div>
          </div>
        </CardHeader>
        
        {/* Champ de recherche */}
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="text"
                placeholder="Rechercher un exercice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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
            const dayWorkout = workoutProgram[dayKey];
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
                        {searchTerm.trim() ? `${filteredItems.length}/${allItems.length}` : allItems.length} éléments
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
                          {filteredItems.map((item) => (
                            <tr key={item.id} className={`border-b border-slate-700/50 hover:bg-slate-700/20 ${getExerciseBorderColor(item)} border-l-2`}>
                              {/* Colonne exercice/étirement */}
                              <td className="p-4 sticky left-0 bg-slate-800/50">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium text-sm">
                                      {item.name}
                                    </span>
                                    <Badge className={`text-xs ${getExerciseBadgeColor(item)}`}>
                                      {item.type === 'semaineA' ? 'Sem A' : 
                                       item.type === 'semaineB' ? 'Sem B' : 
                                       item.type === 'stretch' ? 'Étirement' : 'Principal'}
                                    </Badge>
                                  </div>
                                  {item.materiel && (
                                    <span className="text-xs text-slate-500">
                                      {item.materiel}
                                    </span>
                                  )}
                                  {item.notes && (
                                    <span className="text-xs text-slate-400">
                                      {item.notes}
                                    </span>
                                  )}
                                  {item.description && (
                                    <span className="text-xs text-slate-400 max-w-xs truncate">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Colonne séries/période */}
                              <td className="p-2 text-center">
                                <Badge variant="outline" className="border-slate-500 text-slate-300 text-xs">
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
                                          className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-colors ${
                                            isCompleted 
                                              ? 'bg-green-500 border-green-500' 
                                              : 'border-slate-500 hover:border-green-400'
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
                                        {/* Champ de saisie */}
                                        <Input
                                          type="number"
                                          value={repsValue}
                                          onChange={(e) => handleRepsChange(item.id, dateInfo.isoDateStr, e.target.value)}
                                          placeholder="0"
                                          className="w-16 h-10 text-center text-sm bg-slate-700 border-slate-600 text-white font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                          min="0"
                                        />
                                        
                                        {/* Case à cocher */}
                                        <button
                                          onClick={() => handleCompletedToggle(item.id, dateInfo.isoDateStr)}
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
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
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