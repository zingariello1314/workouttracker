/**
 * Hook useSettingsExport - Gestion de tous les exports
 * 
 * ✅ PHASE 4 : Extraction de la logique d'export
 * 
 * Gère tous les exports : Sport complet, Body Tracking, Garmin, Nutrition, Books, Budget, QuietQuest, Apprentissage
 * 
 * @module components/tabs/SettingsTab/hooks/useSettingsExport
 */

import { useState, useCallback } from 'react';
import { 
  prepareExportData, 
  downloadExportFile 
} from '../../../BodyTracking/utils/exportImport';
import { 
  prepareBooksExportData, 
  downloadBooksExportFile 
} from '../../../../utils/booksExportImport';
import { 
  getAllBooksFromIndexedDB 
} from '../../../../utils/booksIndexedDB';
import { 
  loadBooks as loadBooksFromLocalStorage 
} from '../../../../utils/booksStorage';
import { 
  prepareBudgetExportData 
} from '../../../../utils/budgetExportImport';
import { 
  exportQuietQuestData 
} from '../../../../utils/quietQuestExportImport';
import { 
  exportApprentissageData,
  prepareApprentissageExportData
} from '../../../../utils/apprentissageExportImport';
import { prepareFinanceExportData } from '../../../../utils/financeExportImport';
import { 
  compressGarminExport 
} from '../../GarminTab/utils/jsonCompression';
import { 
  compressNutritionExport 
} from '../../../../utils/nutritionCompression';
import { ENDURANCE_SCHEMA_VERSION } from '../../../../services/endurance/enduranceDataService';
import {
  loadSportProgramContext,
  prepareSportExportBundle
} from '../utils/sportExportBundle';
import { resolveLatestProgramContext } from '../../../../utils/programVersionUtils';
import { flushAllAppPersistence } from '../../../../services/persistence/appPersistenceFlush';
import { collectSportLocalSnapshot } from '../utils/sportLocalSnapshot';
import {
  buildGarminDailyIndex,
  buildGarminExportSummary
} from '../utils/garminExportSummary';

function downloadJsonFile(filename, payload) {
  const jsonString = JSON.stringify(payload);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function loadBooksForExport() {
  try {
    const indexedBooks = await getAllBooksFromIndexedDB();
    if (Array.isArray(indexedBooks) && indexedBooks.length > 0) return indexedBooks;
  } catch {
    /* repli localStorage */
  }
  try {
    return loadBooksFromLocalStorage() || [];
  } catch {
    return [];
  }
}

/**
 * Hook pour gérer tous les exports
 * 
 * @param {Object} data - Données actuelles
 * @param {Function} loadFromDB - Fonction pour charger depuis la DB
 * @param {Function} exportGarminData - Fonction pour exporter Garmin
 * @param {Function} exportNutritionData - Fonction pour exporter Nutrition
 * @returns {Object} États et handlers pour tous les exports
 */
export const useSettingsExport = (
  data,
  loadFromDB,
  exportGarminData,
  exportNutritionData,
  { storageKey = 'anonymous', currentUser = null, liveProgramContext = null } = {}
) => {
  // États pour chaque type d'export
  const [exportStatus, setExportStatus] = useState(null);
  const [siteExportStatus, setSiteExportStatus] = useState(null);
  const [garminExportStatus, setGarminExportStatus] = useState(null);
  const [nutritionExportStatus, setNutritionExportStatus] = useState(null);
  const [booksExportStatus, setBooksExportStatus] = useState(null);
  const [budgetExportStatus, setBudgetExportStatus] = useState(null);
  const [quietQuestExportStatus, setQuietQuestExportStatus] = useState(null);
  const [apprentissageExportStatus, setApprentissageExportStatus] = useState(null);

  // Export Body Tracking uniquement
  const exportBodyTrackingData = useCallback(async () => {
    try {
      setExportStatus('loading');
      
      const currentData = await loadFromDB();
      const dataToExport = currentData || data;
      
      const bodyTrackingData = {
        progressPhotos: dataToExport.progressPhotos || [],
        progressEntries: dataToExport.progressEntries || [],
        bodyTrackingReminders: dataToExport.bodyTrackingReminders || [],
        bodyTrackingLastUpdated: dataToExport.bodyTrackingLastUpdated || null,
        bodyTrackingPrefs: dataToExport.bodyTrackingPrefs || {}
      };
      
      const exportData = prepareExportData(bodyTrackingData, {
        includePhotos: true,
        compressPhotos: false,
        includeMetadata: true,
        includeReminders: true
      });
      
      await downloadExportFile(exportData);
      
      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export du suivi corporel:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  }, [data, loadFromDB]);

  // Export sport : entraînement, Garmin, nutrition. Pas les livres ni le budget.
  const collectSportComplete = useCallback(async () => {
      try {
        await flushAllAppPersistence();
      } catch (flushErr) {
        console.warn('[export] Flush avant export incomplet:', flushErr);
      }

      const currentData = await loadFromDB();
      const dataToExport = currentData || data;
      const storedProgramContext = await loadSportProgramContext(storageKey);
      const programContext = resolveLatestProgramContext(storedProgramContext, liveProgramContext);
      const sportBundle = prepareSportExportBundle({
        workoutData: dataToExport,
        programContext,
        userProfile: currentUser
      });

      // Garmin complet (activités + métriques quotidiennes FC, pas, etc.)
      let garminData = null;
      try {
        garminData = await exportGarminData();
      } catch (error) {
        console.warn('⚠️ Erreur récupération données Garmin pour export global:', error);
      }

      // Récupérer données Nutrition
      let nutritionData = null;
      let nutritionWarning = null;
      try {
        nutritionData = await exportNutritionData();
        if (nutritionData?.unavailable) {
          nutritionWarning = nutritionData.reason || 'nutrition-unavailable';
          console.warn('⚠️ Nutrition non incluse dans l’export:', nutritionWarning);
          nutritionData = null;
        }
      } catch (error) {
        nutritionWarning = error?.message || 'nutrition-export-failed';
        console.warn('⚠️ Erreur récupération données Nutrition pour export global:', error);
      }
      
      const exportObject = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        exportType: 'Sport Complete',
        appName: 'Momentum',
        sportLocalSnapshot: collectSportLocalSnapshot(),
        data: sportBundle.data,
        sportExport: {
          ...sportBundle.sportExport,
          ...(garminData
            ? { garminDailyIndex: buildGarminDailyIndex(garminData) }
            : {})
        },
        metadata: {
          ...sportBundle.metadata,
          enduranceSchemaVersion: dataToExport.enduranceData?.schemaVersion || ENDURANCE_SCHEMA_VERSION,
          enduranceChallenges: (dataToExport.enduranceData?.challenges || []).length,
          progressPhotos: (dataToExport.progressPhotos || []).length,
          progressEntries: (dataToExport.progressEntries || []).length,
          bodyTrackingReminders: (dataToExport.bodyTrackingReminders || []).length,
          bodyTrackingLastUpdated: dataToExport.bodyTrackingLastUpdated || null,
          bodyTrackingStats: {
            photosWithWeight: (dataToExport.progressPhotos || []).filter((p) => p.weight).length,
            photosWithNotes: (dataToExport.progressPhotos || []).filter((p) => p.notes).length,
            photosWithMeasurements: (dataToExport.progressPhotos || []).filter(
              (p) => p.measurements && Object.keys(p.measurements).length > 0
            ).length,
            entriesByType: (dataToExport.progressEntries || []).reduce((acc, entry) => {
              acc[entry.type] = (acc[entry.type] || 0) + 1;
              return acc;
            }, {}),
            dateRange: {
              earliest:
                (dataToExport.progressPhotos || [])
                  .concat(dataToExport.progressEntries || [])
                  .map((item) => item.date)
                  .sort()[0] || null,
              latest:
                (dataToExport.progressPhotos || [])
                  .concat(dataToExport.progressEntries || [])
                  .map((item) => item.date)
                  .sort()
                  .reverse()[0] || null
            }
          },
          dayJustificationsDetail: {
            total: Object.keys(dataToExport.dayJustifications || {}).length,
            byReason: Object.values(dataToExport.dayJustifications || {}).reduce((acc, justification) => {
              const reason = justification?.reason || 'autre';
              acc[reason] = (acc[reason] || 0) + 1;
              return acc;
            }, {}),
            version: dataToExport.dayJustificationsVersion || '1.0'
          },
          startDate: dataToExport.startDate,
          nutritionSummary: nutritionData
            ? {
                totalDailyMeals: nutritionData.metadata?.totalDailyMeals || 0,
                totalMeals: nutritionData.metadata?.totalMeals || 0,
                totalPrograms: nutritionData.metadata?.totalPrograms || 0,
                totalFavoriteFoods: nutritionData.metadata?.totalFavoriteFoods || 0,
                dateRange: nutritionData.metadata?.dateRange || null,
                activeProgram: nutritionData.programs?.find((p) => p.isActive)?.name || null
              }
            : null,
          garminSummary: garminData ? buildGarminExportSummary(garminData) : null,
          nutritionWarning
        }
      };

      if (garminData) {
        exportObject.data.garminData = garminData;
      }

      if (nutritionData) {
        exportObject.data.nutritionData = nutritionData;
      }

      return exportObject;
  }, [data, loadFromDB, exportNutritionData, exportGarminData, storageKey, currentUser, liveProgramContext]);

  const exportAllData = useCallback(async () => {
    try {
      setExportStatus('loading');
      const exportObject = await collectSportComplete();
      const jsonString = JSON.stringify(exportObject);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `momentum-sport-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export complet:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  }, [collectSportComplete]);

  const exportSiteData = useCallback(async () => {
    try {
      setSiteExportStatus('loading');
      const [sport, booksForExport, budget, quietQuest, apprentissage, finance] = await Promise.all([
        collectSportComplete(),
        loadBooksForExport().then((books) => prepareBooksExportData(books, {
          includeSessions: true,
          includeMetadata: true
        })),
        prepareBudgetExportData({
          includeHistory: true,
          includeMetadata: true,
          includeCalculations: false
        }).catch((error) => {
          console.warn('[export site] Budget ignoré:', error);
          return null;
        }),
        exportQuietQuestData({ includeMetadata: true }).catch((error) => {
          console.warn('[export site] QuietQuest ignoré:', error);
          return null;
        }),
        prepareApprentissageExportData().catch((error) => {
          console.warn('[export site] Apprentissage ignoré:', error);
          return null;
        }),
        prepareFinanceExportData({
          includeCalculations: true,
          includeYahooData: true,
          includeHistory: true
        }).catch((error) => {
          console.warn('[export site] Finance ignorée:', error);
          return null;
        })
      ]);

      downloadJsonFile(
        `momentum-site-backup-${new Date().toISOString().split('T')[0]}.json`,
        {
          version: '1.0',
          exportDate: new Date().toISOString(),
          exportType: 'Site Complete',
          appName: 'Momentum',
          sections: {
            sport,
            books: booksForExport,
            budget,
            quietQuest,
            apprentissage,
            finance
          }
        }
      );
      setSiteExportStatus('success');
      setTimeout(() => setSiteExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export site:', error);
      setSiteExportStatus('error');
      setTimeout(() => setSiteExportStatus(null), 3000);
    }
  }, [collectSportComplete]);

  // Export Garmin
  const handleExportGarminData = useCallback(async () => {
    try {
      setGarminExportStatus('loading');
      const garminData = await exportGarminData();
      const forcedHistory = garminData.forcedRangesHistory || [];
      const lastForcedEntry = forcedHistory[0] || null;
      
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
          }
        }
      };

      const compressedExport = compressGarminExport(exportObject, {
        level: 6,
        force: false
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
  }, [exportGarminData]);

  // Export Nutrition
  const handleExportNutritionData = useCallback(async (useCompression = true) => {
    try {
      setNutritionExportStatus('loading');
      const nutritionData = await exportNutritionData();
      if (nutritionData?.unavailable) {
        throw new Error(nutritionData.reason || 'nutrition-db-not-ready');
      }
      
      const totalMeals = nutritionData.meals?.length || 0;
      const totalDailyMeals = nutritionData.dailyMeals?.length || 0;
      const activeProgram = nutritionData.programs?.find(p => p.isActive) || null;
      
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
          totalDailyMeals: totalDailyMeals,
          totalMeals: totalMeals,
          totalPrograms: nutritionData.programs?.length || 0,
          totalFavoriteFoods: nutritionData.favoriteFoods?.length || 0,
          mealsByType: mealsByType,
          totalCalories: totalCalories,
          activeProgram: activeProgram ? {
            id: activeProgram.id,
            name: activeProgram.name,
            goal: activeProgram.goal,
            targetCalories: activeProgram.targetCalories
          } : null,
          dateRange: dateRange,
        }
      };

      const compressedExport = useCompression 
        ? await compressNutritionExport(exportObject, {
            level: 6,
            force: false
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
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = compressedExport.compressed ? '.json.gz' : '.json';
      link.download = `nutrition-data-export-${new Date().toISOString().split('T')[0]}${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (compressedExport.compressed) {
        console.log(`[Settings] Export Nutrition compressé: ${compressedExport.originalSize} → ${compressedExport.compressedSize} bytes (${compressedExport.savings.toFixed(1)}% économisés)`);
      }

      setNutritionExportStatus('success');
      setTimeout(() => setNutritionExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export Nutrition:', error);
      setNutritionExportStatus('error');
      setTimeout(() => setNutritionExportStatus(null), 3000);
    }
  }, [exportNutritionData]);

  // Export Books
  const handleExportBooksData = useCallback(async () => {
    try {
      setBooksExportStatus('loading');
      
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

      const booksExport = prepareBooksExportData(booksForExport, {
        includeSessions: true,
        includeMetadata: true
      });

      downloadBooksExportFile(booksExport);

      setBooksExportStatus('success');
      setTimeout(() => setBooksExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export Livres:', error);
      setBooksExportStatus('error');
      setTimeout(() => setBooksExportStatus(null), 3000);
    }
  }, []);

  // Export Budget
  const handleExportBudgetData = useCallback(async () => {
    try {
      setBudgetExportStatus('loading');
      
      const budgetExport = await prepareBudgetExportData({
        includeHistory: true,
        includeMetadata: true,
        includeCalculations: false
      });

      const blob = new Blob([JSON.stringify(budgetExport, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBudgetExportStatus('success');
      setTimeout(() => setBudgetExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export Budget:', error);
      setBudgetExportStatus('error');
      setTimeout(() => setBudgetExportStatus(null), 3000);
    }
  }, []);

  // Export QuietQuest
  const handleExportQuietQuest = useCallback(async () => {
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
  }, []);

  // Export Apprentissage
  const handleExportApprentissage = useCallback(async () => {
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
  }, []);

  return {
    // États
    exportStatus,
    siteExportStatus,
    garminExportStatus,
    nutritionExportStatus,
    booksExportStatus,
    budgetExportStatus,
    quietQuestExportStatus,
    apprentissageExportStatus,
    
    // Handlers
    exportBodyTrackingData,
    exportAllData,
    exportSiteData,
    handleExportGarminData,
    handleExportNutritionData,
    handleExportBooksData,
    handleExportBudgetData,
    handleExportQuietQuest,
    handleExportApprentissage,
  };
};

export default useSettingsExport;
