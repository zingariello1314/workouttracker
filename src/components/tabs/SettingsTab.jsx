import React, { useState, useRef } from 'react';
import { Download, Upload, Settings, Database, FileText, AlertTriangle, CheckCircle, X, Save, RotateCcw, Image } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
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

const SettingsTab = () => {
  const { data, updateData, loadFromDB, deleteMockEnduranceSessions } = useWorkout();
  const { exportAll: exportGarminData, importAll: importGarminData } = useGarminData();
  const { exportAll: exportNutritionData } = useNutritionData();
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [importData, setImportData] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showHomePageSettings, setShowHomePageSettings] = useState(false);
  const [garminExportStatus, setGarminExportStatus] = useState(null);
  const [garminImportStatus, setGarminImportStatus] = useState(null);
  const [nutritionExportStatus, setNutritionExportStatus] = useState(null);
  const [allDataImportStatus, setAllDataImportStatus] = useState(null);
  const [showAllDataImportPreview, setShowAllDataImportPreview] = useState(false);
  const [allDataPreviewData, setAllDataPreviewData] = useState(null);
  const [cleanupStatus, setCleanupStatus] = useState(null);
  const fileInputRef = useRef(null);

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
          exportSize: JSON.stringify(dataToExport).length
        }
      };
      
      // ✅ Ajouter les données nutrition dans l'export si disponibles
      if (nutritionData) {
        exportObject.data.nutritionData = nutritionData;
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
            dailyMeals: ['date', 'programId', 'isComplete', 'mealIds', 'dailyTotals', 'lastModified'],
            meals: ['id', 'date', 'type', 'timestamp', 'foods', 'totalCalories', 'totalProtein', 'totalCarbs', 'totalFat', 'notes'],
            programs: ['id', 'name', 'isActive', 'goal', 'targetCalories', 'targetProtein', 'targetCarbs', 'targetFat', 'startDate'],
            favoriteFoods: ['id', 'name', 'category', 'isFavorite', 'caloriesPer100', 'proteinPer100', 'carbsPer100', 'fatPer100', 'usageCount'],
            hydrationLogs: ['date', 'waterIntake', 'targetWater', 'entries', 'notes', 'lastModified'],
            progressPhotos: ['id', 'type', 'date', 'sequenceId', 'timestamp', 'thumbnail', 'format', 'metadata']
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
      
      // Valider les données
      const validation = validateAllWorkoutData(parsedData);
      
      if (!validation.isValid) {
        setAllDataImportStatus('error');
        console.error('Erreurs de validation:', validation.errors);
        return;
      }
      
      // Préparer les données de prévisualisation
      setAllDataPreviewData({
        data: validation.data,
        stats: validation.stats,
        warnings: validation.warnings,
        errors: validation.errors,
        isExportFormat: !!parsedData.data || !!parsedData.metadata
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
      
      // Utiliser les données de prévisualisation validées
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
      
      // ✅ Sauvegarder les données fusionnées et nettoyées
      await updateData(mergedData);
      
      // ✅ Forcer rechargement depuis IndexedDB pour mettre à jour le state
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
        if (window.confirm('Import réussi ! Souhaitez-vous recharger la page pour voir les changements ?')) {
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
      alert(`❌ Erreur lors du debug : ${error.message}`);
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
          if (window.confirm('Souhaitez-vous recharger la page pour voir les changements ?')) {
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
      alert(`❌ Erreur lors du nettoyage : ${error.message}`);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Settings className="mr-3" size={28} />
          ⚙️ Paramètres & Sauvegarde
        </h2>
      </div>

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
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Données incluses :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-blue-300">🏋️ Entraînement</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Exercices cochés : {Object.keys(data.checkedExercises || {}).length} entrées</li>
                    <li>• Répétitions : {Object.keys(data.reps || {}).length} entrées</li>
                    <li>• Étirements : {Object.keys(data.checkedStretches || {}).length} entrées</li>
                    <li>• Historique répétitions : {Object.keys(data.historyReps || {}).length} entrées</li>
                  </ul>
                </div>
                <div className="space-y-1">
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
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-purple-300">🏠 Page d'Accueil</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Images de fond : Système indépendant</li>
                    <li>• Bannières : Système indépendant</li>
                    <li>• Dernière mise à jour : Système indépendant</li>
                  </ul>
                </div>
                <div className="space-y-1">
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
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-purple-300">⚙️ Configuration</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Date de début : {data.startDate ? new Date(data.startDate).toLocaleDateString('fr-FR') : 'Non définie'}</li>
                    <li>• Variante de semaine : {data.weekVariant || 'A'}</li>
                    <li>• Historique programmes : {(data.programHistory || []).length} entrées</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-yellow-300">📈 Statistiques</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Total propriétés : {Object.keys(data).length} champs</li>
                    <li>• Taille données : {(JSON.stringify(data).length / 1024).toFixed(1)} KB</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={exportAllData}
                disabled={exportStatus === 'loading'}
                icon={Download}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {exportStatus === 'loading' ? 'Export en cours...' : 'Export Complet'}
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

            {exportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {exportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export. Veuillez réessayer.
              </div>
            )}

            {garminExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export Garmin réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {garminExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export Garmin. Veuillez réessayer.
              </div>
            )}

            {nutritionExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export Nutrition réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {nutritionExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export Nutrition. Veuillez réessayer.
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
                  placeholder="Collez ici le contenu JSON de votre sauvegarde..."
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
                title="Prévisualiser l'import Body Tracking uniquement"
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
                title="Prévisualiser l'import COMPLET (toutes les données d'entraînement)"
              >
                {allDataImportStatus === 'loading' ? 'Prévisualisation...' : 'Prévisualiser (Complet)'}
              </Button>
              
              <Button
                onClick={() => handleImportGarminData(importData)}
                disabled={!importData.trim() || garminImportStatus === 'loading'}
                icon={Upload}
                variant="outline"
                className="bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
                title="Importer uniquement les données Garmin"
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
                Données JSON invalides. Vérifiez le format.
              </div>
            )}

            {importStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Import réussi ! Vos données ont été mises à jour.
              </div>
            )}

            {importStatus === 'restored' && (
              <div className="flex items-center text-blue-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Sauvegarde restaurée avec succès !
              </div>
            )}

            {garminImportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Import Garmin réussi ! Les données ont été importées.
              </div>
            )}

            {garminImportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'import Garmin. Vérifiez le format JSON.
              </div>
            )}

            {/* ✅ FIX CALENDRIER : Statuts pour l'import complet */}
            {allDataImportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Import complet réussi ! Toutes vos données ont été importées.
              </div>
            )}

            {allDataImportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'import complet. Vérifiez le format JSON et réessayez.
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
                title="Debug : Identifier les sessions mockées dans la console"
              >
                Debug (Console)
              </Button>
              
              <Button
                onClick={handleCleanupMockEndurance}
                disabled={cleanupStatus === 'loading'}
                icon={AlertTriangle}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800"
                title="Supprimer toutes les données mockées d'endurance détectées"
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
                Erreur lors du nettoyage. Vérifiez la console pour plus de détails.
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
                      alert('✅ Sauvegarde restaurée avec succès !');
                      window.location.reload();
                    }
                  } catch (error) {
                    alert(`❌ Erreur lors de la restauration : ${error.message}`);
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

      {/* Modal des paramètres de la page d'accueil */}
      {showHomePageSettings && (
        <HomePageImageSettings onClose={() => setShowHomePageSettings(false)} />
      )}
    </div>
  );
};

export default SettingsTab;