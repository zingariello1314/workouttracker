import React from 'react';
import { WorkoutProvider } from './context/WorkoutContext';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import TodayTab from './components/tabs/TodayTab';
import ProgressTab from './components/tabs/ProgressTab';
import CalendarTab from './components/tabs/CalendarTab';
import ChartsTab from './components/tabs/ChartsTab';
import StatsTab from './components/tabs/StatsTab';
import ExercisesTab from './components/tabs/ExercisesTab';
import HistoryTab from './components/tabs/HistoryTab';
import ExerciseVariations from './components/ExerciseVariations/ExerciseVariations';
import { useWorkout } from './context/WorkoutContext';

const WorkoutTrackerApp = () => {
  return (
    <WorkoutProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <WorkoutTrackerContent />
      </div>
    </WorkoutProvider>
  );
};

const WorkoutTrackerContent = () => {
  const { 
    activeTab, 
    showExerciseVariations, 
    selectedExercise, 
    setShowExerciseVariations 
  } = useWorkout();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'today':
        return <TodayTab />;
      case 'progress':
        return <ProgressTab />;
      case 'calendar':
        return <CalendarTab />;
      case 'charts':
        return <ChartsTab />;
      case 'stats':
        return <StatsTab />;
      case 'exercises':
        return <ExercisesTab />;
      case 'history':
        return <HistoryTab />;
      default:
        return <TodayTab />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Navigation />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {renderTabContent()}
        </div>
      </main>

      {/* Modales */}
      {showExerciseVariations && (
        <ExerciseVariations
          baseExercise={selectedExercise}
          onClose={() => setShowExerciseVariations(false)}
        />
      )}
    </div>
  );
};

export default WorkoutTrackerApp;