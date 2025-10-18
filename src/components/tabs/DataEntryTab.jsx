import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { workoutProgram } from '../../data/workoutProgram';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Calendar, Save, RotateCcw, TrendingUp, Clock, Target } from 'lucide-react';
import { typography } from '../../styles/typography';

const DataEntryTab = () => {
  const { data, updateReps, toggleCheck, getDateStr, getDayName } = useWorkout();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [repsData, setRepsData] = useState({});
  const [advancedMode, setAdvancedMode] = useState(false);
  const [bulkEntryData, setBulkEntryData] = useState({});

  const dateStr = getDateStr(selectedDate);
  const dayName = getDayName(selectedDate);
  const workout = workoutProgram[dayName];

  // Initialiser les données de répétitions pour la date sélectionnée
  useEffect(() => {
    if (workout) {
      const initialReps = {};
      workout.exercices.forEach(exercise => {
        const key = `${dateStr}_${exercise.id}`;
        initialReps[exercise.id] = data.reps[key] || '';
      });
      setRepsData(initialReps);
    }
  }, [selectedDate, workout, data.reps, dateStr]);

  // Sauvegarder les répétitions
  const handleSaveReps = () => {
    Object.entries(repsData).forEach(([exerciseId, reps]) => {
      if (reps && reps !== '') {
        updateReps(parseInt(exerciseId), reps, selectedDate);
        // Marquer automatiquement comme fait si des reps sont saisies
        if (parseInt(reps) > 0) {
          const key = `${dateStr}_${exerciseId}`;
          if (!data.checkedExercises[key]) {
            toggleCheck(parseInt(exerciseId), selectedDate);
          }
        }
      }
    });
    
    // Réinitialiser les données temporaires
    setRepsData({});
    alert('Données sauvegardées avec succès !');
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
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données de cette journée ?')) {
      if (workout) {
        workout.exercices.forEach(exercise => {
          const key = `${dateStr}_${exercise.id}`;
          updateReps(exercise.id, '', selectedDate);
          if (data.checkedExercises[key]) {
            toggleCheck(exercise.id, selectedDate);
          }
        });
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
        if (!data.checkedExercises[key]) {
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
            Jour de repos
          </h3>
          <p className={`${typography.presets.bodyLarge} text-slate-400`}>
            Aucun exercice programmé pour {dayName.toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec sélection de date */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${typography.presets.h1} text-white mb-2`}>
            Saisie de données
          </h1>
          <p className={`${typography.presets.bodyLarge} text-slate-400`}>
            Enregistrez vos répétitions pour le {dayName.toLowerCase()} {selectedDate.toLocaleDateString('fr-FR')}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="bg-slate-800 border-slate-700 text-white"
          />
          <Button
            variant={advancedMode ? "default" : "outline"}
            onClick={() => setAdvancedMode(!advancedMode)}
            className="whitespace-nowrap"
          >
            <TrendingUp size={16} className="mr-2" />
            Mode avancé
          </Button>
        </div>
      </div>

      {/* Saisie rapide du jour */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className={`${typography.presets.h2} text-white flex items-center gap-2`}>
            <Target size={20} className="text-blue-400" />
            {workout.nom} - Saisie rapide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workout.exercices.map((exercise) => {
            const key = `${dateStr}_${exercise.id}`;
            const currentReps = data.reps[key] || '';
            const isCompleted = data.checkedExercises[key] || false;
            const tempReps = repsData[exercise.id] || currentReps;

            return (
              <div key={exercise.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                <div className="flex-1">
                  <h4 className={`${typography.presets.h4} text-white mb-1`}>
                    {exercise.name}
                  </h4>
                  <p className={`${typography.presets.bodySmall} text-slate-400`}>
                    {exercise.series} • {exercise.materiel || 'Poids du corps'}
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
                    placeholder="Reps"
                    value={tempReps}
                    onChange={(e) => handleRepsChange(exercise.id, e.target.value)}
                    className="w-20 bg-slate-800 border-slate-600 text-white text-center"
                    min="0"
                  />
                  
                  {isCompleted && (
                    <Badge variant="success" className="bg-green-600 text-white">
                      ✓ Fait
                    </Badge>
                  )}
                  
                  {currentReps && !isCompleted && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                      {currentReps} reps
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveReps} className="flex-1">
              <Save size={16} className="mr-2" />
              Sauvegarder
            </Button>
            <Button variant="outline" onClick={handleResetDay}>
              <RotateCcw size={16} className="mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mode avancé - Tableau de saisie sur plusieurs jours */}
      {advancedMode && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className={`${typography.presets.h2} text-white flex items-center gap-2`}>
              <Clock size={20} className="text-purple-400" />
              Saisie avancée - 7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className={`${typography.presets.bodyLarge} text-white text-left p-3`}>
                      Exercice
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
                        const dayWorkout = workoutProgram[day.dayName];
                        const dayExercise = dayWorkout?.exercices.find(ex => ex.name === exercise.name);
                        const key = `${day.dateStr}_${exercise.id}`;
                        const reps = data.reps[key] || '';
                        const isCompleted = data.checkedExercises[key] || false;
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
            
            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
              <p className={`${typography.presets.bodySmall} text-slate-400 mb-2`}>
                💡 <strong>Astuce :</strong> Vous pouvez saisir vos répétitions en avance ou rattraper celles en retard directement dans ce tableau.
              </p>
              <p className={`${typography.presets.bodySmall} text-slate-500`}>
                Les exercices sont automatiquement marqués comme terminés quand vous saisissez des répétitions > 0.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résumé des données saisies */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className={`${typography.presets.h3} text-white`}>
            Résumé de la journée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <div className={`${typography.presets.h2} text-blue-400 mb-1`}>
                {workout.exercices.reduce((total, exercise) => {
                  const key = `${dateStr}_${exercise.id}`;
                  return total + (parseInt(data.reps[key]) || 0);
                }, 0)}
              </div>
              <div className={`${typography.presets.bodySmall} text-slate-400`}>
                Répétitions totales
              </div>
            </div>
            
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <div className={`${typography.presets.h2} text-green-400 mb-1`}>
                {workout.exercices.filter(exercise => {
                  const key = `${dateStr}_${exercise.id}`;
                  return data.checkedExercises[key];
                }).length}
              </div>
              <div className={`${typography.presets.bodySmall} text-slate-400`}>
                Exercices terminés
              </div>
            </div>
            
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <div className={`${typography.presets.h2} text-purple-400 mb-1`}>
                {Math.round((workout.exercices.filter(exercise => {
                  const key = `${dateStr}_${exercise.id}`;
                  return data.checkedExercises[key];
                }).length / workout.exercices.length) * 100)}%
              </div>
              <div className={`${typography.presets.bodySmall} text-slate-400`}>
                Progression
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataEntryTab;