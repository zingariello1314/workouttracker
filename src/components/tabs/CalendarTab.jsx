import React, { useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useWorkoutStats } from '../../hooks/useWorkoutStats';
import CalendarHeatmap from '../CalendarHeatmap';

const CalendarTab = () => {
  // Récupérer les données directement du contexte pour la réactivité
  const { data, getCurrentData } = useWorkout();
  
  // Utiliser getCurrentData() pour inclure les données temporaires non sauvegardées
  const currentData = getCurrentData();
  
  // Créer une instance du hook avec les données actuelles
  const { getWorkoutHistory } = useWorkoutStats(currentData);
  
  // Utiliser useMemo pour recalculer l'historique quand les données changent
  const workoutHistory = useMemo(() => {
    const history = getWorkoutHistory();
    console.log('🔍 DEBUG CalendarTab: Historique recalculé:', history.length, 'sessions');
    return history;
  }, [currentData.reps, currentData.checkedExercises, getWorkoutHistory]);
  
  console.log('🔍 DEBUG CalendarTab: Rendu avec', workoutHistory?.length || 0, 'sessions');
  
  return (
    <div className="p-6">
      <CalendarHeatmap workoutHistory={workoutHistory} />
    </div>
  );
};

export default CalendarTab;