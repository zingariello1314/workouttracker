import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import CalendarHeatmap from '../CalendarHeatmap';

const CalendarTab = () => {
  const { data } = useWorkout();

  return (
    <div className="p-6">
      <CalendarHeatmap data={data} />
    </div>
  );
};

export default CalendarTab;