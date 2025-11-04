import React, { useState } from 'react';
import { Play, Square, CheckCircle, Clock, Target, Flame, Zap, MessageSquare, Save, X, Award, Plus, Trash2 } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useToast } from '../../components/ui/Toast';
import { workoutProgram } from '../../data/workoutProgram';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Checkbox } from '../ui/Input';
import ChallengeCard from '../ui/ChallengeCard';
import { typography } from '../../styles/typography';
import { getAutoWeekVariant } from '../../utils/dateUtils';
import { calculateAutoReps } from '../../utils/exerciseCalculations';
import { useTodayExercises } from '../../hooks/useTodayExercises';
import AddExceptionalExerciseModal from '../modals/AddExceptionalExerciseModal';

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
    toggleCheck,
    // ✅ NOUVEAU : Fonctions de variations journalières
    suppressExerciseForToday,
    restoreExerciseForToday,
    addExceptionalExercise,
    removeExceptionalExercise,
    markExceptionalExerciseComplete
  } = useWorkout();
  
  const { showSuccess, showError } = useToast();

  // Récupérer les défis actifs
  const getActiveChallenges = () => {
    const challenges = data?.enduranceData?.challenges || [];
    const todayStr = getDateStr(currentDate);
    const now = new Date();
    
    return challenges.filter(challenge => {
      // Cas récurrent: afficher si non réalisé aujourd'hui
      if (challenge.type === 'recurrent') {
        const doneToday = challenge.lastCompletedDate === todayStr;
        // Même si le statut a été mis par erreur à 'completed', on le considère actif tant que pas fait aujourd'hui
        return !doneToday;
      }
      // Cas non récurrent: seulement si actif et dans la fenêtre de validité
      if (challenge.status !== 'active') return false;
      switch (challenge.type) {
        case 'ponctuel':
          return new Date(challenge.targetDate) >= now;
        case 'periode':
          return new Date(challenge.endDate) >= now;
        default:
          return true;
      }
    });
  };

  // Fonction pour valider un défi
  const handleChallengeComplete = async (challengeId, completionData) => {
    try {
      // Créer une session d'endurance pour valider le défi
      const sessionData = {
        id: Date.now(),
        date: getDateStr(currentDate),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        ...completionData,
        validatedChallenges: [challengeId]
      };

      // Mettre à jour les données d'endurance
      const enduranceData = data?.enduranceData || {};
      const currentSessions = enduranceData.sessions || {};
      const activityType = getActiveChallenges().find(c => c.id === challengeId)?.activityType || 'pushups';
      
      const updatedSessions = {
        ...currentSessions,
        [activityType]: [...(currentSessions[activityType] || []), sessionData]
      };

      // Marquer le défi comme complété
      const updatedChallenges = (enduranceData.challenges || []).map(challenge => {
        if (challenge.id !== challengeId) return challenge;
        if (challenge.type === 'recurrent') {
          // Marquer comme réalisé pour aujourd'hui uniquement
          return {
            ...challenge,
            status: 'active',
            lastCompletedDate: getDateStr(currentDate),
            completedSessionId: sessionData.id
          };
        }
        return {
          ...challenge,
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedSessionId: sessionData.id
        };
      });

      // Sauvegarder
      await updateData({
        ...data,
        enduranceData: {
          ...enduranceData,
          sessions: updatedSessions,
          challenges: updatedChallenges,
          lastUpdated: new Date().toISOString()
        }
      });

      showSuccess('Défi validé avec succès ! 🎉');
    } catch (error) {
      console.error('❌ Erreur lors de la validation du défi:', error);
      showError('Erreur lors de la validation du défi', {
        title: 'Échec de la validation',
        message: 'Une erreur est survenue lors de la validation du défi.',
        suggestions: [
          'Vérifiez que tous les champs sont remplis',
          'Réessayez dans quelques instants'
        ]
      });
      throw error;
    }
  };

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

  // Note: calculateAutoReps est maintenant importé depuis utils/exerciseCalculations

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
    const workout = getTodayWorkout(date, isGymMode);
    
    // Générer la clé appropriée selon le type d'exercice
    let key = `${dateStr}_${exerciseId}`;
    
    // Si c'est un exercice de salle (mode gym activé), ajouter le suffixe de semaine
    if (isGymMode && workout.isGymMode) {
      const currentWeekVariant = getAutoWeekVariant(date);
      const weekSuffix = currentWeekVariant === 'A' ? '_semaineA' : '_semaineB';
      key = `${dateStr}_${exerciseId}${weekSuffix}`;
    }
    
    const isCurrentlyChecked = currentData.checkedExercises[key] || false;
    
    // Si pas encore coché, calculer les reps automatiques
    if (!isCurrentlyChecked) {
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
    const workout = getTodayWorkout(date, isGymMode);
    
    // Générer la clé appropriée selon le type d'exercice
    let key = `${dateStr}_${exerciseId}`;
    
    // Si c'est un exercice de salle (mode gym activé), ajouter le suffixe de semaine
    if (isGymMode && workout.isGymMode) {
      const currentWeekVariant = getAutoWeekVariant(date);
      const weekSuffix = currentWeekVariant === 'A' ? '_semaineA' : '_semaineB';
      key = `${dateStr}_${exerciseId}${weekSuffix}`;
    }
    
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
      showSuccess('Exercices enregistrés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des exercices:', error);
      showError('Erreur lors de la sauvegarde des exercices', {
        title: 'Échec de la sauvegarde',
        message: 'Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.',
        suggestions: [
          'Vérifiez votre connexion internet',
          'Rafraîchissez la page et réessayez',
          'Contactez le support si le problème persiste'
        ]
      });
    }
  };

  // Sauvegarder les étirements avec vérification d'intégrité
  const handleSaveStretches = async () => {
    try {
      // Utiliser la fonction de sauvegarde du contexte avec gestion d'erreurs
      await saveStretchChanges();
      showSuccess('Étirements enregistrés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des étirements:', error);
      showError('Erreur lors de la sauvegarde des étirements', {
        title: 'Échec de la sauvegarde',
        message: 'Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.',
        suggestions: [
          'Vérifiez votre connexion internet',
          'Rafraîchissez la page et réessayez',
          'Contactez le support si le problème persiste'
        ]
      });
    }
  };

  const handleDiscardExercises = () => {
    discardExerciseChanges();
  };

  const handleDiscardStretches = () => {
    discardStretchChanges();
  };

  // ✅ NOUVEAU : Handler pour supprimer un exercice pour aujourd'hui
  const handleSuppressExercise = async (exerciseId) => {
    try {
      // Confirmation avant suppression
      const confirmed = window.confirm(
        'Êtes-vous sûr de vouloir supprimer cet exercice pour aujourd\'hui ?\n\nCette action peut être annulée en restaurant l\'exercice.'
      );
      
      if (!confirmed) {
        return;
      }

      await suppressExerciseForToday(exerciseId);
      showSuccess('Exercice supprimé pour aujourd\'hui');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'exercice:', error);
      showError('Erreur lors de la suppression', {
        title: 'Échec de la suppression',
        message: error.message || 'Une erreur est survenue lors de la suppression de l\'exercice.',
        suggestions: [
          'Vérifiez que l\'exercice existe dans le programme',
          'Réessayez dans quelques instants'
        ]
      });
    }
  };

  // ✅ NOUVEAU : Handler pour restaurer un exercice supprimé
  const handleRestoreExercise = async (exerciseId) => {
    try {
      await restoreExerciseForToday(exerciseId);
      showSuccess('Exercice restauré pour aujourd\'hui');
    } catch (error) {
      console.error('❌ Erreur lors de la restauration de l\'exercice:', error);
      showError('Erreur lors de la restauration', {
        title: 'Échec de la restauration',
        message: error.message || 'Une erreur est survenue lors de la restauration de l\'exercice.',
        suggestions: [
          'Vérifiez que l\'exercice était bien supprimé',
          'Réessayez dans quelques instants'
        ]
      });
    }
  };

  // ✅ NOUVEAU : Handler pour compléter un exercice exceptionnel
  const handleExceptionalExerciseComplete = async (exerciseId, actualReps, actualDuration) => {
    try {
      await markExceptionalExerciseComplete(exerciseId, actualReps, actualDuration);
      showSuccess('Exercice exceptionnel marqué comme complété');
    } catch (error) {
      console.error('❌ Erreur lors de la complétion de l\'exercice exceptionnel:', error);
      showError('Erreur lors de la complétion', {
        title: 'Échec de la complétion',
        message: error.message || 'Une erreur est survenue lors de la complétion de l\'exercice.',
        suggestions: [
          'Vérifiez que l\'exercice existe',
          'Réessayez dans quelques instants'
        ]
      });
    }
  };

  // ✅ NOUVEAU : Handler pour supprimer un exercice exceptionnel
  const handleRemoveExceptionalExercise = async (exerciseId) => {
    try {
      const confirmed = window.confirm(
        'Êtes-vous sûr de vouloir supprimer cet exercice exceptionnel ?'
      );
      
      if (!confirmed) {
        return;
      }

      await removeExceptionalExercise(exerciseId);
      showSuccess('Exercice exceptionnel supprimé');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'exercice exceptionnel:', error);
      showError('Erreur lors de la suppression', {
        title: 'Échec de la suppression',
        message: error.message || 'Une erreur est survenue lors de la suppression de l\'exercice.',
        suggestions: [
          'Vérifiez que l\'exercice existe',
          'Réessayez dans quelques instants'
        ]
      });
    }
  };

  const workout = getTodayWorkout(currentDate, isGymMode);
  const dateStr = getDateStr(currentDate);
  const dayName = getDayName(currentDate);

  // Calculer la variante de semaine automatique (toujours basée sur la date)
  const currentWeekVariant = getAutoWeekVariant(currentDate);

  // Vérifier si des variantes gym sont disponibles pour ce jour
  const hasGymVariants = (dayName === 'samedi' || dayName === 'dimanche') && 
                        workoutProgram[dayName] && 
                        workoutProgram[dayName].salleVariants;

  // ✅ NOUVEAU : Utiliser le hook useTodayExercises pour obtenir exercices avec variations
  const {
    programExercises,
    additionalExercises,
    suppressedExerciseIds,
    metadata: exercisesMetadata
  } = useTodayExercises({ date: currentDate, isGymMode });

  // ✅ État pour modal d'ajout d'exercice exceptionnel
  const [showAddExceptionalModal, setShowAddExceptionalModal] = useState(false);

  const handleSessionFeedback = () => {
    // Calculer la durée réelle basée sur les exercices accomplis
    const calculateSessionDuration = () => {
      const completedExercises = workout.exercices.filter(exercise => {
        // Générer la clé appropriée selon le type d'exercice
        let exerciseKey = `${dateStr}_${exercise.id}`;
        
        // Si c'est un exercice de salle (mode gym activé), ajouter le suffixe de semaine
        if (isGymMode && workout.isGymMode) {
          const currentWeekVariant = getAutoWeekVariant(currentDate);
          const weekSuffix = currentWeekVariant === 'A' ? '_semaineA' : '_semaineB';
          exerciseKey = `${dateStr}_${exercise.id}${weekSuffix}`;
        }
        
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
    const activeChallenges = getActiveChallenges();
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
          <div className="text-gray-400 mb-4">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Jour de repos</h3>
            <p>Profitez de votre journée de récupération !</p>
          </div>
        </div>
        {/* Section des défis actifs, même si jour de repos */}
        {activeChallenges.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 mt-8">
            <Card.Header>
              <Card.Title className="flex items-center text-purple-200">
                <Award className="mr-2" size={20} />
                Défis actifs ({activeChallenges.length})
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {activeChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onComplete={handleChallengeComplete}
                  />
                ))}
              </div>
            </Card.Content>
          </Card>
        )}
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
                Semaine {currentWeekVariant}
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
          {/* ✅ NOUVEAU : Exercices du programme (filtrés selon variations) */}
          {programExercises.map((exercise) => {
            // Générer la clé appropriée selon le type d'exercice
            let exerciseKey = `${dateStr}_${exercise.id}`;
            
            // Si c'est un exercice de salle (mode gym activé), ajouter le suffixe de semaine
            if (isGymMode && workout.isGymMode) {
              const currentWeekVariant = getAutoWeekVariant(currentDate);
              const weekSuffix = currentWeekVariant === 'A' ? '_semaineA' : '_semaineB';
              exerciseKey = `${dateStr}_${exercise.id}${weekSuffix}`;
            }
            
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
                  {/* ✅ NOUVEAU : Bouton pour supprimer l'exercice pour aujourd'hui */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuppressExercise(exercise.id)}
                    icon={Trash2}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Supprimer pour aujourd'hui"
                  />
                </div>
              </div>
            );
          })}

          {/* ✅ NOUVEAU : Section Exercices Exceptionnels */}
          {additionalExercises.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="text-yellow-400">⭐</span>
                  Exercices Exceptionnels
                  {exercisesMetadata.additionalCount > 0 && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                      {exercisesMetadata.additionalCount}
                    </span>
                  )}
                </h4>
              </div>
              <div className="space-y-3">
                {additionalExercises.map((exercise) => {
                  const isCompleted = exercise.completed || false;
                  
                  return (
                    <div 
                      key={exercise.id} 
                      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-700/20 to-orange-700/20 rounded-lg border border-yellow-500/30 hover:from-yellow-700/30 hover:to-orange-700/30 transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          {exercise.name}
                          <span className="text-xs bg-yellow-500/30 text-yellow-200 px-2 py-0.5 rounded-full">
                            Exceptionnel
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 mt-1">
                          {exercise.type === 'reps' ? (
                            <>
                              {exercise.series} séries
                              {exercise.repsPerSeries && exercise.repsPerSeries.length > 0 && (
                                <span className="ml-2">
                                  ({exercise.repsPerSeries.join(' + ')} reps)
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {exercise.duration ? `${Math.floor(exercise.duration / 60)}min ${exercise.duration % 60}s` : 'Durée'}
                            </>
                          )}
                          {exercise.materiel && ` • ${exercise.materiel}`}
                          {exercise.notes && ` • ${exercise.notes}`}
                        </div>
                        {exercise.completed && (
                          <div className="text-xs text-green-300 mt-1">
                            {exercise.type === 'reps' && exercise.totalReps ? (
                              `✓ Complété : ${exercise.totalReps} reps`
                            ) : exercise.type === 'duration' && exercise.actualDuration ? (
                              `✓ Complété : ${Math.floor(exercise.actualDuration / 60)}min ${exercise.actualDuration % 60}s`
                            ) : (
                              '✓ Complété'
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isCompleted}
                          onChange={() => {
                            if (!isCompleted) {
                              // Compléter l'exercice
                              if (exercise.type === 'reps') {
                                handleExceptionalExerciseComplete(exercise.id, exercise.repsPerSeries);
                              } else {
                                handleExceptionalExerciseComplete(exercise.id, null, exercise.duration);
                              }
                            } else {
                              // Décocher (non implémenté pour l'instant, mais prévu)
                              console.log('Décocher exercice exceptionnel non encore implémenté');
                            }
                          }}
                          className="text-yellow-400"
                          name={`exceptional_${exercise.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExceptionalExercise(exercise.id)}
                          icon={X}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Supprimer cet exercice exceptionnel"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ✅ NOUVEAU : Bouton pour ajouter un exercice exceptionnel */}
          <div className="mt-4 pt-4 border-t border-slate-600/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddExceptionalModal(true)}
              icon={Plus}
              className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
            >
              Ajouter un exercice exceptionnel
            </Button>
          </div>
          
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
                
                {/* Champ de saisie pour les minutes */}
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={getCurrentData().reps[`${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`] || ''}
                    onChange={(e) => updateReps(`complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`, e.target.value, currentDate)}
                    onFocus={() => handleInputFocus(`complementary_${workout.complementaryActivity.name.toLowerCase()}_minutes`, { series: `1×${workout.complementaryActivity.duration}min` })}
                    className="w-16 text-center"
                    min="0"
                    max="300"
                  />
                  <span className="text-purple-300 text-sm font-medium">min</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedExercise(workout.complementaryActivity);
                    setShowExerciseVariations(true);
                  }}
                  icon={Zap}
                  className="bg-purple-600 hover:bg-purple-700"
                />
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



      {/* Sessions d'endurance du jour */}
      {(() => {
        const enduranceData = data?.enduranceData || {};
        const sessions = enduranceData.sessions || {};
        const todayEnduranceSessions = [];
        
        // Collecter toutes les sessions d'endurance du jour
        Object.entries(sessions).forEach(([activityType, activitySessions]) => {
          if (Array.isArray(activitySessions)) {
            activitySessions.forEach(session => {
              if (session.date === dateStr) {
                todayEnduranceSessions.push({
                  ...session,
                  activityType,
                  activityName: {
                    boxing: 'Boxe',
                    pushups: 'Pompes',
                    swimming: 'Natation',
                    jumprope: 'Corde à sauter',
                    running: 'Course'
                  }[activityType] || activityType
                });
              }
            });
          }
        });
        
        if (todayEnduranceSessions.length === 0) return null;
        
        return (
          <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
            <Card.Header>
              <Card.Title className="flex items-center text-orange-200">
                <Zap className="mr-2" size={20} />
                Sessions d'endurance d'aujourd'hui
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {todayEnduranceSessions.map((session, index) => (
                  <div key={index} className="bg-orange-700/20 rounded-lg p-3 border border-orange-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-orange-200">{session.activityName}</h4>
                      <span className="text-orange-300 text-sm">{session.time}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {session.count && (
                        <div className="text-center">
                          <div className="text-orange-200 font-bold">{session.count}</div>
                          <div className="text-orange-300">Répétitions</div>
                        </div>
                      )}
                      {session.duration && (
                        <div className="text-center">
                          <div className="text-orange-200 font-bold">{session.duration}min</div>
                          <div className="text-orange-300">Durée</div>
                        </div>
                      )}
                      {session.distance && (
                        <div className="text-center">
                          <div className="text-orange-200 font-bold">{session.distance}m</div>
                          <div className="text-orange-300">Distance</div>
                        </div>
                      )}
                      {session.jumps && (
                        <div className="text-center">
                          <div className="text-orange-200 font-bold">{session.jumps}</div>
                          <div className="text-orange-300">Sauts</div>
                        </div>
                      )}
                    </div>
                    {session.notes && (
                      <div className="mt-2 text-orange-300 text-sm italic">
                        "{session.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        );
      })()}

      {/* Section des défis actifs */}
      {(() => {
        const activeChallenges = getActiveChallenges();
        if (activeChallenges.length === 0) return null;
        
        return (
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <Card.Header>
              <Card.Title className="flex items-center text-purple-200">
                <Award className="mr-2" size={20} />
                Défis actifs ({activeChallenges.length})
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {activeChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onComplete={handleChallengeComplete}
                  />
                ))}
              </div>
            </Card.Content>
          </Card>
        );
      })()}

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

      {/* ✅ NOUVEAU : Modal d'ajout d'exercice exceptionnel */}
      <AddExceptionalExerciseModal
        isOpen={showAddExceptionalModal}
        onClose={() => setShowAddExceptionalModal(false)}
      />
    </div>
  );
};

export default TodayTab;