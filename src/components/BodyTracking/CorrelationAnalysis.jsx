import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Award,
  Trophy
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import {
  calculatePearsonCorrelation,
  getCorrelationStrength,
  generateCorrelationDescription,
  alignDataByDate
} from './utils/correlationUtils';
import {
  generateInsights,
  generateRecommendations,
  determineTrend
} from './utils/correlationInsights';
import {
  analyzeVolumeWeightCorrelation,
  analyzeVolumeMuscleCorrelation,
  identifyOptimalFrequency,
  calculateWeeklyVolume
} from './utils/historyIntegration';
import {
  analyzeEnduranceWeightCorrelation,
  calculateEnduranceCaloriesForPeriod
} from './utils/enduranceIntegration';
import {
  findSuccessPatterns
} from './utils/successPatternsAnalyzer';
import logger from '../../utils/logger';
import { useGarminData } from '../../hooks/useGarminData';

const log = logger.component('CorrelationAnalysis');

const CorrelationAnalysis = () => {
  const { data, getWorkoutHistory } = useWorkout();
  const { loadAllData, dbReady } = useGarminData();
  const [garminData, setGarminData] = React.useState(null);
  
  // Obtenir poids moyen pour calculs précis d'endurance
  const avgWeight = useMemo(() => {
    if (!data?.progressEntries || data.progressEntries.length === 0) {
      return 70; // Poids moyen par défaut
    }
    
    const weightEntries = data.progressEntries
      .filter(entry => entry.type === 'metrics' && entry.weight != null && !isNaN(entry.weight))
      .map(entry => entry.weight);
    
    if (weightEntries.length === 0) {
      return 70;
    }
    
    return weightEntries.reduce((sum, w) => sum + w, 0) / weightEntries.length;
  }, [data?.progressEntries]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCorrelations, setSelectedCorrelations] = useState(['strong', 'moderate']);
  const [showSuccessPatterns, setShowSuccessPatterns] = useState(false);
  const [successCriteria, setSuccessCriteria] = useState('global');
  const [successPatternsData, setSuccessPatternsData] = useState(null);
  
  // Charger données Garmin pour analyse patterns de succès
  React.useEffect(() => {
    if (dbReady && showSuccessPatterns) {
      loadAllData()
        .then(loaded => {
          setGarminData(loaded);
        })
        .catch(error => {
          log.error('Erreur chargement données Garmin pour patterns de succès', error);
          setGarminData(null);
        });
    }
  }, [dbReady, showSuccessPatterns, loadAllData]);

  // 🏆 ANALYSE DES PATTERNS DE SUCCÈS
  React.useEffect(() => {
    if (showSuccessPatterns && data?.progressEntries && data.progressEntries.length >= 4) {
      try {
        const workoutHistory = getWorkoutHistory ? getWorkoutHistory() : [];
        const enduranceData = data?.enduranceData || {};
        
        const result = findSuccessPatterns(
          data.progressEntries,
          workoutHistory,
          garminData || {},
          enduranceData,
          {
            period: selectedTimeframe === '1month' ? '1month' : 
                    selectedTimeframe === '6months' ? '6months' :
                    selectedTimeframe === '1year' ? '1year' : '3months',
            minWeeks: 2,
            successThreshold: 70,
            criteria: successCriteria
          }
        );
        
        setSuccessPatternsData(result.success ? result : { success: false, message: result.message || 'Erreur inconnue' });
      } catch (error) {
        log.error('Erreur lors de l\'analyse des patterns de succès', error);
        setSuccessPatternsData({ success: false, message: 'Erreur lors du calcul' });
      }
    } else if (!showSuccessPatterns) {
      setSuccessPatternsData(null);
    }
  }, [showSuccessPatterns, data?.progressEntries, data?.enduranceData, getWorkoutHistory, garminData, selectedTimeframe, successCriteria]);

  // 🔍 CALCUL RÉEL DES CORRÉLATIONS DEPUIS LES DONNÉES INDEXEDDB
  const correlationData = useMemo(() => {
    if (!data?.progressEntries || data.progressEntries.length === 0) {
      return [];
    }

    // Définir la période sélectionnée
    const cutoffDate = new Date();
    const timeframeMonths = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '1year': 12
    };
    const months = timeframeMonths[selectedTimeframe] || 3;
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    // Filtrer les entrées dans la période
    const relevantEntries = data.progressEntries.filter(entry => {
      const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : null);
      return entryDate && entryDate >= cutoffDate;
    });

    if (relevantEntries.length < 3) {
      // Pas assez de données pour calculer des corrélations
      return [];
    }

    // Définir les métriques à analyser (paires pertinentes)
    const metricPairs = [
      // Métriques de base (type 'metrics')
      { key1: 'weight', label1: 'Poids', key2: 'waist', label2: 'Tour de taille', type1: 'metrics', type2: 'metrics' },
      { key1: 'weight', label1: 'Poids', key2: 'chest', label2: 'Tour de poitrine', type1: 'metrics', type2: 'metrics' },
      { key1: 'weight', label1: 'Poids', key2: 'hips', label2: 'Tour de hanches', type1: 'metrics', type2: 'metrics' },
      { key1: 'waist', label1: 'Tour de taille', key2: 'chest', label2: 'Tour de poitrine', type1: 'metrics', type2: 'metrics' },
      { key1: 'waist', label1: 'Tour de taille', key2: 'hips', label2: 'Tour de hanches', type1: 'metrics', type2: 'metrics' },
      { key1: 'arms', label1: 'Tour de bras', key2: 'thighs', label2: 'Tour de cuisse', type1: 'metrics', type2: 'metrics' },
      
      // Impédancemétrie (type 'impedance') - ✅ CORRIGÉ : Utilisation des noms de champs corrects
      { key1: 'bodyFatPercentage', label1: 'Pourcentage de graisse', key2: 'visceralFatIndex', label2: 'Indice de graisse viscérale', type1: 'impedance', type2: 'impedance' },
      { key1: 'muscleMass', label1: 'Masse musculaire', key2: 'basalMetabolism', label2: 'Métabolisme de base', type1: 'impedance', type2: 'impedance' },
      { key1: 'bodyWater', label1: 'Eau corporelle', key2: 'muscleMass', label2: 'Masse musculaire', type1: 'impedance', type2: 'impedance' },
      { key1: 'bodyFatPercentage', label1: 'Pourcentage de graisse', key2: 'bodyFatMass', label2: 'Masse graisseuse', type1: 'impedance', type2: 'impedance' },
      { key1: 'metabolicAge', label1: 'Âge métabolique', key2: 'bodyFatPercentage', label2: 'Pourcentage de graisse', type1: 'impedance', type2: 'impedance' },
      
      // Cross-type (metrics + impedance) - ✅ CORRIGÉ : Utilisation des noms de champs corrects
      { key1: 'weight', label1: 'Poids', key2: 'bodyFatPercentage', label2: 'Pourcentage de graisse', type1: 'metrics', type2: 'impedance' },
      { key1: 'weight', label1: 'Poids', key2: 'muscleMass', label2: 'Masse musculaire', type1: 'metrics', type2: 'impedance' },
      { key1: 'waist', label1: 'Tour de taille', key2: 'visceralFatIndex', label2: 'Indice de graisse viscérale', type1: 'metrics', type2: 'impedance' },
      
      // ✅ INTÉGRATION VOLUME D'ENTRAÎNEMENT (History Tab) - Corrélations volume vs changements corporels
      { key1: 'workoutVolume', label1: 'Volume d\'entraînement', key2: 'weight', label2: 'Poids', type1: 'computed', type2: 'metrics', requiresHistory: true },
      { key1: 'workoutVolume', label1: 'Volume d\'entraînement', key2: 'muscleMass', label2: 'Masse musculaire', type1: 'computed', type2: 'impedance', requiresHistory: true },
      { key1: 'workoutVolume', label1: 'Volume d\'entraînement', key2: 'bodyFatPercentage', label2: 'Pourcentage de graisse', type1: 'computed', type2: 'impedance', requiresHistory: true },
    ];

    /**
     * Extrait une série de données pour une métrique donnée avec gestion des fallbacks
     * Gère la compatibilité avec les anciens formats (skeletalMuscle → muscleMass, visceralFat → visceralFatIndex)
     * ✅ ÉTENDU : Supporte aussi le type 'computed' pour métriques calculées (ex: volume d'entraînement)
     * @param {string} metricKey - Clé de la métrique (ex: 'muscleMass', 'workoutVolume')
     * @param {string} entryType - Type d'entrée ('metrics', 'impedance', ou 'computed')
     * @param {Object} pair - Paire de métriques (pour accéder à requiresHistory si nécessaire)
     * @returns {Array<{date: Date, value: number}>} Série de données avec dates
     */
    const extractMetricSeries = (metricKey, entryType, pair = null) => {
      // ✅ GÉRER TYPE 'computed' (métriques calculées depuis autres sources)
      if (entryType === 'computed') {
        if (metricKey === 'workoutVolume' && pair?.requiresHistory) {
          // ✅ CALCULER VOLUME D'ENTRAÎNEMENT DEPUIS WORKOUT HISTORY
          const workoutHistory = getWorkoutHistory ? getWorkoutHistory() : [];
          if (!workoutHistory || workoutHistory.length === 0) {
            return []; // Pas de données d'entraînement
          }
          
          // Calculer volume hebdomadaire pour la période
          const weeklyVolume = calculateWeeklyVolume(workoutHistory, cutoffDate, endDate);
          
          if (!weeklyVolume || !weeklyVolume.weeks || weeklyVolume.weeks.length === 0) {
            return [];
          }
          
          // ✅ CRÉER SÉRIE DEPUIS WEEKLY VOLUME
          // Chaque semaine donne un point de données (volume total de la semaine)
          return weeklyVolume.weeks
            .map(week => ({
              date: new Date(week.startDate), // Utiliser début de semaine comme date
              value: week.totalReps || 0 // Volume total (répétitions) de la semaine
            }))
            .filter(point => point.value > 0) // Filtrer semaines sans entraînement
            .sort((a, b) => a.date.getTime() - b.date.getTime()); // ✅ TRIER PAR DATE CROISSANTE
        }
        
        // Autres types computed non implémentés pour l'instant
        return [];
      }
      // ✅ DÉFINIR LES FALLBACKS DE MANIÈRE CENTRALISÉE
      // Mapping nouveau format → ancien format pour compatibilité
      const fallbackMap = {
        'muscleMass': 'skeletalMuscle',      // Nouveau format → ancien format
        'visceralFatIndex': 'visceralFat',    // Nouveau format → ancien format
      };
      
      const fallbackKey = fallbackMap[metricKey];
      
      const entries = relevantEntries
        .filter(entry => {
          // Vérifier le type d'abord (optimisation performance)
          if (entry.type !== entryType) return false;
          
          // ✅ GESTION INTELLIGENTE DES FALLBACKS
          let value = entry[metricKey];
          
          // Si valeur principale absente, essayer fallback
          if (value == null && fallbackKey && entry[fallbackKey] != null) {
            value = entry[fallbackKey];
          }
          
          // Validation stricte : valeur numérique, finie, et positive (pour la plupart des métriques)
          return value != null && 
                 !isNaN(value) && 
                 isFinite(value) &&
                 (metricKey === 'bodyFatPercentage' || metricKey === 'bodyWater' || metricKey === 'proteinPercentage' 
                  ? value >= 0 && value <= 100  // Pourcentages : 0-100
                  : value > 0);  // Autres métriques doivent être > 0
        })
        .map(entry => {
          // ✅ UTILISER LA VALEUR AVEC FALLBACK APPLIQUÉ
          let value = entry[metricKey];
          
          if (value == null && fallbackKey && entry[fallbackKey] != null) {
            value = entry[fallbackKey];
          }
          
          // Normaliser la date
          const entryDate = entry.date 
            ? new Date(entry.date) 
            : (entry.timestamp ? new Date(entry.timestamp) : new Date());
          
          return {
            date: entryDate,
            value: parseFloat(value)
          };
        })
        .filter(entry => {
          // ✅ VALIDATION FINALE STRICTE
          return isFinite(entry.value) && 
                 entry.value > 0 && 
                 !isNaN(entry.date.getTime());
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // ✅ TRIER PAR DATE CROISSANTE

      return entries;
    };

    // Calculer les corrélations pour chaque paire
    const correlations = [];
    let correlationId = 1;

    for (const pair of metricPairs) {
      const series1 = extractMetricSeries(pair.key1, pair.type1);
      const series2 = extractMetricSeries(pair.key2, pair.type2);

      if (series1.length < 3 || series2.length < 3) {
        continue; // Pas assez de données pour cette paire
      }

      // Aligner les données par date
      const aligned = alignDataByDate(series1, series2);

      if (aligned.x.length < 3) {
        continue; // Pas assez de points communs
      }

      // Calculer la corrélation
      const result = calculatePearsonCorrelation(aligned.x, aligned.y);

      if (result.correlation == null || isNaN(result.correlation)) {
        continue; // Corrélation invalide
      }

      const strength = getCorrelationStrength(result.correlation);
      const direction = result.correlation >= 0 ? 'positive' : 'negative';
      const trend = determineTrend(aligned.dates, aligned.x, aligned.y, result.correlation);

      // Générer description, insights et recommandations
      const description = generateCorrelationDescription(pair.label1, pair.label2, result.correlation, strength, direction);
      const insights = generateInsights(pair.label1, pair.label2, result.correlation, strength, direction, result.n, aligned.dates);
      const recommendations = generateRecommendations(pair.label1, pair.label2, result.correlation, strength, direction);

      correlations.push({
        id: correlationId++,
        variable1: pair.label1,
        variable2: pair.label2,
        correlation: result.correlation,
        strength,
        direction,
        significance: result.pValue != null ? result.pValue : 0.05,
        dataPoints: result.n,
        trend,
        description,
        insights,
        recommendations
      });
    }

    // 🔄 NOUVEAU: Ajouter corrélations avec volume d'entraînement (HistoryTab)
    try {
      const workoutHistory = getWorkoutHistory ? getWorkoutHistory() : [];
      
      if (workoutHistory && workoutHistory.length > 0) {
        const endDate = new Date();
        const startDate = new Date(cutoffDate);
        
        // Corrélation Volume vs Poids
        const volumeWeightCorrelation = analyzeVolumeWeightCorrelation(
          workoutHistory,
          relevantEntries,
          startDate,
          endDate
        );
        
        if (volumeWeightCorrelation && volumeWeightCorrelation.sampleSize >= 2) {
          const strength = getCorrelationStrength(volumeWeightCorrelation.correlation);
          const direction = volumeWeightCorrelation.correlation >= 0 ? 'positive' : 'negative';
          const description = generateCorrelationDescription(
            'Volume d\'entraînement',
            'Changement de poids',
            volumeWeightCorrelation.correlation,
            strength,
            direction
          );
          const insights = generateInsights(
            'Volume d\'entraînement',
            'Changement de poids',
            volumeWeightCorrelation.correlation,
            strength,
            direction,
            volumeWeightCorrelation.sampleSize,
            volumeWeightCorrelation.dataPoints.map(dp => new Date(dp.date))
          );
          
          correlations.push({
            id: correlationId++,
            variable1: 'Volume d\'entraînement',
            variable2: 'Changement de poids',
            correlation: volumeWeightCorrelation.correlation,
            strength,
            direction,
            significance: 0.05,
            dataPoints: volumeWeightCorrelation.sampleSize,
            trend: direction === 'negative' ? 'improving' : direction === 'positive' ? 'decreasing' : 'stable',
            description,
            insights,
            recommendations: [
              volumeWeightCorrelation.interpretation,
              ...generateRecommendations('Volume d\'entraînement', 'Changement de poids', volumeWeightCorrelation.correlation, strength, direction)
            ],
            isActivityCorrelation: true // Flag pour identifier corrélations activité
          });
        }
        
        // Corrélation Volume vs Masse musculaire
        const volumeMuscleCorrelation = analyzeVolumeMuscleCorrelation(
          workoutHistory,
          relevantEntries,
          startDate,
          endDate
        );
        
        if (volumeMuscleCorrelation && volumeMuscleCorrelation.sampleSize >= 2) {
          const strength = getCorrelationStrength(volumeMuscleCorrelation.correlation);
          const direction = volumeMuscleCorrelation.correlation >= 0 ? 'positive' : 'negative';
          const description = generateCorrelationDescription(
            'Volume d\'entraînement',
            'Gain de masse musculaire',
            volumeMuscleCorrelation.correlation,
            strength,
            direction
          );
          const insights = generateInsights(
            'Volume d\'entraînement',
            'Gain de masse musculaire',
            volumeMuscleCorrelation.correlation,
            strength,
            direction,
            volumeMuscleCorrelation.sampleSize,
            volumeMuscleCorrelation.dataPoints.map(dp => new Date(dp.date))
          );
          
          correlations.push({
            id: correlationId++,
            variable1: 'Volume d\'entraînement',
            variable2: 'Gain de masse musculaire',
            correlation: volumeMuscleCorrelation.correlation,
            strength,
            direction,
            significance: 0.05,
            dataPoints: volumeMuscleCorrelation.sampleSize,
            trend: direction === 'positive' ? 'improving' : direction === 'negative' ? 'decreasing' : 'stable',
            description,
            insights,
            recommendations: [
              volumeMuscleCorrelation.interpretation,
              ...generateRecommendations('Volume d\'entraînement', 'Gain de masse musculaire', volumeMuscleCorrelation.correlation, strength, direction)
            ],
            isActivityCorrelation: true // Flag pour identifier corrélations activité
          });
        }
      }
    } catch (error) {
      log.error('Erreur lors du calcul des corrélations volume d\'entraînement', error);
    }
    
    // ✅ INTÉGRATION ENDURANCE : Corrélations avec calories endurance (EnduranceTab)
    // ✅ DÉDUPLICATION : Exclure les dates déjà trackées par Garmin pour éviter double comptage
    try {
      const enduranceData = data?.enduranceData || {};
      
      // ✅ CRÉER SET DES DATES DÉJÀ TRACKÉES PAR GARMIN
      const garminActivityDates = new Set();
      if (garminData?.activities) {
        Object.values(garminData.activities).flat().forEach(activity => {
          const activityDate = activity.startTime 
            ? new Date(activity.startTime).toISOString().split('T')[0]
            : (activity.date ? new Date(activity.date).toISOString().split('T')[0] : null);
          if (activityDate) {
            garminActivityDates.add(activityDate);
          }
        });
      }
      
      // ✅ FILTRER ENDURANCE DATA : Exclure dates déjà dans Garmin
      const filteredEnduranceData = {
        ...enduranceData,
        sessions: Object.entries(enduranceData.sessions || {}).reduce((acc, [type, sessions]) => {
          if (!Array.isArray(sessions)) {
            acc[type] = sessions;
            return acc;
          }
          
          // Filtrer sessions pour exclure dates déjà trackées par Garmin
          acc[type] = sessions.filter(session => {
            if (!session.date) return false;
            const sessionDate = new Date(session.date).toISOString().split('T')[0];
            return !garminActivityDates.has(sessionDate); // ✅ DÉDUPLICATION
          });
          return acc;
        }, {})
      };
      
      if (filteredEnduranceData.sessions && Object.keys(filteredEnduranceData.sessions).some(type => 
        Array.isArray(filteredEnduranceData.sessions[type]) && filteredEnduranceData.sessions[type].length > 0
      )) {
        // ✅ CORRÉLATION CALORIES ENDURANCE VS POIDS (avec données filtrées)
        const enduranceWeightCorrelation = analyzeEnduranceWeightCorrelation(
          filteredEnduranceData, // ✅ Utiliser données filtrées (sans doublons Garmin)
          relevantEntries,
          cutoffDate,
          new Date(),
          avgWeight
        );
        
        if (enduranceWeightCorrelation && enduranceWeightCorrelation.sampleSize >= 2) {
          const strength = getCorrelationStrength(enduranceWeightCorrelation.correlation);
          const direction = enduranceWeightCorrelation.correlation >= 0 ? 'positive' : 'negative';
          const description = generateCorrelationDescription(
            'Calories endurance',
            'Changement de poids',
            enduranceWeightCorrelation.correlation,
            strength,
            direction
          );
          const insights = generateInsights(
            'Calories endurance',
            'Changement de poids',
            enduranceWeightCorrelation.correlation,
            strength,
            direction,
            enduranceWeightCorrelation.sampleSize,
            enduranceWeightCorrelation.dataPoints.map(dp => new Date(dp.date))
          );
          
          correlations.push({
            id: correlationId++,
            variable1: 'Calories endurance',
            variable2: 'Changement de poids',
            correlation: enduranceWeightCorrelation.correlation,
            strength,
            direction,
            significance: 0.05,
            dataPoints: enduranceWeightCorrelation.sampleSize,
            trend: direction === 'negative' ? 'improving' : direction === 'positive' ? 'decreasing' : 'stable',
            description,
            insights,
            recommendations: [
              enduranceWeightCorrelation.interpretation,
              ...generateRecommendations('Calories endurance', 'Changement de poids', enduranceWeightCorrelation.correlation, strength, direction)
            ],
            isActivityCorrelation: true // Flag pour identifier corrélations activité
          });
        }
      }
    } catch (error) {
      log.error('Erreur lors du calcul des corrélations calories endurance', error);
    }

    // Trier par valeur absolue de corrélation (plus fortes en premier)
    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [data?.progressEntries, selectedTimeframe, getWorkoutHistory, avgWeight]);

  const timeframes = [
    { value: '1month', label: '1 mois' },
    { value: '3months', label: '3 mois' },
    { value: '6months', label: '6 mois' },
    { value: '1year', label: '1 an' }
  ];

  const strengthLevels = [
    { value: 'strong', label: 'Forte (>0.7)', color: 'text-green-400', bgColor: 'bg-green-600/20' },
    { value: 'moderate', label: 'Modérée (0.3-0.7)', color: 'text-yellow-400', bgColor: 'bg-yellow-600/20' },
    { value: 'weak', label: 'Faible (<0.3)', color: 'text-red-400', bgColor: 'bg-red-600/20' }
  ];

  const getCorrelationStrength = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'strong';
    if (abs >= 0.3) return 'moderate';
    return 'weak';
  };

  const getCorrelationColor = (correlation) => {
    const strength = getCorrelationStrength(correlation);
    const strengthInfo = strengthLevels.find(s => s.value === strength);
    return strengthInfo?.color || 'text-gray-400';
  };

  const getCorrelationBg = (correlation) => {
    const strength = getCorrelationStrength(correlation);
    const strengthInfo = strengthLevels.find(s => s.value === strength);
    return strengthInfo?.bgColor || 'bg-gray-600/20';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'stable':
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSignificanceLevel = (significance) => {
    if (significance < 0.001) return { level: 'Très élevée', color: 'text-green-400' };
    if (significance < 0.01) return { level: 'Élevée', color: 'text-green-300' };
    if (significance < 0.05) return { level: 'Modérée', color: 'text-yellow-400' };
    return { level: 'Faible', color: 'text-red-400' };
  };

  const filteredCorrelations = correlationData.filter(item => 
    selectedCorrelations.includes(getCorrelationStrength(item.correlation))
  );

  const handleStrengthToggle = (strength) => {
    setSelectedCorrelations(prev => 
      prev.includes(strength)
        ? prev.filter(s => s !== strength)
        : [...prev, strength]
    );
  };

  const exportCorrelations = () => {
    const csvContent = [
      ['Variable 1', 'Variable 2', 'Corrélation', 'Force', 'Signification', 'Points de données'],
      ...filteredCorrelations.map(item => [
        item.variable1,
        item.variable2,
        item.correlation != null && !isNaN(item.correlation) ? item.correlation.toFixed(3) : 'N/A',
        getCorrelationStrength(item.correlation),
        item.significance,
        item.dataPoints
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `correlations_${selectedTimeframe}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* En-tête et contrôles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Analyse des corrélations
              <span className="text-sm font-normal text-slate-400">
                ({filteredCorrelations.length} corrélations détectées)
              </span>
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {timeframes.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAdvanced ? 'Masquer' : 'Avancé'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={exportCorrelations}
              >
                <Download className="w-4 h-4" />
                Exporter
              </Button>
              
              <Button
                variant={showSuccessPatterns ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowSuccessPatterns(!showSuccessPatterns)}
                className={showSuccessPatterns ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                <Target className="w-4 h-4" />
                Patterns de succès
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Filtres par force de corrélation */}
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-slate-400 mr-2">Afficher :</span>
            {strengthLevels.map(strength => (
              <label
                key={strength.value}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer transition-all ${
                  selectedCorrelations.includes(strength.value)
                    ? `border-purple-500 ${strength.bgColor}`
                    : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCorrelations.includes(strength.value)}
                  onChange={() => handleStrengthToggle(strength.value)}
                  className="sr-only"
                />
                <span className={`text-sm ${strength.color}`}>{strength.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Résumé des insights */}
      <Card className="bg-purple-600/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Insights clés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {filteredCorrelations.filter(c => getCorrelationStrength(c.correlation) === 'strong').length}
              </div>
              <div className="text-sm text-slate-400">Corrélations fortes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {filteredCorrelations.length > 0 
                  ? (filteredCorrelations.reduce((sum, c) => sum + Math.abs(c.correlation || 0), 0) / filteredCorrelations.length).toFixed(2)
                  : '0.00'}
              </div>
              <div className="text-sm text-slate-400">Corrélation moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {filteredCorrelations.filter(c => c.trend === 'improving' || c.trend === 'increasing').length}
              </div>
              <div className="text-sm text-slate-400">Tendances positives</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des corrélations */}
      <div className="space-y-4">
        {filteredCorrelations.map(correlation => (
          <Card key={correlation.id} className={`${getCorrelationBg(correlation.correlation)} border-slate-600`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-white text-lg">
                      {correlation.variable1} ↔ {correlation.variable2}
                    </h3>
                    {correlation.isActivityCorrelation && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-600/30 text-blue-300 rounded border border-blue-500/50">
                        Activité
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCorrelationBg(correlation.correlation)} ${getCorrelationColor(correlation.correlation)}`}>
                      r = {correlation.correlation != null && !isNaN(correlation.correlation) ? correlation.correlation.toFixed(3) : 'N/A'}
                    </span>
                    {getTrendIcon(correlation.trend)}
                  </div>
                  
                  <p className="text-slate-300 mb-3">{correlation.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {correlation.dataPoints} points de données
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Direction: {correlation.direction === 'positive' ? 'Positive' : 'Négative'}
                    </div>
                    {showAdvanced && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Signification: <span className={getSignificanceLevel(correlation.significance).color}>
                          {getSignificanceLevel(correlation.significance).level}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Insights détaillés */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    Observations
                  </h4>
                  <ul className="space-y-2">
                    {correlation.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    Recommandations
                  </h4>
                  <ul className="space-y-2">
                    {correlation.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                        <TrendingUp className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {showAdvanced && (
                <div className="mt-6 pt-4 border-t border-slate-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Force:</span>
                      <div className={`font-medium ${getCorrelationColor(correlation.correlation)}`}>
                        {getCorrelationStrength(correlation.correlation) === 'strong' ? 'Forte' :
                         getCorrelationStrength(correlation.correlation) === 'moderate' ? 'Modérée' : 'Faible'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">P-value:</span>
                      <div className="font-medium text-white">{correlation.significance}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Tendance:</span>
                      <div className="font-medium text-white capitalize">{correlation.trend}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Fiabilité:</span>
                      <div className={`font-medium ${getSignificanceLevel(correlation.significance).color}`}>
                        {getSignificanceLevel(correlation.significance).level}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCorrelations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h4 className="text-xl font-semibold mb-2 text-white">Aucune corrélation trouvée</h4>
            <p className="text-slate-400 mb-4">
              Ajustez les filtres ou la période d'analyse pour voir plus de corrélations.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCorrelations(['strong', 'moderate', 'weak'])}
              className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Afficher toutes les corrélations
            </button>
          </CardContent>
        </Card>
      )}

      {/* Informations méthodologiques */}
      {showAdvanced && (
        <Card className="bg-blue-600/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Méthodologie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="font-medium text-white mb-2">Calcul des corrélations</h4>
                <p>Les corrélations sont calculées en utilisant le coefficient de corrélation de Pearson (r), qui mesure la relation linéaire entre deux variables.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Interprétation</h4>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>r &gt; 0.7</strong> : Corrélation forte</li>
                  <li>• <strong>0.3 ≤ r ≤ 0.7</strong> : Corrélation modérée</li>
                  <li>• <strong>r &lt; 0.3</strong> : Corrélation faible</li>
                  <li>• <strong>r &gt; 0</strong> : Corrélation positive (les variables évoluent dans le même sens)</li>
                  <li>• <strong>r &lt; 0</strong> : Corrélation négative (les variables évoluent en sens inverse)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Signification statistique</h4>
                <p>La p-value indique la probabilité que la corrélation observée soit due au hasard. Plus elle est faible, plus la corrélation est significative.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CorrelationAnalysis;