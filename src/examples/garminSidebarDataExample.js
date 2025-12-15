/**
 * Exemple d'utilisation du transformateur de données Garmin sidebar
 * 
 * Requirements: 1.2, 1.4
 * - Démontrer l'utilisation de la transformation des données (1.2)
 * - Montrer la gestion des cas d'erreur (1.4)
 */

import { garminSidebarDataTransformer } from '../services/garmin/garminSidebarDataTransformer';
import { transformGarminDataForSidebar } from '../utils/garminSidebarDataUtils';

/**
 * Exemple d'utilisation basique
 */
export async function basicUsageExample() {
  // Données Garmin simulées (comme celles du hook useRealGarminData)
  const rawGarminData = {
    dailyMetrics: {
      '2025-12-15': {
        heartRate: {
          resting: 65,
          max: 180,
          avg: 85,
          timeSeries: [
            { timestamp: 1734249600000, bpm: 65 },
            { timestamp: 1734274800000, bpm: 85 },
            { timestamp: 1734282000000, bpm: 180 }
          ]
        },
        steps: 8500,
        calories: {
          active: 800,
          resting: 1200,
          total: 2000
        },
        bodyBattery: 75,
        sleep: {
          duration: 480,
          deep: 120,
          light: 240,
          rem: 90,
          awake: 30
        }
      }
    }
  };

  // Options de transformation
  const options = {
    selectedDate: '2025-12-15',
    enableTimeSeriesData: true,
    optimizeForSidebar: true,
    maxTimeSeriesPoints: 100
  };

  try {
    // Utilisation directe du transformateur
    const transformedData = await garminSidebarDataTransformer.transformToSidebarData(
      rawGarminData,
      options
    );

    console.log('✅ Données transformées avec succès');
    console.log('📊 Série temporelle FC:', transformedData.heartRateTimeSeries.length, 'points');
    console.log('🎯 Zones FC:', transformedData.heartRateZones.length, 'zones');
    console.log('💤 Phases de sommeil:', transformedData.sleepPhases?.length || 0, 'phases');

    return transformedData;

  } catch (error) {
    console.error('❌ Erreur de transformation:', error.message);
    throw error;
  }
}

/**
 * Exemple avec gestion d'erreurs avancée
 */
export async function advancedUsageExample() {
  // Données incomplètes pour tester la gestion d'erreurs
  const incompleteData = {
    dailyMetrics: {
      '2025-12-15': {
        heartRate: {
          resting: 65
          // Données manquantes: max, avg, timeSeries
        },
        steps: 5000
        // Données manquantes: calories, sleep, etc.
      }
    }
  };

  const options = {
    selectedDate: '2025-12-15',
    enableTimeSeriesData: true,
    optimizeForSidebar: true
  };

  try {
    // Utilisation avec gestion d'erreurs
    const { data, error, warnings } = await transformGarminDataForSidebar(
      incompleteData,
      options
    );

    if (error) {
      console.warn('⚠️ Erreur détectée:', error.message);
      console.log('💡 Suggestion:', error.details?.suggestion);
    }

    if (warnings.length > 0) {
      console.warn('⚠️ Avertissements:', warnings.join(', '));
    }

    console.log('📈 Données disponibles:', data.hasData);
    console.log('🔄 Série temporelle:', data.hasTimeSeriesData);

    return { data, error, warnings };

  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    throw error;
  }
}

/**
 * Exemple d'intégration avec un composant React
 */
export function useGarminSidebarData(rawData, selectedDate) {
  const [sidebarData, setSidebarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function transformData() {
      if (!rawData) return;

      setLoading(true);
      setError(null);

      try {
        const options = {
          selectedDate,
          enableTimeSeriesData: true,
          optimizeForSidebar: true
        };

        const { data, error: transformError } = await transformGarminDataForSidebar(
          rawData,
          options
        );

        setSidebarData(data);
        
        if (transformError) {
          setError(transformError);
        }

      } catch (err) {
        setError(err);
        console.error('[useGarminSidebarData] Erreur:', err);
      } finally {
        setLoading(false);
      }
    }

    transformData();
  }, [rawData, selectedDate]);

  return { sidebarData, loading, error };
}

/**
 * Exemple de validation des données
 */
export function validateGarminSidebarData(data) {
  const issues = [];

  // Vérifier les métriques de base
  if (!data.todayMetrics) {
    issues.push('Métriques quotidiennes manquantes');
  } else {
    if (!data.todayMetrics.heartRate.resting && !data.todayMetrics.heartRate.max) {
      issues.push('Aucune donnée de fréquence cardiaque');
    }
    
    if (data.todayMetrics.steps === 0) {
      issues.push('Aucun pas enregistré');
    }
  }

  // Vérifier les données de série temporelle
  if (data.hasTimeSeriesData && data.heartRateTimeSeries.length === 0) {
    issues.push('Série temporelle activée mais vide');
  }

  // Vérifier les zones FC
  if (data.heartRateZones.length === 0) {
    issues.push('Aucune zone de fréquence cardiaque');
  }

  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 20)) // Score sur 100
  };
}

// Exemple d'utilisation
if (typeof window === 'undefined') {
  // Exécuter les exemples en mode Node.js
  console.log('🚀 Démarrage des exemples...\n');
  
  basicUsageExample()
    .then(() => console.log('\n✅ Exemple basique terminé'))
    .catch(err => console.error('❌ Erreur exemple basique:', err));
    
  advancedUsageExample()
    .then(() => console.log('\n✅ Exemple avancé terminé'))
    .catch(err => console.error('❌ Erreur exemple avancé:', err));
}