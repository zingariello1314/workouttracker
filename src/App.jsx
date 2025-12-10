import React from 'react';
import { WorkoutProvider } from './context/WorkoutContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { QuickActionsProvider } from './context/QuickActionsContext';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import HomePage from './components/HomePage';
import HomePageScrollTransition from './components/HomePageScrollTransition';
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
import ApprentissageTab from './components/tabs/ApprentissageTab';
import SmartBalancingTab from './components/SmartBalancingTab';
import GarminTab from './components/tabs/GarminTab';
import NutritionTab from './components/tabs/NutritionTab';
import BooksTab from './components/tabs/BooksTab';
import FinanceTab from './components/tabs/FinanceTab';
import DashboardTab from './components/tabs/DashboardTab';
import CoachDashboard from './components/tabs/nutrition/components/CoachDashboard';
import ExerciseVariations from './components/ExerciseVariations/ExerciseVariations';
import AdvancedStats from './components/AdvancedStats';
import SessionFeedback from './components/SessionFeedback';
import SidebarPremium from './components/sidebar/SidebarPremium';
import { useWorkout } from './context/WorkoutContext';
import { useGarminData } from './hooks/useGarminData';
import { useAuth } from './context/AuthContext';

const WorkoutTrackerApp = () => {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <QuickActionsProvider>
            <WorkoutProvider>
              <WorkoutTrackerContent />
            </WorkoutProvider>
          </QuickActionsProvider>
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

  // Masquer la scrollbar du body quand on est sur home/dashboard
  // + Ajouter classe dashboard-active pour le CSS de la sidebar
  React.useEffect(() => {
    if (activeTab === 'home' || activeTab === 'dashboard') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Ajouter/retirer la classe dashboard-active pour le positionnement de la sidebar
    if (activeTab === 'dashboard') {
      document.body.classList.add('dashboard-active');
    } else {
      document.body.classList.remove('dashboard-active');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('dashboard-active');
    };
  }, [activeTab]);

  // Émettre un événement lors du changement d'onglet pour la rotation des images de profil
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: activeTab, isSubTab: false } 
    }));
  }, [activeTab]);

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
      case 'apprentissage':
        return <ApprentissageTab />;
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
      case 'dashboard':
        return <DashboardTab />;
      case 'finance':
        return <FinanceTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <HomePage />;
    }
  };

  // Déterminer si la sidebar doit être affichée
  // Visible partout SAUF sur home et auth
  const shouldShowSidebar = activeTab !== 'home' && 
                            activeTab !== 'auth';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col min-h-screen">
        {/* Header et Navigation - Masqués sur home, auth et dashboard */}
        {activeTab !== 'home' && activeTab !== 'auth' && activeTab !== 'dashboard' && <Header />}
        {activeTab !== 'home' && activeTab !== 'auth' && activeTab !== 'dashboard' && <Navigation />}
        
        {/* HomePage avec transition fluide vers Dashboard */}
        {(activeTab === 'home' || activeTab === 'dashboard') && <HomePageScrollTransition />}

        {/* Layout avec sidebar */}
        <div className="flex-1 relative">
          {/* Sidebar Premium - Visible sur toutes les pages sauf home, auth et settings */}
          {shouldShowSidebar && <SidebarPremium />}
          
          <main 
            className={`${(activeTab === 'home' || activeTab === 'dashboard') ? 'overflow-hidden' : ''}`}
            style={{
              marginLeft: shouldShowSidebar ? '300px' : '0',
              marginTop: activeTab === 'settings' ? '-742px' : activeTab === 'finance' ? '-710px' : (activeTab === 'quests' || activeTab === 'apprentissage' || activeTab === 'books') ? '-690px' : (activeTab !== 'home' && activeTab !== 'auth' && activeTab !== 'dashboard') ? '-642px' : '0',
              transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: '100vh',
              position: 'relative',
              zIndex: 1
            }}
          >
            {activeTab === 'auth' ? (
              <AuthPage />
            ) : (activeTab !== 'home' && activeTab !== 'dashboard') ? (
              <div className="container mx-auto px-4">
                {renderTabContent()}
              </div>
            ) : null}
          </main>
        </div>

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