/**
 * 📋 COMPOSANT EXERCISE LIST
 * 
 * Composant pour afficher la liste des exercices du workout.
 * Utilise ExerciseItem pour chaque exercice et gère l'affichage des activités complémentaires.
 * 
 * @module ExerciseList
 */

import React from 'react';
import ExerciseItem from './ExerciseItem';
import { Checkbox } from '../../ui/Input';
import { Input } from '../../ui/Input';
import Button from '../../ui/Button';
import { Zap } from 'lucide-react';
import { generateComplementaryKey } from '../../../../utils/exerciseKeyGenerator';
import { useWorkout } from '../../../../context/WorkoutContext';
import { getDateStr } from '../../../../utils/dateUtils';

/**
 * Composant pour afficher la liste des exercices
 * 
 * @param {Object} props
 * @param {Array} props.exercises - Liste des exercices
 * @param {Object} props.complementaryActivity - Activité complémentaire (optionnelle)
 * @param {Date} props.date - Date du workout
 * @param {boolean} props.isGymMode - Mode salle activé
 * @param {Function} props.onShowVariations - Callback pour afficher les variations
 * 
 * @example
 * <ExerciseList
 *   exercises={workout.exercices}
 *   complementaryActivity={workout.complementaryActivity}
 *   date={currentDate}
 *   isGymMode={isGymMode}
 *   onShowVariations={(exercise) => setShowVariations(exercise)}
 * />
 */
const ExerciseList = ({ 
  exercises = [], 
  complementaryActivity = null, 
  date, 
  isGymMode, 
  onShowVariations 
}) => {
  const { getCurrentData, updateTempExerciseData } = useWorkout();
  const dateStr = getDateStr(date);
  const currentData = getCurrentData();

  // Handler pour activité complémentaire
  // Note: Les activités complémentaires utilisent une clé spéciale avec date
  const handleComplementaryToggle = (activityName) => {
    // Pour les activités complémentaires, on doit utiliser directement la clé avec date
    const key = generateComplementaryKey(date, activityName);
    const isChecked = currentData.checkedExercises?.[key] || false;
    
    const newData = {
      ...currentData,
      checkedExercises: {
        ...currentData.checkedExercises,
        [key]: !isChecked
      }
    };
    updateTempExerciseData(newData);
  };

  const handleComplementaryMinutesChange = (activityName, minutes) => {
    const minutesKey = `${dateStr}_complementary_${activityName.toLowerCase()}_minutes`;
    const newData = {
      ...currentData,
      reps: {
        ...currentData.reps,
        [minutesKey]: minutes
      }
    };
    updateTempExerciseData(newData);
  };

  return (
    <div className="space-y-3">
      {/* Exercices classiques */}
      {exercises.map((exercise) => (
        <ExerciseItem
          key={exercise.id}
          exercise={exercise}
          date={date}
          isGymMode={isGymMode}
          onShowVariations={onShowVariations}
        />
      ))}
      
      {/* Activités complémentaires */}
      {complementaryActivity && (() => {
        const complementaryKey = generateComplementaryKey(date, complementaryActivity.name);
        const isChecked = currentData.checkedExercises?.[complementaryKey] || false;
        const minutesKey = `${dateStr}_complementary_${complementaryActivity.name.toLowerCase()}_minutes`;
        const minutes = currentData.reps?.[minutesKey] || '';

        return (
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-700/30 to-blue-700/30 rounded-lg border border-purple-500/50 hover:from-purple-700/40 hover:to-blue-700/40 transition-all duration-200">
            <div className="flex-1">
              <div className="font-medium text-white flex items-center gap-2">
                {complementaryActivity.name}
                <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full">
                  {complementaryActivity.type}
                </span>
              </div>
              <div className="text-sm text-gray-300">
                {complementaryActivity.duration} min • {complementaryActivity.timeSlot}
              </div>
              {complementaryActivity.benefits && (
                <div className="text-xs text-purple-200 mt-1">
                  {complementaryActivity.benefits.join(' • ')}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isChecked}
                onChange={() => handleComplementaryToggle(complementaryActivity.name)}
                className="text-purple-400"
                name={`complementary_${complementaryActivity.name.toLowerCase()}`}
                aria-label={`Marquer ${complementaryActivity.name} comme complété`}
              />
              
              {/* Champ de saisie pour les minutes */}
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minutes}
                  onChange={(e) => handleComplementaryMinutesChange(complementaryActivity.name, e.target.value)}
                  className="w-16 text-center"
                  min="0"
                  max="300"
                  aria-label={`Minutes pour ${complementaryActivity.name}`}
                />
                <span className="text-purple-300 text-sm font-medium">min</span>
              </div>
              
              {onShowVariations && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShowVariations(complementaryActivity)}
                  icon={Zap}
                  className="bg-purple-600 hover:bg-purple-700"
                  aria-label={`Voir les variations de ${complementaryActivity.name}`}
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

ExerciseList.displayName = 'ExerciseList';

export default ExerciseList;

