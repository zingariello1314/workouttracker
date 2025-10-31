import React from 'react';
import { WorkoutProvider } from './context/WorkoutContext';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import HomePage from './components/HomePage';
import TodayTab from './components/tabs/TodayTab';
import DataEntryTab from './components/tabs/DataEntryTab';
import ProgressTab from './components/tabs/ProgressTab';
import EnduranceTab from './components/tabs/EnduranceTab';
import CalendarTab from './components/tabs/CalendarTab';
import ProgramTab from './components/tabs/ProgramTab';
import ChartsTab from './components/tabs/ChartsTab';
import StatsTab from './components/tabs/StatsTab';
import ExercisesTab from './components/tabs/ExercisesTab';
import HistoryTab from './components/tabs/HistoryTab';
import SettingsTab from './components/tabs/SettingsTab';
import PredictionsTab from './components/PredictionsTab';
import SmartBalancingTab from './components/SmartBalancingTab';
import GarminTab from './components/tabs/GarminTab';
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
    getWorkoutHistory
  } = useWorkout();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'today':
        return <TodayTab />;
      case 'data-entry':
        return <DataEntryTab />;
      case 'progress':
        return <ProgressTab />;
      case 'endurance':
        return <EnduranceTab />;
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
      case 'smart-balancing':
        return <SmartBalancingTab />;
      case 'garmin':
        return <GarminTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {activeTab !== 'home' && <Header />}
      {activeTab !== 'home' && <Navigation />}
      
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' ? (
          <HomePage />
        ) : (
          <div className="container mx-auto px-4 py-6">
            {renderTabContent()}
          </div>
        )}
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