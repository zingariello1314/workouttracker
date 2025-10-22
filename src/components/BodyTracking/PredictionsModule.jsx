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

const PredictionsModule = () => {
  const { data } = useWorkout();
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [predictionPeriod, setPredictionPeriod] = useState('3months');
  const [confidenceLevel, setConfidenceLevel] = useState('medium');
  const [showDetails, setShowDetails] = useState(false);

  // Métriques disponibles pour les prévisions
  const availableMetrics = [
    { value: 'weight', label: 'Poids', unit: 'kg', icon: '⚖️' },
    { value: 'bodyFat', label: 'Masse graisseuse', unit: '%', icon: '🔥' },
    { value: 'muscleMass', label: 'Masse musculaire', unit: 'kg', icon: '💪' },
    { value: 'waist', label: 'Tour de taille', unit: 'cm', icon: '📏' },
    { value: 'bmi', label: 'IMC', unit: '', icon: '📊' },
    { value: 'visceralFat', label: 'Graisse viscérale', unit: '', icon: '🫀' },
    { value: 'metabolicAge', label: 'Âge métabolique', unit: 'ans', icon: '⏰' }
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

  // Données simulées pour les prévisions
  const predictionsData = useMemo(() => {
    const currentMetric = availableMetrics.find(m => m.value === selectedMetric);
    const periodMonths = predictionPeriod === '1month' ? 1 : 
                        predictionPeriod === '3months' ? 3 : 
                        predictionPeriod === '6months' ? 6 : 12;

    // Valeurs actuelles simulées
    const currentValues = {
      weight: 75.2,
      bodyFat: 18.5,
      muscleMass: 32.8,
      waist: 82,
      bmi: 23.1,
      visceralFat: 8,
      metabolicAge: 28
    };

    // Tendances simulées (changement par mois)
    const monthlyTrends = {
      weight: -0.8,
      bodyFat: -0.5,
      muscleMass: 0.3,
      waist: -1.2,
      bmi: -0.2,
      visceralFat: -0.3,
      metabolicAge: -0.5
    };

    const currentValue = currentValues[selectedMetric];
    const monthlyTrend = monthlyTrends[selectedMetric];
    const predictedValue = currentValue + (monthlyTrend * periodMonths);
    const totalChange = predictedValue - currentValue;
    const changePercentage = ((totalChange / currentValue) * 100);

    // Calcul des intervalles de confiance
    const confidenceMultiplier = confidenceLevel === 'low' ? 0.5 : 
                                confidenceLevel === 'medium' ? 0.3 : 0.15;
    const margin = Math.abs(totalChange) * confidenceMultiplier;

    return {
      metric: currentMetric,
      current: currentValue,
      predicted: predictedValue,
      change: totalChange,
      changePercentage,
      monthlyTrend,
      confidenceInterval: {
        lower: predictedValue - margin,
        upper: predictedValue + margin
      },
      accuracy: confidenceLevel === 'low' ? 65 : confidenceLevel === 'medium' ? 82 : 94,
      dataQuality: 'Bonne',
      lastUpdate: new Date(),
      factors: [
        'Tendance historique des 3 derniers mois',
        'Régularité des mesures',
        'Corrélations avec autres métriques',
        'Saisonnalité détectée'
      ]
    };
  }, [selectedMetric, predictionPeriod, confidenceLevel]);

  // Scénarios de prévision
  const scenarios = useMemo(() => {
    const baseChange = predictionsData.change;
    
    return [
      {
        name: 'Optimiste',
        description: 'Si vous maintenez vos efforts actuels et les optimisez',
        multiplier: 1.3,
        probability: 25,
        color: 'text-green-400',
        bgColor: 'bg-green-600/20',
        icon: <TrendingUp className="w-4 h-4" />
      },
      {
        name: 'Réaliste',
        description: 'Basé sur votre tendance actuelle',
        multiplier: 1.0,
        probability: 50,
        color: 'text-blue-400',
        bgColor: 'bg-blue-600/20',
        icon: <Activity className="w-4 h-4" />
      },
      {
        name: 'Conservateur',
        description: 'Si vous ralentissez légèrement vos efforts',
        multiplier: 0.7,
        probability: 25,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-600/20',
        icon: <TrendingDown className="w-4 h-4" />
      }
    ].map(scenario => ({
      ...scenario,
      predictedValue: predictionsData.current + (baseChange * scenario.multiplier),
      change: baseChange * scenario.multiplier
    }));
  }, [predictionsData]);

  // Objectifs suggérés
  const suggestedGoals = useMemo(() => {
    const metric = predictionsData.metric;
    const current = predictionsData.current;
    
    const goals = {
      weight: [
        { target: current - 5, timeframe: '6 mois', difficulty: 'Modéré', description: 'Perte de poids saine' },
        { target: current - 2, timeframe: '2 mois', difficulty: 'Facile', description: 'Objectif à court terme' },
        { target: current - 10, timeframe: '1 an', difficulty: 'Difficile', description: 'Transformation majeure' }
      ],
      bodyFat: [
        { target: current - 3, timeframe: '4 mois', difficulty: 'Modéré', description: 'Réduction significative' },
        { target: current - 1, timeframe: '6 semaines', difficulty: 'Facile', description: 'Amélioration rapide' },
        { target: current - 5, timeframe: '8 mois', difficulty: 'Difficile', description: 'Objectif ambitieux' }
      ],
      muscleMass: [
        { target: current + 2, timeframe: '4 mois', difficulty: 'Modéré', description: 'Gain musculaire solide' },
        { target: current + 0.5, timeframe: '6 semaines', difficulty: 'Facile', description: 'Premier gain' },
        { target: current + 5, timeframe: '1 an', difficulty: 'Difficile', description: 'Transformation physique' }
      ]
    };

    return goals[selectedMetric] || goals.weight;
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
      metric: predictionsData.metric.label,
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
            Prévision pour {predictionsData.metric.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Valeur actuelle */}
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Valeur actuelle</div>
              <div className="text-3xl font-bold text-white mb-1">
                {predictionsData.current.toFixed(1)}
                <span className="text-lg text-slate-400 ml-1">{predictionsData.metric.unit}</span>
              </div>
              <div className="text-xs text-slate-500">Dernière mesure</div>
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
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {predictionsData.predicted.toFixed(1)}
                <span className="text-lg text-slate-400 ml-1">{predictionsData.metric.unit}</span>
              </div>
              <div className={`flex items-center justify-center gap-1 text-sm ${getChangeColor(predictionsData.change)}`}>
                {getChangeIcon(predictionsData.change)}
                {predictionsData.change > 0 ? '+' : ''}{predictionsData.change.toFixed(1)} {predictionsData.metric.unit}
                ({predictionsData.changePercentage > 0 ? '+' : ''}{predictionsData.changePercentage.toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Intervalle de confiance */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Intervalle de confiance ({predictionsData.accuracy}%)</span>
              <span className="text-sm text-purple-400">
                {predictionsData.confidenceInterval.lower.toFixed(1)} - {predictionsData.confidenceInterval.upper.toFixed(1)} {predictionsData.metric.unit}
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
                    {scenario.predictedValue.toFixed(1)}
                    <span className="text-sm text-slate-400 ml-1">{predictionsData.metric.unit}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    {scenario.change > 0 ? '+' : ''}{scenario.change.toFixed(1)} {predictionsData.metric.unit}
                  </div>
                </div>
                
                <p className="text-xs text-slate-300">{scenario.description}</p>
              </div>
            ))}
          </div>
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
          <div className="space-y-4">
            {suggestedGoals.map((goal, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-lg font-semibold text-white">
                      {goal.target.toFixed(1)} {predictionsData.metric.unit}
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
                  <div className={`text-sm font-medium ${getChangeColor(goal.target - predictionsData.current)}`}>
                    {goal.target - predictionsData.current > 0 ? '+' : ''}
                    {(goal.target - predictionsData.current).toFixed(1)} {predictionsData.metric.unit}
                  </div>
                  <Button size="sm" className="mt-2">
                    Définir comme objectif
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
                      {predictionsData.monthlyTrend > 0 ? '+' : ''}{predictionsData.monthlyTrend.toFixed(2)} {predictionsData.metric.unit}/mois
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