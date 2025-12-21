import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Settings, Database, FileText, AlertTriangle, CheckCircle, X, Save, RotateCcw, Image, Languages, BookOpen, Mail, Lock, User, Navigation } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarByUserId } from '../../utils/authIndexedDB';
import LanguageSelector from '../ui/LanguageSelector';
import { useTranslation } from '../../utils/translations';
import { useGarminData } from '../../hooks/useGarminData';
import { useNutritionData } from '../../hooks/useNutritionData';
import { compressGarminExport, decompressGarminExport, isCompressed } from './GarminTab/utils/jsonCompression';
import { compressNutritionExport, decompressNutritionExport } from '../../utils/nutritionCompression';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import HomePageImageSettings from '../HomePageImageSettings';
import BannerExportImport from '../BannerExportImport';
import { 
  prepareExportData, 
  downloadExportFile, 
  processImportData,
  validateBodyTrackingData 
} from '../BodyTracking/utils/exportImport';
import { isMockEnduranceSession } from '../../utils/calendarUtils';
import { 
  createDefaultFormState, 
  createDefaultChallengeFormState
} from '../../services/endurance/enduranceFormSchema';
import { ENDURANCE_SCHEMA_VERSION } from '../../services/endurance/enduranceDataService';
import { prepareBooksExportData, processBooksImportData, downloadBooksExportFile } from '../../utils/booksExportImport';
import { getAllBooksFromIndexedDB, saveBooksToIndexedDB } from '../../utils/booksIndexedDB';
import { loadBooks as loadBooksFromLocalStorage, saveBooks as saveBooksToLocalStorage } from '../../utils/booksStorage';
import { prepareBudgetExportData, downloadBudgetExportFile, importBudgetData } from '../../utils/budgetExportImport';
import { exportQuietQuestData, importQuietQuestData, validateQuietQuestExport } from '../../utils/quietQuestExportImport';
import { openQuietQuestDB, loadQuestsFromIndexedDB, loadValidationsFromIndexedDB, loadUserDataFromIndexedDB } from '../../utils/quietQuestIndexedDB';
import { STORAGE_KEYS, loadFromStorage, defaultUserData } from '../../hooks/useQuietQuestEngine';
import { exportApprentissageData, importApprentissageData, previewApprentissageImport, prepareApprentissageExportData } from '../../utils/apprentissageExportImport';
import { getSettings as getSwipeSettings, saveSettings as saveSwipeSettings } from '../../services/swipeNavigationSettings';
import { QuoteManager } from '../quotes/QuoteManager';
import { QuotesErrorBoundary } from '../quotes/QuotesErrorBoundary';
import ProfileCardSettings from '../sidebar/ProfileCardSettings';

const SettingsTab = () => {
  const { data, updateData, loadFromDB, deleteMockEnduranceSessions } = useWorkout();
  const { currentUser, updateAvatar, updateProfile, updatePassword, linkAnonymousDataToUser } = useAuth();
  const t = useTranslation();
  const { exportAll: exportGarminData, importAll: importGarminData } = useGarminData();
  const { exportAll: exportNutritionData } = useNutritionData();
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [importData, setImportData] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [showProfileCardSettings, setShowProfileCardSettings] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showHomePageSettings, setShowHomePageSettings] = useState(false);
  const [garminExportStatus, setGarminExportStatus] = useState(null);
  const [garminImportStatus, setGarminImportStatus] = useState(null);
  const [nutritionExportStatus, setNutritionExportStatus] = useState(null);
  const [booksExportStatus, setBooksExportStatus] = useState(null);
  const [booksImportStatus, setBooksImportStatus] = useState(null);
  const [budgetExportStatus, setBudgetExportStatus] = useState(null);
  const [budgetImportStatus, setBudgetImportStatus] = useState(null);
  const [quietQuestExportStatus, setQuietQuestExportStatus] = useState(null);
  const [quietQuestImportStatus, setQuietQuestImportStatus] = useState(null);
  const [quietQuestStats, setQuietQuestStats] = useState({
    questsCount: 0,
    validationsCount: 0,
    userLevel: 1,
  });
  const [apprentissageExportStatus, setApprentissageExportStatus] = useState(null);
  const [apprentissageImportStatus, setApprentissageImportStatus] = useState(null);
  const [apprentissageStats, setApprentissageStats] = useState({
    subjectsCount: 0,
    sessionsCount: 0,
    globalLevel: 1,
    globalXP: 0,
    totalStudyTime: 0,
  });
  const [booksStats, setBooksStats] = useState({
    totalBooks: 0,
    totalSessions: 0,
    inProgress: 0,
    completed: 0,
  });
  const [allDataImportStatus, setAllDataImportStatus] = useState(null);
  const [showAllDataImportPreview, setShowAllDataImportPreview] = useState(false);
  const [allDataPreviewData, setAllDataPreviewData] = useState(null);
  const [cleanupStatus, setCleanupStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Swipe Navigation Settings
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [swipeThreshold, setSwipeThreshold] = useState(100);
  const [swipeSettingsStatus, setSwipeSettingsStatus] = useState(null); // 'success' | 'error' | null

  // Profil / avatar
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [avatarStatus, setAvatarStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const avatarFileRef = useRef(null);
  const [migrationStatus, setMigrationStatus] = useState(null); // 'idle' | 'loading' | 'success' | 'error'
  const [migrationProgress, setMigrationProgress] = useState({ current: 0, total: 0, message: '' });

  // Mon profil
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const [emailError, setEmailError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const [passwordError, setPasswordError] = useState('');

  const usernameInitial = currentUser?.username?.charAt(0).toUpperCase() || 'M';

  // Charger l'avatar et l'email au chargement
  useEffect(() => {
    if (!currentUser?.id) {
      setAvatarPreviewUrl(null);
      setEmail('');
      return;
    }

    // Charger l'avatar
    let revokedUrl = null;
    const loadAvatar = async () => {
      const record = await getAvatarByUserId(currentUser.id);
      if (record && record.blob) {
        const url = URL.createObjectURL(record.blob);
        revokedUrl = url;
        setAvatarPreviewUrl(url);
      } else {
        setAvatarPreviewUrl(null);
      }
    };
    loadAvatar().catch(() => {
      setAvatarPreviewUrl(null);
    });

    // Charger l'email
    setEmail(currentUser.email || '');
    setConfirmEmail('');
    // Réinitialiser les mots de passe
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    return () => {
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [currentUser?.id, currentUser?.email]);

  // Charger les paramètres de swipe navigation au montage
  useEffect(() => {
    const settings = getSwipeSettings();
    setSwipeEnabled(settings.enabled);
    setSwipeThreshold(settings.threshold);
  }, []);

  // Charger les stats QuietQuest et Livres au montage
  useEffect(() => {
    const loadQuietQuestStats = async () => {
      try {
        const db = await openQuietQuestDB();
        if (db) {
          const quests = await loadQuestsFromIndexedDB(db, 'main');
          const validations = await loadValidationsFromIndexedDB(db, 'main');
          const userData = await loadUserDataFromIndexedDB(db, 'main');
          setQuietQuestStats({
            questsCount: quests.length,
            validationsCount: validations.length,
            userLevel: userData?.level || 1,
          });
        } else {
          // Fallback localStorage
          const quests = loadFromStorage(STORAGE_KEYS.quests, []);
          const validations = loadFromStorage(STORAGE_KEYS.validations, []);
          const userData = loadFromStorage(STORAGE_KEYS.userData, defaultUserData);
          setQuietQuestStats({
            questsCount: quests.length,
            validationsCount: validations.length,
            userLevel: userData?.level || 1,
          });
        }
      } catch (error) {
        console.error('[SettingsTab] Erreur chargement stats QuietQuest:', error);
      }
    };

    const loadBooksStats = async () => {
      try {
        let books = [];
        try {
          const indexedBooks = await getAllBooksFromIndexedDB();
          if (Array.isArray(indexedBooks) && indexedBooks.length > 0) {
            books = indexedBooks;
          } else {
            books = loadBooksFromLocalStorage();
          }
        } catch {
          books = loadBooksFromLocalStorage();
        }

        const totalSessions = books.reduce((sum, book) => sum + (book.sessions?.length || 0), 0);
        const inProgress = books.filter(b => b.status === 'in-progress').length;
        const completed = books.filter(b => b.status === 'completed').length;

        setBooksStats({
          totalBooks: books.length,
          totalSessions,
          inProgress,
          completed,
        });
      } catch (error) {
        console.error('[SettingsTab] Erreur chargement stats Livres:', error);
      }
    };

    const loadApprentissageStats = async () => {
      try {
        const exportData = await prepareApprentissageExportData('main');
        setApprentissageStats({
          subjectsCount: exportData.subjects?.length || 0,
          sessionsCount: exportData.sessionsHistory?.length || 0,
          globalLevel: exportData.progression?.globalLevel || 1,
          globalXP: exportData.progression?.globalXP || 0,
          totalStudyTime: exportData.progression?.totalStudyTime || 0,
        });
      } catch (error) {
        console.error('[SettingsTab] Erreur chargement stats Apprentissage:', error);
      }
    };

    loadQuietQuestStats();
    loadBooksStats();
    loadApprentissageStats();
  }, []);

  const handleAvatarChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !currentUser) return;

    setAvatarStatus('loading');
    try {
      const result = await updateAvatar(file);
      if (result.success) {
        if (avatarPreviewUrl) {
          URL.revokeObjectURL(avatarPreviewUrl);
        }
        const url = URL.createObjectURL(file);
        setAvatarPreviewUrl(url);
        setAvatarStatus('success');
        setTimeout(() => setAvatarStatus(null), 3000);
      } else {
        setAvatarStatus('error');
        setTimeout(() => setAvatarStatus(null), 3000);
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur lors de la mise à jour de l\'avatar:', error);
      setAvatarStatus('error');
      setTimeout(() => setAvatarStatus(null), 3000);
    }
  };

  const handleEmailUpdate = async () => {
    if (!currentUser || !email || !confirmEmail) {
      setEmailError('Tous les champs sont requis');
      setEmailStatus('error');
      return;
    }

    if (email !== confirmEmail) {
      setEmailError('Les adresses email ne correspondent pas');
      setEmailStatus('error');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Adresse email invalide');
      setEmailStatus('error');
      return;
    }

    setEmailError('');
    setEmailStatus('loading');
    try {
      const result = await updateProfile({ email });
      if (result.success) {
        setEmailStatus('success');
        setConfirmEmail('');
        setTimeout(() => {
          setEmailStatus(null);
        }, 3000);
      } else {
        setEmailError('Erreur lors de la mise à jour de l\'email');
        setEmailStatus('error');
        setTimeout(() => {
          setEmailStatus(null);
          setEmailError('');
        }, 5000);
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur lors de la mise à jour de l\'email:', error);
      setEmailError('Erreur lors de la mise à jour de l\'email');
      setEmailStatus('error');
      setTimeout(() => {
        setEmailStatus(null);
        setEmailError('');
      }, 5000);
    }
  };

  const handlePasswordUpdate = async () => {
    // Validation stricte : tous les champs doivent être remplis
    if (!currentUser) {
      setPasswordError('Vous devez être connecté');
      setPasswordStatus('error');
      return;
    }

    if (!oldPassword || oldPassword.trim() === '') {
      setPasswordError('L\'ancien mot de passe est requis');
      setPasswordStatus('error');
      return;
    }

    if (!newPassword || newPassword.trim() === '') {
      setPasswordError('Le nouveau mot de passe est requis');
      setPasswordStatus('error');
      return;
    }

    if (!confirmPassword || confirmPassword.trim() === '') {
      setPasswordError('La confirmation du mot de passe est requise');
      setPasswordStatus('error');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      setPasswordStatus('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      setPasswordStatus('error');
      return;
    }

    // Vider les erreurs précédentes
    setPasswordError('');
    setPasswordStatus('loading');
    
    try {
      // La fonction updatePassword vérifie l'ancien mot de passe
      // Si incorrect, elle retourne { success: false, error: 'INVALID_OLD_PASSWORD' }
      const result = await updatePassword(oldPassword, newPassword);
      
      if (result.success) {
        // Succès : vider tous les champs
        setPasswordStatus('success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setTimeout(() => {
          setPasswordStatus(null);
        }, 3000);
      } else {
        // Erreur : bloquer et afficher le message
        if (result.error === 'INVALID_OLD_PASSWORD') {
          setPasswordError('❌ Ancien mot de passe incorrect. Impossible de changer le mot de passe.');
          // Ne pas vider l'ancien mot de passe pour que l'utilisateur puisse réessayer
        } else {
          setPasswordError('Erreur lors de la mise à jour du mot de passe');
        }
        setPasswordStatus('error');
        setTimeout(() => {
          setPasswordStatus(null);
          // Garder l'erreur visible plus longtemps
        }, 7000);
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur lors de la mise à jour du mot de passe:', error);
      setPasswordError('Erreur lors de la mise à jour du mot de passe');
      setPasswordStatus('error');
      setTimeout(() => {
        setPasswordStatus(null);
        setPasswordError('');
      }, 5000);
    }
  };

  const handleMigrateData = async () => {
    if (!currentUser) return;
    setMigrationStatus('loading');
    setMigrationProgress({ current: 0, total: 5, message: 'Démarrage de la migration...' });
    
    const onProgress = (current, total, message) => {
      setMigrationProgress({ current, total, message });
    };
    
    try {
      const result = await linkAnonymousDataToUser(onProgress);
      if (result.success) {
        setMigrationStatus('success');
        const totalMigrated = 
          (result.migratedBooks || 0) + 
          (result.migratedNutrition || 0) + 
          (result.migratedBodyTracking || 0) + 
          (result.migratedGarmin || 0) + 
          (result.migratedPrograms || 0);
        setMigrationProgress({ 
          current: 5, 
          total: 5, 
          message: `Migration terminée : ${totalMigrated} entrées migrées au total` 
        });
      } else {
        setMigrationStatus('error');
        setMigrationProgress({ current: 0, total: 0, message: 'Erreur lors de la migration' });
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur lors de la migration des données:', error);
      setMigrationStatus('error');
      setMigrationProgress({ current: 0, total: 0, message: 'Erreur lors de la migration' });
    } finally {
      setTimeout(() => {
        setMigrationStatus(null);
        setMigrationProgress({ current: 0, total: 0, message: '' });
      }, 5000);
    }
  };

  // Gestionnaire pour activer/désactiver le swipe
  const handleSwipeEnabledChange = (enabled) => {
    setSwipeEnabled(enabled);
    const success = saveSwipeSettings({
      enabled,
      threshold: swipeThreshold,
      velocityThreshold: 0.5,
    });
    
    if (success) {
      // Dispatch custom event to notify HomePage of settings change
      window.dispatchEvent(new CustomEvent('swipeSettingsUpdated'));
      setSwipeSettingsStatus('success');
      setTimeout(() => setSwipeSettingsStatus(null), 2000);
    } else {
      setSwipeSettingsStatus('error');
      setTimeout(() => setSwipeSettingsStatus(null), 3000);
    }
  };

  // Gestionnaire pour changer le threshold
  const handleSwipeThresholdChange = (threshold) => {
    setSwipeThreshold(threshold);
    const success = saveSwipeSettings({
      enabled: swipeEnabled,
      threshold,
      velocityThreshold: 0.5,
    });
    
    if (success) {
      // Dispatch custom event to notify HomePage of settings change
      window.dispatchEvent(new CustomEvent('swipeSettingsUpdated'));
      setSwipeSettingsStatus('success');
      setTimeout(() => setSwipeSettingsStatus(null), 2000);
    } else {
      setSwipeSettingsStatus('error');
      setTimeout(() => setSwipeSettingsStatus(null), 3000);
    }
  };

  const buildEnduranceExportStats = (enduranceData = {}) => {
    const sessions = enduranceData.sessions || {};
    const getList = (type) => (Array.isArray(sessions[type]) ? sessions[type] : []);

    const perTypeCounts = {
      boxing: getList('boxing').length,
      pushups: getList('pushups').length,
      swimming: getList('swimming').length,
      jumprope: getList('jumprope').length,
      running: getList('running').length
    };

    const totalSessions = Object.values(perTypeCounts).reduce((sum, count) => sum + count, 0);

    const swimmingDetail = getList('swimming').reduce(
      (acc, session) => {
        if (Array.isArray(session?.laps) && session.laps.length > 0) acc.withLaps += 1;
        if (session?.pace100m) acc.withPace100m += 1;
        if (session?.heartRate !== undefined && session.heartRate !== null) acc.withHeartRate += 1;
        if (session?.calories !== undefined && session.calories !== null) acc.withCalories += 1;
        return acc;
      },
      { withLaps: 0, withPace100m: 0, withHeartRate: 0, withCalories: 0 }
    );

    const jumpropeDetail = getList('jumprope').reduce(
      (acc, session) => {
        if (session?.durationSec) acc.withDurationSec += 1;
        if (session?.jumpsPerMin) acc.withJumpsPerMin += 1;
        if (session?.hrMax || session?.hrAvg) acc.withHeartRate += 1;
        return acc;
      },
      { withDurationSec: 0, withJumpsPerMin: 0, withHeartRate: 0 }
    );

    const challenges = Array.isArray(enduranceData.challenges) ? enduranceData.challenges : [];
    const challengeStats = challenges.reduce(
      (acc, challenge) => {
        const status = challenge?.status || 'unknown';
        acc.byStatus[status] = (acc.byStatus[status] || 0) + 1;
        return acc;
      },
      { total: challenges.length, byStatus: {} }
    );

    return {
      schemaVersion: enduranceData.schemaVersion || ENDURANCE_SCHEMA_VERSION,
      lastUpdated: enduranceData.lastUpdated || null,
      totalSessions,
      perTypeCounts,
      swimmingDetail,
      jumpropeDetail,
      challenges: challengeStats
    };
  };

  // Fonction pour exporter spécifiquement les données de suivi corporel (OPTIMISÉE)
  const exportBodyTrackingData = async () => {
    try {
      setExportStatus('loading');
      
      // Récupérer les données les plus récentes
      const currentData = await loadFromDB();
      const dataToExport = currentData || data;
      
      // Préparer les données avec le module optimisé
      const bodyTrackingData = {
        progressPhotos: dataToExport.progressPhotos || [],
        progressEntries: dataToExport.progressEntries || [],
        bodyTrackingReminders: dataToExport.bodyTrackingReminders || [],
        bodyTrackingLastUpdated: dataToExport.bodyTrackingLastUpdated || null
      };
      
      // Utiliser le module d'export optimisé
      const exportData = prepareExportData(bodyTrackingData, {
        includePhotos: true,
        compressPhotos: false, // Photos déjà compressées lors de l'ajout
        includeMetadata: true,
        includeReminders: true
      });
      
      // Télécharger le fichier
      const result = await downloadExportFile(exportData);
      
      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export du suivi corporel:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // Fonction pour exporter toutes les données
  const exportAllData = async () => {
    try {
      setExportStatus('loading');
      
      // Récupérer les données les plus récentes
      const currentData = await loadFromDB();
      const dataToExport = currentData || data;
      
      // ✅ INTÉGRATION NUTRITION : Récupérer les données nutrition
      let nutritionData = null;
      try {
        nutritionData = await exportNutritionData();
      } catch (nutritionError) {
        console.warn('⚠️ Erreur récupération données nutrition pour export global:', nutritionError);
        // Ne pas bloquer l'export si nutrition échoue
      }
      
      // Récupérer les données Livres (IndexedDB → fallback localStorage)
      let booksForExport = [];
      try {
        const indexedBooks = await getAllBooksFromIndexedDB();
        if (Array.isArray(indexedBooks) && indexedBooks.length > 0) {
          booksForExport = indexedBooks;
        } else {
          booksForExport = loadBooksFromLocalStorage();
        }
      } catch (booksError) {
        console.warn('⚠️ Erreur récupération données Livres pour export global:', booksError);
        try {
          booksForExport = loadBooksFromLocalStorage();
        } catch {
          booksForExport = [];
        }
      }

      const booksExport = prepareBooksExportData(booksForExport, {
        includeSessions: true,
        includeMetadata: true
      });

      // Ajouter des métadonnées complètes
      const exportObject = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'Workout Tracker',
        data: dataToExport,
        metadata: {
          // Données d'entraînement
          totalExercises: Object.keys(dataToExport.checkedExercises || {}).length,
          totalReps: Object.keys(dataToExport.reps || {}).length,
          totalStretches: Object.keys(dataToExport.checkedStretches || {}).length,
          historyReps: Object.keys(dataToExport.historyReps || {}).length,
          
          // Données de suivi corporel
          progressPhotos: (dataToExport.progressPhotos || []).length,
          progressEntries: (dataToExport.progressEntries || []).length,
          bodyTrackingReminders: (dataToExport.bodyTrackingReminders || []).length,
          bodyTrackingLastUpdated: dataToExport.bodyTrackingLastUpdated || null,
          
          // Statistiques détaillées du suivi corporel
          bodyTrackingStats: {
            photosWithWeight: (dataToExport.progressPhotos || []).filter(p => p.weight).length,
            photosWithNotes: (dataToExport.progressPhotos || []).filter(p => p.notes).length,
            photosWithMeasurements: (dataToExport.progressPhotos || []).filter(p => p.measurements && Object.keys(p.measurements).length > 0).length,
            entriesByType: (dataToExport.progressEntries || []).reduce((acc, entry) => {
              acc[entry.type] = (acc[entry.type] || 0) + 1;
              return acc;
            }, {}),
            dateRange: {
              earliest: (dataToExport.progressPhotos || []).concat(dataToExport.progressEntries || [])
                .map(item => item.date).sort()[0] || null,
              latest: (dataToExport.progressPhotos || []).concat(dataToExport.progressEntries || [])
                .map(item => item.date).sort().reverse()[0] || null
            }
          },
          
          // Données de la page d'accueil (maintenant gérées par useHomepageImages indépendant)
          homepageBackgroundImages: 0, // Système indépendant
          homepageBannerImages: 0, // Système indépendant
          homepageLastUpdated: null, // Système indépendant
          
          // Données d'endurance
          enduranceSummary: buildEnduranceExportStats(dataToExport.enduranceData || {}),
          enduranceLastUpdated: dataToExport.enduranceData?.lastUpdated || null,
          enduranceSchemaVersion: dataToExport.enduranceData?.schemaVersion || ENDURANCE_SCHEMA_VERSION,
          enduranceChallenges: (dataToExport.enduranceData?.challenges || []).length,
          
          // ✅ NOUVEAU : Justifications des jours sans activité
          dayJustifications: {
            total: Object.keys(dataToExport.dayJustifications || {}).length,
            byReason: Object.values(dataToExport.dayJustifications || {}).reduce((acc, justification) => {
              const reason = justification?.reason || 'autre';
              acc[reason] = (acc[reason] || 0) + 1;
              return acc;
            }, {}),
            dateRange: (() => {
              const dates = Object.keys(dataToExport.dayJustifications || {}).sort();
              return {
                earliest: dates[0] || null,
                latest: dates[dates.length - 1] || null
              };
            })(),
            version: dataToExport.dayJustificationsVersion || '1.0'
          },
          enduranceSessionsLegacyKeys: {
            pushupSessions: Array.isArray(dataToExport.enduranceData?.pushupSessions) ? dataToExport.enduranceData.pushupSessions.length : 0,
            boxingSessions: Array.isArray(dataToExport.enduranceData?.boxingSessions) ? dataToExport.enduranceData.boxingSessions.length : 0,
            swimmingSessions: Array.isArray(dataToExport.enduranceData?.swimmingSessions) ? dataToExport.enduranceData.swimmingSessions.length : 0,
            jumpropeSessions: Array.isArray(dataToExport.enduranceData?.jumpropeSessions) ? dataToExport.enduranceData.jumpropeSessions.length : 0,
            runningSessions: Array.isArray(dataToExport.enduranceData?.runningSessions) ? dataToExport.enduranceData.runningSessions.length : 0
          },
          
          // Configuration et historique
          startDate: dataToExport.startDate,
          weekVariant: dataToExport.weekVariant,
          programHistory: (dataToExport.programHistory || []).length,
          
          // ✅ Données Nutrition (si disponibles)
          nutritionSummary: nutritionData ? {
            totalDailyMeals: nutritionData.metadata?.totalDailyMeals || 0,
            totalMeals: nutritionData.metadata?.totalMeals || 0,
            totalPrograms: nutritionData.metadata?.totalPrograms || 0,
            totalFavoriteFoods: nutritionData.metadata?.totalFavoriteFoods || 0,
            dateRange: nutritionData.metadata?.dateRange || null,
            activeProgram: nutritionData.programs?.find(p => p.isActive)?.name || null
          } : null,
          
          // Statistiques générales
          totalDataPoints: Object.keys(dataToExport).length,
          exportSize: JSON.stringify(dataToExport).length,

          // ✅ Données Livres
          booksSummary: {
            totalBooks: booksExport.metadata?.totalBooks || 0,
            totalSessions: booksExport.metadata?.totalSessions || 0,
            statuses: booksExport.metadata?.statuses || { 'in-progress': 0, completed: 0 },
            dateRange: booksExport.metadata?.dateRange || { earliest: null, latest: null },
            estimatedSizeKB: booksExport.metadata?.estimatedSizeKB || 0
          }
        }
      };
      
      // ✅ Ajouter les données nutrition dans l'export si disponibles
      if (nutritionData) {
        exportObject.data.nutritionData = nutritionData;
      }

      // ✅ Ajouter les données Livres dans l'export global (structure complète)
      exportObject.data.booksData = booksExport;
      
      // ✅ Ajouter les données Budget Personnel dans l'export global si disponibles
      try {
        const budgetExport = await prepareBudgetExportData({
          includeHistory: true,
          includeMetadata: true,
          includeCalculations: false
        });
        exportObject.data.budgetData = budgetExport;
        exportObject.metadata.budgetSummary = {
          categories: budgetExport.summary?.categories?.total || 0,
          depenses: budgetExport.summary?.depenses?.total || 0,
          depensesPlanifiees: budgetExport.summary?.depensesPlanifiees?.total || 0,
          chargesFixes: budgetExport.summary?.chargesFixes?.total || 0,
          estimatedSizeKB: budgetExport.metadata?.estimatedSizeKB || 0
        };
      } catch (budgetError) {
        console.warn('⚠️ Erreur récupération données Budget pour export global:', budgetError);
        // Continue sans Budget si erreur
      }

      // Créer le fichier JSON
      const jsonString = JSON.stringify(exportObject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Créer le lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `workout-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
      
    } catch (error) {
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // Fonction pour exporter les données Nutrition
  const handleExportNutritionData = async (useCompression = true) => {
    try {
      setNutritionExportStatus('loading');
      const nutritionData = await exportNutritionData();
      
      // Calculer statistiques pour métadonnées
      const totalMeals = nutritionData.meals?.length || 0;
      const totalDailyMeals = nutritionData.dailyMeals?.length || 0;
      const activeProgram = nutritionData.programs?.find(p => p.isActive) || null;
      
      // Calculer statistiques détaillées
      const mealsByType = (nutritionData.meals || []).reduce((acc, meal) => {
        acc[meal.type] = (acc[meal.type] || 0) + 1;
        return acc;
      }, {});
      
      const totalCalories = (nutritionData.meals || []).reduce((sum, meal) => 
        sum + (meal.totalCalories || 0), 0
      );
      
      const dateRange = nutritionData.metadata?.dateRange || null;

      const exportObject = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportType: 'Nutrition Data',
        appName: 'Workout Tracker - Nutrition',
        data: nutritionData,
        metadata: {
          // Compteurs
          totalDailyMeals: totalDailyMeals,
          totalMeals: totalMeals,
          totalPrograms: nutritionData.programs?.length || 0,
          totalFavoriteFoods: nutritionData.favoriteFoods?.length || 0,
          
          // Statistiques détaillées
          mealsByType: mealsByType,
          totalCalories: totalCalories,
          activeProgram: activeProgram ? {
            id: activeProgram.id,
            name: activeProgram.name,
            goal: activeProgram.goal,
            targetCalories: activeProgram.targetCalories
          } : null,
          
          // Plage de dates
          dateRange: dateRange,
          
          // Champs inclus
          fieldsIncluded: {
            dailyMeals: ['date', 'programId', 'isComplete', 'mealIds', 'dailyTotals', 'lastModified', 'version'], // ✅ Phase 15.3 : Ajout champ version pour optimistic locking
            meals: ['id', 'date', 'type', 'timestamp', 'foods', 'totalCalories', 'totalProtein', 'totalCarbs', 'totalFat', 'notes', 'version'], // ✅ Phase 15.3 : Ajout champ version
            programs: ['id', 'name', 'isActive', 'goal', 'targetCalories', 'targetProtein', 'targetCarbs', 'targetFat', 'startDate', 'version'], // ✅ Phase 15.3 : Ajout champ version
            favoriteFoods: ['id', 'name', 'category', 'isFavorite', 'caloriesPer100', 'proteinPer100', 'carbsPer100', 'fatPer100', 'usageCount'],
            hydrationLogs: ['date', 'waterIntake', 'targetWater', 'entries', 'notes', 'lastModified'],
            progressPhotos: ['id', 'type', 'date', 'sequenceId', 'timestamp', 'thumbnail', 'format', 'metadata'],
            mlModels: ['id', 'type', 'version', 'timestamp', 'isActive', 'modelConfig', 'stats', 'metadata']
          },
          
          // Notes
          notes: {
            structure: 'Données nutrition exportées depuis IndexedDB (stores séparés)',
            compatibility: 'Export compatible avec import. Toutes les données sont préservées.',
            version: 'Version 1.0 - Structure optimisée avec stores séparés'
          }
        }
      };

      // Compression optionnelle (comme Garmin)
      const compressedExport = useCompression 
        ? await compressNutritionExport(exportObject, {
            level: 6, // Bon compromis vitesse/taille
            force: false // Compression automatique si > 1KB
          })
        : { compressed: false, data: JSON.stringify(exportObject, null, 2) };

      const jsonString = compressedExport.compressed
        ? JSON.stringify(compressedExport, null, 2)
        : compressedExport.data;

      const blob = new Blob([jsonString], { 
        type: compressedExport.compressed 
          ? 'application/json+gzip' 
          : 'application/json' 
      });
      const url = URL.createObjectURL(blob);

      // Créer le lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = compressedExport.compressed ? '.json.gz' : '.json';
      link.download = `nutrition-data-export-${new Date().toISOString().split('T')[0]}${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log compression stats si compressé
      if (compressedExport.compressed) {
        console.log(`[Settings] Export Nutrition compressé: ${compressedExport.originalSize} → ${compressedExport.compressedSize} bytes (${compressedExport.savings.toFixed(1)}% économisés) - Méthode: ${compressedExport.method || 'pako'}`);
      }

      setNutritionExportStatus('success');
      setTimeout(() => setNutritionExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export Nutrition:', error);
      setNutritionExportStatus('error');
      setTimeout(() => setNutritionExportStatus(null), 3000);
    }
  };

  // Fonction pour exporter les données Livres
  const handleExportBooksData = async () => {
    try {
      setBooksExportStatus('loading');
      
      // Récupérer les livres depuis IndexedDB (fallback localStorage)
      let booksForExport = [];
      try {
        const indexedBooks = await getAllBooksFromIndexedDB();
        if (Array.isArray(indexedBooks) && indexedBooks.length > 0) {
          booksForExport = indexedBooks;
        } else {
          booksForExport = loadBooksFromLocalStorage();
        }
      } catch (booksError) {
        console.warn('⚠️ Erreur récupération données Livres pour export:', booksError);
        try {
          booksForExport = loadBooksFromLocalStorage();
        } catch {
          booksForExport = [];
        }
      }

      if (booksForExport.length === 0) {
        alert('Aucun livre à exporter.');
        setBooksExportStatus(null);
        return;
      }

      // Préparer l'export
      const booksExport = prepareBooksExportData(booksForExport, {
        includeSessions: true,
        includeMetadata: true
      });

      // Télécharger le fichier
      downloadBooksExportFile(booksExport);

      setBooksExportStatus('success');
      setTimeout(() => setBooksExportStatus(null), 3000);
      
    } catch (error) {
      console.error('❌ Erreur export Livres:', error);
      setBooksExportStatus('error');
      setTimeout(() => setBooksExportStatus(null), 3000);
    }
  };

  // ✅ Fonction pour exporter les données Budget Personnel
  const handleExportBudgetData = async () => {
    try {
      setBudgetExportStatus('loading');
      
      // Préparer l'export Budget
      const budgetExport = await prepareBudgetExportData({
        includeHistory: true,
        includeMetadata: true,
        includeCalculations: false
      });
      
      // Télécharger le fichier
      downloadBudgetExportFile(budgetExport);
      
      setBudgetExportStatus('success');
      setTimeout(() => setBudgetExportStatus(null), 3000);
      
    } catch (error) {
      console.error('❌ Erreur export Budget:', error);
      setBudgetExportStatus('error');
      setTimeout(() => setBudgetExportStatus(null), 3000);
    }
  };
  
  // ✅ Fonction pour importer les données Budget Personnel
  const handleImportBudgetData = async (jsonData) => {
    try {
      setBudgetImportStatus('loading');
      
      let parsed;
      if (typeof jsonData === 'string') {
        parsed = JSON.parse(jsonData);
      } else {
        parsed = jsonData;
      }
      
      // Importer les données
      const result = await importBudgetData(parsed, {
        merge: false,
        overwrite: true,
        validate: true
      });
      
      const totalImported = 
        result.imported.budget +
        result.imported.categories +
        result.imported.depenses +
        result.imported.depensesPlanifiees +
        result.imported.chargesFixes;
      
      if (totalImported === 0 && result.errors.length > 0) {
        throw new Error(result.errors.join(', '));
      }
      
      console.log(`[Settings] ✅ Import Budget réussi (${totalImported} éléments importés)`);
      setBudgetImportStatus('success');
      setTimeout(() => {
        setBudgetImportStatus(null);
        // Recharger la page pour voir les changements
        if (window.confirm(`${totalImported} élément(s) Budget importé(s) avec succès ! Voulez-vous recharger la page pour voir les changements ?`)) {
          window.location.reload();
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erreur import Budget:', error);
      setBudgetImportStatus('error');
      alert(`Erreur lors de l'import du Budget : ${error.message}`);
      setTimeout(() => setBudgetImportStatus(null), 3000);
    }
  };

  // Fonction pour importer les données Livres
  const handleImportBooksData = async (jsonData) => {
    try {
      setBooksImportStatus('loading');
      
      let parsed;
      if (typeof jsonData === 'string') {
        parsed = JSON.parse(jsonData);
      } else {
        parsed = jsonData;
      }

      // Traiter l'import
      const result = processBooksImportData(parsed);

      if (!result.valid) {
        throw new Error(result.errors?.join(', ') || 'Erreur de validation des données Livres');
      }

      if (result.books.length === 0) {
        throw new Error('Aucun livre valide trouvé dans le fichier');
      }

      // Sauvegarder dans IndexedDB
      const indexedOk = await saveBooksToIndexedDB(result.books);
      
      if (indexedOk) {
        console.log(`[Settings] ✅ Import Livres réussi (${result.books.length} livres restaurés dans IndexedDB)`);
        setBooksImportStatus('success');
        setTimeout(() => {
          setBooksImportStatus(null);
          // Recharger la page pour voir les changements
          if (window.confirm(`${result.books.length} livre(s) importé(s) avec succès ! Voulez-vous recharger la page pour voir les changements ?`)) {
            window.location.reload();
          }
        }, 2000);
      } else {
        throw new Error('Échec de la sauvegarde dans IndexedDB');
      }
      
    } catch (error) {
      console.error('❌ Erreur import Livres:', error);
      setBooksImportStatus('error');
      alert(`Erreur lors de l'import des Livres : ${error.message}`);
      setTimeout(() => setBooksImportStatus(null), 3000);
    }
  };

  // Fonction pour exporter les données QuietQuest
  const handleExportQuietQuest = async () => {
    try {
      setQuietQuestExportStatus('loading');
      const exportData = await exportQuietQuestData({ includeMetadata: true });
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quietquest-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setQuietQuestExportStatus('success');
      setTimeout(() => setQuietQuestExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export QuietQuest:', error);
      setQuietQuestExportStatus('error');
      setTimeout(() => setQuietQuestExportStatus(null), 3000);
    }
  };

  // Fonction pour importer les données QuietQuest
  const handleImportQuietQuest = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        setQuietQuestImportStatus('loading');
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        const jsonData = JSON.parse(text);
        if (!validateQuietQuestExport(jsonData)) {
          throw new Error('Format d\'export invalide');
        }
        await importQuietQuestData(jsonData, { mode: 'replace', createBackup: true });
        setQuietQuestImportStatus('success');
        setTimeout(() => {
          setQuietQuestImportStatus(null);
          if (window.confirm('Import réussi ! Voulez-vous recharger la page pour voir les changements ?')) {
            window.location.reload();
          }
        }, 2000);
      } catch (error) {
        console.error('❌ Erreur import QuietQuest:', error);
        setQuietQuestImportStatus('error');
        alert(`Erreur lors de l'import : ${error.message}`);
        setTimeout(() => setQuietQuestImportStatus(null), 3000);
      }
    };
    input.click();
  };

  // Fonction pour exporter les données Apprentissage
  const handleExportApprentissage = async () => {
    try {
      setApprentissageExportStatus('loading');
      await exportApprentissageData();
      setApprentissageExportStatus('success');
      setTimeout(() => setApprentissageExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export Apprentissage:', error);
      setApprentissageExportStatus('error');
      setTimeout(() => setApprentissageExportStatus(null), 3000);
    }
  };

  // Fonction pour importer les données Apprentissage
  const handleImportApprentissage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        setApprentissageImportStatus('loading');
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        const jsonData = JSON.parse(text);
        const preview = previewApprentissageImport(jsonData);
        if (!preview.valid) {
          throw new Error(`Format d'export invalide: ${preview.errors?.join(', ')}`);
        }
        await importApprentissageData(jsonData, { mode: 'replace', createBackup: true });
        setApprentissageImportStatus('success');
        setTimeout(() => {
          setApprentissageImportStatus(null);
          if (window.confirm('Import réussi ! Voulez-vous recharger la page pour voir les changements ?')) {
            window.location.reload();
          }
        }, 2000);
      } catch (error) {
        console.error('❌ Erreur import Apprentissage:', error);
        setApprentissageImportStatus('error');
        alert(`Erreur lors de l'import : ${error.message}`);
        setTimeout(() => setApprentissageImportStatus(null), 3000);
      }
    };
    input.click();
  };

  // Fonction pour exporter les données Garmin
  const handleExportGarminData = async () => {
    try {
      setGarminExportStatus('loading');
      const garminData = await exportGarminData();
      const forcedHistory = garminData.forcedRangesHistory || [];
      const lastForcedEntry = forcedHistory[0] || null;
      
      // ✅ PHASE 3.1 : Calculer statistiques sur lastSynced pour métadonnées
      const dailyMetricsDates = Object.keys(garminData.dailyMetrics || {});
      const metricsWithLastSynced = dailyMetricsDates.filter(date => {
        const metric = garminData.dailyMetrics[date];
        return metric && metric.lastSynced;
      }).length;

      const exportObject = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportType: 'Garmin Data',
        appName: 'Workout Tracker - Garmin',
        data: garminData,
        metadata: {
          totalSwimming: (garminData.activities?.swimming || []).length,
          totalJumpRope: (garminData.activities?.jumpRope || []).length,
          totalCardio: (garminData.activities?.cardio || []).length,
          totalActivities: (garminData.activities?.swimming || []).length + 
                          (garminData.activities?.jumpRope || []).length + 
                          (garminData.activities?.cardio || []).length,
          totalDailyMetrics: dailyMetricsDates.length,
          // ✅ PHASE 3.1 : Statistiques sur lastSynced
          metricsWithLastSynced: metricsWithLastSynced,
          metricsWithLastSyncedPercentage: dailyMetricsDates.length > 0 
            ? Math.round((metricsWithLastSynced / dailyMetricsDates.length) * 100) 
            : 0,
          forcedSync: {
            totalEntries: forcedHistory.length,
            lastMode: lastForcedEntry?.mode || null,
            lastTriggeredAt: lastForcedEntry?.triggeredAt || null,
            lastRange: lastForcedEntry
              ? { start: lastForcedEntry.start, end: lastForcedEntry.end, includeToday: !!lastForcedEntry.includeToday }
              : null,
          },
          dateRange: {
            earliest: dailyMetricsDates.sort()[0] || null,
            latest: dailyMetricsDates.sort().reverse()[0] || null
          },
          activityDateRange: {
            earliest: [
              ...(garminData.activities?.swimming || []).map(a => a.date),
              ...(garminData.activities?.jumpRope || []).map(a => a.date),
              ...(garminData.activities?.cardio || []).map(a => a.date)
            ].sort()[0] || null,
            latest: [
              ...(garminData.activities?.swimming || []).map(a => a.date),
              ...(garminData.activities?.jumpRope || []).map(a => a.date),
              ...(garminData.activities?.cardio || []).map(a => a.date)
            ].sort().reverse()[0] || null
          },
          // ✅ PHASE 3.1 : Documentation des champs inclus
          fieldsIncluded: {
            activities: ['id', 'date', 'type', 'name', 'duration', 'distance', 'calories', 'heartRate', 'lastSynced', 'source'],
            dailyMetrics: ['date', 'steps', 'calories', 'distance', 'heartRate', 'sleep', 'bodyBattery', 'stress', 'spo2', 'respiration', 'intensityMinutes', 'floors', 'lastSynced', 'performance']
          },
          // ✅ PHASE 3.1 : Note sur lastSynced
          notes: {
            lastSynced: 'Champ lastSynced (ISO timestamp) inclus dans chaque métrique quotidienne pour optimisations Phase 3.1 (récupération incrémentale)',
            compatibility: 'Export compatible avec import. Les timestamps lastSynced sont préservés lors de l\'import.'
          }
        }
      };

      // ✅ Tâche 12 : Compression JSON avec pako
      const compressedExport = compressGarminExport(exportObject, {
        level: 6, // Bon compromis vitesse/taille
        force: false // Compression automatique si > 1KB
      });

      const jsonString = compressedExport.compressed
        ? JSON.stringify(compressedExport, null, 2)
        : JSON.stringify(exportObject, null, 2);

      const blob = new Blob([jsonString], { 
        type: compressedExport.compressed 
          ? 'application/json+gzip' 
          : 'application/json' 
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const fileExtension = compressedExport.compressed ? '.json.gz' : '.json';
      link.download = `garmin-data-export-${new Date().toISOString().split('T')[0]}${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setGarminExportStatus('success');
      setTimeout(() => setGarminExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export Garmin:', error);
      setGarminExportStatus('error');
      setTimeout(() => setGarminExportStatus(null), 3000);
    }
  };

  // Fonction pour importer les données Garmin
  const handleImportGarminData = async (jsonData) => {
    try {
      setGarminImportStatus('loading');
      
      // ✅ Tâche 12 : Décompression automatique si nécessaire
      let parsed;
      if (typeof jsonData === 'string') {
        // Vérifier si c'est compressé
        if (isCompressed(jsonData)) {
          parsed = decompressGarminExport(jsonData);
        } else {
          parsed = JSON.parse(jsonData);
        }
      } else {
        // Objet : vérifier si compressé
        if (jsonData.format === 'garmin-compressed' || jsonData.compressed === true) {
          parsed = decompressGarminExport(jsonData);
        } else {
          parsed = jsonData;
        }
      }
      
      // Vérifier la structure - supporte à la fois le format d'export (avec .data) et le format brut
      const garminData = parsed.data || parsed;
      if (!garminData || (!garminData.activities && !garminData.dailyMetrics)) {
        throw new Error('Format JSON Garmin invalide. Attendu: { activities: {...}, dailyMetrics: {...} } ou { data: { activities: {...}, dailyMetrics: {...} } }');
      }

      // Valider la structure des activités et dailyMetrics
      if (garminData.activities && typeof garminData.activities !== 'object') {
        throw new Error('activities doit être un objet avec swimming, jumpRope, cardio');
      }
      if (garminData.dailyMetrics && typeof garminData.dailyMetrics !== 'object') {
        throw new Error('dailyMetrics doit être un objet avec dates comme clés');
      }

      await importGarminData(garminData);
      
      setGarminImportStatus('success');
      setTimeout(() => setGarminImportStatus(null), 3000);
      
      // Suggérer de recharger la page pour voir les données importées
      console.log('[Settings] Garmin data imported successfully. Consider refreshing the Garmin tab to see the new data.');
    } catch (error) {
      console.error('❌ Erreur import Garmin:', error);
      setGarminImportStatus('error');
      setTimeout(() => setGarminImportStatus(null), 3000);
      throw error; // Re-throw pour permettre l'affichage d'erreur dans l'UI
    }
  };

  // ✅ FIX CALENDRIER : Fonction pour valider les données d'import COMPLET (toutes les données d'entraînement)
  const validateAllWorkoutData = (data) => {
    const errors = [];
    const warnings = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Format de données invalide');
      return { isValid: false, errors, warnings, stats: null };
    }
    
    // Support format export complet { data: {...}, metadata: {...} }
    const workoutData = data.data || data;
    
    // Vérifier les champs obligatoires (mais permettre qu'ils soient vides pour compatibilité)
    const requiredFields = ['checkedExercises', 'reps', 'checkedStretches'];
    requiredFields.forEach(field => {
      if (field in workoutData && typeof workoutData[field] !== 'object') {
        errors.push(`${field} doit être un objet`);
      }
    });
    
    // Vérifier les types optionnels
    if (workoutData.progressPhotos !== undefined && !Array.isArray(workoutData.progressPhotos)) {
      errors.push('progressPhotos doit être un tableau');
    }
    
    if (workoutData.progressEntries !== undefined && !Array.isArray(workoutData.progressEntries)) {
      errors.push('progressEntries doit être un tableau');
    }
    
    if (workoutData.bodyTrackingReminders !== undefined && !Array.isArray(workoutData.bodyTrackingReminders)) {
      errors.push('bodyTrackingReminders doit être un tableau');
    }
    
    if (workoutData.historyReps !== undefined && typeof workoutData.historyReps !== 'object') {
      errors.push('historyReps doit être un objet');
    }
    
    if (workoutData.programHistory !== undefined && !Array.isArray(workoutData.programHistory)) {
      errors.push('programHistory doit être un tableau');
    }
    
    if (workoutData.enduranceData !== undefined && typeof workoutData.enduranceData !== 'object') {
      errors.push('enduranceData doit être un objet');
    }
    
    if (workoutData.dailyVariations !== undefined && typeof workoutData.dailyVariations !== 'object') {
      errors.push('dailyVariations doit être un objet');
    }
    
    if (workoutData.sessionFeedbacks !== undefined && typeof workoutData.sessionFeedbacks !== 'object') {
      errors.push('sessionFeedbacks doit être un objet');
    }
    
    if (workoutData.weekVariant !== undefined && typeof workoutData.weekVariant !== 'string') {
      errors.push('weekVariant doit être une chaîne de caractères');
    }
    
    // Warnings pour données manquantes (pas bloquant)
    if (!workoutData.checkedExercises || Object.keys(workoutData.checkedExercises || {}).length === 0) {
      warnings.push('Aucun exercice trouvé dans les données');
    }
    
    if (!workoutData.reps || Object.keys(workoutData.reps || {}).length === 0) {
      warnings.push('Aucune répétition trouvée dans les données');
    }
    
    if (!workoutData.enduranceData || !workoutData.enduranceData.sessions) {
      warnings.push('Aucune donnée d\'endurance trouvée');
    }
    
    const stats = {
      exercises: Object.keys(workoutData.checkedExercises || {}).length,
      reps: Object.keys(workoutData.reps || {}).length,
      stretches: Object.keys(workoutData.checkedStretches || {}).length,
      photos: (workoutData.progressPhotos || []).length,
      progressEntries: (workoutData.progressEntries || []).length,
      reminders: (workoutData.bodyTrackingReminders || []).length,
      historyReps: Object.keys(workoutData.historyReps || {}).length,
      programHistory: (workoutData.programHistory || []).length,
      enduranceSessions: Object.values(workoutData.enduranceData?.sessions || {}).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0
      ),
      dailyVariations: Object.keys(workoutData.dailyVariations || {}).length,
      sessionFeedbacks: Object.keys(workoutData.sessionFeedbacks || {}).length
    };
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats,
      data: workoutData
    };
  };

  // Fonction pour valider les données importées (Body Tracking uniquement - ancienne fonction)
  const validateImportData = (data) => {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Format de données invalide');
      return { isValid: false, errors };
    }

    // Vérifier la structure de base
    const requiredFields = ['checkedExercises', 'reps', 'checkedStretches'];
    requiredFields.forEach(field => {
      if (!(field in data) || typeof data[field] !== 'object') {
        errors.push(`Champ manquant ou invalide: ${field}`);
      }
    });

    // Vérifier les types
    if (data.progressPhotos && !Array.isArray(data.progressPhotos)) {
      errors.push('progressPhotos doit être un tableau');
    }

    // Validation des entrées de progression (nouveau)
    if (data.progressEntries && !Array.isArray(data.progressEntries)) {
      errors.push('progressEntries doit être un tableau');
    }

    // Validation des rappels de suivi corporel (nouveau)
    if (data.bodyTrackingReminders && !Array.isArray(data.bodyTrackingReminders)) {
      errors.push('bodyTrackingReminders doit être un tableau');
    }

    // Validation de l'historique des répétitions (nouveau)
    if (data.historyReps && typeof data.historyReps !== 'object') {
      errors.push('historyReps doit être un objet');
    }

    // Validation de l'historique des programmes (nouveau)
    if (data.programHistory && !Array.isArray(data.programHistory)) {
      errors.push('programHistory doit être un tableau');
    }

    if (data.weekVariant && typeof data.weekVariant !== 'string') {
      errors.push('weekVariant doit être une chaîne de caractères');
    }

    return {
      isValid: errors.length === 0,
      errors,
      stats: {
        exercises: Object.keys(data.checkedExercises || {}).length,
        reps: Object.keys(data.reps || {}).length,
        stretches: Object.keys(data.checkedStretches || {}).length,
        photos: (data.progressPhotos || []).length,
        progressEntries: (data.progressEntries || []).length,
        reminders: (data.bodyTrackingReminders || []).length,
        historyReps: Object.keys(data.historyReps || {}).length,
        programHistory: (data.programHistory || []).length
      }
    };
  };

  // Fonction pour prévisualiser les données d'import
  // Prévisualisation de l'import (OPTIMISÉE avec nouveau module)
  const previewImport = () => {
    try {
      // Traiter les données avec le module optimisé
      const result = processImportData(importData, {
        validateData: true,
        validateVersion: true,
        createBackup: false // Backup créé lors de confirmImport
      });
      
      if (!result.valid) {
        setImportStatus('error');
        console.error('Erreurs de validation:', result.errors);
        return;
      }
      
      // Extraire données Body Tracking si format d'export spécifique
      let dataToImport = result.data;
      
      // Si c'est un export Body Tracking spécifique, extraire les données
      if (dataToImport.exportType === 'Body Tracking Data') {
        dataToImport = {
          progressPhotos: dataToImport.progressPhotos || [],
          progressEntries: dataToImport.progressEntries || [],
          bodyTrackingReminders: dataToImport.bodyTrackingReminders || [],
          bodyTrackingLastUpdated: dataToImport.metadata?.lastUpdate || new Date().toISOString()
        };
      } else if (dataToImport.data) {
        // Format export complet - extraire données Body Tracking
        const fullData = dataToImport.data;
        dataToImport = {
          progressPhotos: fullData.progressPhotos || [],
          progressEntries: fullData.progressEntries || [],
          bodyTrackingReminders: fullData.bodyTrackingReminders || [],
          bodyTrackingLastUpdated: fullData.bodyTrackingLastUpdated || null
        };
      }
      
      setPreviewData({
        data: dataToImport,
        stats: result.stats,
        warnings: result.warnings,
        isExportFormat: result.data.exportType === 'Body Tracking Data' || !!result.data.data
      });
      setShowImportPreview(true);
      setImportStatus('preview');
      
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error);
      setImportStatus('error');
    }
  };

  // Fonction pour confirmer l'import (OPTIMISÉE)
  const confirmImport = async () => {
    try {
      setImportStatus('loading');
      
      // Créer backup avant import
      const currentData = await loadFromDB();
      const backupData = currentData || data || {};
      localStorage.setItem('workoutData_preImport_backup', JSON.stringify({
        data: backupData,
        backupDate: new Date().toISOString()
      }));

      // Re-valider les données avant import (sécurité supplémentaire)
      const validation = validateBodyTrackingData(previewData.data);
      
      if (!validation.valid) {
        setImportStatus('error');
        console.error('Validation échouée avant import:', validation.errors);
        setTimeout(() => setImportStatus(null), 3000);
        return;
      }
      
      // Fusionner avec données existantes (stratégie merge)
      const existingData = backupData;
      const importedData = previewData.data;
      
      const mergedData = {
        ...existingData,
        // Merge photos (éviter doublons par date)
        progressPhotos: [
          ...(existingData.progressPhotos || []).filter(existingPhoto => {
            const existingDate = existingPhoto.date || existingPhoto.timestamp;
            return !(importedData.progressPhotos || []).some(importedPhoto => {
              const importedDate = importedPhoto.date || importedPhoto.timestamp;
              return existingDate === importedDate;
            });
          }),
          ...(importedData.progressPhotos || [])
        ],
        // Merge entrées (éviter doublons par date + type)
        progressEntries: [
          ...(existingData.progressEntries || []).filter(existingEntry => {
            const existingKey = `${existingEntry.date || existingEntry.timestamp}_${existingEntry.type}`;
            return !(importedData.progressEntries || []).some(importedEntry => {
              const importedKey = `${importedEntry.date || importedEntry.timestamp}_${importedEntry.type}`;
              return existingKey === importedKey;
            });
          }),
          ...(importedData.progressEntries || [])
        ],
        // Remplacer reminders (configuration utilisateur)
        bodyTrackingReminders: importedData.bodyTrackingReminders || existingData.bodyTrackingReminders || [],
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      // Importer les données fusionnées
      await updateData(mergedData);
      
      setImportStatus('success');
      setShowImportPreview(false);
      setImportData('');
      setPreviewData(null);
      
      setTimeout(() => setImportStatus(null), 3000);
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setImportStatus('error');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  // ✅ FIX CALENDRIER : Fonction pour prévisualiser l'import COMPLET (toutes les données d'entraînement)
  const previewImportAllData = () => {
    try {
      if (!importData.trim()) {
        setAllDataImportStatus('error');
        return;
      }
      
      let parsedData;
      try {
        parsedData = JSON.parse(importData);
      } catch (parseError) {
        setAllDataImportStatus('error');
        console.error('Erreur de parsing JSON:', parseError);
        return;
      }
      
      // Valider les données d'entraînement
      const validation = validateAllWorkoutData(parsedData);
      if (!validation.isValid) {
        setAllDataImportStatus('error');
        console.error('Erreurs de validation:', validation.errors);
        return;
      }

      // Prévisualisation des données Livres (si présentes dans l'export global)
      let booksPreview = null;
      let booksWarnings = [];
      try {
        const rawBooksExport =
          (parsedData.data && parsedData.data.booksData) || parsedData.booksData || null;

        if (rawBooksExport) {
          const booksResult = processBooksImportData(rawBooksExport);

          if (!booksResult.valid) {
            booksWarnings.push(
              `Livres: ${booksResult.errors?.[0] || 'Erreur de validation des données Livres'}`
            );
          } else {
            booksPreview = {
              valid: true,
              totalBooks: (booksResult.books || []).length,
              metadata: booksResult.metadata || null,
              books: booksResult.books || []
            };
          }
        }
      } catch (booksError) {
        console.warn('⚠️ Erreur lors de la prévisualisation des données Livres:', booksError);
        booksWarnings.push('Livres: erreur lors de la lecture des données (voir console).');
      }

      const combinedWarnings = [...validation.warnings, ...booksWarnings];

      // Préparer les données de prévisualisation
      setAllDataPreviewData({
        data: validation.data,
        stats: validation.stats,
        warnings: combinedWarnings,
        errors: validation.errors,
        isExportFormat: !!parsedData.data || !!parsedData.metadata,
        booksPreview
      });
      
      setShowAllDataImportPreview(true);
      setAllDataImportStatus('preview');
      
    } catch (error) {
      console.error('Erreur lors de la prévisualisation complète:', error);
      setAllDataImportStatus('error');
    }
  };

  // ✅ FIX CALENDRIER : Fonction pour confirmer l'import COMPLET (toutes les données d'entraînement)
  const confirmImportAllData = async () => {
    try {
      setAllDataImportStatus('loading');
      
      // Créer backup avant import
      const currentData = await loadFromDB();
      const backupData = currentData || data || {};
      
      localStorage.setItem('workoutData_preImport_backup', JSON.stringify({
        data: backupData,
        backupDate: new Date().toISOString()
      }));
      
      // Utiliser les données de prévisualisation validées (entraînement)
      const importedData = allDataPreviewData.data;
      
      // ✅ Fusion intelligente : Fusionner avec données existantes (stratégie merge conservatrice)
      // Principe : Préserver les données existantes si les nouvelles sont vides, sinon utiliser les nouvelles
      const mergedData = {
        // Données de base : Fusionner intelligemment
        checkedExercises: {
          ...(backupData.checkedExercises || {}),
          ...(importedData.checkedExercises || {})
        },
        reps: {
          ...(backupData.reps || {}),
          ...(importedData.reps || {})
        },
        checkedStretches: {
          ...(backupData.checkedStretches || {}),
          ...(importedData.checkedStretches || {})
        },
        
        // Données d'endurance : Fusionner les sessions par type EN ÉVITANT LES DOUBLONS
        enduranceData: (() => {
          // ✅ FIX DOUBLONS : Fonction helper pour fusionner sessions sans doublons
          const mergeSessionsWithoutDuplicates = (existingSessions, importedSessions) => {
            if (!Array.isArray(existingSessions)) existingSessions = [];
            if (!Array.isArray(importedSessions)) importedSessions = [];
            
            // Créer un Set des IDs existants pour détection rapide
            const existingIds = new Set(existingSessions.map(s => String(s.id)));
            // Créer un Map pour détecter les doublons par date+heure (si pas d'ID)
            const existingDateTimes = new Map();
            existingSessions.forEach(s => {
              const key = `${s.date || ''}_${s.time || ''}`;
              if (key && key !== '_') {
                existingDateTimes.set(key, true);
              }
            });
            
            // Filtrer les sessions importées : exclure celles avec ID ou date+heure déjà existants
            const newSessions = importedSessions.filter(imported => {
              const importedId = String(imported.id);
              const importedDateTime = `${imported.date || ''}_${imported.time || ''}`;
              
              // Si l'ID existe déjà, c'est un doublon
              if (importedId && existingIds.has(importedId)) {
                console.log(`⚠️ [Settings] Session avec ID dupliqué ignorée: ${importedId} (${imported.date} ${imported.time})`);
                return false;
              }
              
              // Si date+heure identiques, c'est probablement un doublon
              if (importedDateTime && importedDateTime !== '_' && existingDateTimes.has(importedDateTime)) {
                console.log(`⚠️ [Settings] Session avec date/heure dupliquée ignorée: ${importedDateTime}`);
                return false;
              }
              
              return true;
            });
            
            // Fusionner : existantes + nouvelles (sans doublons)
            return [...existingSessions, ...newSessions];
          };
          
          return {
            sessions: {
              boxing: mergeSessionsWithoutDuplicates(
                backupData.enduranceData?.sessions?.boxing || backupData.enduranceData?.boxingSessions || [],
                importedData.enduranceData?.sessions?.boxing || importedData.enduranceData?.boxingSessions || []
              ),
              pushups: mergeSessionsWithoutDuplicates(
                backupData.enduranceData?.sessions?.pushups || backupData.enduranceData?.pushupSessions || [],
                importedData.enduranceData?.sessions?.pushups || importedData.enduranceData?.pushupSessions || []
              ),
              swimming: mergeSessionsWithoutDuplicates(
                backupData.enduranceData?.sessions?.swimming || backupData.enduranceData?.swimmingSessions || [],
                importedData.enduranceData?.sessions?.swimming || importedData.enduranceData?.swimmingSessions || []
              ),
              jumprope: mergeSessionsWithoutDuplicates(
                backupData.enduranceData?.sessions?.jumprope || backupData.enduranceData?.jumpropeSessions || [],
                importedData.enduranceData?.sessions?.jumprope || importedData.enduranceData?.jumpropeSessions || []
              ),
              running: mergeSessionsWithoutDuplicates(
                backupData.enduranceData?.sessions?.running || backupData.enduranceData?.runningSessions || [],
                importedData.enduranceData?.sessions?.running || importedData.enduranceData?.runningSessions || []
              )
            },
            challenges: (() => {
              // ✅ FIX DOUBLONS : Fusionner défis sans doublons (par ID + nom+type+date pour robustesse)
              const existingChallenges = backupData.enduranceData?.challenges || [];
              const importedChallenges = importedData.enduranceData?.challenges || [];
              
              // Créer un Set des IDs existants
              const existingChallengeIds = new Set(existingChallenges.map(c => String(c.id)));
              // Créer un Map pour détecter les doublons par nom+type+date (fallback si pas d'ID)
              const existingChallengeKeys = new Map();
              existingChallenges.forEach(c => {
                const key = `${c.name || ''}_${c.activityType || ''}_${c.startDate || c.targetDate || ''}`;
                if (key && key !== '__') {
                  existingChallengeKeys.set(key, true);
                }
              });
              
              const newChallenges = importedChallenges.filter(c => {
                const id = String(c.id);
                const key = `${c.name || ''}_${c.activityType || ''}_${c.startDate || c.targetDate || ''}`;
                
                // Si l'ID existe déjà, c'est un doublon
                if (id && id !== 'undefined' && existingChallengeIds.has(id)) {
                  console.log(`⚠️ [Settings] Défi avec ID dupliqué ignoré: ${id} (${c.name})`);
                  return false;
                }
                
                // Si nom+type+date identiques, c'est probablement un doublon
                if (key && key !== '__' && existingChallengeKeys.has(key)) {
                  console.log(`⚠️ [Settings] Défi avec nom/type/date dupliqués ignoré: ${key}`);
                  return false;
                }
                
                return true;
              });
              
              return [...existingChallenges, ...newChallenges];
            })()
          };
        })(),
        
        // Photos de progression : Fusionner en évitant doublons par date
        progressPhotos: [
          ...(backupData.progressPhotos || []).filter(existingPhoto => {
            const existingDate = existingPhoto.date || existingPhoto.timestamp;
            return !(importedData.progressPhotos || []).some(importedPhoto => {
              const importedDate = importedPhoto.date || importedPhoto.timestamp;
              return existingDate === importedDate;
            });
          }),
          ...(importedData.progressPhotos || [])
        ],
        
        // Entrées de progression : Fusionner en évitant doublons par date + type
        progressEntries: [
          ...(backupData.progressEntries || []).filter(existingEntry => {
            const existingKey = `${existingEntry.date || existingEntry.timestamp}_${existingEntry.type}`;
            return !(importedData.progressEntries || []).some(importedEntry => {
              const importedKey = `${importedEntry.date || importedEntry.timestamp}_${importedEntry.type}`;
              return existingKey === importedKey;
            });
          }),
          ...(importedData.progressEntries || [])
        ],
        
        // Historique des répétitions : Fusionner
        historyReps: {
          ...(backupData.historyReps || {}),
          ...(importedData.historyReps || {})
        },
        
        // Variations journalières : Fusionner
        dailyVariations: {
          ...(backupData.dailyVariations || {}),
          ...(importedData.dailyVariations || {})
        },
        
        // Feedbacks de session : Fusionner
        sessionFeedbacks: {
          ...(backupData.sessionFeedbacks || {}),
          ...(importedData.sessionFeedbacks || {})
        },
        
        // Historique des programmes : Fusionner en évitant doublons
        programHistory: [
          ...(backupData.programHistory || []),
          ...(importedData.programHistory || []).filter(imported => {
            return !(backupData.programHistory || []).some(existing => 
              existing.id === imported.id || 
              (existing.startDate === imported.startDate && existing.endDate === imported.endDate)
            );
          })
        ],
        
        // Configuration : Préférer les données importées si présentes
        startDate: importedData.startDate || backupData.startDate || null,
        weekVariant: importedData.weekVariant || backupData.weekVariant || 'A',
        
        // Rappels suivi corporel : Remplacer (configuration utilisateur)
        bodyTrackingReminders: importedData.bodyTrackingReminders || backupData.bodyTrackingReminders || [],
        bodyTrackingLastUpdated: new Date().toISOString()
      };
      
      // ✅ FIX DOUBLONS : Nettoyer les IDs dupliqués dans les sessions après fusion
      // (au cas où des doublons auraient quand même passé les filtres)
      const cleanDuplicateSessionIds = (sessions) => {
        const cleaned = {};
        let hasChanges = false;
        
        Object.entries(sessions).forEach(([activityType, activitySessions]) => {
          if (!Array.isArray(activitySessions)) {
            cleaned[activityType] = activitySessions;
            return;
          }
          
          // Détecter les IDs dupliqués
          const idMap = new Map();
          const duplicateIds = new Set();
          
          activitySessions.forEach((session, idx) => {
            const id = String(session.id);
            if (idMap.has(id)) {
              duplicateIds.add(id);
              idMap.get(id).push(idx);
            } else {
              idMap.set(id, [idx]);
            }
          });
          
          if (duplicateIds.size > 0) {
            console.log(`⚠️ [Settings] ${duplicateIds.size} ID(s) dupliqué(s) détecté(s) après fusion pour ${activityType}:`, Array.from(duplicateIds));
            
            // Générer de nouveaux IDs uniques pour les doublons (garder le premier)
            cleaned[activityType] = activitySessions.map((session, idx) => {
              const id = String(session.id);
              if (duplicateIds.has(id)) {
                const occurrences = idMap.get(id);
                const isFirst = occurrences[0] === idx;
                if (!isFirst) {
                  hasChanges = true;
                  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${idx}-${activityType}-import`;
                  console.log(`  🔄 [Settings] Régénération ID pour ${activityType}[${idx}]: ${id} → ${newId}`);
                  return {
                    ...session,
                    id: newId
                  };
                }
              }
              return session;
            });
          } else {
            cleaned[activityType] = activitySessions;
          }
        });
        
        return { cleaned, hasChanges };
      };
      
      // Nettoyer les sessions d'endurance après fusion
      if (mergedData.enduranceData?.sessions) {
        const { cleaned, hasChanges } = cleanDuplicateSessionIds(mergedData.enduranceData.sessions);
        if (hasChanges) {
          console.log('✅ [Settings] Nettoyage des IDs dupliqués effectué après fusion (sessions)');
          mergedData.enduranceData.sessions = cleaned;
        }
      }
      
      // ✅ FIX DOUBLONS : Nettoyer aussi les défis dupliqués après fusion
      if (mergedData.enduranceData?.challenges) {
        const challengeIdMap = new Map();
        const duplicateChallengeIds = new Set();
        
        mergedData.enduranceData.challenges.forEach((challenge, idx) => {
          const id = String(challenge.id);
          if (challengeIdMap.has(id)) {
            duplicateChallengeIds.add(id);
            challengeIdMap.get(id).push(idx);
          } else {
            challengeIdMap.set(id, [idx]);
          }
        });
        
        if (duplicateChallengeIds.size > 0) {
          console.log(`⚠️ [Settings] ${duplicateChallengeIds.size} ID(s) dupliqué(s) détecté(s) après fusion pour les défis:`, Array.from(duplicateChallengeIds));
          
          mergedData.enduranceData.challenges = mergedData.enduranceData.challenges.map((challenge, idx) => {
            const id = String(challenge.id);
            if (duplicateChallengeIds.has(id)) {
              const occurrences = challengeIdMap.get(id);
              const isFirst = occurrences[0] === idx;
              if (!isFirst) {
                const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${idx}-challenge-import`;
                console.log(`  🔄 [Settings] Régénération ID pour challenge[${idx}]: ${id} → ${newId}`);
                return {
                  ...challenge,
                  id: newId
                };
              }
            }
            return challenge;
          });
          
          console.log('✅ [Settings] Nettoyage des IDs dupliqués effectué après fusion (défis)');
        }
      }
      
      // ✅ Sauvegarder les données fusionnées et nettoyées (entraînement)
      await updateData(mergedData);
      
      // ✅ Importer également les données Livres si présentes et valides
      try {
        const booksPreview = allDataPreviewData?.booksPreview;
        if (booksPreview && booksPreview.valid && Array.isArray(booksPreview.books)) {
          const booksToSave = booksPreview.books;

          // Sauvegarder UNIQUEMENT dans IndexedDB (localStorage saturé, utilisé uniquement en fallback de lecture)
          let indexedOk = false;
          try {
            indexedOk = await saveBooksToIndexedDB(booksToSave);
            if (indexedOk) {
              console.log(
                `[Settings] ✅ Import Livres réussi (${booksToSave.length} livres restaurés dans IndexedDB depuis l'export global)`
              );
            } else {
              console.warn(
                `[Settings] ⚠️ Échec sauvegarde IndexedDB pour ${booksToSave.length} livres`
              );
            }
          } catch (booksDbError) {
            console.error('❌ Erreur lors de la sauvegarde des Livres en IndexedDB:', booksDbError);
            // NE PLUS sauvegarder dans localStorage (saturé)
          }
        }
      } catch (booksImportError) {
        console.error('❌ Erreur lors de l’import des données Livres depuis l’export global:', booksImportError);
      }

      // ✅ Forcer rechargement depuis IndexedDB pour mettre à jour le state principal
      const reloadedData = await loadFromDB();
      if (reloadedData) {
        // Les données sont maintenant dans IndexedDB et seront chargées automatiquement
        console.log('[Settings] ✅ Import complet réussi, données rechargées depuis IndexedDB');
      }
      
      setAllDataImportStatus('success');
      setShowAllDataImportPreview(false);
      setImportData('');
      setAllDataPreviewData(null);
      
      setTimeout(() => {
        setAllDataImportStatus(null);
        // Suggérer de recharger la page pour voir les changements
        if (window.confirm(t('messages.importExport.fullReloadConfirm'))) {
          window.location.reload();
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'import complet:', error);
      setAllDataImportStatus('error');
      setTimeout(() => setAllDataImportStatus(null), 5000);
    }
  };

  // ✅ FIX CALENDRIER : Fonction de debug pour identifier les sessions mockées
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
      
      console.log('🔍 DEBUG - Sessions mockées détectées:', mockSessions);
      console.log('✅ DEBUG - Sessions valides:', validSessions);
      
      if (mockSessions.length > 0) {
        alert(`🔍 Debug : ${mockSessions.length} session(s) mockée(s) détectée(s) et ${validSessions.length} valide(s).\n\nVoir la console pour les détails.`);
      } else {
        alert(`ℹ️ Debug : Aucune session mockée détectée par la fonction isMockEnduranceSession().\n\n${validSessions.length} session(s) valide(s) trouvée(s).\n\nVoir la console pour les détails.`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du debug:', error);
      alert(`❌ ${t('messages.errors.debug', { error: error.message })}`);
    }
  };

  // ✅ FIX CALENDRIER : Fonction pour supprimer toutes les données mockées d'endurance
  const handleCleanupMockEndurance = async () => {
    try {
      if (!window.confirm(
        '⚠️ Supprimer toutes les données mockées/fausses d\'endurance ?\n\n' +
        'Cela supprimera :\n' +
        '- Sessions avec durée suspecte (880 min, etc.)\n' +
        '- Sessions avec sauts suspectes (13200, etc.)\n' +
        '- Sessions natation avec distance suspecte (1.5m)\n' +
        '- Toutes les autres données mockées détectées\n\n' +
        'Cette action est irréversible. Une sauvegarde sera créée avant la suppression.'
      )) {
        return;
      }

      setCleanupStatus('loading');

      // Créer backup avant nettoyage
      const currentData = await loadFromDB();
      const backupData = currentData || data || {};
      localStorage.setItem('workoutData_preCleanup_backup', JSON.stringify({
        data: backupData,
        backupDate: new Date().toISOString()
      }));

      // Supprimer les sessions mockées
      const result = await deleteMockEnduranceSessions();

      if (result.deleted > 0) {
        setCleanupStatus('success');
        const detailsText = Object.entries(result.details)
          .filter(([_, count]) => count > 0)
          .map(([type, count]) => `${type}: ${count}`)
          .join(', ');
        
        alert(`✅ ${result.deleted} session(s) mockée(s) supprimée(s) !\n\nDétails : ${detailsText}\n\nRechargez la page pour voir les changements.`);
        
        setTimeout(() => {
          setCleanupStatus(null);
          if (window.confirm(t('messages.importExport.reloadConfirm'))) {
            window.location.reload();
          }
        }, 3000);
      } else {
        setCleanupStatus('none');
        alert('ℹ️ Aucune session mockée trouvée. Vos données sont déjà propres.');
        setTimeout(() => setCleanupStatus(null), 3000);
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des sessions mockées:', error);
      setCleanupStatus('error');
      alert(`❌ ${t('messages.errors.cleanup', { error: error.message })}`);
      setTimeout(() => setCleanupStatus(null), 5000);
    }
  };

  // Fonction pour importer depuis un fichier (détecte automatiquement le type)
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImportData(e.target.result);
    };
    reader.readAsText(file);
  };

  // Fonction pour restaurer la sauvegarde pré-import
  const restorePreImportBackup = async () => {
    try {
      const backup = localStorage.getItem('workoutData_preImport_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        await updateData(parsedBackup.data);
        setImportStatus('restored');
        setTimeout(() => setImportStatus(null), 3000);
      }
    } catch (error) {
      // Erreur lors de la restauration
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
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
      {currentUser && (
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 profile-input-dark">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <User className="mr-2" size={20} />
              Mon profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Photo de profil */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-200 flex items-center">
                  <Image className="mr-2" size={16} />
                  Photo de profil
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-white/20 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                    {avatarPreviewUrl ? (
                      <img
                        src={avatarPreviewUrl}
                        alt={currentUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-white">{usernameInitial}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={avatarFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="text-xs text-slate-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />
                    {avatarStatus === 'loading' && (
                      <span className="text-xs text-slate-300">Mise à jour…</span>
                    )}
                    {avatarStatus === 'success' && (
                      <span className="text-xs text-emerald-400">✅ Avatar mis à jour avec succès</span>
                    )}
                    {avatarStatus === 'error' && (
                      <span className="text-xs text-red-400">❌ Erreur lors de la mise à jour</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Nom d'utilisateur (non modifiable) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200 flex items-center">
                  <User className="mr-2" size={16} />
                  Nom d'utilisateur
                </label>
                <Input
                  type="text"
                  value={currentUser.username}
                  disabled
                  className="!bg-slate-700/50 !text-slate-300 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400">Le nom d'utilisateur ne peut pas être modifié</p>
              </div>

              {/* Email */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-200 flex items-center">
                  <Mail className="mr-2" size={16} />
                  Adresse email
                </label>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nouvelle adresse email"
                    style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                    className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
                  />
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="Confirmer votre adresse email"
                    style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                    className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
                  />
                  <Button
                    onClick={handleEmailUpdate}
                    disabled={emailStatus === 'loading' || !email || !confirmEmail || (email === (currentUser.email || '') && confirmEmail === (currentUser.email || ''))}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {emailStatus === 'loading' ? 'Mise à jour...' : 'Enregistrer l\'email'}
                  </Button>
                  {emailError && (
                    <span className="text-xs text-red-400 block">{emailError}</span>
                  )}
                  {emailStatus === 'success' && (
                    <span className="text-xs text-emerald-400">✅ Email mis à jour avec succès</span>
                  )}
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <label className="text-sm font-medium text-slate-200 flex items-center">
                  <Lock className="mr-2" size={16} />
                  Changer le mot de passe
                </label>
                <div className="space-y-3">
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Renseignez votre mot de passe actuel"
                    autoComplete="off"
                    style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                    className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe (min. 6 caractères)"
                    autoComplete="new-password"
                    style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                    className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer votre mot de passe"
                    autoComplete="new-password"
                    style={{ backgroundColor: 'rgb(51 65 85)', color: '#e2e8f0', borderColor: '#475569' }}
                    className="w-full px-4 py-3 !bg-slate-700 !text-slate-200 !border-slate-600 border rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-slate-500 transition-all duration-200 focus:outline-none"
                  />
                  <Button
                    onClick={handlePasswordUpdate}
                    disabled={passwordStatus === 'loading' || !oldPassword || !newPassword || !confirmPassword}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {passwordStatus === 'loading' ? 'Mise à jour...' : 'Changer le mot de passe'}
                  </Button>
                  {passwordError && (
                    <span className="text-xs text-red-400 block">{passwordError}</span>
                  )}
                  {passwordStatus === 'success' && (
                    <span className="text-xs text-emerald-400">✅ Mot de passe mis à jour avec succès</span>
                  )}
                </div>
              </div>

              {/* Migration des données */}
              <div className="pt-4 border-t border-slate-700 mt-4">
                <p className="text-xs text-slate-400 mb-3">
                  Tu peux associer toutes tes données locales actuelles (notamment les livres) à ce compte.
                </p>
                <Button
                  onClick={handleMigrateData}
                  disabled={migrationStatus === 'loading'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Associer mes données locales à ce compte
                </Button>
                
                {migrationStatus === 'loading' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                      <span>{migrationProgress.message || 'Migration en cours...'}</span>
                      <span>{migrationProgress.current} / {migrationProgress.total}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ 
                          width: `${migrationProgress.total > 0 ? (migrationProgress.current / migrationProgress.total) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {migrationStatus === 'success' && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-emerald-400">
                      ✅ Migration terminée avec succès !
                    </p>
                    {migrationProgress.message && (
                      <p className="text-xs text-slate-300">
                        {migrationProgress.message}
                      </p>
                    )}
                  </div>
                )}
                
                {migrationStatus === 'error' && (
                  <p className="text-xs text-red-400 mt-2">
                    ❌ Erreur lors de la migration. Réessaie plus tard.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

            <Button
              onClick={() => setShowProfileCardSettings(true)}
              icon={Image}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Gérer l'Image de la Carte
            </Button>
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

            <Button
              onClick={() => setShowProfileCardSettings(true)}
              icon={User}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Gérer le Handle de la Carte
            </Button>
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

            <Button
              onClick={() => setShowHomePageSettings(true)}
              icon={Image}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Configurer les Images de la Page d'Accueil
            </Button>

            {/* Section Export/Import Bannières */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <BannerExportImport />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Export */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Download className="mr-2" size={20} />
            Export des données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Exportez toutes vos données d'entraînement au format JSON pour créer une sauvegarde complète.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne Sport */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-lg flex items-center">
                  <span className="mr-2">🏋️</span>
                  Sport
                </h4>
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-blue-300">🏋️ Entraînement</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Exercices cochés : {Object.keys(data.checkedExercises || {}).length} entrées</li>
                    <li>• Répétitions : {Object.keys(data.reps || {}).length} entrées</li>
                    <li>• Étirements : {Object.keys(data.checkedStretches || {}).length} entrées</li>
                    <li>• Historique répétitions : {Object.keys(data.historyReps || {}).length} entrées</li>
                  </ul>
                </div>
                  <div className="space-y-1 pt-2 border-t border-slate-600">
                  <h5 className="text-sm font-medium text-green-300">📊 Suivi Corporel</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Photos de progression : {(data.progressPhotos || []).length} photos</li>
                    <li>• Entrées de progression : {(data.progressEntries || []).length} entrées</li>
                    <li>• Rappels configurés : {(data.bodyTrackingReminders || []).length} rappels</li>
                    <li>• Photos avec poids : {(data.progressPhotos || []).filter(p => p.weight).length}</li>
                    <li>• Photos avec notes : {(data.progressPhotos || []).filter(p => p.notes).length}</li>
                    <li>• Photos avec mesures : {(data.progressPhotos || []).filter(p => p.measurements && Object.keys(p.measurements).length > 0).length}</li>
                    <li>• Dernière mise à jour : {data.bodyTrackingLastUpdated ? new Date(data.bodyTrackingLastUpdated).toLocaleDateString('fr-FR') : 'Jamais'}</li>
                  </ul>
                </div>
                  <div className="space-y-1 pt-2 border-t border-slate-600">
                  <h5 className="text-sm font-medium text-orange-300">🏃 Endurance</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Sessions boxe : {(data.enduranceData?.sessions?.boxing || data.enduranceData?.boxingSessions || []).length} sessions</li>
                    <li>• Sessions pompes : {(data.enduranceData?.sessions?.pushups || data.enduranceData?.pushupSessions || []).length} sessions</li>
                    <li>• Sessions natation : {(data.enduranceData?.sessions?.swimming || data.enduranceData?.swimmingSessions || []).length} sessions</li>
                    <li>• Sessions corde à sauter : {(data.enduranceData?.sessions?.jumprope || data.enduranceData?.jumpropeSessions || []).length} sessions</li>
                    <li>• Sessions course : {(data.enduranceData?.sessions?.running || data.enduranceData?.runningSessions || []).length} sessions</li>
                    <li>• Défis actifs : {(data.enduranceData?.challenges || []).length} défis</li>
                  </ul>
                </div>
                  <div className="space-y-1 pt-2 border-t border-slate-600">
                    <h5 className="text-sm font-medium text-purple-300">⌚ Garmin</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Données synchronisées Garmin</li>
                      <li>• Activités et statistiques</li>
                  </ul>
                </div>
                  <div className="space-y-1 pt-2 border-t border-slate-600">
                    <h5 className="text-sm font-medium text-orange-300">🍎 Nutrition</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Repas et calories</li>
                      <li>• Suivi nutritionnel complet</li>
                  </ul>
                </div>
                  <div className="space-y-1 pt-2 border-t border-slate-600">
                    <h5 className="text-sm font-medium text-purple-300">⚙️ Configuration</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Date de début : {data.startDate ? new Date(data.startDate).toLocaleDateString('fr-FR') : 'Non définie'}</li>
                      <li>• Variante de semaine : {data.weekVariant || 'A'}</li>
                      <li>• Historique programmes : {(data.programHistory || []).length} entrées</li>
                  </ul>
              </div>
            </div>

                <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={exportAllData}
                disabled={exportStatus === 'loading'}
                icon={Download}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                    {exportStatus === 'loading' ? 'Export en cours...' : 'Export Complet Sport'}
              </Button>
              
              <Button
                onClick={exportBodyTrackingData}
                disabled={exportStatus === 'loading'}
                icon={FileText}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {exportStatus === 'loading' ? 'Export en cours...' : 'Export Suivi Corporel'}
              </Button>
              
              <Button
                onClick={handleExportGarminData}
                disabled={garminExportStatus === 'loading'}
                icon={Download}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {garminExportStatus === 'loading' ? 'Export en cours...' : 'Export Garmin'}
              </Button>
              
              <Button
                onClick={handleExportNutritionData}
                disabled={nutritionExportStatus === 'loading'}
                icon={Download}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {nutritionExportStatus === 'loading' ? 'Export en cours...' : 'Export Nutrition'}
              </Button>
                </div>
              </div>

              {/* Colonne Quêtes et Livres */}
              <div className="space-y-4">
                {/* Section Quêtes */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-white text-lg flex items-center">
                    <span className="mr-2">⚡</span>
                    Quêtes
                  </h4>
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-emerald-300">⚡ QuietQuest</h5>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Quêtes : {quietQuestStats.questsCount} quête{quietQuestStats.questsCount !== 1 ? 's' : ''}</li>
                        <li>• Validations : {quietQuestStats.validationsCount} validation{quietQuestStats.validationsCount !== 1 ? 's' : ''}</li>
                        <li>• Niveau utilisateur : {quietQuestStats.userLevel}</li>
                        <li>• Performances quotidiennes</li>
                        <li>• XP et progression</li>
                        <li>• Métadonnées complètes</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={handleExportQuietQuest}
                      disabled={quietQuestExportStatus === 'loading'}
                      icon={Download}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {quietQuestExportStatus === 'loading' ? 'Export en cours...' : 'Export QuietQuest'}
                    </Button>
                  </div>
                </div>

                {/* Section Livres */}
                <div className="space-y-4 pt-4 border-t border-slate-600">
                  <h4 className="font-semibold text-white text-lg flex items-center">
                    <BookOpen className="mr-2" size={20} />
                    Livres
                  </h4>
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-indigo-300">📚 Bibliothèque</h5>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Livres : {booksStats.totalBooks} livre{booksStats.totalBooks !== 1 ? 's' : ''}</li>
                        <li>• Sessions de lecture : {booksStats.totalSessions} session{booksStats.totalSessions !== 1 ? 's' : ''}</li>
                        <li>• En cours : {booksStats.inProgress} livre{booksStats.inProgress !== 1 ? 's' : ''}</li>
                        <li>• Terminés : {booksStats.completed} livre{booksStats.completed !== 1 ? 's' : ''}</li>
                        <li>• Couvertures et PDFs</li>
                        <li>• Métadonnées complètes</li>
                        <li>• Historique de lecture</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={handleExportBooksData}
                disabled={booksExportStatus === 'loading'}
                      icon={Download}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {booksExportStatus === 'loading' ? 'Export en cours...' : 'Export Livres'}
              </Button>
                  </div>
            </div>

                {/* Section Apprentissage */}
                <div className="space-y-4 pt-4 border-t border-slate-600">
                  <h4 className="font-semibold text-white text-lg flex items-center">
                    <span className="mr-2">📖</span>
                    Apprentissage
                  </h4>
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-cyan-300">📖 Apprentissage</h5>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Matières : {apprentissageStats.subjectsCount} matière{apprentissageStats.subjectsCount !== 1 ? 's' : ''}</li>
                        <li>• Sessions : {apprentissageStats.sessionsCount} session{apprentissageStats.sessionsCount !== 1 ? 's' : ''}</li>
                        <li>• Niveau global : {apprentissageStats.globalLevel}</li>
                        <li>• XP total : {apprentissageStats.globalXP}</li>
                        <li>• Temps d'étude : {Math.floor(apprentissageStats.totalStudyTime / 3600)}h</li>
                        <li>• Progression et badges</li>
                        <li>• Historique complet</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={handleExportApprentissage}
                      disabled={apprentissageExportStatus === 'loading'}
                      icon={Download}
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                    >
                      {apprentissageExportStatus === 'loading' ? 'Export en cours...' : 'Export Apprentissage'}
                    </Button>
                    <Button
                      onClick={handleImportApprentissage}
                      disabled={apprentissageImportStatus === 'loading'}
                      icon={Upload}
                      variant="outline"
                      className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      {apprentissageImportStatus === 'loading' ? 'Import en cours...' : 'Import Apprentissage'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages de statut */}
            <div className="space-y-2">
            {exportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {exportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.importExport.exportError')}
              </div>
            )}

            {garminExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                {t('messages.importExport.garminExportSuccess')}
              </div>
            )}

            {garminExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.importExport.garminExportError')}
              </div>
            )}

            {nutritionExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                {t('messages.importExport.nutritionExportSuccess')}
              </div>
            )}

            {nutritionExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.importExport.nutritionExportError')}
              </div>
            )}

              {quietQuestExportStatus === 'success' && (
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="mr-2" size={16} />
                  Export QuietQuest réussi ! Le fichier a été téléchargé.
                </div>
              )}

              {quietQuestExportStatus === 'error' && (
                <div className="flex items-center text-red-400 text-sm">
                  <AlertTriangle className="mr-2" size={16} />
                  Erreur lors de l'export QuietQuest
                </div>
              )}

            {booksExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export Livres réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {booksExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export des Livres
              </div>
            )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Livres - Export/Import dédié */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <BookOpen className="mr-2" size={20} />
            Livres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Gérez vos livres, sessions de lecture et métadonnées. Exportez et importez vos données de bibliothèque.
            </p>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Fonctionnalités :</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Gestion complète de votre bibliothèque personnelle</li>
                <li>• Suivi des sessions de lecture (durée, pages lues, notes)</li>
                <li>• Stockage des couvertures et PDFs dans IndexedDB</li>
                <li>• Export/Import au format JSON versionné</li>
                <li>• Intégration avec l'export global de l'application</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleExportBooksData}
                disabled={booksExportStatus === 'loading'}
                icon={Download}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {booksExportStatus === 'loading' ? 'Export en cours...' : 'Exporter les Livres'}
              </Button>
              
              <Button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      handleImportBooksData(event.target.result);
                    };
                    reader.readAsText(file);
                  };
                  input.click();
                }}
                disabled={booksImportStatus === 'loading'}
                icon={Upload}
                className="w-full bg-indigo-500 hover:bg-indigo-600"
              >
                {booksImportStatus === 'loading' ? 'Import en cours...' : 'Importer les Livres'}
              </Button>
            </div>

            {booksExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {booksExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export
              </div>
            )}

            {booksImportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Import réussi ! Les livres ont été restaurés.
              </div>
            )}

            {booksImportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'import
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ Section Budget Personnel - Export/Import dédié */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <span className="mr-2">💰</span>
            Budget Personnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Gérez votre budget personnel : revenus, épargne, catégories, dépenses, dépenses planifiées et charges fixes. Exportez et importez toutes vos données budgétaires.
            </p>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Fonctionnalités :</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Gestion complète de votre budget personnel (revenus, épargne, objectifs)</li>
                <li>• Suivi des dépenses par catégorie avec budgets mensuels</li>
                <li>• Gestion des dépenses planifiées et charges fixes récurrentes</li>
                <li>• Stockage dans IndexedDB (performance optimale)</li>
                <li>• Export/Import au format JSON versionné avec métadonnées</li>
                <li>• Intégration avec l'export global de l'application</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleExportBudgetData}
                disabled={budgetExportStatus === 'loading'}
                icon={Download}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {budgetExportStatus === 'loading' ? 'Export en cours...' : 'Exporter le Budget'}
              </Button>
              
              <Button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      handleImportBudgetData(event.target.result);
                    };
                    reader.readAsText(file);
                  };
                  input.click();
                }}
                disabled={budgetImportStatus === 'loading'}
                icon={Upload}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {budgetImportStatus === 'loading' ? 'Import en cours...' : 'Importer le Budget'}
              </Button>
            </div>

            {budgetExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {budgetExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export
              </div>
            )}

            {budgetImportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Import réussi ! Les données ont été restaurées.
              </div>
            )}

            {budgetImportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'import
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section QuietQuest - Export/Import dédié */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <span className="mr-2">⚡</span>
            QuietQuest - Quêtes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Gérez vos quêtes, validations, XP et performances quotidiennes. Exportez et importez vos données de quêtes.
            </p>
            
            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <div className="text-slate-400 text-xs">Quêtes</div>
                <div className="text-emerald-300 font-semibold">{quietQuestStats.questsCount}</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <div className="text-slate-400 text-xs">Validations</div>
                <div className="text-emerald-300 font-semibold">{quietQuestStats.validationsCount}</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <div className="text-slate-400 text-xs">Niveau</div>
                <div className="text-emerald-300 font-semibold">{quietQuestStats.userLevel}</div>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Fonctionnalités :</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Gestion complète de vos quêtes (récurrentes et exceptionnelles)</li>
                <li>• Suivi des validations et calcul automatique de l'XP</li>
                <li>• Stockage dans IndexedDB (performance optimale)</li>
                <li>• Export/Import au format JSON versionné avec métadonnées</li>
                <li>• Backup automatique avant import</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleExportQuietQuest}
                disabled={quietQuestExportStatus === 'loading'}
                icon={Download}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {quietQuestExportStatus === 'loading' ? 'Export en cours...' : 'Exporter QuietQuest'}
              </Button>
              
              <Button
                onClick={handleImportQuietQuest}
                disabled={quietQuestImportStatus === 'loading'}
                icon={Upload}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {quietQuestImportStatus === 'loading' ? 'Import en cours...' : 'Importer QuietQuest'}
              </Button>
            </div>

            {quietQuestExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {quietQuestExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export
              </div>
            )}

            {quietQuestImportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Import réussi ! Les données ont été restaurées.
              </div>
            )}

            {quietQuestImportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'import
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Import */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Upload className="mr-2" size={20} />
            Import des données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-400 mr-2 mt-0.5" size={16} />
                <div className="text-sm text-yellow-200">
                  <strong>Attention :</strong> L'import remplacera toutes vos données actuelles. 
                  Une sauvegarde automatique sera créée avant l'import.
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Importer depuis un fichier :
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
                />
              </div>

              <div className="text-center text-gray-400">ou</div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Coller les données JSON :
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={t('settings.tooltips.import.placeholder')}
                  className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={previewImport}
                disabled={!importData.trim() || importStatus === 'loading'}
                icon={FileText}
                variant="outline"
                className="flex-1"
                title={t('settings.tooltips.import.previewBodyTracking')}
              >
                Prévisualiser (Body Tracking)
              </Button>
              
              {/* ✅ FIX CALENDRIER : Bouton pour prévisualiser l'import COMPLET */}
              <Button
                onClick={previewImportAllData}
                disabled={!importData.trim() || allDataImportStatus === 'loading'}
                icon={FileText}
                variant="outline"
                className="flex-1 bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30"
                title={t('settings.tooltips.import.previewComplete')}
              >
                {allDataImportStatus === 'loading' ? 'Prévisualisation...' : 'Prévisualiser (Complet)'}
              </Button>
              
              <Button
                onClick={() => handleImportGarminData(importData)}
                disabled={!importData.trim() || garminImportStatus === 'loading'}
                icon={Upload}
                variant="outline"
                className="bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
                title={t('settings.tooltips.import.importGarmin')}
              >
                {garminImportStatus === 'loading' ? 'Import...' : 'Import Garmin'}
              </Button>
              
              {localStorage.getItem('workoutData_preImport_backup') && (
                <Button
                  onClick={restorePreImportBackup}
                  icon={RotateCcw}
                  variant="outline"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                >
                  Restaurer
                </Button>
              )}
            </div>

            {importStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.importExport.invalidJson')}
              </div>
            )}

            {importStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                {t('messages.success.imported')}
              </div>
            )}

            {importStatus === 'restored' && (
              <div className="flex items-center text-blue-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                {t('messages.success.restoreBackup')}
              </div>
            )}

            {garminImportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                {t('messages.importExport.garminSuccess')}
              </div>
            )}

            {garminImportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.importExport.garminError')}
              </div>
            )}

            {/* ✅ FIX CALENDRIER : Statuts pour l'import complet */}
            {allDataImportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                {t('messages.importExport.fullSuccess')}
              </div>
            )}

            {allDataImportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.importExport.fullError')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ FIX CALENDRIER : Modal de prévisualisation pour l'import COMPLET */}
      {showAllDataImportPreview && allDataPreviewData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Prévisualisation de l'import complet</h3>
                <Button
                  onClick={() => {
                    setShowAllDataImportPreview(false);
                    setAllDataPreviewData(null);
                  }}
                  variant="outline"
                  className="text-white border-slate-600 hover:bg-slate-700"
                >
                  <X size={16} />
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Statistiques */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Statistiques des données à importer</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Exercices :</span>
                      <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.exercises || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Répétitions :</span>
                      <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.reps || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Étirements :</span>
                      <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.stretches || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Sessions endurance :</span>
                      <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.enduranceSessions || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Photos :</span>
                      <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.photos || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Entrées progression :</span>
                      <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.progressEntries || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Historique reps :</span>
                      <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.historyReps || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Variations journalières :</span>
                      <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.dailyVariations || 0}</span>
                    </div>
                  </div>
                </div>
                
                {/* Warnings */}
                {allDataPreviewData.warnings && allDataPreviewData.warnings.length > 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                    <h4 className="text-yellow-300 font-medium mb-2 flex items-center">
                      <AlertTriangle className="mr-2" size={16} />
                      Avertissements
                    </h4>
                    <ul className="list-disc list-inside text-yellow-200 text-sm space-y-1">
                      {allDataPreviewData.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Erreurs */}
                {allDataPreviewData.errors && allDataPreviewData.errors.length > 0 && (
                  <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                    <h4 className="text-red-300 font-medium mb-2 flex items-center">
                      <AlertTriangle className="mr-2" size={16} />
                      Erreurs
                    </h4>
                    <ul className="list-disc list-inside text-red-200 text-sm space-y-1">
                      {allDataPreviewData.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Note importante */}
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="text-blue-400 mr-2 mt-0.5" size={16} />
                    <div className="text-sm text-blue-200">
                      <strong>Note importante :</strong> L'import va fusionner intelligemment les données avec vos données existantes. 
                      Les données existantes seront préservées si les nouvelles données sont vides. 
                      Une sauvegarde automatique sera créée avant l'import.
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowAllDataImportPreview(false);
                      setAllDataPreviewData(null);
                    }}
                    variant="outline"
                    className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={confirmImportAllData}
                    disabled={allDataImportStatus === 'loading'}
                    icon={Save}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {allDataImportStatus === 'loading' ? 'Import en cours...' : 'Confirmer l\'import complet'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévisualisation (Body Tracking uniquement) */}
      {showImportPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Prévisualisation de l'import</h3>
                <Button
                  onClick={() => setShowImportPreview(false)}
                  variant="ghost"
                  size="sm"
                  icon={X}
                />
              </div>

              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Statistiques des données :</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      <h5 className="text-blue-300 font-medium">🏋️ Entraînement</h5>
                      <div className="space-y-1 pl-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Exercices :</span>
                          <span className="text-white">{previewData.stats.exercises}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Répétitions :</span>
                          <span className="text-white">{previewData.stats.reps}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Étirements :</span>
                          <span className="text-white">{previewData.stats.stretches}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Historique reps :</span>
                          <span className="text-white">{previewData.stats.historyReps || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-green-300 font-medium">📊 Suivi Corporel</h5>
                      <div className="space-y-1 pl-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Photos :</span>
                          <span className="text-white">{previewData.stats.photos}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Entrées progression :</span>
                          <span className="text-white">{previewData.stats.progressEntries || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rappels :</span>
                          <span className="text-white">{previewData.stats.reminders || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Historique programmes :</span>
                          <span className="text-white">{previewData.stats.programHistory || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {previewData.isExportFormat && (
                  <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                    <div className="flex items-center text-green-400 text-sm">
                      <CheckCircle className="mr-2" size={16} />
                      Format d'export détecté - Données validées
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowImportPreview(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={confirmImport}
                    disabled={importStatus === 'loading'}
                    icon={Save}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {importStatus === 'loading' ? 'Import en cours...' : 'Confirmer l\'import'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FIX CALENDRIER : Section Nettoyage des données mockées */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <AlertTriangle className="mr-2" size={20} />
            Nettoyage des données mockées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-400 mr-2 mt-0.5" size={16} />
                <div className="text-sm text-yellow-200">
                  <strong>Attention :</strong> Cette fonction supprime toutes les données mockées/fausses d'endurance détectées automatiquement.
                  <br />
                  <br />
                  <strong>Données supprimées :</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Sessions avec durée suspecte (880 min, 1200 min, etc.)</li>
                    <li>Sessions avec sauts suspectes (13200, 13000-13500, etc.)</li>
                    <li>Sessions natation avec distance suspecte (1.5m avec durée élevée)</li>
                    <li>Sessions avec dates futures</li>
                    <li>Toutes autres données mockées détectées</li>
                  </ul>
                  <br />
                  Une sauvegarde automatique sera créée avant la suppression.
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={debugMockSessions}
                variant="outline"
                icon={AlertTriangle}
                className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                title={t('settings.tooltips.cleanup.debugConsole')}
              >
                Debug (Console)
              </Button>
              
              <Button
                onClick={handleCleanupMockEndurance}
                disabled={cleanupStatus === 'loading'}
                icon={AlertTriangle}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800"
                title={t('settings.tooltips.cleanup.removeMocked')}
              >
                {cleanupStatus === 'loading' ? 'Nettoyage...' : 'Supprimer mockées'}
              </Button>
            </div>

            {cleanupStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Nettoyage réussi ! Les données mockées ont été supprimées.
              </div>
            )}

            {cleanupStatus === 'none' && (
              <div className="flex items-center text-blue-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Aucune donnée mockée trouvée. Vos données sont déjà propres.
              </div>
            )}

            {cleanupStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.errors.cleanupGeneric')}
              </div>
            )}

            {localStorage.getItem('workoutData_preCleanup_backup') && (
              <Button
                onClick={async () => {
                  try {
                    const backup = localStorage.getItem('workoutData_preCleanup_backup');
                    if (backup) {
                      const parsedBackup = JSON.parse(backup);
                      await updateData(parsedBackup.data);
                      alert(`✅ ${t('messages.success.restoreBackup')}`);
                      window.location.reload();
                    }
                  } catch (error) {
                    alert(`❌ ${t('messages.importExport.restoreError', { error: error.message })}`);
                  }
                }}
                icon={RotateCcw}
                variant="outline"
                className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              >
                Restaurer la sauvegarde pré-nettoyage
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Citations Page d'Accueil */}
      <QuotesErrorBoundary>
        <QuoteManager />
      </QuotesErrorBoundary>

      {/* Section Navigation */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Navigation className="mr-2" size={20} />
            Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-gray-300 text-sm">
              Personnalisez la navigation par swipe sur la page d'accueil.
            </p>

            {/* Toggle Activer/Désactiver */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-200">
                    Activer la navigation par swipe
                  </label>
                  <p className="text-xs text-slate-400">
                    Swipez vers le bas sur la page d'accueil pour accéder au dashboard
                  </p>
                </div>
                <button
                  onClick={() => handleSwipeEnabledChange(!swipeEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                    swipeEnabled ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                  role="switch"
                  aria-checked={swipeEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      swipeEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Slider pour le threshold */}
            {swipeEnabled && (
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-200">
                      Distance de swipe requise
                    </label>
                    <span className="text-sm font-semibold text-blue-400">
                      {swipeThreshold}px
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Ajustez la distance minimale pour déclencher la navigation (50-200px)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={swipeThreshold}
                    onChange={(e) => handleSwipeThresholdChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    style={{
                      background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${((swipeThreshold - 50) / 150) * 100}%, rgb(51 65 85) ${((swipeThreshold - 50) / 150) * 100}%, rgb(51 65 85) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>50px (Sensible)</span>
                    <span>200px (Moins sensible)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Message de statut */}
            {swipeSettingsStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Paramètres sauvegardés avec succès
              </div>
            )}

            {swipeSettingsStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de la sauvegarde des paramètres
              </div>
            )}

            {/* Informations supplémentaires */}
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-slate-200">💡 Astuce</h4>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Le swipe fonctionne uniquement sur la page d'accueil</li>
                <li>• Les boutons et éléments interactifs ne sont pas affectés</li>
                <li>• Un indicateur visuel apparaît pendant le swipe</li>
                <li>• Raccourci clavier : Appuyez sur 'D' pour accéder au dashboard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Langue */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Languages className="mr-2" size={20} />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              {t('settings.language.description')}
            </p>
            <LanguageSelector variant="dropdown" position="bottom-left" />
          </div>
        </CardContent>
      </Card>

      {/* Section Informations */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Database className="mr-2" size={20} />
            Informations de sauvegarde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Sauvegarde automatique :</span>
              <span className="text-green-400">✅ Activée (IndexedDB + localStorage)</span>
            </div>
            <div className="flex justify-between">
              <span>Fréquence de sauvegarde :</span>
              <span>Automatique (1 seconde après modification)</span>
            </div>
            <div className="flex justify-between">
              <span>Sauvegarde de secours :</span>
              <span className="text-blue-400">localStorage (en cas d'échec IndexedDB)</span>
            </div>
            <div className="flex justify-between">
              <span>Mécanisme de récupération :</span>
              <span>3 tentatives avec fallback automatique</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Attributions */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <FileText className="mr-2" size={20} />
            Attributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Prix de l'or :</span>
              <a 
                href="https://goldpricez.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Source: GoldPriceZ.com
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Les données de prix de l'or sont fournies par GoldPriceZ.com via leur API gratuite.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal des paramètres de la page d'accueil */}
      {showHomePageSettings && (
        <HomePageImageSettings onClose={() => setShowHomePageSettings(false)} />
      )}

      {/* Modal des paramètres de la carte de profil */}
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