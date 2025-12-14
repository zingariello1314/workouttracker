/**
 * Script de test pour le nouveau service de données Garmin réelles
 * Teste la récupération et le formatage des données depuis l'onglet Sport
 */

console.log('🧪 Test du service de données Garmin réelles');

// Simuler des données Garmin réelles comme celles de l'onglet Sport
const mockRawGarminData = {
  dailyMetrics: {
    '2024-12-14': {
      calories: {
        active: 450,
        resting: 1200,
        total: 1650
      },
      heartRate: {
        resting: 65,
        max: 185,
        average: 85
      },
      bodyBattery: 75,
      steps: 8500,
      sleep: {
        duration: 450, // 7h30 en minutes
        deep: 120,
        light: 200,
        rem: 100,
        awake: 30
      },
      stress: {
        average: 35,
        max: 80
      },
      intensityMinutes: {
        total: 45,
        vigorous: 15,
        moderate: 30
      }
    }
  },
  activities: {
    swimming: [],
    jumpRope: [],
    cardio: []
  }
};

// Test du service
async function testGarminRealDataService() {
  try {
    // Importer le service
    const { default: garminRealDataService } = await import('./src/services/garmin/garminRealDataService.js');
    
    console.log('✅ Service importé avec succès');
    
    // Tester le formatage des données
    const formattedData = garminRealDataService.processMetrics(
      mockRawGarminData.dailyMetrics['2024-12-14'],
      mockRawGarminData.dailyMetrics,
      '2024-12-14'
    );
    
    console.log('📊 Données formatées:', {
      hasData: formattedData.hasData,
      dataSource: formattedData.dataSource,
      dataDate: formattedData.dataDate,
      calories: formattedData.todayMetrics.calories,
      heartRate: formattedData.todayMetrics.heartRate,
      bodyBattery: formattedData.todayMetrics.bodyBattery,
      steps: formattedData.todayMetrics.steps,
      sleep: formattedData.todayMetrics.sleep,
      stress: formattedData.todayMetrics.stress,
      intensityMinutes: formattedData.todayMetrics.intensityMinutes
    });
    
    // Tester les graphiques
    console.log('📈 Données graphiques:', {
      heartRateZones: formattedData.heartRateZones?.length || 0,
      sleepPhases: formattedData.sleepPhases?.length || 0,
      stressLevels: formattedData.stressLevels?.length || 0,
      maxHeartRate: formattedData.maxHeartRate,
      sleepObjective: formattedData.sleepObjective
    });
    
    // Afficher quelques détails des graphiques
    if (formattedData.heartRateZones?.length > 0) {
      console.log('❤️ Zones de fréquence cardiaque:');
      formattedData.heartRateZones.forEach(zone => {
        console.log(`  Zone ${zone.zone} (${zone.name}): ${zone.min}-${zone.max} bpm, ${zone.time} min`);
      });
    }
    
    if (formattedData.sleepPhases?.length > 0) {
      console.log('😴 Phases de sommeil:');
      formattedData.sleepPhases.forEach(phase => {
        console.log(`  ${phase.phase}: ${phase.duration} min (${phase.quality})`);
      });
    }
    
    if (formattedData.stressLevels?.length > 0) {
      console.log('😰 Niveaux de stress:');
      formattedData.stressLevels.slice(0, 3).forEach(level => {
        console.log(`  ${level.time}: ${level.level} (${level.category})`);
      });
    }
    
    // Tester le cache
    garminRealDataService.updateCache(formattedData);
    const cachedData = garminRealDataService.getCachedData();
    
    console.log('💾 Cache:', {
      isCached: !!cachedData,
      isValid: garminRealDataService.isCacheValid(),
      lastUpdate: garminRealDataService.lastUpdate
    });
    
    // Tester les données vides
    const emptyData = garminRealDataService.getEmptyData();
    console.log('🗂️ Données vides:', {
      hasData: emptyData.hasData,
      dataSource: emptyData.dataSource,
      calories: emptyData.todayMetrics.calories,
      heartRateZones: emptyData.heartRateZones.length
    });
    
    console.log('✅ Tous les tests sont passés avec succès !');
    
    return {
      success: true,
      formattedData,
      cachedData,
      emptyData
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Exécuter le test
testGarminRealDataService().then(result => {
  if (result.success) {
    console.log('🎉 Test terminé avec succès');
  } else {
    console.log('💥 Test échoué:', result.error);
  }
});