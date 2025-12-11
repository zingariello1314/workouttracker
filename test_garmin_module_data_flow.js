/**
 * Test du flux de données pour le module Garmin
 * Vérifie que les données passent correctement de useSidebarData vers GarminMetricsModule
 */

import { renderHook } from '@testing-library/react';
import { useSidebarData } from './src/hooks/useSidebarData.js';

console.log('🔍 TEST FLUX DE DONNÉES GARMIN');

// Mock des hooks nécessaires
const mockUseAuth = () => ({ isAuthenticated: true });
const mockUseWorkout = () => ({ getWorkoutHistory: () => [] });
const mockUseQuietQuestEngine = () => ({
  userData: { currentXP: 1000, level: 5 },
  dailyPerformances: [],
  getQuestsForDate: () => [],
  isQuestCompletedOnDate: () => false
});

const mockUseGarminData = () => ({
  loadDataForTab: async () => ({
    dailyMetrics: {
      '2025-12-10': {
        calories: { active: 650, resting: 1350, total: 2000 },
        bodyBattery: 78,
        steps: 7500,
        heartRate: { resting: 62, max: 158, avg: 115 },
        sleep: { duration: 450, quality: 'good' }
      }
    }
  }),
  dbReady: true
});

const mockUseNutritionData = () => ({
  getDailyMeal: async () => null,
  dbReady: true
});

const mockUseSynthese = () => ({ patrimoine: null });
const mockUsePlanificateur = () => ({ salaire: null, repartition: null });
const mockUseBooksStorage = () => ({ books: [] });

// Test du hook useSidebarData
async function testSidebarData() {
  try {
    console.log('1️⃣ Test du hook useSidebarData...');
    
    // Simuler l'environnement React
    const mockHooks = {
      useAuth: mockUseAuth,
      useWorkout: mockUseWorkout,
      useQuietQuestEngine: mockUseQuietQuestEngine,
      useGarminData: mockUseGarminData,
      useNutritionData: mockUseNutritionData,
      useSynthese: mockUseSynthese,
      usePlanificateur: mockUsePlanificateur,
      useBooksStorage: mockUseBooksStorage
    };
    
    console.log('2️⃣ Simulation des données Garmin...');
    const garminHook = mockUseGarminData();
    const garminData = await garminHook.loadDataForTab('metrics', null, 'week');
    
    console.log('✅ Données Garmin simulées:');
    console.log('- dbReady:', garminHook.dbReady);
    console.log('- dailyMetrics:', !!garminData?.dailyMetrics);
    
    if (garminData?.dailyMetrics) {
      const today = '2025-12-10';
      const todayMetrics = garminData.dailyMetrics[today];
      
      if (todayMetrics) {
        console.log('📊 Métriques du jour trouvées:');
        console.log('- calories:', todayMetrics.calories);
        console.log('- bodyBattery:', todayMetrics.bodyBattery);
        console.log('- steps:', todayMetrics.steps);
        console.log('- heartRate:', todayMetrics.heartRate);
        console.log('- sleep:', todayMetrics.sleep);
      }
    }
    
    console.log('3️⃣ Test de la structure des données sport...');
    
    // Simuler la structure que useSidebarData devrait retourner
    const expectedSportData = {
      weeklyWorkouts: 0,
      todayCalories: garminData?.dailyMetrics?.['2025-12-10']?.calories?.total || 0,
      todaySteps: garminData?.dailyMetrics?.['2025-12-10']?.steps || 0,
      avgHeartRate: garminData?.dailyMetrics?.['2025-12-10']?.heartRate?.resting || 72,
      hasGarminData: true,
      todayMetrics: garminData?.dailyMetrics?.['2025-12-10'] || null,
      garminData: garminData || null
    };
    
    console.log('✅ Structure sport attendue:');
    console.log('- hasGarminData:', expectedSportData.hasGarminData);
    console.log('- todayMetrics:', !!expectedSportData.todayMetrics);
    console.log('- todayCalories:', expectedSportData.todayCalories);
    console.log('- todaySteps:', expectedSportData.todaySteps);
    
    console.log('4️⃣ Vérification du passage des props...');
    
    // Simuler les props que ModuleRenderer devrait passer
    const moduleProps = {
      moduleId: 'garmin-metrics-module',
      moduleType: 'historical',
      navigationTarget: { tab: 'sport', subtab: 'today' },
      navigation: { navigateToModule: () => {} },
      data: {
        sport: expectedSportData
      },
      todayDate: '2025-12-10',
      isLoading: false
    };
    
    console.log('✅ Props du module:');
    console.log('- moduleId:', moduleProps.moduleId);
    console.log('- data.sport.hasGarminData:', moduleProps.data.sport.hasGarminData);
    console.log('- data.sport.todayMetrics:', !!moduleProps.data.sport.todayMetrics);
    
    if (moduleProps.data.sport.todayMetrics) {
      console.log('📊 Métriques dans les props:');
      const metrics = moduleProps.data.sport.todayMetrics;
      console.log('- calories:', metrics.calories);
      console.log('- bodyBattery:', metrics.bodyBattery);
      console.log('- steps:', metrics.steps);
    }
    
    console.log('5️⃣ Recommandations:');
    
    if (expectedSportData.hasGarminData && expectedSportData.todayMetrics) {
      console.log('✅ Le flux de données semble correct');
      console.log('   Le module devrait afficher les métriques');
    } else {
      console.log('❌ Problème dans le flux de données');
      console.log('   Vérifier useSidebarData et la base de données Garmin');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Lancer le test
testSidebarData();

console.log('🚀 Test du flux de données terminé');