/**
 * SettingsTab - Composant principal refactorisé
 * 
 * ✅ PHASE 4 : Refactoring complet de SettingsTab.jsx (~3610 lignes → ~358 lignes)
 * 
 * Orchestration uniquement - Toute la logique et l'UI ont été extraites dans des hooks et composants
 * 
 * @module components/tabs/SettingsTab
 */

import React, { useState } from 'react';
import { Settings, Image, User } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../utils/translations';
import { useGarminData } from '../../hooks/useGarminData';
import { useNutritionData } from '../../hooks/useNutritionData';
import { isMockEnduranceSession } from '../../utils/calendarUtils';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';

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

const SettingsTab = () => {
  const { data, updateData, loadFromDB, deleteMockEnduranceSessions, setActiveTab } = useWorkout();
  const { currentUser, updateAvatar, updateProfile, updatePassword, linkAnonymousDataToUser } = useAuth();
  const t = useTranslation();
  const { exportAll: exportGarminData, importAll: importGarminData } = useGarminData();
  const { exportAll: exportNutritionData } = useNutritionData();

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
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Settings className="mr-3" size={28} />
            ⚙️ Paramètres & Sauvegarde
          </h2>
        </div>

        {/* Section Mon Profil */}
        <ProfileSettings
          currentUser={currentUser}
          profileSettings={profileSettings}
          setActiveTab={setActiveTab}
          migrationSettings={migrationSettings}
        />

        {/* Section Carte de Profil - Image Centrale */}
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

        {/* Section Page d'Accueil */}
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

        {/* Section Export/Import Bannières */}
        <BannerExportImport />

        {/* Section Citations Page d'Accueil */}
        <QuotesErrorBoundary>
          <QuoteManager />
        </QuotesErrorBoundary>

        {/* Section Export */}
        <ExportSection
          data={data}
          stats={stats}
          exportSettings={exportSettings}
        />

        {/* Sections Export/Import individuelles */}
        <QuietQuestExportImport
          quietQuestStats={stats.quietQuestStats}
          quietQuestExportStatus={exportSettings.quietQuestExportStatus}
          quietQuestImportStatus={importSettings.quietQuestImportStatus}
          handleExportQuietQuest={exportSettings.handleExportQuietQuest}
          handleImportQuietQuest={importSettings.handleImportQuietQuest}
        />

        <BooksExportImport
          booksStats={stats.booksStats}
          booksExportStatus={exportSettings.booksExportStatus}
          booksImportStatus={importSettings.booksImportStatus}
          handleExportBooksData={exportSettings.handleExportBooksData}
          handleImportBooksData={handleImportBooksData}
        />

        <BudgetExportImport
          budgetExportStatus={exportSettings.budgetExportStatus}
          budgetImportStatus={importSettings.budgetImportStatus}
          handleExportBudgetData={exportSettings.handleExportBudgetData}
          handleImportBudgetData={handleImportBudgetData}
        />

        <ApprentissageExportImport
          apprentissageStats={stats.apprentissageStats}
          apprentissageExportStatus={exportSettings.apprentissageExportStatus}
          apprentissageImportStatus={importSettings.apprentissageImportStatus}
          handleExportApprentissage={exportSettings.handleExportApprentissage}
          handleImportApprentissage={importSettings.handleImportApprentissage}
        />

        {/* Section Import */}
        <ImportSection
          allDataImportSettings={allDataImportSettings}
          importSettings={importSettings}
          restorePreImportBackup={allDataImportSettings.restorePreImportBackup}
        />

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
        <DataCleanupSection
          cleanupSettings={cleanupSettings}
          updateData={updateData}
          debugMockSessions={debugMockSessions}
        />

        {/* Section Navigation */}
        <SwipeNavigationSettings swipeSettings={swipeSettings} />

        {/* Section Langue */}
        <LanguageSettings />

        {/* Section Informations */}
        <InfoCards />

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
