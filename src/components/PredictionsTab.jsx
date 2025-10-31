import React, { useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { useWorkout } from '../context/WorkoutContext';
import { typography } from '../styles/typography';
import { calculateValidReps } from '../utils/enduranceUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  Trophy, 
  Brain,
  Activity,
  Zap,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

const PredictionsTab = () => {
  const { getWorkoutHistory } = useWorkout();
  const [selectedTimeframe, setSelectedTimeframe] = useState('30'); // 30, 60, 90 jours
  
  const workoutHistory = useMemo(() => {
    return getWorkoutHistory();
  }, [getWorkoutHistory]);

  // Algorithme de régression linéaire simple
  const calculateLinearRegression = (data) => {
    if (data.length < 2) return { slope: 0, intercept: 0, r2: 0 };
    
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, point) => sum + point.value, 0);
    const sumXY = data.reduce((sum, point, i) => sum + i * point.value, 0);
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calcul du coefficient de détermination R²
    const yMean = sumY / n;
    const ssRes = data.reduce((sum, point, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(point.value - predicted, 2);
    }, 0);
    const ssTot = data.reduce((sum, point) => sum + Math.pow(point.value - yMean, 2), 0);
    const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    
    return { slope, intercept, r2: Math.max(0, r2) };
  };

  // Algorithme de moyenne mobile exponentielle
  const calculateEMA = (data, alpha = 0.3) => {
    if (data.length === 0) return [];
    
    const ema = [data[0].value];
    for (let i = 1; i < data.length; i++) {
      ema[i] = alpha * data[i].value + (1 - alpha) * ema[i - 1];
    }
    return ema;
  };

  // Détection de cycles et saisonnalité
  const detectCycles = (data) => {
    if (data.length < 14) return { hasCycle: false, period: 0, strength: 0 };
    
    const values = data.map(d => d.value);
    let bestPeriod = 7;
    let maxCorrelation = 0;
    
    // Tester différentes périodes (7, 14, 21, 28 jours)
    for (let period = 7; period <= Math.min(28, Math.floor(data.length / 2)); period += 7) {
      let correlation = 0;
      let count = 0;
      
      for (let i = period; i < values.length; i++) {
        correlation += values[i] * values[i - period];
        count++;
      }
      
      if (count > 0) {
        correlation /= count;
        if (correlation > maxCorrelation) {
          maxCorrelation = correlation;
          bestPeriod = period;
        }
      }
    }
    
    return {
      hasCycle: maxCorrelation > 0.3,
      period: bestPeriod,
      strength: maxCorrelation
    };
  };

  // Prédictions basées sur les données historiques
  const generatePredictions = useMemo(() => {
    if (workoutHistory.length < 7) {
      return {
        hasEnoughData: false,
        message: "Besoin d'au moins 7 séances pour générer des prédictions fiables"
      };
    }

    const days = parseInt(selectedTimeframe);
    const recentHistory = workoutHistory
      .slice(0, Math.min(days, workoutHistory.length))
      .reverse(); // Ordre chronologique

    // Préparation des données pour l'analyse
    // CORRECTION CRITIQUE: Exclure les jumps de corde à sauter des calculs de reps
    const repsData = recentHistory.map((session, index) => ({
      date: session.date,
      value: calculateValidReps(session), // Utiliser la fonction qui exclut les jumps
      index
    }));

    const sessionsPerWeek = recentHistory.length / (days / 7);
    
    // Analyse de régression linéaire
    const repsRegression = calculateLinearRegression(repsData);
    
    // Moyenne mobile exponentielle
    const emaValues = calculateEMA(repsData);
    const currentEMA = emaValues[emaValues.length - 1] || 0;
    
    // Détection de cycles
    const cycleAnalysis = detectCycles(repsData);
    
    // Calcul de la volatilité (écart-type)
    const repsMean = repsData.reduce((sum, d) => sum + d.value, 0) / repsData.length;
    const volatility = Math.sqrt(
      repsData.reduce((sum, d) => sum + Math.pow(d.value - repsMean, 2), 0) / repsData.length
    );
    
    // Prédictions pour les 7, 14 et 30 prochains jours
    const predictions = {
      nextWeek: {
        expectedReps: Math.max(0, Math.round(currentEMA + repsRegression.slope * 7)),
        confidence: Math.min(95, Math.max(30, repsRegression.r2 * 100)),
        trend: repsRegression.slope > 0 ? 'hausse' : repsRegression.slope < 0 ? 'baisse' : 'stable'
      },
      next2Weeks: {
        expectedReps: Math.max(0, Math.round(currentEMA + repsRegression.slope * 14)),
        confidence: Math.min(90, Math.max(25, repsRegression.r2 * 90)),
        trend: repsRegression.slope > 0 ? 'hausse' : repsRegression.slope < 0 ? 'baisse' : 'stable'
      },
      nextMonth: {
        expectedReps: Math.max(0, Math.round(currentEMA + repsRegression.slope * 30)),
        confidence: Math.min(80, Math.max(20, repsRegression.r2 * 80)),
        trend: repsRegression.slope > 0 ? 'hausse' : repsRegression.slope < 0 ? 'baisse' : 'stable'
      }
    };

    // Analyse des exercices individuels
    const exerciseAnalysis = {};
    const allExercises = new Set();
    
    recentHistory.forEach(session => {
      session.exercises?.forEach(exercise => {
        const name = exercise.name || exercise.nom;
        if (name) {
          allExercises.add(name);
          if (!exerciseAnalysis[name]) {
            exerciseAnalysis[name] = [];
          }
          exerciseAnalysis[name].push({
            date: session.date,
            reps: exercise.reps || 0
          });
        }
      });
    });

    // Prédictions par exercice
    const exercisePredictions = {};
    Array.from(allExercises).forEach(exerciseName => {
      const exerciseData = exerciseAnalysis[exerciseName];
      if (exerciseData && exerciseData.length >= 3) {
        const dataPoints = exerciseData.map((d, i) => ({ value: d.reps, index: i }));
        const regression = calculateLinearRegression(dataPoints);
        const lastValue = exerciseData[exerciseData.length - 1].reps;
        
        exercisePredictions[exerciseName] = {
          current: lastValue,
          predicted: Math.max(0, Math.round(lastValue + regression.slope * 7)),
          trend: regression.slope > 0.5 ? 'hausse' : regression.slope < -0.5 ? 'baisse' : 'stable',
          confidence: Math.min(90, Math.max(20, regression.r2 * 100))
        };
      }
    });

    // Recommandations intelligentes
    const recommendations = [];
    
    if (repsRegression.slope < -2) {
      recommendations.push({
        type: 'warning',
        title: 'Tendance à la baisse détectée',
        message: 'Vos performances diminuent. Considérez une semaine de récupération ou ajustez l\'intensité.',
        priority: 'high'
      });
    }
    
    if (volatility > repsMean * 0.3) {
      recommendations.push({
        type: 'info',
        title: 'Performances irrégulières',
        message: 'Vos séances varient beaucoup. Essayez de maintenir une routine plus constante.',
        priority: 'medium'
      });
    }
    
    if (sessionsPerWeek < 2) {
      recommendations.push({
        type: 'suggestion',
        title: 'Fréquence d\'entraînement',
        message: 'Augmenter la fréquence à 3-4 séances par semaine pourrait améliorer vos progrès.',
        priority: 'medium'
      });
    }
    
    if (cycleAnalysis.hasCycle) {
      recommendations.push({
        type: 'insight',
        title: 'Cycle détecté',
        message: `Vos performances suivent un cycle de ${cycleAnalysis.period} jours. Planifiez vos séances importantes en conséquence.`,
        priority: 'low'
      });
    }

    return {
      hasEnoughData: true,
      predictions,
      exercisePredictions,
      recommendations,
      analytics: {
        trend: repsRegression.slope,
        confidence: repsRegression.r2,
        volatility,
        cycleAnalysis,
        sessionsPerWeek: Math.round(sessionsPerWeek * 10) / 10
      }
    };
  }, [workoutHistory, selectedTimeframe]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'hausse': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'baisse': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return 'text-green-400';
    if (confidence >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'suggestion': return <Target className="w-5 h-5 text-blue-400" />;
      case 'insight': return <Brain className="w-5 h-5 text-purple-400" />;
      default: return <Zap className="w-5 h-5 text-green-400" />;
    }
  };

  if (!generatePredictions.hasEnoughData) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className={typography.presets.h2Gradient}>
            Prédictions de Performance
          </h1>
          <p className={typography.presets.body}>
            Intelligence artificielle pour prédire vos futurs progrès
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Brain className="w-16 h-16 mx-auto text-slate-400" />
            <div>
              <h3 className={typography.presets.h4}>Données insuffisantes</h3>
              <p className={typography.presets.body}>
                {generatePredictions.message}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { predictions, exercisePredictions, recommendations, analytics } = generatePredictions;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <h1 className={typography.presets.h2Gradient}>
          Prédictions de Performance
        </h1>
        <p className={typography.presets.body}>
          Algorithmes d'IA pour anticiper vos progrès futurs
        </p>
      </div>

      {/* Sélecteur de période */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className={typography.presets.body}>Période d'analyse :</span>
          <div className="flex gap-2">
            {['30', '60', '90'].map(days => (
              <button
                key={days}
                onClick={() => setSelectedTimeframe(days)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedTimeframe === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {days} jours
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Prédictions principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Prochaine semaine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {predictions.nextWeek.expectedReps}
              </span>
              {getTrendIcon(predictions.nextWeek.trend)}
            </div>
            <div className="text-sm text-slate-400">répétitions prédites</div>
            <Badge 
              variant="outline" 
              className={`${getConfidenceColor(predictions.nextWeek.confidence)} border-current`}
            >
              {Math.round(predictions.nextWeek.confidence)}% de confiance
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              2 semaines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {predictions.next2Weeks.expectedReps}
              </span>
              {getTrendIcon(predictions.next2Weeks.trend)}
            </div>
            <div className="text-sm text-slate-400">répétitions prédites</div>
            <Badge 
              variant="outline" 
              className={`${getConfidenceColor(predictions.next2Weeks.confidence)} border-current`}
            >
              {Math.round(predictions.next2Weeks.confidence)}% de confiance
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Mois prochain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {predictions.nextMonth.expectedReps}
              </span>
              {getTrendIcon(predictions.nextMonth.trend)}
            </div>
            <div className="text-sm text-slate-400">répétitions prédites</div>
            <Badge 
              variant="outline" 
              className={`${getConfidenceColor(predictions.nextMonth.confidence)} border-current`}
            >
              {Math.round(predictions.nextMonth.confidence)}% de confiance
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Prédictions par exercice */}
      {Object.keys(exercisePredictions).length > 0 && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Prédictions par Exercice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(exercisePredictions).map(([exerciseName, pred]) => (
                <div key={exerciseName} className="bg-slate-800 rounded-lg p-4">
                  <div className="font-medium text-white mb-2 truncate" title={exerciseName}>
                    {exerciseName}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Actuel: {pred.current}</span>
                    <span className="text-sm text-white">Prédit: {pred.predicted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    {getTrendIcon(pred.trend)}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getConfidenceColor(pred.confidence)} border-current`}
                    >
                      {Math.round(pred.confidence)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommandations IA */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-400" />
              Recommandations IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-slate-800 rounded-lg">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">{rec.title}</h4>
                    <p className="text-sm text-slate-300">{rec.message}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      rec.priority === 'high' ? 'text-red-400 border-red-400' :
                      rec.priority === 'medium' ? 'text-yellow-400 border-yellow-400' :
                      'text-green-400 border-green-400'
                    }`}
                  >
                    {rec.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics avancées */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Analytics Avancées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {analytics.sessionsPerWeek}
              </div>
              <div className="text-sm text-slate-400">séances/semaine</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round(analytics.confidence * 100)}%
              </div>
              <div className="text-sm text-slate-400">fiabilité modèle</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round(analytics.volatility)}
              </div>
              <div className="text-sm text-slate-400">variabilité</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {analytics.cycleAnalysis.hasCycle ? analytics.cycleAnalysis.period : '—'}
              </div>
              <div className="text-sm text-slate-400">cycle (jours)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionsTab;