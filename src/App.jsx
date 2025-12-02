import React from 'react';
import { WorkoutProvider } from './context/WorkoutContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import HomePage from './components/HomePage';
import AuthPage from './components/AuthPage';
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
import QuestsTab from './components/tabs/QuestsTab';
import SmartBalancingTab from './components/SmartBalancingTab';
import GarminTab from './components/tabs/GarminTab';
import NutritionTab from './components/tabs/NutritionTab';
import BooksTab from './components/tabs/BooksTab';
import CoachDashboard from './components/tabs/nutrition/components/CoachDashboard';
import ExerciseVariations from './components/ExerciseVariations/ExerciseVariations';
import AdvancedStats from './components/AdvancedStats';
import SessionFeedback from './components/SessionFeedback';
import { useWorkout } from './context/WorkoutContext';
import { useGarminData } from './hooks/useGarminData';
import { useAuth } from './context/AuthContext';

const WorkoutTrackerApp = () => {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
        <WorkoutProvider>
          <WorkoutTrackerContent />
        </WorkoutProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
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
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'zingariello1314';

  // ✅ Charger les données Garmin pour les calories
  // - admin connecté : charge les vraies données
  // - non authentifié : pas de chargement, garminData reste null (vue "0 partout")
  // - autre utilisateur : on ne charge pas encore de données Garmin (sera géré dans une phase suivante)
  const { loadAllData, dbReady } = useGarminData();
  const [garminData, setGarminData] = React.useState(null);
  
  React.useEffect(() => {
    // Si personne n'est connecté, ne rien charger (Garmin affichera une vue vide)
    if (!isAuthenticated) {
      setGarminData(null);
      return;
    }

    // Pour les comptes non-admin (utilisateurs classiques), on évite pour l'instant tout chargement
    // des données historiques tant que la séparation par utilisateur n'est pas en place.
    if (!isAdmin) {
      setGarminData(null);
      return;
    }

    if (dbReady) {
      loadAllData()
        .then(setGarminData)
        .catch(err => {
          console.error('[App] Error loading Garmin data:', err);
          setGarminData(null);
        });
    }
  }, [dbReady, loadAllData, isAdmin, isAuthenticated]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'auth':
        return <AuthPage />;
      case 'today':
        return <TodayTab />;
      case 'quests':
        // Onglet QuietQuest – contenu en cours de développement
        return <QuestsTab />;
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
      case 'nutrition':
        return <NutritionTab />;
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
        // ✅ Comportement Garmin :
        // - Déconnecté : on affiche GarminTab avec des données vides (0 partout, aucune synchro encore faite)
        // - Admin connecté : GarminTab complet avec données historiques
        // - Autre utilisateur connecté : pour l'instant, on bloque l'accès pour préserver tes données admin
        if (!isAuthenticated) {
          return <GarminTab />;
        }
        if (isAdmin) {
        return <GarminTab />;
        }
        return (
          <div className="max-w-3xl mx-auto p-6 text-center text-slate-200">
            <p className="text-lg font-semibold mb-2">
              Cette section Garmin est réservée à ton compte administrateur.
            </p>
            <p className="text-sm text-slate-400">
              Connecte-toi avec ton compte admin pour consulter l&apos;historique Garmin et les analyses détaillées.
            </p>
          </div>
        );
      case 'coach':
        return <CoachDashboard />;
      case 'books':
        return <BooksTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col min-h-screen">
        {activeTab !== 'home' && activeTab !== 'auth' && <Header />}
        {activeTab !== 'home' && activeTab !== 'auth' && <Navigation />}
        
        <main className={`flex-1 ${activeTab === 'home' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {activeTab === 'home' ? (
            <HomePage />
          ) : activeTab === 'auth' ? (
            <AuthPage />
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
            garminData={garminData}
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
    </div>
  );
};

export default WorkoutTrackerApp;