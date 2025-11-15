/**
 * NutritionPredictions.jsx
 * 
 * Composant UI pour les prédictions offline avec TensorFlow.js.
 * 
 * Fonctionnalités :
 * - Affichage prédictions poids avec graphiques (Recharts)
 * - Entraînement modèles (lazy, non-bloquant UI)
 * - Prédictions multiples horizons (7, 14, 30 jours)
 * - Graphique historique + courbe prédite
 * - Métriques : poids actuel, prédit, différence, tendance
 * - Feedback utilisateur (toast, loading states)
 * - Fallback gracieux si TensorFlow.js non supporté
 * 
 * Architecture :
 * - Hook : useNutritionPredictions (logique prédictions)
 * - Graphiques : Recharts (LineChart avec courbe prédite)
 * - Performance : Lazy loading graphiques, chunking données
 * 
 * @module components/tabs/nutrition/components/NutritionPredictions
 * @see ../../../../hooks/useNutritionPredictions
 * @see ../../../../services/nutrition/nutritionPredictions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Dot
} from 'recharts';
import { useNutritionPredictions } from '../../../../hooks/useNutritionPredictions';
import { useWorkout } from '../../../../context/WorkoutContext';
import logger from '../../../../utils/logger';

const log = logger.component('NutritionPredictions');

/**
 * Tooltip personnalisé pour graphiques
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-slate-300 font-medium mb-2">{label}</p>
        {payload
          .filter(entry => entry.value != null)
          .map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-bold">{entry.value?.toFixed(1)} kg</span>
            </p>
          ))}
      </div>
    );
  }
  return null;
};

/**
 * Composant principal pour les prédictions nutrition
 */
const NutritionPredictions = () => {
  // Hooks
  const {
    isSupported,
    isTraining,
    modelLoaded,
    predictions,
    error,
    trainingProgress,
    trainWeightModel,
    predictWeight,
    loadWeightModel,
    reset
  } = useNutritionPredictions();
  
  const { data: workoutData } = useWorkout();

  // État local
  const [chartsReady, setChartsReady] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7); // Horizon prédiction (7, 14, 30 jours)
  // ✅ OPTIMISATION : Variable predictionData supprimée (non utilisée)
  const [historicalData, setHistoricalData] = useState([]);

  // Options prédiction
  const predictionDays = [
    { value: 7, label: '7 jours' },
    { value: 14, label: '14 jours' },
    { value: 30, label: '30 jours' }
  ];

  // Attendre que le DOM soit prêt avant de rendre les graphiques
  useEffect(() => {
    let raf1, raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setChartsReady(true);
      });
    });
    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, []);

  // Charger historique poids pour graphique
  useEffect(() => {
    if (!workoutData?.progressEntries) return;

    const weightEntries = workoutData.progressEntries
      .filter(entry => entry.type === 'metrics' && entry.weight != null && entry.weight > 0)
      .map(entry => ({
        date: entry.date || new Date(entry.timestamp).toISOString().split('T')[0],
        timestamp: entry.timestamp || new Date(entry.date).getTime(),
        weight: parseFloat(entry.weight)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // 30 derniers points pour graphique

    setHistoricalData(weightEntries);
  }, [workoutData]);

  // Construire données graphique (historique + prédictions)
  const chartData = useMemo(() => {
    // ✅ OPTIMISATION : Créer nouvelle array (éviter mutation)
    const historical = historicalData.map(h => ({
      date: h.date,
      dateLabel: new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      weight: h.weight,
      predictedWeight: null,
      type: 'historical'
    }));

    // Ajouter prédiction si disponible (avec point de connexion depuis dernier historique)
    if (predictions.weight && predictions.weight.value && historical.length > 0) {
      const pred = predictions.weight;
      const predDate = pred.date || new Date(Date.now() + pred.daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const lastHistorical = historical[historical.length - 1];
      
      // ✅ OPTIMISATION : Créer nouvelle array avec prédiction (éviter mutation)
      return [
        ...historical,
        // Point de connexion (dernier historique)
        {
          date: lastHistorical.date,
          dateLabel: lastHistorical.dateLabel,
          weight: lastHistorical.weight,
          predictedWeight: null,
          type: 'historical'
        },
        // Prédiction
        {
          date: predDate,
          dateLabel: new Date(predDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          weight: null,
          predictedWeight: pred.value,
          type: 'prediction'
        }
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // ✅ OPTIMISATION : Trier sans muter (déjà trié par historicalData, mais sécurité)
    return [...historical].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [historicalData, predictions]);

  // Handler entraînement
  const handleTrainModel = useCallback(async () => {
    reset();
    
    // Démarrer entraînement en arrière-plan (non-bloquant)
    setTimeout(async () => {
      await trainWeightModel({
        onProgress: (epoch, logs) => {
          log.debug('[NutritionPredictions] Progression entraînement', { epoch, logs });
        }
      });
    }, 0);
  }, [trainWeightModel, reset]);

  // Handler prédiction
  const handlePredict = useCallback(async () => {
    reset();
    const predicted = await predictWeight(selectedDays);
    if (predicted != null) {
      log.debug('[NutritionPredictions] Prédiction générée', { predicted, daysAhead: selectedDays });
    }
  }, [predictWeight, selectedDays, reset]);

  // Calculer statistiques
  const stats = useMemo(() => {
    if (!predictions.weight || !predictions.weight.value) {
      return null;
    }

    const pred = predictions.weight;
    const currentWeight = pred.currentWeight;
    const predictedWeight = pred.value;
    const difference = predictedWeight - currentWeight;
    const differencePercent = ((difference / currentWeight) * 100).toFixed(1);
    const trend = difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable';

    return {
      currentWeight,
      predictedWeight,
      difference,
      differencePercent: Math.abs(differencePercent),
      trend,
      daysAhead: pred.daysAhead,
      date: pred.date
    };
  }, [predictions]);

  // Si TensorFlow.js non supporté
  if (!isSupported) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} className="text-purple-400" />
            Prédictions Offline (ML)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle size={48} className="text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              TensorFlow.js non supporté
            </h3>
            <p className="text-slate-400 max-w-md">
              Votre navigateur ne supporte pas TensorFlow.js, nécessaire pour les prédictions offline.
              Veuillez utiliser un navigateur moderne (Chrome, Firefox, Edge, Safari).
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vérifier données suffisantes
  const hasEnoughData = historicalData.length >= 30;
  const hasModel = modelLoaded || (predictions.weight && predictions.weight.value);

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={20} className="text-purple-400" />
              Prédictions Offline (ML)
            </div>
            <div className="flex items-center gap-2">
              {modelLoaded && (
                <CheckCircle size={16} className="text-green-400" title="Modèle chargé" />
              )}
              {isTraining && (
                <Loader2 size={16} className="text-blue-400 animate-spin" title="Entraînement en cours" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1">
              <p className="text-slate-400 text-sm mb-3">
                Prédictions de poids utilisant l'apprentissage automatique (TensorFlow.js) basées sur votre historique nutrition et poids.
              </p>
              {!hasEnoughData && (
                <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <Info size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-200">
                    <strong>Données insuffisantes :</strong> Minimum 30 jours de données nécessaires pour entraîner un modèle fiable. 
                    Actuellement : {historicalData.length} jours.
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {!modelLoaded && hasEnoughData && (
                <Button
                  onClick={handleTrainModel}
                  disabled={isTraining}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                >
                  {isTraining ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Entraînement...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="mr-2" />
                      Entraîner modèle
                    </>
                  )}
                </Button>
              )}
              {modelLoaded && (
                <Button
                  onClick={handlePredict}
                  disabled={isTraining}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                >
                  <Target size={16} className="mr-2" />
                  Générer prédiction
                </Button>
              )}
              {modelLoaded && (
                <Button
                  onClick={loadWeightModel}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Recharger
                </Button>
              )}
            </div>
          </div>

          {/* Progression entraînement */}
          {isTraining && trainingProgress && (
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-200">
                  Époque {trainingProgress.epoch}/50
                </span>
                <span className="text-xs text-blue-300">
                  Loss: {trainingProgress.loss} | Val Loss: {trainingProgress.valLoss}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(trainingProgress.epoch / 50) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Sélection horizon prédiction */}
          {modelLoaded && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-slate-400">Prédire pour :</span>
              <div className="flex gap-2">
                {predictionDays.map(days => (
                  <Button
                    key={days.value}
                    onClick={() => setSelectedDays(days.value)}
                    variant={selectedDays === days.value ? 'default' : 'outline'}
                    size="sm"
                    className={
                      selectedDays === days.value
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    }
                  >
                    {days.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Card className="bg-red-900/20 border-red-700/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-200 font-medium mb-1">Erreur</h4>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques prédiction */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Poids actuel</p>
                <p className="text-2xl font-bold text-slate-200">{stats.currentWeight.toFixed(1)} kg</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Poids prédit</p>
                <p className="text-2xl font-bold text-blue-400">{stats.predictedWeight.toFixed(1)} kg</p>
                <p className="text-xs text-slate-500 mt-1">Dans {stats.daysAhead} jours</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Différence</p>
                <div className="flex items-center justify-center gap-1">
                  {stats.trend === 'up' ? (
                    <TrendingUp size={16} className="text-red-400" />
                  ) : stats.trend === 'down' ? (
                    <TrendingDown size={16} className="text-green-400" />
                  ) : (
                    <Target size={16} className="text-slate-400" />
                  )}
                  <p className={`text-2xl font-bold ${stats.trend === 'up' ? 'text-red-400' : stats.trend === 'down' ? 'text-green-400' : 'text-slate-400'}`}>
                    {stats.trend !== 'stable' && (stats.trend === 'up' ? '+' : '-')}
                    {Math.abs(stats.difference).toFixed(1)} kg
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-1">({stats.differencePercent}%)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Date prédiction</p>
                <p className="text-lg font-semibold text-slate-200">
                  {new Date(stats.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-slate-500 mt-1">Objectif</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphique historique + prédiction */}
      {chartData.length > 0 && chartsReady && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={20} className="text-blue-400" />
              Évolution Poids (Historique + Prédiction)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height={400} minHeight={400}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="dateLabel" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {/* Ligne historique */}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Poids historique"
                    connectNulls={false}
                  />
                  {/* Ligne prédiction (pointillée) */}
                  <Line
                    type="monotone"
                    dataKey="predictedWeight"
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#EF4444', r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Poids prédit"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si pas de données */}
      {chartData.length === 0 && !error && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar size={48} className="text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Aucune donnée disponible
              </h3>
              <p className="text-slate-400 max-w-md">
                Enregistrez des mesures de poids dans l'onglet "Suivi Corporel" pour commencer à générer des prédictions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NutritionPredictions;

