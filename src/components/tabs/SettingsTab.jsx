/**
 * SettingsTab - Composant principal refactorisé
 * 
 * ✅ PHASE 4 : Refactoring complet de SettingsTab.jsx (~3610 lignes → ~358 lignes)
 * 
 * Orchestration uniquement - Toute la logique et l'UI ont été extraites dans des hooks et composants
 * 
 * @module components/tabs/SettingsTab
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Settings, Image, User, Search } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../utils/translations';
import { useGarminData } from '../../hooks/useGarminData';
import { useNutritionData } from '../../hooks/useNutritionData';
import { isMockEnduranceSession } from '../../utils/calendarUtils';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';

// Hooks
import { useSettingsStats } from './SettingsTab/hooks/useSettingsStats';
import { useSwipeSettings } from './SettingsTab/hooks/useSwipeSettings';
import { useProfileSettings } from './SettingsTab/hooks/useProfileSettings';
import { useDataValidation } from './SettingsTab/hooks/useDataValidation';
import { useDataCleanup } from './SettingsTab/hooks/useDataCleanup';
import { useDataMigration } from './SettingsTab/hooks/useDataMigration';
import { useSettingsExport } from './SettingsTab/hooks/useSettingsExport';
import { useSettingsImport } from './SettingsTab/hooks/useSettingsImport';
import { useAllDataExportImport } from './SettingsTab/hooks/useAllDataExportImport';

// Composants
import ProfileSettings from './SettingsTab/components/ProfileSettings';
import SwipeNavigationSettings from './SettingsTab/components/SwipeNavigationSettings';
import LanguageSettings from './SettingsTab/components/LanguageSettings';
import PrayerLocationSettings from './SettingsTab/components/PrayerLocationSettings';
import InfoCards from './SettingsTab/components/InfoCards';
import DataCleanupSection from './SettingsTab/components/DataCleanupSection';
import { BodyTrackingImportPreviewModal, AllDataImportPreviewModal } from './SettingsTab/components/ImportPreviewModal';
import QuietQuestExportImport from './SettingsTab/components/QuietQuestExportImport';
import BooksExportImport from './SettingsTab/components/BooksExportImport';
import BudgetExportImport from './SettingsTab/components/BudgetExportImport';
import ApprentissageExportImport from './SettingsTab/components/ApprentissageExportImport';
import { ExportSection, ImportSection } from './SettingsTab/components/ExportImportSection';

// Autres composants existants
import HomePageImageSettings from '../HomePageImageSettings';
import BannerExportImport from '../BannerExportImport';
import { QuoteManager } from '../quotes/QuoteManager';
import { QuotesErrorBoundary } from '../quotes/QuotesErrorBoundary';
import ProfileCardSettings from '../sidebar/ProfileCardSettings';
import AppLockSettingsPanel from '../appLock/AppLockSettingsPanel';

/** Sections paramètres : ancres + texte indexé pour la recherche (synonymes / termes courants) */
const SETTINGS_SECTIONS = [
  { id: 'settings-profil', label: 'Profil', searchText: 'profil avatar email mot de passe compte utilisateur migration données anonyme invité' },
  { id: 'settings-verrou', label: 'Verrouillage', searchText: 'verrouillage cadenas code pin mot de passe inactivité arrière-plan sécurité confidentialité session' },
  { id: 'settings-carte', label: 'Carte profil', searchText: 'carte profil image handle username bannière sidebar logo' },
  { id: 'settings-accueil', label: 'Page d\'accueil', searchText: 'accueil page fond bannière rotation images home' },
  { id: 'settings-bannieres', label: 'Bannières', searchText: 'bannières bannière import export rotation' },
  { id: 'settings-citations', label: 'Citations', searchText: 'citations citation phrases phrase quote page accueil texte inspirant épinglé aléatoire' },
  { id: 'settings-export', label: 'Export', searchText: 'export sauvegarde backup données garmin nutrition workout' },
  { id: 'settings-quests', label: 'Quêtes', searchText: 'quêtes quiet quest export import' },
  { id: 'settings-livres', label: 'Livres', searchText: 'livres books lecture bibliothèque' },
  { id: 'settings-budget', label: 'Budget', searchText: 'budget finance argent dépenses' },
  { id: 'settings-apprentissage', label: 'Apprentissage', searchText: 'apprentissage étude cours flashcards' },
  { id: 'settings-import', label: 'Import', searchText: 'import restauration fusion données sauvegarde json' },
  { id: 'settings-nettoyage', label: 'Nettoyage', searchText: 'nettoyage suppression effacer mock debug cache données' },
  { id: 'settings-navigation', label: 'Navigation', searchText: 'navigation swipe gestes onglets défilement' },
  { id: 'settings-langue', label: 'Langue', searchText: 'langue traduction français anglais locale' },
  { id: 'settings-priere', label: 'Prière', searchText: 'prière horaires localisation adhan quête géolocalisation' },
  { id: 'settings-infos', label: 'Infos', searchText: 'infos informations version aide à propos' },
];

function normalizeForSearch(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

/** Tous les mots de la requête doivent apparaître dans le texte indexé de la section */
function sectionMatchesQuery(query, label, searchText) {
  const q = normalizeForSearch(query);
  if (!q) return true;
  const blob = normalizeForSearch(`${label} ${searchText}`);
  const words = q.split(/\s+/).filter(Boolean);
  return words.every((w) => blob.includes(w));
}

const SettingsTab = () => {
  const { data, updateData, loadFromDB, deleteMockEnduranceSessions, setActiveTab } = useWorkout();
  const { currentUser, updateAvatar, updateProfile, updatePassword, linkAnonymousDataToUser } = useAuth();
  const t = useTranslation();
  const { exportAll: exportGarminData, importAll: importGarminData } = useGarminData();
  const { exportAll: exportNutritionData } = useNutritionData();

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const [settingsSearchQuery, setSettingsSearchQuery] = useState('');

  const { isSectionVisible, showSearchEmptyState } = useMemo(() => {
    const q = settingsSearchQuery.trim();
    if (!q) {
      return { isSectionVisible: () => true, showSearchEmptyState: false };
    }
    const matched = new Set();
    for (const s of SETTINGS_SECTIONS) {
      if (sectionMatchesQuery(q, s.label, s.searchText)) {
        matched.add(s.id);
      }
    }
    return {
      isSectionVisible: (id) => matched.has(id),
      showSearchEmptyState: matched.size === 0,
    };
  }, [settingsSearchQuery]);

  // États locaux pour les modals
  const [showProfileCardSettings, setShowProfileCardSettings] = useState(false);
  const [showHomePageSettings, setShowHomePageSettings] = useState(false);

  // Hooks personnalisés
  const stats = useSettingsStats();
  const swipeSettings = useSwipeSettings();
  const profileSettings = useProfileSettings(
    currentUser,
    updateAvatar,
    updateProfile,
    updatePassword
  );
  const { validateAllWorkoutData } = useDataValidation();
  const cleanupSettings = useDataCleanup(deleteMockEnduranceSessions, loadFromDB, data, t);
  const migrationSettings = useDataMigration(currentUser, linkAnonymousDataToUser);

  const exportSettings = useSettingsExport(
    data,
    loadFromDB,
    exportGarminData,
    exportNutritionData
  );

  const importSettings = useSettingsImport(importGarminData);

  const allDataImportSettings = useAllDataExportImport(
    data,
    loadFromDB,
    updateData,
    validateAllWorkoutData
  );

  // Fonction debug pour les sessions mockées (à extraire si nécessaire)
  const debugMockSessions = () => {
    try {
      const enduranceData = data?.enduranceData || {};
      const sessions = enduranceData.sessions || {};
      const mockSessions = [];
      const validSessions = [];
      
      Object.entries(sessions).forEach(([activityType, activitySessions]) => {
        if (Array.isArray(activitySessions)) {
          activitySessions.forEach(session => {
            const isMock = isMockEnduranceSession(session);
            const sessionInfo = {
              activityType,
              date: session.date,
              duration: session.duration,
              jumps: session.jumps || session.count || session.reps || 0,
              distance: session.distance || 0,
              isMock,
              session: JSON.stringify(session, null, 2)
            };
            
            if (isMock) {
              mockSessions.push(sessionInfo);
            } else {
              validSessions.push(sessionInfo);
            }
          });
        }
      });

      console.group('🔍 [Settings] Debug Sessions Mockées');
      console.log(`📊 Total: ${mockSessions.length + validSessions.length} sessions`);
      console.log(`❌ Mockées: ${mockSessions.length}`, mockSessions);
      console.log(`✅ Valides: ${validSessions.length}`, validSessions);
      console.groupEnd();
    } catch (error) {
      console.error('❌ Erreur lors du debug des sessions mockées:', error);
    }
  };

  // Handlers pour les imports individuels (nécessaires pour les boutons dans les composants)
  const handleImportBooksData = async (jsonData) => {
    try {
      await importSettings.handleImportBooksData(jsonData);
    } catch (error) {
      console.error('Erreur lors de l\'import des Livres:', error);
    }
  };

  const handleImportBudgetData = async (jsonData) => {
    try {
      await importSettings.handleImportBudgetData(jsonData);
    } catch (error) {
      console.error('Erreur lors de l\'import du Budget:', error);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 p-6 space-y-6">
        <style>{`
        .profile-input-dark input[type="email"],
        .profile-input-dark input[type="password"],
        .profile-input-dark input[type="text"] {
          background-color: rgb(51 65 85) !important;
          color: #e2e8f0 !important;
          border-color: #475569 !important;
        }
        .profile-input-dark input[type="email"]:disabled,
        .profile-input-dark input[type="password"]:disabled,
        .profile-input-dark input[type="text"]:disabled {
          background-color: rgb(51 65 85) !important;
          color: #cbd5e1 !important;
          border-color: #475569 !important;
          opacity: 0.7 !important;
        }
      `}</style>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Settings className="mr-3" size={28} />
            ⚙️ Paramètres & Sauvegarde
          </h2>
        </div>

        {/* Recherche dans les paramètres */}
        <div className="mb-4">
          <Input
            id="settings-search"
            type="search"
            variant="search"
            icon={Search}
            placeholder="Rechercher un paramètre (ex. phrases, budget, langue…)"
            value={settingsSearchQuery}
            onChange={(e) => setSettingsSearchQuery(e.target.value)}
            aria-label="Rechercher dans les paramètres"
            className="!bg-slate-800/90 !border-slate-600"
            containerClassName="max-w-xl"
          />
          {settingsSearchQuery.trim() && (
            <p className="mt-2 text-xs text-slate-400">
              Affichage des blocs correspondant à votre recherche. Effacez le champ pour tout afficher.
            </p>
          )}
        </div>

        {/* Ancres : liens rapides vers les sections (filtrées si recherche active) */}
        {SETTINGS_SECTIONS.some(({ id }) => isSectionVisible(id)) && (
        <div className="flex flex-wrap gap-2 mb-6 p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
          {SETTINGS_SECTIONS.filter(({ id }) => isSectionVisible(id)).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-700/80 hover:bg-slate-600/90 hover:text-white rounded-lg transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        )}

        {showSearchEmptyState && (
          <div
            className="mb-6 rounded-xl border border-dashed border-slate-600 bg-slate-800/40 px-4 py-8 text-center text-slate-300"
            role="status"
          >
            Aucun bloc de paramètres ne correspond à « {settingsSearchQuery.trim()} ». Essayez un autre mot ou effacez la recherche.
          </div>
        )}

        {/* Section Mon Profil */}
        {isSectionVisible('settings-profil') && (
        <div id="settings-profil" className="scroll-mt-4">
        <ProfileSettings
          currentUser={currentUser}
          profileSettings={profileSettings}
          setActiveTab={setActiveTab}
          migrationSettings={migrationSettings}
        />
        </div>
        )}

        {isSectionVisible('settings-verrou') && (
        <div id="settings-verrou" className="scroll-mt-4">
          <AppLockSettingsPanel />
        </div>
        )}

        {/* Section Carte de Profil - Image Centrale + Handle */}
        {isSectionVisible('settings-carte') && (
        <div id="settings-carte" className="scroll-mt-4">
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Image className="mr-2" size={20} />
              Image de la Carte de Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Personnalisez l'image centrale qui apparaît sur votre carte de profil dans la sidebar.
              </p>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">À propos :</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Cette image remplace le logo par défaut au centre de votre carte</li>
                  <li>• Formats acceptés : JPG, PNG, GIF, SVG</li>
                  <li>• Taille maximale : 5 MB</li>
                  <li>• L'image est stockée localement dans votre navigateur</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowProfileCardSettings(true)}
                className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2"
              >
                <Image className="w-5 h-5" />
                Gérer l'Image de la Carte
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section Carte de Profil - Handle */}
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <User className="mr-2" size={20} />
              Handle de la Carte (@username)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Personnalisez le @handle qui apparaît dans le rectangle au bas de votre carte de profil.
              </p>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">À propos :</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Ce handle apparaît dans le petit rectangle en bas de la carte</li>
                  <li>• Il est affiché avec le symbole @ automatiquement</li>
                  <li>• Vous pouvez le personnaliser indépendamment de votre nom d'utilisateur</li>
                  <li>• Les modifications sont sauvegardées automatiquement</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowProfileCardSettings(true)}
                className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg w-full flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5" />
                Gérer le Handle de la Carte
              </button>
            </div>
          </CardContent>
        </Card>
        </div>
        )}

        {/* Section Page d'Accueil */}
        {isSectionVisible('settings-accueil') && (
        <div id="settings-accueil" className="scroll-mt-4">
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Image className="mr-2" size={20} />
              Page d'Accueil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Personnalisez les images de fond et les bannières de votre page d'accueil.
              </p>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Fonctionnalités :</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Rotation d'images de fond à chaque interaction</li>
                  <li>• Rotation automatique des bannières toutes les 2 minutes</li>
                  <li>• Import d'images JPG/JPEG depuis vos fichiers</li>
                  <li>• Transitions fluides vers les autres onglets</li>
                  <li>• Stockage local des images dans votre navigateur</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowHomePageSettings(true)}
                className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2"
              >
                <Image className="w-5 h-5" />
                Gérer les Images de la Page d'Accueil
              </button>
            </div>
          </CardContent>
        </Card>
        </div>
        )}

        {/* Section Export/Import Bannières */}
        {isSectionVisible('settings-bannieres') && (
        <div id="settings-bannieres" className="scroll-mt-4">
        <BannerExportImport />
        </div>
        )}

        {/* Section Citations Page d'Accueil */}
        {isSectionVisible('settings-citations') && (
        <div id="settings-citations" className="scroll-mt-4">
        <QuotesErrorBoundary>
          <QuoteManager />
        </QuotesErrorBoundary>
        </div>
        )}

        {/* Section Export */}
        {isSectionVisible('settings-export') && (
        <div id="settings-export" className="scroll-mt-4">
        <ExportSection
          data={data}
          stats={stats}
          exportSettings={exportSettings}
        />
        </div>
        )}

        {/* Sections Export/Import individuelles */}
        {isSectionVisible('settings-quests') && (
        <div id="settings-quests" className="scroll-mt-4">
        <QuietQuestExportImport
          quietQuestStats={stats.quietQuestStats}
          quietQuestExportStatus={exportSettings.quietQuestExportStatus}
          quietQuestImportStatus={importSettings.quietQuestImportStatus}
          handleExportQuietQuest={exportSettings.handleExportQuietQuest}
          handleImportQuietQuest={importSettings.handleImportQuietQuest}
        />
        </div>
        )}

        {isSectionVisible('settings-livres') && (
        <div id="settings-livres" className="scroll-mt-4">
        <BooksExportImport
          booksStats={stats.booksStats}
          booksExportStatus={exportSettings.booksExportStatus}
          booksImportStatus={importSettings.booksImportStatus}
          handleExportBooksData={exportSettings.handleExportBooksData}
          handleImportBooksData={handleImportBooksData}
        />
        </div>
        )}

        {isSectionVisible('settings-budget') && (
        <div id="settings-budget" className="scroll-mt-4">
        <BudgetExportImport
          budgetExportStatus={exportSettings.budgetExportStatus}
          budgetImportStatus={importSettings.budgetImportStatus}
          handleExportBudgetData={exportSettings.handleExportBudgetData}
          handleImportBudgetData={handleImportBudgetData}
        />
        </div>
        )}

        {isSectionVisible('settings-apprentissage') && (
        <div id="settings-apprentissage" className="scroll-mt-4">
        <ApprentissageExportImport
          apprentissageStats={stats.apprentissageStats}
          apprentissageExportStatus={exportSettings.apprentissageExportStatus}
          apprentissageImportStatus={importSettings.apprentissageImportStatus}
          handleExportApprentissage={exportSettings.handleExportApprentissage}
          handleImportApprentissage={importSettings.handleImportApprentissage}
        />
        </div>
        )}

        {/* Section Import */}
        {isSectionVisible('settings-import') && (
        <div id="settings-import" className="scroll-mt-4">
        <ImportSection
          allDataImportSettings={allDataImportSettings}
          importSettings={importSettings}
          restorePreImportBackup={allDataImportSettings.restorePreImportBackup}
        />
        </div>
        )}

        {/* Modals de prévisualisation */}
        <BodyTrackingImportPreviewModal
          showImportPreview={allDataImportSettings.showImportPreview}
          previewData={allDataImportSettings.previewData}
          importStatus={allDataImportSettings.importStatus}
          setShowImportPreview={allDataImportSettings.setShowImportPreview}
          confirmImport={allDataImportSettings.confirmImport}
        />

        <AllDataImportPreviewModal
          showAllDataImportPreview={allDataImportSettings.showAllDataImportPreview}
          allDataPreviewData={allDataImportSettings.allDataPreviewData}
          allDataImportStatus={allDataImportSettings.allDataImportStatus}
          setShowAllDataImportPreview={allDataImportSettings.setShowAllDataImportPreview}
          confirmImportAllData={allDataImportSettings.confirmImportAllData}
        />

        {/* Section Nettoyage des données */}
        {isSectionVisible('settings-nettoyage') && (
        <div id="settings-nettoyage" className="scroll-mt-4">
        <DataCleanupSection
          cleanupSettings={cleanupSettings}
          updateData={updateData}
          debugMockSessions={debugMockSessions}
        />
        </div>
        )}

        {/* Section Navigation */}
        {isSectionVisible('settings-navigation') && (
        <div id="settings-navigation" className="scroll-mt-4">
        <SwipeNavigationSettings swipeSettings={swipeSettings} />
        </div>
        )}

        {/* Section Langue */}
        {isSectionVisible('settings-langue') && (
        <div id="settings-langue" className="scroll-mt-4">
        <LanguageSettings         />
        </div>
        )}

        {/* Section Horaires de prière (quêtes) */}
        {isSectionVisible('settings-priere') && (
        <div id="settings-priere" className="scroll-mt-4">
        <PrayerLocationSettings         />
        </div>
        )}

        {/* Section Informations */}
        {isSectionVisible('settings-infos') && (
        <div id="settings-infos" className="scroll-mt-4">
        <InfoCards />
        </div>
        )}

        {/* Modals */}
        {showHomePageSettings && (
          <HomePageImageSettings onClose={() => setShowHomePageSettings(false)} />
        )}

        <ProfileCardSettings
          username={currentUser?.username || 'guest'}
          isOpen={showProfileCardSettings}
          onClose={() => setShowProfileCardSettings(false)}
        />
      </div>
    </div>
  );
};

export default SettingsTab;
