import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  Clock,
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  EyeOff,
  RefreshCw,
  Calendar,
  ArrowRight,
  Pause
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import {
  calculateWeeklyVolume
} from './utils/historyIntegration';

const StabilityAnalysis = () => {
  const { data, getWorkoutHistory } = useWorkout();
  const [selectedPeriod, setSelectedPeriod] = useState('4weeks');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(['weight', 'bodyFat', 'muscleMass']);

  // ✅ CORRIGÉ : Mapping complet avec types et clés correctes pour chaque métrique
  const analysisMetrics = [
    { value: 'weight', label: 'Poids', unit: 'kg', icon: '⚖️', type: 'metrics', key: 'weight', fallbackKey: null },
    { value: 'bodyFat', label: 'Masse graisseuse', unit: '%', icon: '🔥', type: 'impedance', key: 'bodyFatPercentage', fallbackKey: null },
    { value: 'muscleMass', label: 'Masse musculaire', unit: 'kg', icon: '💪', type: 'impedance', key: 'muscleMass', fallbackKey: 'skeletalMuscle' },
    { value: 'waist', label: 'Tour de taille', unit: 'cm', icon: '📏', type: 'metrics', key: 'waist', fallbackKey: null },
    { value: 'bmi', label: 'IMC', unit: '', icon: '📊', type: 'metrics', key: 'bmi', fallbackKey: null, calculated: true },
    { value: 'visceralFat', label: 'Graisse viscérale', unit: '/20', icon: '🫀', type: 'impedance', key: 'visceralFatIndex', fallbackKey: 'visceralFat' },
    { value: 'bodyWater', label: 'Eau corporelle', unit: '%', icon: '💧', type: 'impedance', key: 'bodyWater', fallbackKey: null },
    { value: 'metabolicAge', label: 'Âge métabolique', unit: 'ans', icon: '⏰', type: 'impedance', key: 'metabolicAge', fallbackKey: null }
  ];

  const analysisPeriods = [
    { value: '2weeks', label: '2 semaines' },
    { value: '4weeks', label: '4 semaines' },
    { value: '8weeks', label: '8 semaines' },
    { value: '12weeks', label: '12 semaines' }
  ];

  // ✅ ANALYSE DE STABILITÉ REFACTORÉE : Analyse les deux types (metrics + impedance)
  const stabilityAnalysis = useMemo(() => {
    if (!data?.progressEntries || data.progressEntries.length === 0) {
      return [];
    }

    const periodWeeks = parseInt(selectedPeriod.replace('weeks', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (periodWeeks * 7));

    return selectedMetrics.map(metricValue => {
      const metric = analysisMetrics.find(m => m.value === metricValue);
      
      if (!metric) {
        return {
          metric: metricValue,
          label: metricValue,
          unit: '',
          icon: '📊',
          currentValue: null,
          variability: 0,
          trend: 0,
          stability: 'insufficient_data',
          volatility: 'unknown',
          isStagnant: false,
          recommendation: 'Métrique non reconnue',
          dataPoints: 0,
          periodWeeks: periodWeeks,
          error: true
        };
      }

      // ✅ DÉTERMINER LES ENTRÉES À UTILISER SELON LE TYPE DE MÉTRIQUE
      let entriesToUse = [];
      
      if (metric.type === 'metrics') {
        // Métriques de type 'metrics' : utiliser uniquement entries de type 'metrics'
        entriesToUse = data.progressEntries
          .filter(entry => {
            if (entry.type !== 'metrics') return false;
            const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : new Date(0));
            return entryDate >= cutoffDate;
          })
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
            const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
            return dateB - dateA; // Plus récent en premier
          });
      } else if (metric.type === 'impedance') {
        // Métriques de type 'impedance' : utiliser uniquement entries de type 'impedance'
        entriesToUse = data.progressEntries
          .filter(entry => {
            if (entry.type !== 'impedance') return false;
            const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : new Date(0));
            return entryDate >= cutoffDate;
          })
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
            const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
            return dateB - dateA; // Plus récent en premier
          });
      }

      if (entriesToUse.length < 2) {
        return {
          metric: metricValue,
          label: metric.label,
          unit: metric.unit,
          icon: metric.icon,
          currentValue: null,
          variability: 0,
          trend: 0,
          stability: 'insufficient_data',
          volatility: 'unknown',
          isStagnant: false,
          recommendation: `Pas assez de données pour analyser la stabilité. Besoin d'au moins 2 mesures sur ${periodWeeks} semaines. Actuellement: ${entriesToUse.length} mesure(s).`,
          dataPoints: entriesToUse.length,
          periodWeeks: periodWeeks,
          error: true,
          errorMessage: `Minimum 2 mesures requis, actuellement ${entriesToUse.length}`
        };
      }

      // ✅ EXTRAIRE LES VALEURS AVEC GESTION DES FALLBACKS ET CALCULS
      const values = entriesToUse
        .map(entry => {
          // ✅ GESTION INTELLIGENTE DES FALLBACKS
          let value = entry[metric.key];
          if (value == null && metric.fallbackKey && entry[metric.fallbackKey] != null) {
            value = entry[metric.fallbackKey];
          }
          
          // ✅ CALCULER BMI SI NÉCESSAIRE
          if (metric.calculated && metric.key === 'bmi' && entry.weight && entry.height) {
            const heightInM = entry.height / 100;
            value = entry.weight / (heightInM * heightInM);
          }
          
          return value;
        })
        .filter(value => {
          // ✅ VALIDATION STRICTE
          if (value == null || isNaN(value) || !isFinite(value)) return false;
          
          // Validation pourcentages : 0-100
          if (metric.key === 'bodyFatPercentage' || metric.key === 'bodyWater' || metric.key === 'proteinPercentage') {
            return value >= 0 && value <= 100;
          }
          
          // Autres métriques : > 0
          return value > 0;
        })
        .reverse(); // Inverser pour ordre chronologique (ancien → récent)

      if (values.length < 2) {
        return {
          metric: metricValue,
          label: metric?.label || metricValue,
          unit: metric?.unit || '',
          icon: metric?.icon || '📊',
          currentValue: null,
          variability: 0,
          trend: 0,
          stability: 'insufficient_data',
          volatility: 'unknown',
          isStagnant: false,
          recommendation: 'Pas assez de données pour analyser la stabilité',
          recommendations: ['Enregistrez au moins 2 mesures pour générer une analyse'], // ✅ Protection
          patterns: [], // ✅ Protection
          dataPoints: values.length,
          periodWeeks: periodWeeks,
          stabilityScore: 0,
          consistencyScore: 0,
          progressScore: 0,
          riskLevel: 'unknown',
          confidence: 0,
          lastSignificantChange: null,
          trainingContext: null,
          minValue: null,
          maxValue: null,
          avgValue: null
        };
      }

      const currentValue = values[0];
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Calcul de la variabilité (coefficient de variation)
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / values.length;
      const standardDeviation = Math.sqrt(variance);
      const variability = avgValue > 0 ? (standardDeviation / avgValue) : 0;
      
      // Calcul de la tendance (régression linéaire simple)
      const n = values.length;
      const xValues = Array.from({length: n}, (_, i) => i);
      const sumX = xValues.reduce((sum, x) => sum + x, 0);
      const sumY = values.reduce((sum, y) => sum + y, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const trend = slope / avgValue; // Tendance relative
      
      // Classification de la stabilité
      const stagnationThreshold = 0.05; // 5% de changement minimum
      const isStagnant = Math.abs(trend) < stagnationThreshold;
      const volatility = variability > 0.08 ? 'high' : variability > 0.05 ? 'medium' : 'low';
      
      let stability = 'stable';
      if (volatility === 'high') stability = 'unstable';
      else if (isStagnant) stability = 'stagnant';
      else if (Math.abs(trend) > 0.1) stability = 'trending';
      
      // Génération de recommandations basées sur l'analyse
      let recommendation = '';
      const recommendations = [];
      
      if (isStagnant) {
        recommendation = 'Aucun changement significatif détecté. Considérez ajuster votre approche.';
        recommendations.push('Ajuster votre stratégie d\'entraînement ou de nutrition');
        recommendations.push('Augmenter l\'intensité ou la fréquence des séances');
      } else if (volatility === 'high') {
        recommendation = 'Variabilité élevée détectée. Vérifiez la cohérence de vos mesures.';
        recommendations.push('Mesurer à la même heure et dans les mêmes conditions');
        recommendations.push('Vérifier la précision de votre matériel de mesure');
      } else if (trend > 0.05) {
        recommendation = 'Tendance positive détectée. Continuez sur cette lancée !';
        recommendations.push('Maintenir les bonnes pratiques actuelles');
        recommendations.push('Continuer la progression actuelle');
      } else if (trend < -0.05) {
        recommendation = 'Tendance négative détectée. Revoyez votre stratégie.';
        recommendations.push('Analyser les causes possibles de régression');
        recommendations.push('Adapter votre approche en conséquence');
      } else {
        recommendation = 'Progression stable et régulière. Excellent travail !';
        recommendations.push('Maintenir la régularité des mesures');
      }

      // Calculer les scores (0-100)
      // StabilityScore: 100 - (variability * 1000) avec limites
      const stabilityScore = Math.max(0, Math.min(100, 100 - (variability * 1000)));
      
      // ConsistencyScore: basé sur l'inverse de la volatilité
      const consistencyScore = volatility === 'high' ? 30 : volatility === 'medium' ? 60 : 90;
      
      // ProgressScore: basé sur la tendance et la stagnation
      let progressScore = 50; // Baseline
      if (isStagnant) {
        progressScore = 20; // Stagnation = faible progression
      } else if (trend > 0.05) {
        progressScore = 80 + Math.min(20, trend * 100); // Progression positive
      } else if (trend < -0.05) {
        progressScore = Math.max(0, 50 + (trend * 100)); // Régression
      } else {
        progressScore = 60; // Stable
      }
      
      // Calculer riskLevel depuis volatility et isStagnant
      let riskLevel = 'low';
      if (volatility === 'high') {
        riskLevel = 'high';
      } else if (volatility === 'medium' || isStagnant) {
        riskLevel = 'medium';
      }
      
      // Calculer confidence depuis dataPoints et periodWeeks
      // Plus de données = plus de confiance
      const minDataPoints = periodWeeks * 2; // Au moins 2 mesures par semaine idéalement
      const confidence = Math.min(100, Math.max(30, (values.length / minDataPoints) * 100));
      
      // ✅ CALCULER lastSignificantChange : Trouver le dernier changement significatif (>5% ou >threshold)
      // Optimisation: utiliser entriesToUse et values déjà calculés
      let lastSignificantChange = null;
      const significantThreshold = avgValue * 0.05; // 5% de la moyenne
      
      // ✅ CRÉER UN MAP VALEUR -> DATE depuis entriesToUse pour accès O(1)
      // Utiliser les valeurs extraites avec fallbacks déjà calculées
      const valueToDateMap = new Map();
      entriesToUse.forEach((entry, index) => {
        // ✅ UTILISER LA MÊME LOGIQUE QUE POUR L'EXTRACTION DES VALEURS
        let value = entry[metric.key];
        if (value == null && metric.fallbackKey && entry[metric.fallbackKey] != null) {
          value = entry[metric.fallbackKey];
        }
        
        // Calculer BMI si nécessaire
        if (metric.calculated && metric.key === 'bmi' && entry.weight && entry.height) {
          const heightInM = entry.height / 100;
          value = entry.weight / (heightInM * heightInM);
        }
        
        // ✅ VALIDATION STRICTE (même que dans extraction)
        if (value != null && !isNaN(value) && isFinite(value)) {
          const isValid = metric.key === 'bodyFatPercentage' || metric.key === 'bodyWater' || metric.key === 'proteinPercentage'
            ? (value >= 0 && value <= 100)
            : value > 0;
          
          if (isValid) {
            const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : new Date());
            valueToDateMap.set(parseFloat(value), entryDate);
          }
        }
      });
      
      // ✅ PARCOURIR VALUES EN ORDRE CHRONOLOGIQUE INVERSE (plus récent d'abord)
      // values est déjà trié chronologiquement (ancien → récent) après reverse()
      // Donc values[0] est le plus récent
      for (let i = 0; i < values.length - 1; i++) {
        const currentValue = values[i]; // Plus récent
        const previousValue = values[i + 1]; // Plus ancien
        const change = Math.abs(currentValue - previousValue);
        
        if (change >= significantThreshold) {
          // Prendre la date du changement le plus récent (currentValue)
          const entryDate = valueToDateMap.get(currentValue);
          if (entryDate) {
            lastSignificantChange = entryDate;
            break; // Prendre le plus récent
          }
        }
      }
      
      // ✅ SI AUCUN CHANGEMENT SIGNIFICATIF, PRENDRE LA DATE LA PLUS RÉCENTE
      if (!lastSignificantChange && entriesToUse.length > 0) {
        const mostRecentEntry = entriesToUse[0]; // Déjà trié par date décroissante
        lastSignificantChange = mostRecentEntry.date 
          ? new Date(mostRecentEntry.date) 
          : (mostRecentEntry.timestamp ? new Date(mostRecentEntry.timestamp) : new Date());
      }
      
      // ✅ INTÉGRATION CONTEXTE D'ENTRAÎNEMENT : Analyser corrélation avec volume d'entraînement
      let trainingContext = null;
      try {
        const workoutHistory = getWorkoutHistory ? getWorkoutHistory() : [];
        if (workoutHistory && workoutHistory.length > 0) {
          // Calculer volume hebdomadaire pour la période
          const weeklyVolume = calculateWeeklyVolume(workoutHistory, cutoffDate, new Date());
          
          if (weeklyVolume && weeklyVolume.weeks && weeklyVolume.weeks.length > 0) {
            // ✅ IDENTIFIER SEMAINES AVEC MESURES (pour corrélation pertinente)
            const relevantWeeks = weeklyVolume.weeks.filter(week => {
              const weekStart = new Date(week.startDate);
              const weekEnd = new Date(week.endDate);
              
              // Vérifier si des mesures existent dans cette semaine
              return entriesToUse.some(entry => {
                const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : new Date(0));
                return entryDate >= weekStart && entryDate <= weekEnd;
              });
            });
            
            if (relevantWeeks.length > 0) {
              const avgWeeklySessions = relevantWeeks.reduce((sum, w) => sum + w.sessions.length, 0) / relevantWeeks.length;
              const avgWeeklyVolume = relevantWeeks.reduce((sum, w) => sum + (w.totalReps || 0), 0) / relevantWeeks.length;
              
              trainingContext = {
                avgWeeklySessions: Math.round(avgWeeklySessions * 10) / 10,
                avgWeeklyVolume: Math.round(avgWeeklyVolume),
                weeksAnalyzed: relevantWeeks.length,
                totalSessions: relevantWeeks.reduce((sum, w) => sum + w.sessions.length, 0)
              };
              
              // ✅ AJOUTER RECOMMANDATIONS BASÉES SUR CONTEXTE D'ENTRAÎNEMENT
              if (stability === 'unstable' && avgWeeklySessions < 2) {
                recommendations.push(
                  `Votre irrégularité d'entraînement (${avgWeeklySessions.toFixed(1)} séances/semaine) peut expliquer la variabilité de cette métrique. Augmentez la régularité pour plus de stabilité.`
                );
              } else if (stability === 'stable' && avgWeeklySessions >= 3 && avgWeeklyVolume > 300) {
                recommendations.push(
                  `Votre régularité d'entraînement (${avgWeeklySessions.toFixed(1)} séances/semaine, ${Math.round(avgWeeklyVolume)} reps/semaine) contribue à la stabilité de cette métrique.`
                );
              }
            }
          }
        }
      } catch (error) {
        // Log error mais ne pas bloquer l'analyse
        console.warn('Erreur calcul contexte d\'entraînement pour stabilité', error);
      }
      
      // Construire patterns array depuis les propriétés
      const patterns = [];
      if (isStagnant) patterns.push('stagnation');
      if (volatility === 'high') patterns.push('volatility');
      if (volatility === 'low' && !isStagnant) patterns.push('stable');
      if (trend > 0.05) patterns.push('trending_up');
      if (trend < -0.05) patterns.push('trending_down');

      return {
        metric: metricValue,
        label: metric?.label || metricValue,
        unit: metric?.unit || '',
        icon: metric?.icon || '📊',
        currentValue: currentValue,
        variability: variability,
        trend: trend,
        stability: stability,
        volatility: volatility,
        isStagnant: isStagnant,
        recommendation: recommendation,
        recommendations: recommendations, // Array pour le rendu
        dataPoints: values.length,
        periodWeeks: periodWeeks,
        trainingContext: trainingContext, // ✅ Contexte d'entraînement enrichi
        minValue: minValue,
        maxValue: maxValue,
        avgValue: avgValue,
        // Propriétés calculées ajoutées
        stabilityScore: stabilityScore,
        consistencyScore: consistencyScore,
        progressScore: progressScore,
        riskLevel: riskLevel,
        confidence: confidence,
        lastSignificantChange: lastSignificantChange,
        patterns: patterns
      };
    });
  }, [data?.progressEntries, selectedMetrics, selectedPeriod, getWorkoutHistory]);

  const overallAnalysis = useMemo(() => {
    const totalMetrics = stabilityAnalysis.length;
    
    // ✅ PROTECTION : Si pas de métriques, retourner valeurs par défaut
    if (totalMetrics === 0) {
      return {
        status: 'good',
        message: 'Pas assez de données pour analyser',
        color: 'text-slate-400',
        stagnantCount: 0,
        volatileCount: 0,
        stableCount: 0,
        avgStabilityScore: 0,
        avgProgressScore: 0,
        recommendations: ['Enregistrez au moins 2 mesures pour chaque métrique pour générer une analyse']
      };
    }
    
    const stagnantMetrics = stabilityAnalysis.filter(m => m.isStagnant).length;
    const volatileMetrics = stabilityAnalysis.filter(m => m.volatility === 'high').length;
    const stableMetrics = stabilityAnalysis.filter(m => m.stability === 'stable').length;
    
    // ✅ PROTECTION : Vérifier que les scores existent avant division
    const avgStabilityScore = stabilityAnalysis.length > 0 && stabilityAnalysis.every(m => m.stabilityScore != null)
      ? stabilityAnalysis.reduce((sum, m) => sum + (m.stabilityScore || 0), 0) / totalMetrics
      : 0;
      
    const avgProgressScore = stabilityAnalysis.length > 0 && stabilityAnalysis.every(m => m.progressScore != null)
      ? stabilityAnalysis.reduce((sum, m) => sum + (m.progressScore || 0), 0) / totalMetrics
      : 0;
    
    let overallStatus = 'good';
    let statusMessage = 'Progression équilibrée';
    let statusColor = 'text-green-400';
    
    if (stagnantMetrics > totalMetrics / 2) {
      overallStatus = 'stagnant';
      statusMessage = 'Stagnation détectée';
      statusColor = 'text-yellow-400';
    } else if (volatileMetrics > totalMetrics / 3) {
      overallStatus = 'volatile';
      statusMessage = 'Forte variabilité';
      statusColor = 'text-red-400';
    }

    return {
      status: overallStatus,
      message: statusMessage,
      color: statusColor,
      stagnantCount: stagnantMetrics,
      volatileCount: volatileMetrics,
      stableCount: stableMetrics,
      avgStabilityScore: avgStabilityScore || 0, // ✅ Protection null/NaN
      avgProgressScore: avgProgressScore || 0, // ✅ Protection null/NaN
      recommendations: [
        stagnantMetrics > 0 && 'Relancer la progression sur les métriques stagnantes',
        volatileMetrics > 0 && 'Améliorer la consistance des mesures',
        stableMetrics > 0 && 'Maintenir les bonnes pratiques actuelles'
      ].filter(Boolean)
    };
  }, [stabilityAnalysis]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'stagnant': return <Pause className="w-4 h-4 text-yellow-400" />;
      case 'volatile': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'stable': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-600/20';
    if (score >= 60) return 'bg-yellow-600/20';
    return 'bg-red-600/20';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-600/20';
      case 'medium': return 'text-yellow-400 bg-yellow-600/20';
      case 'high': return 'text-red-400 bg-red-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  const handleMetricToggle = (metricValue) => {
    setSelectedMetrics(prev => 
      prev.includes(metricValue)
        ? prev.filter(m => m !== metricValue)
        : [...prev, metricValue]
    );
  };

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Analyse de stabilité
              <span className="text-sm font-normal text-slate-400">
                ({selectedMetrics.length} métriques analysées)
              </span>
            </CardTitle>
            
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {analysisPeriods.map(period => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDetails ? 'Masquer' : 'Détails'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Métriques à analyser
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {analysisMetrics.map(metric => (
                  <label
                    key={metric.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedMetrics.includes(metric.value)
                        ? 'border-orange-500 bg-orange-600/20'
                        : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.value)}
                      onChange={() => handleMetricToggle(metric.value)}
                      className="sr-only"
                    />
                    <span className="text-lg">{metric.icon}</span>
                    <span className="text-sm text-white">{metric.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vue d'ensemble */}
      <Card className={`${overallAnalysis.status === 'stagnant' ? 'bg-yellow-600/10 border-yellow-500/30' : 
                          overallAnalysis.status === 'volatile' ? 'bg-red-600/10 border-red-500/30' : 
                          'bg-green-600/10 border-green-500/30'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(overallAnalysis.status)}
            Vue d'ensemble - {overallAnalysis.message}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400 mb-1">
                {overallAnalysis.avgStabilityScore.toFixed(0)}%
              </div>
              <div className="text-sm text-slate-400">Score de stabilité</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {overallAnalysis.avgProgressScore.toFixed(0)}%
              </div>
              <div className="text-sm text-slate-400">Score de progression</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {overallAnalysis.stagnantCount}
              </div>
              <div className="text-sm text-slate-400">Métriques stagnantes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {overallAnalysis.volatileCount}
              </div>
              <div className="text-sm text-slate-400">Métriques volatiles</div>
            </div>
          </div>

          {overallAnalysis.recommendations.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                Recommandations générales
              </h4>
              <ul className="space-y-2">
                {overallAnalysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                    <ArrowRight className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analyse détaillée par métrique */}
      <div className="space-y-4">
        {stabilityAnalysis.map((analysis, index) => (
          <Card key={index} className="border-slate-600">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{analysis.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{analysis.label}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>Valeur actuelle: {analysis.currentValue != null ? analysis.currentValue.toFixed(1) : 'N/A'} {analysis.unit}</span>
                      {getStatusIcon(analysis.stability)}
                      <span className={analysis.isStagnant ? 'text-yellow-400' : 
                                     analysis.volatility === 'high' ? 'text-red-400' : 'text-green-400'}>
                        {analysis.isStagnant ? 'Stagnant' : 
                         analysis.volatility === 'high' ? 'Volatile' : 'Stable'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm ${getRiskColor(analysis.riskLevel)}`}>
                    Risque {analysis.riskLevel === 'low' ? 'faible' : 
                            analysis.riskLevel === 'medium' ? 'modéré' : 'élevé'}
                  </div>
                </div>
              </div>

              {/* Scores de performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${getScoreBg(analysis.stabilityScore)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Stabilité</span>
                    <Activity className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.stabilityScore)}`}>
                    {analysis.stabilityScore != null ? analysis.stabilityScore.toFixed(0) : 0}%
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${getScoreBg(analysis.consistencyScore)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Consistance</span>
                    <CheckCircle className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.consistencyScore)}`}>
                    {analysis.consistencyScore != null ? analysis.consistencyScore.toFixed(0) : 0}%
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${getScoreBg(analysis.progressScore)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Progression</span>
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.progressScore)}`}>
                    {analysis.progressScore != null ? analysis.progressScore.toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              {/* Métriques détaillées */}
              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-white mb-3">Métriques statistiques</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Variabilité:</span>
                        <span className="text-white">{analysis.variability != null ? analysis.variability.toFixed(1) : 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tendance:</span>
                        <span className={analysis.trend > 0 ? 'text-green-400' : analysis.trend < 0 ? 'text-red-400' : 'text-gray-400'}>
                          {analysis.trend != null ? `${analysis.trend > 0 ? '+' : ''}${analysis.trend.toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Points de données:</span>
                        <span className="text-white">{analysis.dataPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Confiance:</span>
                        <span className="text-blue-400">{analysis.confidence != null ? analysis.confidence.toFixed(0) : 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dernier changement:</span>
                        <span className="text-white">
                          {analysis.lastSignificantChange ? formatDate(analysis.lastSignificantChange) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white mb-3">Patterns détectés</h4>
                    <div className="space-y-2">
                      {(analysis.patterns || []).map((pattern, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            pattern === 'stagnation' ? 'bg-yellow-400' :
                            pattern === 'volatility' ? 'bg-red-400' :
                            pattern === 'stable' ? 'bg-green-400' :
                            'bg-blue-400'
                          }`}></div>
                          <span className="text-slate-300 capitalize">
                            {pattern.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommandations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    Recommandations spécifiques
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                        <ArrowRight className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMetrics.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h4 className="text-xl font-semibold mb-2 text-white">Aucune métrique sélectionnée</h4>
            <p className="text-slate-400 mb-4">
              Sélectionnez au moins une métrique pour commencer l'analyse de stabilité.
            </p>
            <Button onClick={() => setSelectedMetrics(['weight', 'bodyFat', 'muscleMass'])}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sélectionner les métriques principales
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informations sur l'analyse */}
      <Card className="bg-blue-600/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            À propos de l'analyse de stabilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <h4 className="font-medium text-white mb-2">Détection de stagnation</h4>
              <p>Une métrique est considérée comme stagnante si elle ne présente pas de changement significatif (&gt;5%) sur la période analysée.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Analyse de volatilité</h4>
              <p>La volatilité mesure la variabilité des mesures. Une forte volatilité peut indiquer des mesures irrégulières ou des facteurs externes influents.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Scores de performance</h4>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Stabilité</strong> : Régularité des mesures et absence de fluctuations excessives</li>
                <li>• <strong>Consistance</strong> : Cohérence des données sur la période</li>
                <li>• <strong>Progression</strong> : Évolution positive vers les objectifs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StabilityAnalysis;