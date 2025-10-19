import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useWorkoutStats } from '../../hooks/useWorkoutStats';
import CalendarHeatmap from '../CalendarHeatmap';

const CalendarTab = () => {
  const { getWorkoutHistory } = useWorkoutStats();
  const workoutHistory = getWorkoutHistory();
  
  // console.log('🔍 DEBUG CalendarTab: getWorkoutHistory appelé');
  // console.log('🔍 DEBUG CalendarTab: workoutHistory récupéré:', workoutHistory);
  // console.log('🔍 DEBUG CalendarTab: Nombre de sessions dans workoutHistory:', workoutHistory?.length || 0);
  
  if (workoutHistory && workoutHistory.length > 0) {
    // console.log('🔍 DEBUG CalendarTab: Première session:', workoutHistory[0]);
    // console.log('🔍 DEBUG CalendarTab: Structure de la première session:', {
      // date: workoutHistory[0].date,
      // exercises: workoutHistory[0].exercises,
      // exercisesCount: workoutHistory[0].exercises?.length || 0
    // });
  }

  return (
    <div className="p-6">
      <CalendarHeatmap workoutHistory={workoutHistory} />
    </div>
  );
};

export default CalendarTab;