import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  BarChart3, 
  LineChart, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import {
  calculateLinearRegression,
  calculateMonthlyTrend,
  predictValue,
  evaluateDataQuality,
  generateScenarios
} from './utils/predictionUtils';

const PredictionsModule = () => {
  const { data } = useWorkout();
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [predictionPeriod, setPredictionPeriod] = useState('3months');
  const [confidenceLevel, setConfidenceLevel] = useState('medium');
  const [showDetails, setShowDetails] = useState(false);

  // Métriques disponibles pour les prévisions (avec mapping vers les clés dans progressEntries)
  const availableMetrics = [
    { value: 'weight', label: 'Poids', unit: 'kg', icon: '⚖️', key: 'weight', type: 'metrics' },
    { value: 'bodyFat', label: 'Pourcentage de graisse', unit: '%', icon: '🔥', key: 'bodyFatPercentage', type: 'impedance' },
    { value: 'muscleMass', label: 'Masse musculaire', unit: 'kg', icon: '💪', key: 'skeletalMuscle', type: 'impedance' },
    { value: 'waist', label: 'Tour de taille', unit: 'cm', icon: '📏', key: 'waist', type: 'metrics' },
    { value: 'bmi', label: 'IMC', unit: '', icon: '📊', key: 'bmi', type: 'metrics' },
    { value: 'visceralFat', label: 'Graisse viscérale', unit: '', icon: '🫀', key: 'visceralFat', type: 'impedance' },
    { value: 'metabolicAge', label: 'Âge métabolique', unit: 'ans', icon: '⏰', key: 'metabolicAge', type: 'impedance' }
  ];

  const predictionPeriods = [
    { value: '1month', label: '1 mois' },
    { value: '3months', label: '3 mois' },
    { value: '6months', label: '6 mois' },
    { value: '1year', label: '1 an' }
  ];

  const confidenceLevels = [
    { value: 'low', label: 'Faible (60%)', description: 'Prévision approximative' },
    { value: 'medium', label: 'Moyenne (80%)', description: 'Prévision probable' },
    { value: 'high', label: 'Élevée (95%)', description: 'Prévision très fiable' }
  ];

  // 🔍 CALCUL RÉEL DES PRÉVISIONS DEPUIS LES DONNÉES INDEXEDDB
  const predictionsData = useMemo(() => {
    const currentMetric = availableMetrics.find(m => m.value === selectedMetric);
    
    if (!currentMetric || !data?.progressEntries || data.progressEntries.length === 0) {
      return {
        metric: currentMetric,
        current: null,
        predicted: null,
        change: 0,
        changePercentage: 0,
        monthlyTrend: 0,
        confidenceInterval: { lower: null, upper: null },
        accuracy: 0,
        dataQuality: 'Insuffisante',
        lastUpdate: new Date(),
        factors: ['Pas assez de données pour générer une prévision'],
        hasData: false
      };
    }

    // Extraire les entrées pour la métrique sélectionnée
    const metricKey = currentMetric.key;
    const entryType = currentMetric.type;

    const relevantEntries = data.progressEntries
      .filter(entry => {
        // Filtrer par type et vérifier que la métrique existe
        if (entry.type !== entryType) return false;
        
        // Pour BMI, calculer depuis weight et height si nécessaire
        if (metricKey === 'bmi' && entryType === 'metrics') {
          return entry.weight != null && entry.height != null && !isNaN(entry.weight) && !isNaN(entry.height);
        }
        
        return entry[metricKey] != null && !isNaN(entry[metricKey]);
      })
      .map(entry => {
        const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : new Date());
        
        // Calculer BMI si nécessaire
        let value = entry[metricKey];
        if (metricKey === 'bmi' && entry.weight && entry.height) {
          const heightInM = entry.height / 100;
          value = entry.weight / (heightInM * heightInM);
        }
        
        return {
          date: entryDate,
          value: parseFloat(value),
          timestamp: entryDate.getTime()
        };
      })
      .filter(entry => isFinite(entry.value) && entry.value > 0)
      .sort((a, b) => a.date - b.date); // Plus ancien en premier

    if (relevantEntries.length < 3) {
      return {
        metric: currentMetric,
        current: relevantEntries.length > 0 ? relevantEntries[relevantEntries.length - 1].value : null,
        predicted: null,
        change: 0,
        changePercentage: 0,
        monthlyTrend: 0,
        confidenceInterval: { lower: null, upper: null },
        accuracy: 0,
        dataQuality: 'Insuffisante',
        lastUpdate: new Date(),
        factors: [`Besoin d'au moins 3 mesures pour générer une prévision (${relevantEntries.length} disponible${relevantEntries.length > 1 ? 's' : ''})`],
        hasData: false
      };
    }

    // Valeur actuelle (dernière mesure)
    const currentValue = relevantEntries[relevantEntries.length - 1].value;

    // Préparer les données pour la régression (index = temps, value = métrique)
    const regressionData = relevantEntries.map((entry, index) => ({
      x: index,
      y: entry.value,
      date: entry.date
    }));

    // Calculer la régression linéaire
    const regression = calculateLinearRegression(regressionData);

    // Calculer la période de prédiction en mois
    const periodMonths = predictionPeriod === '1month' ? 1 : 
                        predictionPeriod === '3months' ? 3 : 
                        predictionPeriod === '6months' ? 6 : 12;

    // Convertir en nombre de "steps" (on suppose une mesure par semaine en moyenne)
    // Utiliser plutôt la durée entre la première et dernière mesure
    const firstDate = relevantEntries[0].date;
    const lastDate = relevantEntries[relevantEntries.length - 1].date;
    const daysBetween = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    const avgDaysPerPoint = daysBetween / (relevantEntries.length - 1);
    const stepsForward = Math.round((periodMonths * 30.44) / avgDaysPerPoint);

    // Prédire la valeur future
    const lastX = regressionData.length - 1;
    const prediction = predictValue(regression, stepsForward, { 
      confidenceLevel, 
      lastX 
    });

    if (prediction.predicted == null) {
      return {
        metric: currentMetric,
        current: currentValue,
        predicted: null,
        change: 0,
        changePercentage: 0,
        monthlyTrend: regression.slope * (30.44 / avgDaysPerPoint),
        confidenceInterval: { lower: null, upper: null },
        accuracy: 0,
        dataQuality: 'Insuffisante',
        lastUpdate: new Date(),
        factors: ['Impossible de calculer une prévision fiable'],
        hasData: true
      };
    }

    // Calculer la tendance mensuelle
    const monthlyTrend = calculateMonthlyTrend(relevantEntries);

    // Changement total et pourcentage
    const totalChange = prediction.predicted - currentValue;
    const changePercentage = currentValue > 0 ? ((totalChange / currentValue) * 100) : 0;

    // Évaluer la qualité des données
    const dataQuality = evaluateDataQuality(relevantEntries, 3);

    // Générer les facteurs pris en compte
    const factors = [
      `Tendance historique sur ${relevantEntries.length} mesures`,
      `Régularité: ${dataQuality.factors.find(f => f.includes('régul')) || 'à améliorer'}`,
      `Coefficient de détermination R²: ${(regression.r2 * 100).toFixed(1)}%`
    ];

    if (regression.r2 > 0.7) {
      factors.push('Tendance très fiable détectée');
    } else if (regression.r2 > 0.5) {
      factors.push('Tendance modérée détectée');
    } else {
      factors.push('Tendance peu marquée - prudence recommandée');
    }

    return {
      metric: currentMetric,
      current: currentValue,
      predicted: prediction.predicted,
      change: totalChange,
      changePercentage,
      monthlyTrend,
      confidenceInterval: prediction.confidenceInterval,
      accuracy: prediction.accuracy,
      dataQuality: dataQuality.quality,
      lastUpdate: new Date(),
      factors,
      hasData: true,
      regression // Exposer pour les détails
    };
  }, [data?.progressEntries, selectedMetric, predictionPeriod, confidenceLevel]);

  // Scénarios de prévision basés sur les vraies données
  const scenarios = useMemo(() => {
    if (!predictionsData.hasData || predictionsData.predicted == null || !predictionsData.current) {
      return [];
    }

    const basePrediction = predictionsData.predicted;
    const baseChange = predictionsData.change;
    
    // Calculer la volatilité (écart-type relatif) depuis les données historiques
    // On utilise les données de régression si disponibles
    let volatility = 0;
    if (predictionsData.regression) {
      // Utiliser l'erreur standard comme mesure de volatilité
      const currentValue = predictionsData.current || 1;
      volatility = Math.min(0.5, Math.abs(predictionsData.regression.stdError / currentValue));
    }

    const generatedScenarios = generateScenarios(basePrediction, baseChange, volatility);

    // Ajouter les icônes
    return generatedScenarios.map((scenario, index) => ({
      ...scenario,
      icon: index === 0 ? <TrendingUp className="w-4 h-4" /> : 
            index === 1 ? <Activity className="w-4 h-4" /> : 
            <TrendingDown className="w-4 h-4" />
    }));
  }, [predictionsData]);

  // Objectifs suggérés basés sur les vraies données
  const suggestedGoals = useMemo(() => {
    const metric = predictionsData.metric;
    const current = predictionsData.current;
    
    // Si pas de valeur actuelle, pas d'objectifs
    if (current == null || isNaN(current)) {
      return [];
    }
    
    // Utiliser la tendance mensuelle si disponible pour calculer des objectifs réalistes
    const monthlyTrend = predictionsData.monthlyTrend || 0;
    
    const goals = {
      weight: [
        { target: Math.max(current * 0.9, current - 5), timeframe: '6 mois', difficulty: 'Modéré', description: 'Perte de poids saine et durable' },
        { target: Math.max(current * 0.97, current - 2), timeframe: '2 mois', difficulty: 'Facile', description: 'Objectif à court terme réaliste' },
        { target: Math.max(current * 0.85, current - 10), timeframe: '1 an', difficulty: 'Difficile', description: 'Transformation majeure' }
      ],
      bodyFat: [
        { target: Math.max(current - 3, current * 0.85), timeframe: '4 mois', difficulty: 'Modéré', description: 'Réduction significative de graisse' },
        { target: Math.max(current - 1, current * 0.95), timeframe: '6 semaines', difficulty: 'Facile', description: 'Amélioration rapide' },
        { target: Math.max(current - 5, current * 0.75), timeframe: '8 mois', difficulty: 'Difficile', description: 'Objectif ambitieux' }
      ],
      muscleMass: [
        { target: current + 2, timeframe: '4 mois', difficulty: 'Modéré', description: 'Gain musculaire solide' },
        { target: current + 0.5, timeframe: '6 semaines', difficulty: 'Facile', description: 'Premier gain observable' },
        { target: current + 5, timeframe: '1 an', difficulty: 'Difficile', description: 'Transformation physique majeure' }
      ],
      waist: [
        { target: Math.max(current - 5, current * 0.93), timeframe: '4 mois', difficulty: 'Modéré', description: 'Réduction du tour de taille' },
        { target: Math.max(current - 2, current * 0.97), timeframe: '2 mois', difficulty: 'Facile', description: 'Amélioration visible' },
        { target: Math.max(current - 8, current * 0.88), timeframe: '8 mois', difficulty: 'Difficile', description: 'Objectif ambitieux' }
      ],
      bmi: [
        { target: Math.max(current - 2, current * 0.92), timeframe: '6 mois', difficulty: 'Modéré', description: 'Réduction IMC vers la normale' },
        { target: Math.max(current - 1, current * 0.96), timeframe: '3 mois', difficulty: 'Facile', description: 'Amélioration progressive' },
        { target: Math.max(current - 4, current * 0.85), timeframe: '1 an', difficulty: 'Difficile', description: 'Normalisation complète' }
      ],
      visceralFat: [
        { target: Math.max(current - 2, current * 0.75), timeframe: '6 mois', difficulty: 'Modéré', description: 'Réduction graisse viscérale' },
        { target: Math.max(current - 1, current * 0.88), timeframe: '3 mois', difficulty: 'Facile', description: 'Amélioration santé' },
        { target: Math.max(current - 4, current * 0.60), timeframe: '1 an', difficulty: 'Difficile', description: 'Objectif optimal' }
      ],
      metabolicAge: [
        { target: Math.max(current - 3, current * 0.90), timeframe: '6 mois', difficulty: 'Modéré', description: 'Rajeunissement métabolique' },
        { target: Math.max(current - 1, current * 0.96), timeframe: '3 mois', difficulty: 'Facile', description: 'Amélioration progressive' },
        { target: Math.max(current - 6, current * 0.80), timeframe: '1 an', difficulty: 'Difficile', description: 'Transformation métabolique' }
      ]
    };

    return goals[selectedMetric] || [];
  }, [selectedMetric, predictionsData]);

  const getChangeColor = (change) => {
    const isPositiveGood = ['muscleMass'].includes(selectedMetric);
    const isNegativeGood = ['weight', 'bodyFat', 'waist', 'bmi', 'visceralFat', 'metabolicAge'].includes(selectedMetric);
    
    if (isPositiveGood) {
      return change > 0 ? 'text-green-400' : 'text-red-400';
    } else if (isNegativeGood) {
      return change < 0 ? 'text-green-400' : 'text-red-400';
    }
    return 'text-blue-400';
  };

  const getChangeIcon = (change) => {
    return change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Facile': return 'text-green-400 bg-green-600/20';
      case 'Modéré': return 'text-yellow-400 bg-yellow-600/20';
      case 'Difficile': return 'text-red-400 bg-red-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  const exportPredictions = () => {
    const data = {
      metric: predictionsData.metric?.label || selectedMetric,
      period: predictionPeriod,
      current: predictionsData.current,
      predicted: predictionsData.predicted,
      change: predictionsData.change,
      confidence: confidenceLevel,
      scenarios: scenarios,
      goals: suggestedGoals,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${selectedMetric}_${predictionPeriod}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Contrôles de configuration */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Prévisions et projections
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDetails ? 'Masquer' : 'Détails'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={exportPredictions}
              >
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sélection de métrique */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Métrique à prédire
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                {availableMetrics.map(metric => (
                  <option key={metric.value} value={metric.value}>
                    {metric.icon} {metric.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Période de prévision */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Période de prévision
              </label>
              <select
                value={predictionPeriod}
                onChange={(e) => setPredictionPeriod(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                {predictionPeriods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Niveau de confiance */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Niveau de confiance
              </label>
              <select
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                {confidenceLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prévision principale */}
      <Card className="bg-purple-600/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Prévision pour {predictionsData.metric?.label || 'métrique sélectionnée'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Valeur actuelle */}
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Valeur actuelle</div>
              {predictionsData.current != null && !isNaN(predictionsData.current) ? (
                <>
                  <div className="text-3xl font-bold text-white mb-1">
                    {predictionsData.current.toFixed(1)}
                    <span className="text-lg text-slate-400 ml-1">{predictionsData.metric.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500">Dernière mesure</div>
                </>
              ) : (
                <div className="text-lg text-slate-500">Aucune donnée</div>
              )}
            </div>

            {/* Flèche de transition */}
            <div className="flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-purple-400" />
            </div>

            {/* Valeur prédite */}
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">
                Prévision ({predictionPeriods.find(p => p.value === predictionPeriod)?.label})
              </div>
              {predictionsData.predicted != null && !isNaN(predictionsData.predicted) ? (
                <>
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {predictionsData.predicted.toFixed(1)}
                    <span className="text-lg text-slate-400 ml-1">{predictionsData.metric?.unit || ''}</span>
                  </div>
                  {predictionsData.change != null && !isNaN(predictionsData.change) && predictionsData.changePercentage != null && !isNaN(predictionsData.changePercentage) && (
                    <div className={`flex items-center justify-center gap-1 text-sm ${getChangeColor(predictionsData.change)}`}>
                      {getChangeIcon(predictionsData.change)}
                      {predictionsData.change > 0 ? '+' : ''}{predictionsData.change.toFixed(1)} {predictionsData.metric?.unit || ''}
                      ({predictionsData.changePercentage > 0 ? '+' : ''}{predictionsData.changePercentage.toFixed(1)}%)
                    </div>
                  )}
                </>
              ) : (
                <div className="text-lg text-slate-500">Prévision non disponible</div>
              )}
            </div>
          </div>

          {/* Intervalle de confiance */}
          {predictionsData.confidenceInterval.lower != null && predictionsData.confidenceInterval.upper != null && (
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Intervalle de confiance ({predictionsData.accuracy}%)</span>
                <span className="text-sm text-purple-400">
                  {predictionsData.confidenceInterval.lower.toFixed(1)} - {predictionsData.confidenceInterval.upper.toFixed(1)} {predictionsData.metric?.unit || ''}
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-purple-400 h-2 rounded-full relative"
                  style={{ width: '100%' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scénarios de prévision */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Scénarios possibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scenarios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario, index) => (
                <div key={index} className={`p-4 rounded-lg border ${scenario.bgColor} border-slate-600`}>
                  <div className="flex items-center gap-2 mb-3">
                    {scenario.icon}
                    <h4 className={`font-semibold ${scenario.color}`}>{scenario.name}</h4>
                    <span className="text-xs text-slate-400">({scenario.probability}%)</span>
                  </div>
                  
                  <div className="mb-3">
                    <div className={`text-2xl font-bold ${scenario.color}`}>
                      {scenario.predictedValue != null && !isNaN(scenario.predictedValue) 
                        ? scenario.predictedValue.toFixed(1)
                        : 'N/A'}
                      <span className="text-sm text-slate-400 ml-1">{predictionsData.metric?.unit || ''}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      {scenario.change != null && !isNaN(scenario.change)
                        ? `${scenario.change > 0 ? '+' : ''}${scenario.change.toFixed(1)} ${predictionsData.metric?.unit || ''}`
                        : 'N/A'}
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-300">{scenario.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p>Aucun scénario disponible. Ajoutez plus de mesures pour voir des scénarios de prévision.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objectifs suggérés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Objectifs suggérés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestedGoals.length > 0 ? (
            <div className="space-y-4">
              {suggestedGoals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-lg font-semibold text-white">
                        {goal.target != null && !isNaN(goal.target)
                          ? `${goal.target.toFixed(1)} ${predictionsData.metric?.unit || ''}`
                          : 'N/A'}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(goal.difficulty)}`}>
                        {goal.difficulty}
                      </span>
                    </div>
                    <div className="text-sm text-slate-300 mb-1">{goal.description}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      Objectif: {goal.timeframe}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {predictionsData.current != null && goal.target != null && !isNaN(goal.target) && (
                      <div className={`text-sm font-medium ${getChangeColor(goal.target - predictionsData.current)}`}>
                        {goal.target - predictionsData.current > 0 ? '+' : ''}
                        {(goal.target - predictionsData.current).toFixed(1)} {predictionsData.metric?.unit || ''}
                      </div>
                    )}
                    <Button size="sm" className="mt-2">
                      Définir comme objectif
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Target className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p>Aucun objectif disponible. Ajoutez des mesures pour voir des suggestions d'objectifs personnalisés.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails techniques */}
      {showDetails && (
        <Card className="bg-blue-600/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Détails de la prévision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-white mb-3">Facteurs pris en compte</h4>
                <ul className="space-y-2">
                  {predictionsData.factors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Informations techniques</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tendance mensuelle:</span>
                    <span className="text-white">
                      {predictionsData.monthlyTrend != null && !isNaN(predictionsData.monthlyTrend)
                        ? `${predictionsData.monthlyTrend > 0 ? '+' : ''}${predictionsData.monthlyTrend.toFixed(2)} ${predictionsData.metric?.unit || ''}/mois`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Qualité des données:</span>
                    <span className="text-green-400">{predictionsData.dataQuality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Précision estimée:</span>
                    <span className="text-blue-400">{predictionsData.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dernière mise à jour:</span>
                    <span className="text-white">{formatDate(predictionsData.lastUpdate)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-200">
                  <strong>Note importante:</strong> Ces prévisions sont basées sur vos données historiques et les tendances actuelles. 
                  Les résultats réels peuvent varier en fonction de nombreux facteurs externes (alimentation, exercice, stress, sommeil, etc.).
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PredictionsModule;