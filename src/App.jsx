import React from 'react';
import { WorkoutProvider } from './context/WorkoutContext';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import TodayTab from './components/tabs/TodayTab';
import DataEntryTab from './components/tabs/DataEntryTab';
import ProgressTab from './components/tabs/ProgressTab';
import CalendarTab from './components/tabs/CalendarTab';
import ProgramTab from './components/tabs/ProgramTab';
import ChartsTab from './components/tabs/ChartsTab';
import StatsTab from './components/tabs/StatsTab';
import ExercisesTab from './components/tabs/ExercisesTab';
import HistoryTab from './components/tabs/HistoryTab';
import SettingsTab from './components/tabs/SettingsTab';
import PredictionsTab from './components/PredictionsTab';
import StreaksTab from './components/StreaksTab';
import SmartBalancingTab from './components/SmartBalancingTab';
import ExerciseVariations from './components/ExerciseVariations/ExerciseVariations';
import AdvancedStats from './components/AdvancedStats';
import SessionFeedback from './components/SessionFeedback';
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
    setShowExerciseVariations,
    showAdvancedStats,
    setShowAdvancedStats,
    showSessionFeedback,
    setShowSessionFeedback,
    sessionData,
    saveSessionFeedback,
    getWorkoutHistory
  } = useWorkout();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'today':
        return <TodayTab />;
      case 'data-entry':
        return <DataEntryTab />;
      case 'progress':
        return <ProgressTab />;
      case 'calendar':
        return <CalendarTab />;
      case 'program':
        return <ProgramTab />;
      case 'charts':
        return <ChartsTab />;
      case 'stats':
        return <StatsTab />;
      case 'exercises':
        return <ExercisesTab />;
      case 'history':
        return <HistoryTab />;
      case 'predictions':
        return <PredictionsTab />;
      case 'streaks':
        return <StreaksTab />;
      case 'smart-balancing':
        return <SmartBalancingTab />;
      case 'settings':
        return <SettingsTab />;
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

      {showAdvancedStats && (
        <AdvancedStats
          workoutData={getWorkoutHistory()}
          isOpen={showAdvancedStats}
          onClose={() => setShowAdvancedStats(false)}
        />
      )}

      {showSessionFeedback && (
        <SessionFeedback
          isOpen={showSessionFeedback}
          onClose={() => setShowSessionFeedback(false)}
          onSave={(feedbackData) => {
            const today = new Date().toISOString().split('T')[0];
            saveSessionFeedback(today, feedbackData);
            console.log('Session feedback sauvegardé:', feedbackData);
            setShowSessionFeedback(false);
          }}
          sessionData={sessionData}
        />
      )}
    </div>
  );
};

export default WorkoutTrackerApp;