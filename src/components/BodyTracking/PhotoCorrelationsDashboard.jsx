/**
 * Dashboard Corrélations Global - Vue Globale Toutes Corrélations
 * 
 * Vue d'ensemble de toutes les corrélations entraînement vs métriques
 * pour tous les muscles analysés
 * - Carte de chaleur corrélations muscles/exercices
 * - Top exercices impactants globalement
 * - Statistiques globales corrélations
 * - Graphiques comparaisons muscles
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Section Corrélations
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  AlertCircle,
  Loader,
  Zap,
  Award,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatDate } from '../../utils/dateUtils';
import { calculateGlobalCorrelations } from './services/correlationCalculator';
import InteractiveChart from './components/InteractiveChart';
import { getPhotoUrl } from './utils/photoNormalizer';
import logger from '../../utils/logger';

const log = logger.component('PhotoCorrelationsDashboard');

/**
 * Tooltip personnalisé
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-[#0F4C5C]/45 rounded-lg p-3 shadow-xl">
        <p className="text-teal-100 font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value.toFixed(3)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PhotoCorrelationsDashboard = () => {
  const { data, getWorkoutHistory } = useWorkout();
  const [selectedMetric, setSelectedMetric] = useState('volume');
  const [isCalculating, setIsCalculating] = useState(false);
  const [correlationsData, setCorrelationsData] = useState(null);
  const [error, setError] = useState(null);

  // ✅ PHASE 3.2 : Hash stable pour éviter recalculs inutiles
  const photosHash = useMemo(() => {
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return '';
    }
    return `${data.progressPhotos.length}_${data.progressPhotos.map(p => p.id).join(',')}`;
  }, [data?.progressPhotos]);

  /**
   * Extrait toutes les photos analysées
   * ✅ PHASE 3.2 : useMemo optimisé avec hash stable
   */
  const analyzedPhotos = useMemo(() => {
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return [];
    }

    return data.progressPhotos
      .filter(photo => photo.analysis?.analyzed && photo.analysis?.summary)
      .map(photo => ({
        id: photo.id,
        url: getPhotoUrl(photo), // ✅ NORMALISATION: Utilise helper pour obtenir URL
        date: photo.date ? new Date(photo.date) : new Date(photo.timestamp || 0),
        analysis: photo.analysis,
        metrics: photo.analysis.metrics,
        summary: photo.analysis.summary
      }))
      .sort((a, b) => a.date - b.date);
  }, [photosHash]);

  /**
   * Calcule corrélations globales
   */
  useEffect(() => {
    if (analyzedPhotos.length < 3) {
      setCorrelationsData(null);
      setError({
        type: 'insufficient_photos',
        message: 'Minimum 3 photos analysées nécessaires pour les corrélations'
      });
      return;
    }

    const workoutHistory = getWorkoutHistory() || [];
    if (workoutHistory.length === 0) {
      setCorrelationsData(null);
      setError({
        type: 'no_workout_data',
        message: 'Aucune donnée d\'entraînement disponible'
      });
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // Préparer historique
      const preparedHistory = workoutHistory.map(session => ({
        date: session.date,
        exercises: session.exercises || []
      }));

      // Calculer corrélations globales
      const result = calculateGlobalCorrelations(analyzedPhotos, preparedHistory);

      if (result.error) {
        setError({
          type: result.error,
          message: result.message || 'Erreur lors du calcul des corrélations'
        });
        setIsCalculating(false);
        return;
      }

      setCorrelationsData(result);
      setIsCalculating(false);
    } catch (err) {
      log.error('Erreur calcul corrélations globales', err);
      setError({
        type: 'calculation_error',
        message: err.message || 'Erreur lors du calcul des corrélations'
      });
      setIsCalculating(false);
    }
  }, [analyzedPhotos, getWorkoutHistory]);

  /**
   * Prépare données pour graphique comparaison muscles
   */
  const muscleComparisonData = useMemo(() => {
    if (!correlationsData?.muscleCorrelations) return [];

    return Object.entries(correlationsData.muscleCorrelations).map(([muscle, metrics]) => {
      const metricData = metrics[selectedMetric];
      if (!metricData || !metricData.correlations || metricData.correlations.length === 0) {
        return null;
      }

      // Trouver meilleure corrélation pour ce muscle
      const bestCorr = metricData.correlations[0];
      return {
        muscle: muscle.charAt(0).toUpperCase() + muscle.slice(1),
        bestCorrelation: bestCorr?.correlation || 0,
        bestExercise: bestCorr?.exerciseName || 'N/A',
        significantCount: metricData.significantCount || 0,
        totalExercises: metricData.totalExercises || 0,
        avgR2: metricData.correlations.reduce((sum, c) => sum + (c.regression?.r2 || 0), 0) / metricData.correlations.length
      };
    }).filter(Boolean).sort((a, b) => Math.abs(b.bestCorrelation) - Math.abs(a.bestCorrelation));
  }, [correlationsData, selectedMetric]);

  /**
   * Prépare données pour top exercices globalement
   */
  const topExercisesGlobal = useMemo(() => {
    if (!correlationsData?.muscleCorrelations) return [];

    const exerciseMap = {};

    // Agréger par exercice sur tous muscles
    Object.entries(correlationsData.muscleCorrelations).forEach(([muscle, metrics]) => {
      const metricData = metrics[selectedMetric];
      if (!metricData?.correlations) return;

      metricData.correlations.forEach(corr => {
        const key = corr.exerciseKey || corr.exerciseName;
        if (!exerciseMap[key]) {
          exerciseMap[key] = {
            exerciseName: corr.exerciseName,
            exerciseId: corr.exerciseId,
            muscles: [],
            correlations: [],
            avgCorrelation: 0,
            avgImpact: 0,
            significantCount: 0
          };
        }

        exerciseMap[key].muscles.push(muscle);
        exerciseMap[key].correlations.push(corr.correlation);
        exerciseMap[key].avgImpact += corr.impact || 0;
        if (corr.significance === 'significant') {
          exerciseMap[key].significantCount++;
        }
      });
    });

    // Calculer moyennes
    Object.values(exerciseMap).forEach(ex => {
      ex.avgCorrelation = ex.correlations.reduce((sum, c) => sum + Math.abs(c), 0) / ex.correlations.length;
      ex.avgImpact = ex.avgImpact / ex.correlations.length;
    });

    // Trier par impact moyen
    return Object.values(exerciseMap)
      .sort((a, b) => b.avgImpact - a.avgImpact)
      .slice(0, 15); // Top 15
  }, [correlationsData, selectedMetric]);

  // États insuffisants
  if (analyzedPhotos.length < 3) {
    return (
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-teal-100/45" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Données insuffisantes
          </h3>
          <p className="text-teal-100/55">
            Minimum 3 photos analysées nécessaires pour les corrélations globales.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isCalculating) {
    return (
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardContent className="p-12 text-center">
          <Loader className="w-16 h-16 mx-auto mb-4 text-sky-300 animate-spin" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Calcul des corrélations en cours...
          </h3>
          <p className="text-teal-100/55">
            Analyse de {analyzedPhotos.length} photos et {getWorkoutHistory()?.length || 0} séances
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-600/10 border-red-500/30">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">Erreur</h3>
          <p className="text-teal-100/55">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!correlationsData || !correlationsData.muscleCorrelations) {
    return (
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardContent className="p-12 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-teal-100/45" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Aucune corrélation disponible
          </h3>
          <p className="text-teal-100/55">
            Pas assez de données alignées pour calculer des corrélations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/15">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Muscles analysés</div>
            <div className="text-2xl font-bold text-sky-300">
              {correlationsData.musclesAnalyzed?.length || 0}
            </div>
            <div className="text-xs text-teal-100/45 mt-1">
              avec corrélations
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/20">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Photos alignées</div>
            <div className="text-2xl font-bold text-sky-300/90">
              {correlationsData.alignedDataPoints || 0}
            </div>
            <div className="text-xs text-teal-100/45 mt-1">
              sur {correlationsData.totalPhotos || 0} totales
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-600/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Séances analysées</div>
            <div className="text-2xl font-bold text-green-400">
              {correlationsData.totalWorkouts || 0}
            </div>
            <div className="text-xs text-teal-100/45 mt-1">
              dans historique
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-600/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Top exercice</div>
            <div className="text-xl font-bold text-orange-400 truncate">
              {topExercisesGlobal[0]?.exerciseName || 'N/A'}
            </div>
            <div className="text-xs text-teal-100/45 mt-1">
              {topExercisesGlobal[0]?.avgCorrelation.toFixed(3) || '0.000'} corrélation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sélecteur métrique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-300" />
            Vue Globale Corrélations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium text-teal-100/80 mb-2">
              Métrique analysée
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full md:w-64 px-3 py-2 bg-black border border-[#0F4C5C]/45 rounded-lg text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/50"
            >
              <option value="volume">Volume</option>
              <option value="definition">Définition</option>
              <option value="symmetry">Symétrie</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Comparaison muscles */}
      {muscleComparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-300/90" />
              Comparaison Corrélations par Muscle ({selectedMetric})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InteractiveChart
              chartComponent={
                <BarChart margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="muscle"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#9CA3AF"
                  />
                  <YAxis domain={[-1, 1]} stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="bestCorrelation" name="Meilleure Corrélation" radius={[4, 4, 0, 0]}>
                    {muscleComparisonData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          Math.abs(entry.bestCorrelation) > 0.6
                            ? '#10B981'
                            : Math.abs(entry.bestCorrelation) > 0.3
                            ? '#F59E0B'
                            : '#6B7280'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              }
              data={muscleComparisonData}
              exportFilename="correlations-par-muscle"
              showZoom={muscleComparisonData.length > 10}
              showExport={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Top exercices globalement */}
      {topExercisesGlobal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Top 15 Exercices les Plus Impactants Globaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#0F4C5C]/35">
                    <th className="text-left py-3 px-4 text-teal-100/80 font-medium">Exercice</th>
                    <th className="text-center py-3 px-4 text-teal-100/80 font-medium">Corrélation Moy.</th>
                    <th className="text-center py-3 px-4 text-teal-100/80 font-medium">Impact Moy.</th>
                    <th className="text-center py-3 px-4 text-teal-100/80 font-medium">Muscles Ciblés</th>
                    <th className="text-center py-3 px-4 text-teal-100/80 font-medium">Significatifs</th>
                  </tr>
                </thead>
                <tbody>
                  {topExercisesGlobal.map((ex, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#0F4C5C]/35/50 hover:bg-teal-950/25 transition-colors"
                    >
                      <td className="py-3 px-4 text-teal-100 font-medium">
                        <div className="flex items-center gap-2">
                          {index < 3 && <Award className="w-4 h-4 text-yellow-400" />}
                          {ex.exerciseName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${
                          ex.avgCorrelation > 0.6 
                            ? 'text-green-400' 
                            : ex.avgCorrelation > 0.3
                            ? 'text-orange-400'
                            : 'text-teal-100/55'
                        }`}>
                          {ex.avgCorrelation.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-teal-100/80">
                        {(ex.avgImpact * 100).toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {ex.muscles.slice(0, 3).map((muscle, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-[#0F4C5C]/30 text-sky-200/90 rounded text-xs"
                            >
                              {muscle}
                            </span>
                          ))}
                          {ex.muscles.length > 3 && (
                            <span className="px-2 py-1 bg-black border border-[#0F4C5C]/45 text-teal-100/55 rounded text-xs">
                              +{ex.muscles.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                          {ex.significantCount}/{ex.muscles.length}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphique évolution corrélations */}
      {muscleComparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Évolution Qualité Corrélations par Muscle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InteractiveChart
              chartComponent={
                <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="muscle" stroke="#9CA3AF" />
                  <YAxis domain={[0, 1]} stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgR2"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="R² Moyen"
                    dot={{ fill: '#8B5CF6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bestCorrelation"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Meilleure Corrélation"
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </LineChart>
              }
              data={muscleComparisonData}
              exportFilename="evolution-qualite-correlations"
              showZoom={muscleComparisonData.length > 10}
              showExport={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhotoCorrelationsDashboard;

