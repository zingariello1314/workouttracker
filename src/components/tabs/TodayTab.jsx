import React from 'react';
import { Play, Square, CheckCircle, Clock, Target, Flame, Zap, MessageSquare, Save, X } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { workoutProgram } from '../../data/workoutProgram';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Checkbox } from '../ui/Input';
import { typography } from '../../styles/typography';

const TodayTab = () => {
  const {
    currentDate,
    data,
    updateData,
    getTodayWorkout,
    getDateStr,
    getDayName,
    setSelectedExercise,
    setShowExerciseVariations,
    setSessionData,
    setShowSessionFeedback,
    isGymMode,
    setIsGymMode,
    hasUnsavedExercises,
    hasUnsavedStretches,
    saveExerciseChanges,
    discardExerciseChanges,
    saveStretchChanges,
    discardStretchChanges,
    updateTempExerciseData,
    updateTempStretchData,
    getCurrentData,
    updateReps,
    toggleCheck
  } = useWorkout();

  // Script temporaire pour inspecter IndexedDB
  const inspectIndexedDB = async () => {
    try {
      const request = indexedDB.open('WorkoutTrackerDB', 3);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['workoutData'], 'readonly');
        const store = transaction.objectStore('workoutData');
        const getRequest = store.get('main');
        
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          if (result) {
            // Afficher quelques exemples de clés
            const repsKeys = Object.keys(result.reps || {});
            const exerciseKeys = Object.keys(result.checkedExercises || {});
            
            // Vérifier les dates récentes
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const todayStr = getDateStr(today);
            const yesterdayStr = getDateStr(yesterday);
          }
        };
      };
    } catch (error) {
      // Erreur lors de l'inspection de la base de données
    }
  };

  // Exécuter l'inspection au chargement du composant (DÉSACTIVÉ)
  // React.useEffect(() => {
  //   inspectIndexedDB();
  // }, []);

  // Fonction pour calculer automatiquement les répétitions basées sur les séries
  const calculateAutoReps = (seriesText) => {
    if (!seriesText || !seriesText.includes('×')) {
      return null;
    }
    
    const match = seriesText.match(/(\d+)×(\d+)(?:-(\d+))?/);
    if (match) {
      const sets = parseInt(match[1]);
      const minReps = parseInt(match[2]);
      const maxReps = match[3] ? parseInt(match[3]) : minReps;
      
      // Calculer le juste milieu des répétitions
      const avgReps = (minReps + maxReps) / 2;
      
      // Retourner le total exact (sets × moyenne)
      return sets * avgReps;
    }
    
    return null;
  };

  // Gestionnaire pour l'auto-remplissage au focus/clic
  const handleInputFocus = (exerciseId, exercise) => {
    const dateStr = getDateStr(currentDate);
    const key = `${dateStr}_${exerciseId}`;
    const currentValue = data.reps[key] || '';
    
    // Si le champ est vide, calculer et remplir automatiquement
    if (!currentValue && exercise.series) {
      const autoReps = calculateAutoReps(exercise.series);
      if (autoReps) {
        updateLocalReps(exerciseId, autoReps.toString(), currentDate);
      }
    }
  };

  // Fonction pour gérer le clic sur une case à cocher avec auto-remplissage
  const handleExerciseCheck = (exerciseId, date) => {
    const currentData = getCurrentData();
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${exerciseId}`;
    const isCurrentlyChecked = currentData.checkedExercises[key] || false;
    
    // Si pas encore coché, calculer les reps automatiques
    if (!isCurrentlyChecked) {
      const workout = getTodayWorkout(date, isGymMode);
      const exercise = workout.exercices?.find(ex => ex.id === exerciseId);
      
      if (exercise && exercise.series) {
        const seriesText = exercise.series;
        let autoReps = null;
        
        if (seriesText.includes('×')) {
          const match = seriesText.match(/(\d+)×(\d+)(?:-(\d+))?/);
          if (match) {
            const sets = parseInt(match[1]);
            const minReps = parseInt(match[2]);
            const maxReps = match[3] ? parseInt(match[3]) : minReps;
            autoReps = sets * Math.round((minReps + maxReps) / 2);
          }
        }
        
        // Mettre à jour les données avec case cochée ET répétitions
        const newData = {
          ...currentData,
          checkedExercises: {
            ...currentData.checkedExercises,
            [key]: true
          },
          reps: {
            ...currentData.reps,
            [key]: autoReps ? autoReps.toString() : ''
          }
        };
        updateTempExerciseData(newData);
        return;
      }
    }
    
    // Sinon, simple toggle de la case
    const newData = {
      ...currentData,
      checkedExercises: {
        ...currentData.checkedExercises,
        [key]: !isCurrentlyChecked
      },
      reps: {
        ...currentData.reps,
        [key]: !isCurrentlyChecked ? currentData.reps[key] || '' : undefined
      }
    };
    updateTempExerciseData(newData);
  };

  const updateLocalReps = (exerciseId, reps, date) => {
    const currentData = getCurrentData();
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${exerciseId}`;
    
    const newData = {
      ...currentData,
      reps: {
        ...currentData.reps,
        [key]: reps
      }
    };
    updateTempExerciseData(newData);
  };

  // Fonctions locales pour les étirements
  const toggleEtirement = (type, date) => {
    const currentData = getCurrentData();
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${type}`;
    
    const newData = {
      ...currentData,
      checkedStretches: {
        ...currentData.checkedStretches,
        [key]: !currentData.checkedStretches[key]
      }
    };
    updateTempStretchData(newData);
  };

  // Sauvegarder les exercices avec vérification d'intégrité
  const handleSaveExercises = async () => {
    try {
      // Utiliser la fonction de sauvegarde du contexte avec gestion d'erreurs
      await saveExerciseChanges();
    } catch (error) {
      alert('Erreur critique lors de la sauvegarde des exercices. Veuillez réessayer.');
    }
  };

  // Sauvegarder les étirements avec vérification d'intégrité
  const handleSaveStretches = async () => {
    try {
      // Utiliser la fonction de sauvegarde du contexte avec gestion d'erreurs
      await saveStretchChanges();
    } catch (error) {
      alert('Erreur critique lors de la sauvegarde des étirements. Veuillez réessayer.');
    }
  };

  const handleDiscardExercises = () => {
    discardExerciseChanges();
  };

  const handleDiscardStretches = () => {
    discardStretchChanges();
  };

  const workout = getTodayWorkout(currentDate, isGymMode);
  const dateStr = getDateStr(currentDate);
  const dayName = getDayName(currentDate);

  // Vérifier si des variantes gym sont disponibles pour ce jour
  const hasGymVariants = (dayName === 'samedi' || dayName === 'dimanche') && 
                        workoutProgram[dayName] && 
                        workoutProgram[dayName].salleVariants;

  const handleSessionFeedback = () => {
    // Calculer la durée réelle basée sur les exercices accomplis
    const calculateSessionDuration = () => {
      const completedExercises = workout.exercices.filter(exercise => {
        const exerciseKey = `${dateStr}_${exercise.id}`;
        return data.checkedExercises[exerciseKey] || false;
      });
      
      if (completedExercises.length === 0) return 0;
      
      let totalDurationMinutes = 0;
      
      completedExercises.forEach(exercise => {
        if (exercise.series) {
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

    const todayData = {
      date: dateStr,
      exercises: [
        // Exercices classiques
        ...workout.exercices.map(exercise => {
          const exerciseKey = `${dateStr}_${exercise.id}`;
          const isChecked = data.checkedExercises[exerciseKey] || false;
          const reps = data.reps[exerciseKey] || '';
          return {
            ...exercise,
            completed: isChecked,
            reps: parseInt(reps) || 0
          };
        }).filter(ex => ex.completed),
        // Activités complémentaires
        ...(workout.complementaryActivity && data.checkedExercises[`${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`] ? [{
          id: `complementary_${workout.complementaryActivity.name.toLowerCase()}`,
          name: workout.complementaryActivity.name,
          completed: true,
          reps: 0,
          duration: workout.complementaryActivity.duration
        }] : [])
      ],
      totalReps: workout.exercices.reduce((total, exercise) => {
        const exerciseKey = `${dateStr}_${exercise.id}`;
        const reps = data.reps[exerciseKey] || '';
        return total + (parseInt(reps) || 0);
      }, 0),
      estimatedDuration: Math.max(30, workout.exercices.length * 3),
      duration: calculateSessionDuration() // Ajouter la durée réelle calculée
    };
    
    setSessionData(todayData);
    setShowSessionFeedback(true);
  };

  const handleSave = () => {
    saveChanges();
  };

  const handleDiscard = () => {
    discardChanges();
  };

  if (!workout.exercices || workout.exercices.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
          <div className="text-gray-400 mb-4">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Jour de repos</h3>
            <p>Profitez de votre journée de récupération !</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Workout Header */}
      <div className={`p-6 rounded-lg shadow-xl border border-slate-700 ${
        workout.focus.includes('Repos') 
          ? 'bg-gradient-to-r from-blue-900/80 to-slate-800/80' 
          : 'bg-gradient-to-r from-pink-600/80 to-purple-600/80'
      } backdrop-blur-sm`}>
        <h2 className="text-2xl font-bold text-white">{workout.name}</h2>
        <p className="text-sm text-gray-200 opacity-90 mt-1">{workout.focus}</p>
        <p className="text-xs text-gray-300 mt-2">⏱️ {workout.duree}</p>
        
        {/* Toggle Gym/Maison - seulement pour samedi et dimanche */}
        {hasGymVariants && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-200">Mode d'entraînement:</span>
            <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => setIsGymMode(false)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  !isGymMode 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                🏠 Maison
              </button>
              <button
                onClick={() => setIsGymMode(true)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  isGymMode 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                🏋️ Salle
              </button>
            </div>
            {data.weekVariant && (
              <span className="text-xs text-gray-400 bg-slate-700/30 px-2 py-1 rounded">
                Semaine {data.weekVariant}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Exercices */}
      <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          Exercices
        </h3>
        <div className="space-y-3">
          {/* Exercices classiques */}
          {workout.exercices.map((exercise) => {
            const exerciseKey = `${dateStr}_${exercise.id}`;
            const currentData = getCurrentData();
            const isChecked = currentData.checkedExercises[exerciseKey] || false;
            const reps = currentData.reps[exerciseKey] || '';

            return (
              <div key={exercise.id} className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
                <div className="flex-1">
                  <div className="font-medium text-white">{exercise.name}</div>
                  <div className="text-sm text-gray-300">
                    {exercise.series}
                    {exercise.materiel && ` • ${exercise.materiel}`}
                    {exercise.notes && ` • ${exercise.notes}`}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={isChecked}
                    onChange={() => handleExerciseCheck(exercise.id, currentDate)}
                    className="text-green-400"
                    name={`exercise_${exercise.id}`}
                  />
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={reps}
                    onChange={(e) => updateLocalReps(exercise.id, e.target.value, currentDate)}
                    onFocus={() => handleInputFocus(exercise.id, exercise)}
                    className={`w-20 text-center ${isChecked ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-slate-800 border-slate-600 text-white'}`}
                    size="sm"
                  />
                  {isChecked && (
                    <div className="text-green-400 text-sm font-medium">✓ Fait</div>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedExercise(exercise);
                      setShowExerciseVariations(true);
                    }}
                    icon={Zap}
                    className="bg-blue-600 hover:bg-blue-700"
                  />
                </div>
              </div>
            );
          })}
          
          {/* Activités complémentaires */}
          {workout.complementaryActivity && (
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-700/30 to-blue-700/30 rounded-lg border border-purple-500/50 hover:from-purple-700/40 hover:to-blue-700/40 transition-all duration-200">
              <div className="flex-1">
                <div className="font-medium text-white flex items-center gap-2">
                  {workout.complementaryActivity.name}
                  <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full">
                    {workout.complementaryActivity.type}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {workout.complementaryActivity.duration} min • {workout.complementaryActivity.timeSlot}
                </div>
                <div className="text-xs text-purple-200 mt-1">
                  {workout.complementaryActivity.benefits.join(' • ')}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={getCurrentData().checkedExercises[`${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`] || false}
                  onChange={() => handleExerciseCheck(`complementary_${workout.complementaryActivity.name.toLowerCase()}`, currentDate)}
                  className="text-purple-400"
                  name={`complementary_${workout.complementaryActivity.name.toLowerCase()}`}
                />
                <div className="text-purple-300 text-sm font-medium">
                  {workout.complementaryActivity.duration} min
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Boutons de sauvegarde */}
        {hasUnsavedExercises && (
          <div className="mt-6 pt-4 border-t border-slate-600/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-yellow-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                Modifications non sauvegardées
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardExercises}
                  icon={X}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveExercises}
                  icon={Save}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Étirements */}
      {workout.etirements && (
        <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400">🧘‍♂️</span>
            Étirements du jour
          </h3>
          <div className="space-y-4">
            {Object.entries(workout.etirements).map(([moment, description]) => (
              <div key={moment} className="border-l-4 border-purple-500/50 pl-4 bg-slate-700/30 rounded-r-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white capitalize flex items-center gap-2">
                    <span className="text-purple-400">•</span>
                    {moment}
                  </h4>
                  <label className="flex items-center">
                    <Checkbox
                    checked={data.checkedStretches[`${dateStr}_${moment}`] || false}
                    onChange={() => toggleEtirement(moment, currentDate)}
                    className="w-5 h-5"
                  />
                  </label>
                </div>
                <p className="text-sm text-gray-300">{description}</p>
              </div>
            ))}
          </div>

          {/* Boutons de sauvegarde */}
          {hasUnsavedStretches && (
            <div className="mt-6 pt-4 border-t border-slate-600/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-yellow-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  Modifications non sauvegardées
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardStretches}
                    icon={X}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveStretches}
                    icon={Save}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Bouton de feedback de session */}
      <div className="text-center">
        <Button
          variant="primary"
          onClick={handleSessionFeedback}
          icon={MessageSquare}
          className="bg-green-600 hover:bg-green-700"
        >
          Feedback de session
        </Button>
      </div>
    </div>
  );
};

export default TodayTab;