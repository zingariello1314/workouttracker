/**
 * SettingsTab - Composant principal refactorisé
 * 
 * ✅ PHASE 4 : Refactoring complet de SettingsTab.jsx (~3610 lignes → ~358 lignes)
 * 
 * Orchestration uniquement - Toute la logique et l'UI ont été extraites dans des hooks et composants
 * 
 * @module components/tabs/SettingsTab
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Image, User, Search, Watch } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../utils/translations';
import { useGarminData } from '../../hooks/useGarminData';
import { useNutritionData } from '../../hooks/useNutritionData';
import { isMockEnduranceSession } from '../../utils/calendarUtils';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { settingsTheme as settingsUi } from './SettingsTab/settingsThemeClasses';
import { SETTINGS_GROUPS } from './SettingsTab/settingsGroups';
import SettingsGroupFrame from './SettingsTab/components/SettingsGroupFrame';
import './SettingsTab/settingsTones.css';

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
import { useSportExportPreview } from './SettingsTab/hooks/useSportExportPreview';

// Composants
import ProfileSettings from './SettingsTab/components/ProfileSettings';
import ProfileQuizSettings from './SettingsTab/components/ProfileQuizSettings';
import SwipeNavigationSettings from './SettingsTab/components/SwipeNavigationSettings';
import LanguageSettings from './SettingsTab/components/LanguageSettings';
import AppBackgroundSettings from './SettingsTab/components/AppBackgroundSettings';
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
import GithubIntegrationSettings from '../settings/GithubIntegrationSettings';
import SpotifyIntegrationSettings from '../settings/SpotifyIntegrationSettings';
import { consumePendingSettingsScrollSection } from '../../utils/settingsNavigation';
import { isAdminUser } from '../../utils/accessControl';

/** Sections paramètres : ancres + texte indexé pour la recherche (synonymes / termes courants) */
const SETTINGS_SECTIONS = [
  { id: 'settings-quiz', label: 'Quiz', searchText: 'quiz onboarding questionnaire bilan profil personnalisation reprendre générer entraînement nutrition' },
  { id: 'settings-profil', label: 'Profil', searchText: 'profil avatar email vérification code mot de passe compte utilisateur migration données anonyme invité photo nom utilisateur' },
  { id: 'settings-github', label: 'GitHub', searchText: 'github code contributions calendrier oauth jeton pat développeur intégration module dashboard momentum' },
  { id: 'settings-spotify', label: 'Spotify', searchText: 'spotify musique premium oauth lecture player sidebar son en cours piste album api' },
  { id: 'settings-garmin', label: 'Garmin', searchText: 'garmin montre sync synchronisation backfill source comptes multi montres deviceid paramètres' },
  { id: 'settings-verrou', label: 'Verrouillage', searchText: 'verrouillage cadenas code pin mot de passe inactivité sécurité confidentialité session' },
  { id: 'settings-apparence', label: 'Apparence', searchText: 'apparence fond application ambiance visuel arrière-plan animé statique momentum shader thème' },
  { id: 'settings-fonds-ecran', label: 'Fonds d\'écran', searchText: 'fond écran accueil verrouillage arrière-plan wallpaper lock home rotation images bannière' },
  { id: 'settings-carte', label: 'Carte profil', searchText: 'carte profil image handle username bannière sidebar logo' },
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
  { id: 'settings-repos', label: 'Repos dynamique', searchText: 'repos dynamique calendrier swap popup confirmation entraînement sport' },
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
  const {
    data,
    updateData,
    loadFromDB,
    deleteMockEnduranceSessions,
    setActiveTab,
    setSwapRestConfirmEnabled,
    programs,
    activeProgram,
    programHistory,
    weekVariant,
    isGymMode,
    setPrograms,
    setActiveProgram,
    setProgramHistory,
    setWeekVariant,
    setIsGymMode
  } = useWorkout();
  const {
    currentUser,
    updateAvatar,
    updateProfile,
    updatePassword,
    linkAnonymousDataToUser,
    previewAnonymousMigration,
    rollbackAnonymousMigration
  } = useAuth();
  const t = useTranslation();
  const { exportAll: exportGarminData, importAll: importGarminData } = useGarminData();
  const { exportAll: exportNutritionData } = useNutritionData();

  const storageKey = useMemo(() => {
    if (isAdminUser(currentUser)) return 'main';
    if (currentUser?.id) return `user-${currentUser.id}`;
    return 'anonymous';
  }, [currentUser]);

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    const pendingId = consumePendingSettingsScrollSection();
    if (!pendingId) return;
    const group = SETTINGS_GROUPS.find((item) => (
      item.sectionIds.includes(pendingId) || (pendingId === 'settings-profil-quiz' && item.id === 'account')
    ));
    if (group) setActiveGroupId(group.id);
    const t = window.setTimeout(() => scrollToSection(pendingId), 150);
    return () => window.clearTimeout(t);
  }, [scrollToSection]);

  const [settingsSearchQuery, setSettingsSearchQuery] = useState('');
  const [activeGroupId, setActiveGroupId] = useState(SETTINGS_GROUPS[0].id);
  const groupLockUntilRef = useRef(0);

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

  const isGroupVisible = useCallback(
    (group) => group.sectionIds.some((id) => isSectionVisible(id)),
    [isSectionVisible]
  );

  const isGroupShown = useCallback(
    (group) => {
      if (!isGroupVisible(group)) return false;
      if (settingsSearchQuery.trim()) return true;
      return group.id === activeGroupId;
    },
    [isGroupVisible, settingsSearchQuery, activeGroupId]
  );

  useEffect(() => {
    const nodes = SETTINGS_GROUPS
      .map((group) => document.getElementById(`settings-group-${group.id}`))
      .filter(Boolean);
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = hit?.target?.id?.replace('settings-group-', '');
        if (id && Date.now() > groupLockUntilRef.current) setActiveGroupId(id);
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: [0.1, 0.25, 0.5] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [settingsSearchQuery]);

  const focusGroup = useCallback((groupId) => {
    groupLockUntilRef.current = Date.now() + 800;
    setSettingsSearchQuery('');
    setActiveGroupId(groupId);
    scrollToSection(`settings-group-${groupId}`);
  }, [scrollToSection]);

  // États locaux pour les modals
  const [showProfileCardSettings, setShowProfileCardSettings] = useState(false);
  const [showHomePageSettings, setShowHomePageSettings] = useState(false);
  const swapRestConfirmEnabled = data?.trainingPrefs?.swapRestConfirmEnabled !== false;

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
  const migrationSettings = useDataMigration(
    currentUser,
    linkAnonymousDataToUser,
    previewAnonymousMigration,
    rollbackAnonymousMigration
  );

  const liveProgramContext = useMemo(
    () => ({
      programs,
      activeProgram,
      programHistory,
      weekVariant,
      isGymMode
    }),
    [programs, activeProgram, programHistory, weekVariant, isGymMode]
  );

  const applyImportedProgramContext = useCallback(
    (ctx) => {
      if (!ctx) return;
      if (Array.isArray(ctx.programs)) setPrograms(ctx.programs);
      if (ctx.activeProgram !== undefined) setActiveProgram(ctx.activeProgram);
      if (Array.isArray(ctx.programHistory)) setProgramHistory(ctx.programHistory);
      if (ctx.weekVariant != null) setWeekVariant(ctx.weekVariant);
      if (ctx.isGymMode != null) setIsGymMode(ctx.isGymMode);
    },
    [setPrograms, setActiveProgram, setProgramHistory, setWeekVariant, setIsGymMode]
  );

  const exportSettings = useSettingsExport(
    data,
    loadFromDB,
    exportGarminData,
    exportNutritionData,
    { storageKey, currentUser, liveProgramContext }
  );

  const {
    sportPreview,
    sportPreviewLoading,
    garminSummary,
    garminDailyIndex,
    nutritionSummary
  } = useSportExportPreview(data, storageKey, currentUser, {
    exportGarminData,
    exportNutritionData,
    liveProgramContext
  });

  const importSettings = useSettingsImport(importGarminData);

  const allDataImportSettings = useAllDataExportImport(
    data,
    loadFromDB,
    updateData,
    validateAllWorkoutData,
    { storageKey, updateProfile, currentUser, importGarminData, onApplyProgramContext: applyImportedProgramContext }
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
    <div className="settings-page relative min-h-screen">
      <div className="relative z-10 flex items-start gap-5 p-4 md:p-6">
        <nav
          className="sticky top-32 hidden max-h-[calc(100vh-8.5rem)] w-56 shrink-0 overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#14161c]/80 p-3 backdrop-blur-md lg:block"
          aria-label="Familles de paramètres"
        >
          <div className="mb-3 flex items-center gap-2 px-2 text-sm font-semibold text-zinc-100">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
            Momentum
          </div>
          <div className="space-y-1">
            {SETTINGS_GROUPS.filter(isGroupVisible).map((group) => {
              const active = group.id === activeGroupId;
              const count = group.sectionIds.filter((id) => isSectionVisible(id)).length;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => focusGroup(group.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    active ? 'text-zinc-50' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`}
                  style={active ? { background: `color-mix(in srgb, ${group.accent} 18%, transparent)`, color: group.accent } : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: group.accent }}
                      aria-hidden="true"
                    />
                    {group.label}
                  </span>
                  <span className="text-[11px] tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] px-2 pt-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900/70 text-xs font-semibold text-emerald-100">
              {(currentUser?.username || 'G').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-zinc-100">{currentUser?.username || 'guest'}</div>
              <div className="text-[10px] text-zinc-500">{currentUser?.id ? 'Compte' : 'Compte local'}</div>
            </div>
          </div>
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
        <div>
          <Input
            id="settings-search"
            type="search"
            variant="search"
            icon={Search}
            placeholder="Rechercher un paramètre…"
            value={settingsSearchQuery}
            onChange={(e) => setSettingsSearchQuery(e.target.value)}
            aria-label="Rechercher dans les paramètres"
            className="!border-white/10 !bg-[#14161c] !text-zinc-100 placeholder:!text-zinc-500"
            containerClassName="max-w-none"
          />
          {settingsSearchQuery.trim() && (
            <p className="mt-2 text-xs text-zinc-500">
              Seuls les blocs correspondants restent affichés.
            </p>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {SETTINGS_GROUPS.filter(isGroupVisible).map((group) => {
            const active = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => focusGroup(group.id)}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{
                  borderColor: active ? group.accent : 'rgba(255,255,255,0.1)',
                  color: active ? group.accent : '#a1a1aa',
                  background: active ? `color-mix(in srgb, ${group.accent} 16%, transparent)` : 'transparent',
                }}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        {showSearchEmptyState && (
          <div
            className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center text-sm text-zinc-400"
            role="status"
          >
            Aucun bloc de paramètres ne correspond à « {settingsSearchQuery.trim()} ». Essayez un autre mot ou effacez la recherche.
          </div>
        )}

        <SettingsGroupFrame group={SETTINGS_GROUPS[0]} visible={isGroupShown(SETTINGS_GROUPS[0])}>
        {isSectionVisible('settings-quiz') && (
        <div id="settings-quiz" className="scroll-mt-28">
          <ProfileQuizSettings currentUser={currentUser} setActiveTab={setActiveTab} />
        </div>
        )}
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
        </SettingsGroupFrame>

        <SettingsGroupFrame group={SETTINGS_GROUPS[1]} visible={isGroupShown(SETTINGS_GROUPS[1])}>
        {isSectionVisible('settings-github') && (
          <div className="scroll-mt-4">
            <GithubIntegrationSettings currentUser={currentUser} updateProfile={updateProfile} />
          </div>
        )}

        {isSectionVisible('settings-spotify') && (
          <div className="scroll-mt-4">
            <SpotifyIntegrationSettings currentUser={currentUser} updateProfile={updateProfile} />
          </div>
        )}

        {isSectionVisible('settings-garmin') && (
          <div id="settings-garmin" className="scroll-mt-4 lg:col-span-2">
            <Card variant="settings">
              <CardHeader variant="settings">
                <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
                  <Watch className="mr-2 text-red-400" size={20} />
                  Garmin - Parametres des montres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-100/80 mb-4">
                  Configure tes sources Garmin, tes montres et tes backfills dans le sous-onglet Garmin &gt; Parametres.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('garmin.activeSubTab', 'settings');
                    } catch {
                      // Ignore persistence errors
                    }
                    setActiveTab('garmin');
                  }}
                  className={`${settingsUi.btnPrimary} w-full sm:w-auto`}
                >
                  Ouvrir les parametres Garmin
                </button>
              </CardContent>
            </Card>
          </div>
        )}
        </SettingsGroupFrame>

        <SettingsGroupFrame group={SETTINGS_GROUPS[2]} visible={isGroupShown(SETTINGS_GROUPS[2])}>
        {isSectionVisible('settings-apparence') && (
        <div id="settings-apparence" className="scroll-mt-4">
          <AppBackgroundSettings />
        </div>
        )}

        {isSectionVisible('settings-fonds-ecran') && (
        <div id="settings-fonds-ecran" className="scroll-mt-4">
        <Card variant="settings">
          <CardHeader variant="settings">
            <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
              <Image className="mr-2 text-red-400" size={20} />
              Fonds d&apos;écran — accueil &amp; verrouillage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-red-100/80">
                Gérez vos images de fond pour la page d&apos;accueil et l&apos;écran de verrouillage.
                Chaque image peut être assignée à l&apos;un ou aux deux écrans.
              </p>

              <div className={`${settingsUi.inset}`}>
                <h4 className="mb-2 font-medium text-red-100">Fonctionnalités :</h4>
                <ul className="space-y-1 text-sm text-red-100/75">
                  <li>• Plusieurs images avec rotation (vitesse, aléatoire ou dans l&apos;ordre)</li>
                  <li>• Badges Accueil / Verrou par image</li>
                  <li>• Images réservées au verrouillage uniquement</li>
                  <li>• Favoris, masquage et changement au clic (accueil et verrou)</li>
                  <li>• Stockage local dans votre navigateur</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowHomePageSettings(true)}
                className={`${settingsUi.btnPrimary} w-full`}
              >
                <Image className="w-5 h-5" />
                Gérer les fonds d&apos;écran
              </button>
            </div>
          </CardContent>
        </Card>
        </div>
        )}

        {/* Section Carte de Profil - Image Centrale + Handle */}
        {isSectionVisible('settings-carte') && (
        <div id="settings-carte" className="scroll-mt-4">
        <Card variant="settings">
          <CardHeader variant="settings">
            <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
              <Image className="mr-2 text-red-400" size={20} />
              Image de la Carte de Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-red-100/80">
                Personnalisez l'image centrale qui apparaît sur votre carte de profil dans la sidebar.
              </p>
              
              <div className={`${settingsUi.inset}`}>
                <h4 className="mb-2 font-medium text-red-100">À propos :</h4>
                <ul className="space-y-1 text-sm text-red-100/75">
                  <li>• Cette image remplace le logo par défaut au centre de votre carte</li>
                  <li>• Formats acceptés : JPG, PNG, GIF, SVG</li>
                  <li>• Taille maximale : 5 MB</li>
                  <li>• L'image est stockée localement dans votre navigateur</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowProfileCardSettings(true)}
                className={`${settingsUi.btnPrimary} w-full`}
              >
                <Image className="w-5 h-5" />
                Gérer l'Image de la Carte
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section Carte de Profil - Handle */}
        <Card variant="settings">
          <CardHeader variant="settings">
            <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
              <User className="mr-2 text-red-400" size={20} />
              Handle de la Carte (@username)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-red-100/80">
                Personnalisez le @handle qui apparaît dans le rectangle au bas de votre carte de profil.
              </p>
              
              <div className={`${settingsUi.inset}`}>
                <h4 className="mb-2 font-medium text-red-100">À propos :</h4>
                <ul className="space-y-1 text-sm text-red-100/75">
                  <li>• Ce handle apparaît dans le petit rectangle en bas de la carte</li>
                  <li>• Il est affiché avec le symbole @ automatiquement</li>
                  <li>• Vous pouvez le personnaliser indépendamment de votre nom d'utilisateur</li>
                  <li>• Les modifications sont sauvegardées automatiquement</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowProfileCardSettings(true)}
                className={`${settingsUi.btnSecondary} w-full`}
              >
                <User className="w-5 h-5" />
                Gérer le Handle de la Carte
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
        </SettingsGroupFrame>

        <SettingsGroupFrame group={SETTINGS_GROUPS[3]} visible={isGroupShown(SETTINGS_GROUPS[3])}>
        {/* Section Export */}
        {isSectionVisible('settings-export') && (
        <div id="settings-export" className="scroll-mt-4">
        <ExportSection
          data={data}
          stats={stats}
          exportSettings={exportSettings}
          sportPreview={sportPreview}
          sportPreviewLoading={sportPreviewLoading}
          garminSummary={garminSummary}
          garminDailyIndex={garminDailyIndex}
          nutritionSummary={nutritionSummary}
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
        </SettingsGroupFrame>

        <SettingsGroupFrame group={SETTINGS_GROUPS[4]} visible={isGroupShown(SETTINGS_GROUPS[4])}>
        {/* Section Navigation */}
        {isSectionVisible('settings-navigation') && (
        <div id="settings-navigation" className="scroll-mt-4">
        <SwipeNavigationSettings swipeSettings={swipeSettings} />
        </div>
        )}

        {isSectionVisible('settings-repos') && (
        <div id="settings-repos" className="scroll-mt-4">
          <Card variant="settings">
            <CardHeader variant="settings">
              <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
                Jour de repos dynamique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-100/80 mb-4">
                Active ou désactive la popup de confirmation quand l’application propose de déplacer automatiquement le jour de repos hebdomadaire.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const nextEnabled = !swapRestConfirmEnabled;
                  await setSwapRestConfirmEnabled(nextEnabled);
                  if (!nextEnabled) {
                    window.alert('Popup de confirmation désactivée. Les swaps de repos seront appliqués directement.');
                  }
                }}
                className={`${swapRestConfirmEnabled ? settingsUi.btnPrimary : settingsUi.btnSecondary} w-full`}
              >
                {swapRestConfirmEnabled ? 'Popup activée (cliquer pour désactiver)' : 'Popup désactivée (cliquer pour activer)'}
              </button>
            </CardContent>
          </Card>
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
        </SettingsGroupFrame>

        <SettingsGroupFrame group={SETTINGS_GROUPS[5]} visible={isGroupShown(SETTINGS_GROUPS[5])}>
        {/* Section Informations */}
        {isSectionVisible('settings-infos') && (
        <div id="settings-infos" className="scroll-mt-4">
        <InfoCards />
        </div>
        )}
        </SettingsGroupFrame>

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
    </div>
  );
};

export default SettingsTab;
