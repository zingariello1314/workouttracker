import React from 'react';
import { Play, Square, CheckCircle, Clock, Target, Flame, Zap, MessageSquare } from 'lucide-react';
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
    getTodayWorkout,
    getDateStr,
    getDayName,
    toggleCheck,
    updateReps,
    toggleEtirement,
    setSelectedExercise,
    setShowExerciseVariations,
    setSessionData,
    setShowSessionFeedback,
    isGymMode,
    setIsGymMode
  } = useWorkout();

  const workout = getTodayWorkout(currentDate, isGymMode);
  const dateStr = getDateStr(currentDate);
  const dayName = getDayName(currentDate);

  // Vérifier si des variantes gym sont disponibles pour ce jour
  const hasGymVariants = (dayName === 'samedi' || dayName === 'dimanche') && 
                        workoutProgram[dayName] && 
                        workoutProgram[dayName].salleVariants;

  const handleSessionFeedback = () => {
    const todayData = {
      date: dateStr,
      exercises: workout.exercices.map(exercise => {
        const exerciseKey = `${dateStr}_${exercise.id}`;
        const isChecked = data.checkedExercises[exerciseKey] || false;
        const reps = data.reps[exerciseKey] || '';
        return {
          ...exercise,
          completed: isChecked,
          reps: parseInt(reps) || 0
        };
      }).filter(ex => ex.completed),
      totalReps: workout.exercices.reduce((total, exercise) => {
        const exerciseKey = `${dateStr}_${exercise.id}`;
        const reps = data.reps[exerciseKey] || '';
        return total + (parseInt(reps) || 0);
      }, 0),
      estimatedDuration: Math.max(30, workout.exercices.length * 3)
    };
    
    setSessionData(todayData);
    setShowSessionFeedback(true);
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
          {workout.exercices.map((exercise) => {
            const exerciseKey = `${dateStr}_${exercise.id}`;
            const isChecked = data.checkedExercises[exerciseKey] || false;
            const reps = data.reps[exerciseKey] || '';

            return (
              <div key={exercise.id} className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
                <label className="flex items-center">
                  <Checkbox
                    checked={isChecked}
                    onChange={() => toggleCheck(exercise.id, currentDate)}
                    className="w-5 h-5"
                  />
                </label>
                
                <div className="flex-1">
                  <div className="font-medium text-white">{exercise.name}</div>
                  <div className="text-sm text-gray-300">
                    {exercise.series}
                    {exercise.materiel && ` • ${exercise.materiel}`}
                    {exercise.notes && ` • ${exercise.notes}`}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={reps}
                    onChange={(e) => updateReps(exercise.id, e.target.value, currentDate)}
                    className="w-20"
                    size="sm"
                  />
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
        </div>
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