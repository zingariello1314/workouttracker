import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { workoutProgram } from '../../data/workoutProgram';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Calendar, Save, RotateCcw, TrendingUp, Clock, Target, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { typography } from '../../styles/typography';
import WorkoutHistorySection from '../WorkoutHistorySection';
import { calculateAutoReps } from '../../utils/exerciseCalculations';
import { useTranslation } from '../../utils/translations';
import { useFormatters } from '../../utils/translations/formatters-hook';
import { useToast } from '../ui/Toast';
import { isAdminUser } from '../../utils/accessControl';

const DataEntryTab = () => {
  const { data, updateReps, toggleCheck, getDateStr, getDayName, getCurrentData, getTodayWorkout, activeProgram } = useWorkout();
  const { currentUser, isAuthenticated } = useAuth();
  const t = useTranslation();
  const { formatDate: formatLocaleDate } = useFormatters();
  const { showSuccess, showError } = useToast();
  
  // ✅ Vérifier si l'utilisateur est admin
  const isAdmin = isAdminUser(currentUser);
  
  // Utiliser getCurrentData() pour obtenir les données actuelles (incluant tempData)
  const currentData = getCurrentData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [repsData, setRepsData] = useState({});
  const [advancedMode, setAdvancedMode] = useState(false);
  const [bulkEntryData, setBulkEntryData] = useState({});
  const [collapsedDays, setCollapsedDays] = useState({});

  const dateStr = getDateStr(selectedDate);
  const dayName = getDayName(selectedDate);
  // ✅ Utiliser getTodayWorkout pour obtenir le workout du jour (inclut le programme actif)
  const workoutRaw = isAdmin && isAuthenticated ? (getTodayWorkout ? getTodayWorkout(selectedDate, false) : (workoutProgram[dayName] || null)) : null;
  
  // Convertir le format du workout si c'est du nouveau format (avec exercices au lieu de exercices)
  const workout = workoutRaw ? {
    ...workoutRaw,
    exercices: workoutRaw.exercices || workoutRaw.exercises || []
  } : null;

  // Ordre chronologique des jours (traduits)
  const daysOrder = [
    t('dataEntry.days.monday'),
    t('dataEntry.days.tuesday'),
    t('dataEntry.days.wednesday'),
    t('dataEntry.days.thursday'),
    t('dataEntry.days.friday'),
    t('dataEntry.days.saturday'),
    t('dataEntry.days.sunday')
  ];

  // Fonction pour basculer l'état plié/déplié d'un jour
  const toggleDayCollapse = (day) => {
    setCollapsedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  // Fonction pour obtenir tous les exercices d'un jour (incluant les variantes)
  const getAllExercisesForDay = (dayWorkout) => {
    if (!dayWorkout) return [];
    
    let allExercises = [...dayWorkout.exercices];
    
    // Ajouter les variantes de salle si elles existent
    if (dayWorkout.salleVariants) {
      allExercises = [
        ...allExercises,
        ...dayWorkout.salleVariants.semaineA.exercices.map(ex => ({
          ...ex,
          variant: 'Semaine A'
        })),
        ...dayWorkout.salleVariants.semaineB.exercices.map(ex => ({
          ...ex,
          variant: 'Semaine B'
        }))
      ];
    }
    
    return allExercises;
  };

  // Note: calculateAutoReps est maintenant importé depuis utils/exerciseCalculations

  // Gestionnaire pour l'auto-remplissage au focus
  const handleInputFocus = (exerciseId, exercise) => {
    const key = `${dateStr}_${exerciseId}`;
    const currentValue = currentData.reps[key] || '';
    
    // Si le champ est vide, calculer et remplir automatiquement
    if (!currentValue && exercise.series) {
      const autoReps = calculateAutoReps(exercise.series);
      if (autoReps) {
        updateReps(exerciseId, autoReps.toString(), selectedDate);
      }
    }
  };

  // Initialiser les données de répétitions pour la date sélectionnée
  useEffect(() => {
    if (workout && isAdmin && isAuthenticated) {
      const initialReps = {};
      
      // Exercices normaux
      workout.exercices.forEach(exercise => {
        const key = `${dateStr}_${exercise.id}`;
        initialReps[exercise.id] = currentData.reps[key] || '';
      });
      
      // Exercices des variantes de salle
      if (workout.salleVariants) {
        workout.salleVariants.semaineA.exercices.forEach(exercise => {
          const key = `${dateStr}_${exercise.id}_semaineA`;
          initialReps[exercise.id] = currentData.reps[key] || '';
        });
        
        workout.salleVariants.semaineB.exercices.forEach(exercise => {
          const key = `${dateStr}_${exercise.id}_semaineB`;
          initialReps[exercise.id] = currentData.reps[key] || '';
        });
      }
      
      setRepsData(initialReps);
    } else {
      setRepsData({});
    }
  }, [selectedDate, workout, currentData.reps, dateStr, isAdmin, isAuthenticated]);

  // Sauvegarder les répétitions avec vérification d'intégrité
  const handleSaveReps = () => {
    let savedCount = 0;
    let errorCount = 0;
    
    Object.entries(repsData).forEach(([exerciseId, reps]) => {
      if (reps && reps !== '') {
        try {
          const parsedReps = parseInt(reps);
          if (parsedReps >= 0 && parsedReps <= 999) { // Validation des valeurs
            updateReps(parseInt(exerciseId), reps, selectedDate);
            savedCount++;
            
            // Marquer automatiquement comme fait si des reps sont saisies
            if (parsedReps > 0) {
              const key = `${dateStr}_${exerciseId}`;
              if (!currentData.checkedExercises[key]) {
                toggleCheck(parseInt(exerciseId), selectedDate);
              }
            }
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }
    });
    
    // Réinitialiser les données temporaires
    setRepsData({});
    
    // Message de confirmation avec détails
    if (errorCount === 0) {
      showSuccess(t('dataEntry.messages.saveSuccess', { count: savedCount }));
    } else {
      showError(t('dataEntry.messages.savePartial', { savedCount, errorCount }));
    }
  };

  // Mettre à jour les répétitions localement
  const handleRepsChange = (exerciseId, value) => {
    setRepsData(prev => ({
      ...prev,
      [exerciseId]: value
    }));
  };

  // Réinitialiser les données de la journée
  const handleResetDay = () => {
    if (window.confirm(t('dataEntry.messages.resetConfirm'))) {
      if (workout) {
        // Réinitialiser les exercices normaux
        workout.exercices.forEach(exercise => {
          const key = `${dateStr}_${exercise.id}`;
          updateReps(exercise.id, '', selectedDate);
          if (currentData.checkedExercises[key]) {
            toggleCheck(exercise.id, selectedDate);
          }
        });

        // Réinitialiser les exercices des variantes de salle
        if (workout.salleVariants) {
          workout.salleVariants.semaineA.exercices.forEach(exercise => {
            const key = `${dateStr}_${exercise.id}_semaineA`;
            updateReps(exercise.id, '', selectedDate);
            if (currentData.checkedExercises[key]) {
              toggleCheck(exercise.id, selectedDate);
            }
          });
          
          workout.salleVariants.semaineB.exercices.forEach(exercise => {
            const key = `${dateStr}_${exercise.id}_semaineB`;
            updateReps(exercise.id, '', selectedDate);
            if (currentData.checkedExercises[key]) {
              toggleCheck(exercise.id, selectedDate);
            }
          });
        }
      }
      setRepsData({});
    }
  };

  // Saisie en lot pour plusieurs dates
  const handleBulkEntry = (exerciseId, dates, reps) => {
    dates.forEach(date => {
      updateReps(exerciseId, reps, new Date(date));
      if (parseInt(reps) > 0) {
        const key = `${getDateStr(new Date(date))}_${exerciseId}`;
        if (!currentData.checkedExercises[key]) {
          toggleCheck(exerciseId, new Date(date));
        }
      }
    });
  };


  // Générer les 7 derniers jours pour la saisie en lot
  const getLastSevenDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date,
        dateStr: getDateStr(date),
        dayName: getDayName(date),
        isToday: i === 0
      });
    }
    return days;
  };

  const lastSevenDays = getLastSevenDays();

  if (!workout) {
    return (
      <div className="p-6 text-center">
        <div className="bg-slate-800/50 rounded-lg p-8">
          <Calendar className="mx-auto mb-4 text-slate-400" size={48} />
          <h3 className={`${typography.presets.h3} text-white mb-2`}>
            {t('dataEntry.restDay.title')}
          </h3>
          <p className={`${typography.presets.bodyLarge} text-slate-400`}>
            {t('dataEntry.restDay.message', { dayName: dayName.toLowerCase() })}
          </p>
        </div>
      </div>
    );
  }

  // ✅ Afficher un état vide si l'utilisateur n'est pas connecté ou n'est pas admin
  if (!isAuthenticated || !isAdmin || !workout) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`${typography.presets.h1} text-white mb-2`}>
              {t('dataEntry.title')}
            </h1>
            <p className={`${typography.presets.bodyLarge} text-slate-400`}>
              {t('dataEntry.subtitle', { dayName: dayName.toLowerCase(), date: formatLocaleDate(selectedDate) })}
            </p>
          </div>
        </div>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Target size={48} className="text-slate-500 mx-auto mb-4" />
            <h3 className={`${typography.presets.h3} text-white mb-2`}>
              {!isAuthenticated 
                ? t('dataEntry.empty.notConnected') || 'Connecte-toi pour accéder à la saisie de données'
                : t('dataEntry.empty.noProgram') || 'Aucun programme disponible'}
            </h3>
            <p className={`${typography.presets.bodyLarge} text-slate-400`}>
              {!isAuthenticated
                ? t('dataEntry.empty.notConnectedMessage') || 'Connecte-toi pour commencer à enregistrer tes entraînements.'
                : t('dataEntry.empty.noProgramMessage') || 'Crée ou importe un programme pour commencer.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 space-y-6 p-6">
        {/* En-tête avec sélection de date */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#0F4C5C]/50 bg-black px-4 py-3">
        <div>
          <h1 className={`${typography.presets.h1} text-white mb-2`}>
            {t('dataEntry.title')}
          </h1>
          <p className={`${typography.presets.bodyLarge} text-teal-200/75`}>
            {t('dataEntry.subtitle', { dayName: dayName.toLowerCase(), date: formatLocaleDate(selectedDate) })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={getDateStr(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="border-[#0F4C5C]/50 bg-black text-white"
          />
          <button
            type="button"
            onClick={() => setAdvancedMode(!advancedMode)}
            className={`gradient-button-premium gradient-button-premium-sm rounded-lg whitespace-nowrap flex items-center gap-2 ${
              advancedMode ? 'gradient-button-premium-variant' : ''
            }`}
          >
            <TrendingUp size={16} />
            {t('dataEntry.advancedMode.label')}
          </button>
        </div>
      </div>

      {/* Saisie rapide du jour */}
      <Card variant="sport">
        <CardHeader className="border-b border-[#0F4C5C]/40">
          <CardTitle className={`${typography.presets.h2} flex items-center gap-2 text-teal-100`}>
             <Target size={20} className="text-teal-400" />
             {t('dataEntry.quickEntry.title', { workoutName: workout.name })}
           </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workout.exercices.map((exercise) => {
            const key = `${dateStr}_${exercise.id}`;
            const currentData = getCurrentData();
            const currentReps = currentData.reps[key] || '';
            const isCompleted = currentData.checkedExercises[key] || false;
            const tempReps = repsData[exercise.id] || currentReps;

            return (
              <div key={exercise.id} className="flex items-center gap-4 rounded-lg border border-[#0F4C5C]/35 bg-black p-4">
                <div className="flex-1">
                  <h4 className={`${typography.presets.h4} text-white mb-1`}>
                    {exercise.name}
                  </h4>
                  <p className={`${typography.presets.bodySmall} text-slate-400`}>
                    {exercise.series} • {exercise.materiel || t('dataEntry.exercise.bodyWeight')}
                  </p>
                  {exercise.notes && (
                    <p className={`${typography.presets.bodySmall} text-slate-500 mt-1`}>
                      {exercise.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder={t('dataEntry.exercise.placeholder')}
                    value={tempReps}
                    onChange={(e) => handleRepsChange(exercise.id, e.target.value)}
                    onFocus={() => handleInputFocus(exercise.id, exercise)}
                    className={`w-20 text-center ${isCompleted ? 'border border-green-500 bg-green-600/20 text-green-300' : 'border border-[#0F4C5C]/50 bg-black text-white'}`}
                    min="0"
                  />
                  
                  {isCompleted && (
                    <div className="text-green-400 text-sm font-medium">{t('dataEntry.exercise.done')}</div>
                  )}
                  
                  {currentReps && !isCompleted && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                      {currentReps} {t('dataEntry.exercise.reps')}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSaveReps}
              className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {t('dataEntry.buttons.save')}
            </button>
            <button
              type="button"
              onClick={handleResetDay}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2"
            >
              <RotateCcw size={16} />
              {t('dataEntry.buttons.reset')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Mode avancé - Tableau de saisie sur plusieurs jours */}
      {advancedMode && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className={`${typography.presets.h2} text-white flex items-center gap-2`}>
              <Clock size={20} className="text-purple-400" />
              {t('dataEntry.advancedMode.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className={`${typography.presets.bodyLarge} text-white text-left p-3`}>
                      {t('dataEntry.exercise.label')}
                    </th>
                    {lastSevenDays.map((day) => (
                      <th key={day.dateStr} className={`${typography.presets.bodySmall} text-center p-3 min-w-[100px] ${day.isToday ? 'text-blue-400' : 'text-slate-400'}`}>
                        <div>{day.dayName.slice(0, 3)}</div>
                        <div className="text-xs">{day.date.getDate()}/{day.date.getMonth() + 1}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workout.exercices.map((exercise) => (
                    <tr key={exercise.id} className="border-b border-slate-800/50">
                      <td className="p-3">
                        <div className={`${typography.presets.bodyLarge} text-white`}>
                          {exercise.name}
                        </div>
                        <div className={`${typography.presets.bodySmall} text-slate-400`}>
                          {exercise.series}
                        </div>
                      </td>
                      {lastSevenDays.map((day) => {
                        const dayWorkout = isAdmin && isAuthenticated ? workoutProgram[day.dayName] : null;
                        const dayExercise = dayWorkout?.exercices.find(ex => ex.name === exercise.name);
                        const key = `${day.dateStr}_${exercise.id}`;
                        const currentData = getCurrentData();
                        const reps = currentData.reps[key] || '';
                        const isCompleted = currentData.checkedExercises[key] || false;
                        const isScheduled = !!dayExercise;

                        return (
                          <td key={day.dateStr} className="p-3 text-center">
                            {isScheduled ? (
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={reps}
                                  onChange={(e) => updateReps(exercise.id, e.target.value, day.date)}
                                  onFocus={() => {
                                    const key = `${day.dateStr}_${exercise.id}`;
                                    const currentData = getCurrentData();
                                    const currentValue = currentData.reps[key] || '';
                                    
                                    // Si le champ est vide, calculer et remplir automatiquement
                                    if (!currentValue && dayExercise && dayExercise.series) {
                                      const autoReps = calculateAutoReps(dayExercise.series);
                                      if (autoReps) {
                                        updateReps(exercise.id, autoReps.toString(), day.date);
                                      }
                                    }
                                  }}
                                  className="w-16 h-8 bg-slate-900 border-slate-600 text-white text-center text-sm mx-auto"
                                  min="0"
                                />
                                {isCompleted && (
                                  <div className="text-green-400 text-xs">✓</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-slate-600 text-xs">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 rounded-lg border border-[#0F4C5C]/35 bg-black p-4">
              <p className={`${typography.presets.bodySmall} text-slate-400 mb-2`}>
                {t('dataEntry.advancedMode.tip')}
              </p>
              <p className={`${typography.presets.bodySmall} text-slate-500`}>
                {t('dataEntry.advancedMode.autoComplete')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variantes de salle (Semaines A et B) */}
      {workout.salleVariants && (
        <div className="space-y-6">
          {/* Semaine A */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className={`${typography.presets.h2} text-white flex items-center gap-2`}>
                <Target size={20} className="text-orange-400" />
                {workout.salleVariants.semaineA.name} - {t('dataEntry.weekVariants.weekA')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workout.salleVariants.semaineA.exercices.map((exercise) => {
                const key = `${dateStr}_${exercise.id}`;
                const currentData = getCurrentData();
                const currentReps = currentData.reps[key] || '';
                const isCompleted = currentData.checkedExercises[key] || false;
                const tempReps = repsData[exercise.id] || currentReps;

                return (
                  <div key={exercise.id} className="flex items-center gap-4 rounded-lg border border-[#0F4C5C]/35 bg-black p-4">
                    <div className="flex-1">
                      <h4 className={`${typography.presets.h4} text-white mb-1`}>
                        {exercise.name}
                      </h4>
                      <p className={`${typography.presets.bodySmall} text-slate-400`}>
                        {exercise.series}
                      </p>
                      {exercise.notes && (
                        <p className={`${typography.presets.bodySmall} text-slate-500 mt-1`}>
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                   <Input
                     type="number"
                     placeholder={t('dataEntry.exercise.placeholder')}
                     value={tempReps}
                     onChange={(e) => handleRepsChange(exercise.id, e.target.value)}
                     onFocus={() => handleInputFocus(exercise.id, exercise)}
                     className={`w-20 text-center ${isCompleted ? 'border border-green-500 bg-green-600/20 text-green-300' : 'border border-[#0F4C5C]/50 bg-black text-white'}`}
                     min="0"
                   />
                   
                   {isCompleted && (
                     <div className="text-green-400 text-sm font-medium">{t('dataEntry.exercise.done')}</div>
                   )}
                   
                   {currentReps && !isCompleted && (
                     <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                       {currentReps} {t('dataEntry.exercise.reps')}
                     </Badge>
                   )}
                 </div>
                  </div>
                );
              })}
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveReps} className="flex-1">
                  <Save size={16} className="mr-2" />
                  {t('dataEntry.buttons.save')}
                </Button>
                <Button variant="outline" onClick={handleResetDay}>
                  <RotateCcw size={16} className="mr-2" />
                  {t('dataEntry.buttons.reset')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Semaine B */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className={`${typography.presets.h2} text-white flex items-center gap-2`}>
                <Target size={20} className="text-purple-400" />
                {workout.salleVariants.semaineB.name} - {t('dataEntry.weekVariants.weekB')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workout.salleVariants.semaineB.exercices.map((exercise) => {
                const key = `${dateStr}_${exercise.id}`;
                const currentData = getCurrentData();
                const currentReps = currentData.reps[key] || '';
                const isCompleted = currentData.checkedExercises[key] || false;
                const tempReps = repsData[exercise.id] || currentReps;

                return (
                  <div key={exercise.id} className="flex items-center gap-4 rounded-lg border border-[#0F4C5C]/35 bg-black p-4">
                    <div className="flex-1">
                      <h4 className={`${typography.presets.h4} text-white mb-1`}>
                        {exercise.name}
                      </h4>
                      <p className={`${typography.presets.bodySmall} text-slate-400`}>
                        {exercise.series}
                      </p>
                      {exercise.notes && (
                        <p className={`${typography.presets.bodySmall} text-slate-500 mt-1`}>
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <Input
                         type="number"
                         placeholder={t('dataEntry.exercise.placeholder')}
                         value={tempReps}
                         onChange={(e) => handleRepsChange(exercise.id, e.target.value)}
                         onFocus={() => handleInputFocus(exercise.id, exercise)}
                         className={`w-20 text-center ${isCompleted ? 'border border-green-500 bg-green-600/20 text-green-300' : 'border border-[#0F4C5C]/50 bg-black text-white'}`}
                         min="0"
                       />
                       
                       {isCompleted && (
                         <div className="text-green-400 text-sm font-medium">{t('dataEntry.exercise.done')}</div>
                       )}
                       
                       {currentReps && !isCompleted && (
                         <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                           {currentReps} {t('dataEntry.exercise.reps')}
                         </Badge>
                       )}
                     </div>
                  </div>
                );
              })}
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveReps} className="flex-1">
                  <Save size={16} className="mr-2" />
                  {t('dataEntry.buttons.save')}
                </Button>
                <Button variant="outline" onClick={handleResetDay}>
                  <RotateCcw size={16} className="mr-2" />
                  {t('dataEntry.buttons.reset')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Résumé des données saisies */}
      <Card variant="sport">
        <CardHeader>
          <CardTitle className={`${typography.presets.h3} text-teal-50`}>
            {t('dataEntry.summary.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4 text-center">
              <div className={`${typography.presets.h2} mb-1 text-teal-300`}>
                {(() => {
                  let totalReps = 0;
                  const currentData = getCurrentData();
                  
                  // Répétitions des exercices normaux
                  workout.exercices.forEach(exercise => {
                    const key = `${dateStr}_${exercise.id}`;
                    totalReps += parseInt(currentData.reps[key]) || 0;
                  });
                  
                  // Répétitions des variantes de salle
                  if (workout.salleVariants) {
                    workout.salleVariants.semaineA.exercices.forEach(exercise => {
                      const key = `${dateStr}_${exercise.id}_semaineA`;
                      totalReps += parseInt(currentData.reps[key]) || 0;
                    });
                    
                    workout.salleVariants.semaineB.exercices.forEach(exercise => {
                      const key = `${dateStr}_${exercise.id}_semaineB`;
                      totalReps += parseInt(currentData.reps[key]) || 0;
                    });
                  }
                  
                  return totalReps;
                })()}
              </div>
              <div className={`${typography.presets.bodySmall} text-teal-700`}>
                {t('dataEntry.summary.totalReps')}
              </div>
            </div>

            <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4 text-center">
              <div className={`${typography.presets.h2} mb-1 text-emerald-400`}>
                {(() => {
                  let completedExercises = 0;
                  const currentData = getCurrentData();
                  
                  // Exercices normaux terminés
                  completedExercises += workout.exercices.filter(exercise => {
                    const key = `${dateStr}_${exercise.id}`;
                    return currentData.checkedExercises[key];
                  }).length;
                  
                  // Exercices des variantes de salle terminés
                  if (workout.salleVariants) {
                    completedExercises += workout.salleVariants.semaineA.exercices.filter(exercise => {
                      const key = `${dateStr}_${exercise.id}_semaineA`;
                      return currentData.checkedExercises[key];
                    }).length;
                    
                    completedExercises += workout.salleVariants.semaineB.exercices.filter(exercise => {
                      const key = `${dateStr}_${exercise.id}_semaineB`;
                      return currentData.checkedExercises[key];
                    }).length;
                  }
                  
                  return completedExercises;
                })()}
              </div>
              <div className={`${typography.presets.bodySmall} text-teal-700`}>
                {t('dataEntry.summary.completedExercises')}
              </div>
            </div>

            <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4 text-center">
              <div className={`${typography.presets.h2} mb-1 text-teal-200`}>
                {(() => {
                  let totalExercises = workout.exercices.length;
                  let completedExercises = 0;
                  const currentData = getCurrentData();
                  
                  // Exercices normaux
                  completedExercises += workout.exercices.filter(exercise => {
                    const key = `${dateStr}_${exercise.id}`;
                    return currentData.checkedExercises[key];
                  }).length;
                  
                  // Exercices des variantes de salle
                  if (workout.salleVariants) {
                    totalExercises += workout.salleVariants.semaineA.exercices.length;
                    totalExercises += workout.salleVariants.semaineB.exercices.length;
                    
                    completedExercises += workout.salleVariants.semaineA.exercices.filter(exercise => {
                      const key = `${dateStr}_${exercise.id}`;
                      return currentData.checkedExercises[key];
                    }).length;
                    
                    completedExercises += workout.salleVariants.semaineB.exercices.filter(exercise => {
                      const key = `${dateStr}_${exercise.id}`;
                      return currentData.checkedExercises[key];
                    }).length;
                  }
                  
                  return Math.round((completedExercises / totalExercises) * 100);
                })()}%
              </div>
              <div className={`${typography.presets.bodySmall} text-teal-700`}>
                {t('dataEntry.summary.progress')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sessions d'endurance pour la date sélectionnée */}
      {(() => {
        const enduranceData = data?.enduranceData || {};
        const sessions = enduranceData.sessions || {};
        const selectedDateEnduranceSessions = [];
        
        // Collecter toutes les sessions d'endurance pour la date sélectionnée
        Object.entries(sessions).forEach(([activityType, activitySessions]) => {
          if (Array.isArray(activitySessions)) {
            activitySessions.forEach(session => {
              if (session.date === dateStr) {
                selectedDateEnduranceSessions.push({
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
        
        if (selectedDateEnduranceSessions.length === 0) return null;
        
        return (
          <Card variant="sport" className="border-orange-500/30">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-200">
                <Zap className="mr-2" size={20} />
                Sessions d'endurance du {selectedDate.toLocaleDateString('fr-FR')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedDateEnduranceSessions.map((session, index) => (
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
            </CardContent>
          </Card>
        );
      })()}
      
      {/* Section Saisies passées */}
      <WorkoutHistorySection />
      </div>
    </div>
  );
};

export default DataEntryTab;