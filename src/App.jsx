import React, { useState, useEffect, lazy, Suspense } from 'react';
import { WorkoutProvider } from './context/WorkoutContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { QuickActionsProvider } from './context/QuickActionsContext';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
// ✅ PHASE 2 : Lazy loading systématique pour réduire le bundle initial
// Composants toujours nécessaires au démarrage
import HomePage from './components/HomePage';
import HomePageScrollTransition from './components/HomePageScrollTransition';
import AuthPage from './components/AuthPage';

// Lazy loading des onglets (chargés à la demande)
const TodayTab = lazy(() => import('./components/tabs/TodayTab'));
const DataEntryTab = lazy(() => import('./components/tabs/DataEntryTab'));
const ProgressTab = lazy(() => import('./components/tabs/ProgressTab'));
const EnduranceTab = lazy(() => import('./components/tabs/EnduranceTab'));
const CalendarTab = lazy(() => import('./components/tabs/CalendarTab'));
const ProgramTab = lazy(() => import('./components/tabs/ProgramTab'));
const ChartsTab = lazy(() => import('./components/tabs/ChartsTab'));
const StatsTab = lazy(() => import('./components/tabs/StatsTab'));
const ExercisesTab = lazy(() => import('./components/tabs/ExercisesTab'));
const HistoryTab = lazy(() => import('./components/tabs/HistoryTab'));
const SettingsTab = lazy(() => import('./components/tabs/SettingsTab'));
const PredictionsTab = lazy(() => import('./components/PredictionsTab'));
const QuestsTab = lazy(() => import('./components/tabs/QuestsTab'));
const ApprentissageTab = lazy(() => import('./components/tabs/ApprentissageTab'));
const SmartBalancingTab = lazy(() => import('./components/SmartBalancingTab'));
const GarminTab = lazy(() => import('./components/tabs/GarminTab'));
const NutritionTab = lazy(() => import('./components/tabs/NutritionTab'));
const BooksTab = lazy(() => import('./components/tabs/BooksTab'));
const FinanceTab = lazy(() => import('./components/tabs/FinanceTab'));
const DashboardTab = lazy(() => import('./components/tabs/DashboardTab'));
const PricingTab = lazy(() => import('./components/tabs/PricingTab'));
const CoachDashboard = lazy(() => import('./components/tabs/nutrition/components/CoachDashboard'));
const ExerciseVariations = lazy(() => import('./components/ExerciseVariations/ExerciseVariations'));
const AdvancedStats = lazy(() => import('./components/AdvancedStats'));
const SessionFeedback = lazy(() => import('./components/SessionFeedback'));
import SidebarPremium from './components/sidebar/SidebarPremium';
import { useWorkout } from './context/WorkoutContext';
import { useGarminData } from './hooks/useGarminData';
import { useAuth } from './context/AuthContext';
import AnimatedBackground from './components/ui/AnimatedBackground';
import GlassFilter from './components/ui/GlassFilter';
import ErrorBoundary from './components/ui/ErrorBoundary';

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
    getWorkoutHistory,
    saveSessionFeedback
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
      case 'pricing':
        // Pricing est géré directement dans le JSX principal pour affichage plein écran
        return null;
      default:
        return <HomePage />;
    }
  };

  // Déterminer si la sidebar doit être affichée
  // Visible partout SAUF sur home, auth et pricing
  const shouldShowSidebar = activeTab !== 'home' && 
                            activeTab !== 'auth' &&
                            activeTab !== 'pricing';

  // État pour contrôler l'affichage du fond animé
  const [showAnimatedBackground, setShowAnimatedBackground] = useState(false);
  const [dashboardScrollProgress, setDashboardScrollProgress] = useState(0);
  
  // Écouter les événements de scrollProgress depuis HomePageScrollTransition
  useEffect(() => {
    const handleDashboardScrollProgress = (event) => {
      const { progress, activeTab: eventTab } = event.detail;
      if (eventTab === 'dashboard' || eventTab === 'home') {
        setDashboardScrollProgress(progress);
      }
    };
    
    window.addEventListener('dashboard-scroll-progress', handleDashboardScrollProgress);
    return () => {
      window.removeEventListener('dashboard-scroll-progress', handleDashboardScrollProgress);
    };
  }, []);
  
  // Mettre à jour l'état du fond animé selon l'onglet actif
  // IMPORTANT: Le fond reste TOUJOURS monté pour éviter le rechargement entre onglets
  // Seule l'opacité change selon l'onglet actif
  useEffect(() => {
    // Ne pas afficher le fond sur home, auth et pricing
    // Pour dashboard, l'opacité est gérée par scrollProgress (0 = masqué, 1 = visible)
    const shouldShow = activeTab !== 'home' && activeTab !== 'auth' && activeTab !== 'pricing';
    setShowAnimatedBackground(shouldShow);
  }, [activeTab]);

  return (
    <div className="min-h-screen">
      {/* Filtre SVG pour l'effet liquid glass - UNE SEULE FOIS dans l'app */}
      <GlassFilter />
      
      {/* Fond animé global - TOUJOURS monté pour éviter le rechargement */}
      {/* Le fond est en position fixed donc il persiste entre les changements d'onglets */}
      {/* IMPORTANT: Ne JAMAIS démonter ce composant pour éviter le rechargement du Canvas Three.js */}
      {/* Pour dashboard, l'opacité est gérée par scrollProgress (0 = masqué, >0.25 = visible progressivement) */}
      <div 
        style={{ 
          opacity: activeTab === 'dashboard' 
            ? (dashboardScrollProgress < 0.25 
                ? 0 
                : dashboardScrollProgress < 0.5 
                  ? (dashboardScrollProgress - 0.25) / 0.25
                  : 1)
            : showAnimatedBackground 
              ? 1 
              : 0,
          transition: 'opacity 0.2s ease-out',
          pointerEvents: 'none',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          // Toujours monté, même si opacity est 0
          display: 'block'
        }}
      >
        <AnimatedBackground />
      </div>
      
      {/* Fond de fallback - couleur de base du shader animé (vert foncé) pour transition fluide */}
      {/* Ce fond évite le flash blanc pendant le chargement du Canvas Three.js */}
      <div 
        className="fixed inset-0 -z-10" 
        style={{ 
          background: showAnimatedBackground 
            ? 'linear-gradient(135deg, #0a2e1a 0%, #1a4d2e 50%, #0a2e1a 100%)' // Vert foncé correspondant au shader
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' // Slate pour home/auth/dashboard
        }}
      />
      
      <div className="flex flex-col min-h-screen">
        {/* Header et Navigation - Masqués sur home, auth, dashboard et pricing */}
        {activeTab !== 'home' && activeTab !== 'auth' && activeTab !== 'dashboard' && activeTab !== 'pricing' && <Header />}
        {activeTab !== 'home' && activeTab !== 'auth' && activeTab !== 'dashboard' && activeTab !== 'pricing' && <Navigation />}
        
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
              marginTop: activeTab === 'settings' ? '-811px' : activeTab === 'finance' ? '-781px' : activeTab === 'apprentissage' ? '-761px' : (activeTab === 'quests' || activeTab === 'books') ? '-780px' : (activeTab !== 'home' && activeTab !== 'auth' && activeTab !== 'dashboard' && activeTab !== 'pricing') ? '-730px' : '0',
              transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: '100vh',
              position: 'relative',
              zIndex: 1
            }}
          >
            {activeTab === 'auth' ? (
              <AuthPage />
            ) : activeTab === 'pricing' ? (
              <PricingTab />
            ) : (activeTab !== 'home' && activeTab !== 'dashboard') ? (
              <ErrorBoundary
                context={{ activeTab }}
                title={`Erreur dans l'onglet ${activeTab}`}
                onGoHome={() => setActiveTab('home')}
              >
                <Suspense fallback={
                  <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <div className="text-4xl mb-4 animate-spin">⚡</div>
                        <div className="text-slate-400 font-semibold uppercase tracking-wide">CHARGEMENT...</div>
                      </div>
                    </div>
                  </div>
                }>
                  <div className="container mx-auto px-4">
                    {renderTabContent()}
                  </div>
                </Suspense>
              </ErrorBoundary>
            ) : null}
          </main>
        </div>

        {/* Modales avec lazy loading */}
        {showExerciseVariations && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Chargement...</div></div>}>
            <ExerciseVariations
              baseExercise={selectedExercise}
              onClose={() => setShowExerciseVariations(false)}
            />
          </Suspense>
        )}

        {showAdvancedStats && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Chargement...</div></div>}>
            <AdvancedStats
              workoutData={getWorkoutHistory()}
              garminData={garminData}
              isOpen={showAdvancedStats}
              onClose={() => setShowAdvancedStats(false)}
            />
          </Suspense>
        )}

        {showSessionFeedback && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Chargement...</div></div>}>
            <SessionFeedback
              isOpen={showSessionFeedback}
              onClose={() => setShowSessionFeedback(false)}
              onSave={async (feedbackData) => {
                // ✅ Sauvegarder le feedback avec la date comme clé
                if (feedbackData.date && saveSessionFeedback) {
                  try {
                    await saveSessionFeedback(feedbackData.date, feedbackData);
                    console.log('✅ Session feedback sauvegardé:', feedbackData);
                  } catch (error) {
                    console.error('❌ Erreur lors de la sauvegarde du feedback:', error);
                  }
                } else {
                  console.error('❌ Erreur: date ou saveSessionFeedback manquant', { date: feedbackData.date, saveSessionFeedback });
                }
                setShowSessionFeedback(false);
              }}
              sessionData={sessionData}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default WorkoutTrackerApp;