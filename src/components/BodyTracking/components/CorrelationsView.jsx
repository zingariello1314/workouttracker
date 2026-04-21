/**
 * Vue Corrélations - Analyse Impact Entraînement
 * 
 * Affiche corrélations entre volume d'entraînement et métriques photos
 * - Graphiques corrélations par exercice
 * - Tableau exercices les plus impactants
 * - Statistiques significativité
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Section Corrélations
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  AlertCircle,
  Loader,
  Activity,
  Filter,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { calculateMuscleMetricCorrelations } from '../services/correlationCalculator';
import { getPhotoUrl } from '../utils/photoNormalizer';
import logger from '../../../utils/logger';

const log = logger.component('CorrelationsView');

/**
 * Tooltip personnalisé pour graphiques
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

const CorrelationsView = ({
  photos = [],
  workoutHistory = [],
  muscle = 'pectoraux',
  selectedMetric: initialMetric = 'volume'
}) => {
  const [selectedMetric, setSelectedMetric] = useState(initialMetric);
  const [isCalculating, setIsCalculating] = useState(false);
  const [correlationData, setCorrelationData] = useState(null);
  const [error, setError] = useState(null);
  const [minCorrelation, setMinCorrelation] = useState(-1); // Filtre corrélation minimale
  const [showOnlySignificant, setShowOnlySignificant] = useState(false); // Filtrer seulement significatifs
  const [sortBy, setSortBy] = useState('impact'); // 'impact', 'correlation', 'r2', 'exercise'

  /**
   * Calcule corrélations pour muscle/métrique sélectionnés
   */
  React.useEffect(() => {
    if (!photos || photos.length < 3 || !workoutHistory || workoutHistory.length === 0) {
      setCorrelationData(null);
      setError({
        type: 'insufficient_data',
        message: 'Minimum 3 photos analysées et données d\'entraînement nécessaires'
      });
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // Préparer photos analysées pour ce muscle
      const analyzedPhotos = photos
        .filter(photo => 
          photo.analysis?.analyzed && 
          photo.analysis?.metrics?.[muscle]?.success
        )
        .map(photo => ({
          id: photo.id,
          url: getPhotoUrl(photo), // ✅ NORMALISATION: Utilise helper pour obtenir URL
          date: photo.date ? new Date(photo.date) : new Date(photo.timestamp || 0),
          metrics: photo.analysis.metrics,
          summary: photo.analysis.summary
        }))
        .sort((a, b) => a.date - b.date);

      if (analyzedPhotos.length < 3) {
        setError({
          type: 'insufficient_photos',
          message: `Minimum 3 photos analysées nécessaires pour ${muscle}. Actuellement: ${analyzedPhotos.length}`
        });
        setIsCalculating(false);
        return;
      }

      // Préparer historique entraînement
      const preparedHistory = workoutHistory.map(session => ({
        date: session.date,
        exercises: session.exercises || []
      }));

      // Calculer corrélations
      const result = calculateMuscleMetricCorrelations(
        analyzedPhotos,
        preparedHistory,
        muscle,
        selectedMetric
      );

      if (result.error) {
        setError({
          type: result.error,
          message: result.message || 'Erreur lors du calcul des corrélations'
        });
        setIsCalculating(false);
        return;
      }

      setCorrelationData(result);
      setIsCalculating(false);
    } catch (err) {
      log.error('Erreur calcul corrélations', err);
      setError({
        type: 'calculation_error',
        message: err.message || 'Erreur lors du calcul des corrélations'
      });
      setIsCalculating(false);
    }
  }, [photos, workoutHistory, muscle, selectedMetric]);

  // État insuffisant de données
  if (!photos || photos.length === 0) {
    return (
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-teal-100/45" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Aucune photo analysée disponible
          </h3>
          <p className="text-teal-100/55">
            Lancez des analyses IA sur vos photos pour voir les corrélations avec l'entraînement.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!workoutHistory || workoutHistory.length === 0) {
    return (
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardContent className="p-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-teal-100/45" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Aucune donnée d'entraînement disponible
          </h3>
          <p className="text-teal-100/55">
            Enregistrez vos séances d'entraînement pour analyser les corrélations.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcul en cours
  if (isCalculating) {
    return (
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardContent className="p-12 text-center">
          <Loader className="w-16 h-16 mx-auto mb-4 text-sky-300 animate-spin" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Calcul des corrélations en cours...
          </h3>
          <p className="text-teal-100/55">
            Analyse de {photos.length} photos et {workoutHistory.length} séances d'entraînement
          </p>
        </CardContent>
      </Card>
    );
  }

  // Erreur
  if (error) {
    return (
      <Card className="bg-red-600/10 border-red-500/30">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Erreur lors du calcul des corrélations
          </h3>
          <p className="text-teal-100/55 mb-4">{error.message}</p>
          {error.type === 'insufficient_photos' && (
            <p className="text-sm text-teal-100/45">
              Lancez des analyses IA sur plus de photos pour activer cette fonctionnalité.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Pas de corrélations disponibles
  if (!correlationData || !correlationData.correlations || correlationData.correlations.length === 0) {
    return (
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardContent className="p-12 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-teal-100/45" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Aucune corrélation trouvée
          </h3>
          <p className="text-teal-100/55">
            Aucun exercice ciblant {muscle} n'a été trouvé dans votre historique d'entraînement.
          </p>
        </CardContent>
      </Card>
    );
  }

  /**
   * Préparer et filtrer données pour graphiques
   */
  const chartData = useMemo(() => {
    if (!correlationData || !correlationData.correlations) return [];

    let filtered = correlationData.correlations.map(corr => ({
      exercise: corr.exerciseName || corr.exerciseKey,
      exerciseKey: corr.exerciseKey,
      correlation: corr.correlation || 0,
      impact: corr.impact || 0,
      significance: corr.significance || 'not_significant',
      r2: corr.regression?.r2 || 0,
      pValue: corr.pValue || 1,
      dataPoints: corr.dataPoints || 0,
      avgVolume: corr.avgVolume || 0
    }));

    // Filtre corrélation minimale
    if (minCorrelation > -1) {
      filtered = filtered.filter(d => Math.abs(d.correlation) >= minCorrelation);
    }

    // Filtre seulement significatifs
    if (showOnlySignificant) {
      filtered = filtered.filter(d => d.significance === 'significant');
    }

    // Trier selon option
    switch (sortBy) {
      case 'correlation':
        filtered.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
        break;
      case 'r2':
        filtered.sort((a, b) => b.r2 - a.r2);
        break;
      case 'exercise':
        filtered.sort((a, b) => a.exercise.localeCompare(b.exercise));
        break;
      case 'impact':
      default:
        filtered.sort((a, b) => b.impact - a.impact);
        break;
    }

    return filtered;
  }, [correlationData, minCorrelation, showOnlySignificant, sortBy]);

  // Couleurs selon significativité
  const getColorBySignificance = (significance) => {
    switch (significance) {
      case 'significant':
        return '#10B981'; // green-500
      case 'marginally_significant':
        return '#F59E0B'; // orange-500
      default:
        return '#6B7280'; // slate-500
    }
  };

  // Couleurs selon corrélation
  const getColorByCorrelation = (correlation) => {
    if (Math.abs(correlation) < 0.3) return '#6B7280'; // slate-500 (faible)
    if (Math.abs(correlation) < 0.6) return '#F59E0B'; // orange-500 (modérée)
    return '#10B981'; // green-500 (forte)
  };

  return (
    <div className="space-y-6">
      {/* Filtres et contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-sky-300" />
            Filtres et Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sélection métrique */}
            <div>
              <label className="block text-sm font-medium text-teal-100/80 mb-2">
                Métrique analysée
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-[#0F4C5C]/45 rounded-lg text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/50"
              >
                <option value="volume">Volume</option>
                <option value="definition">Définition</option>
                <option value="symmetry">Symétrie</option>
                <option value="vascularity">Vascularité</option>
                <option value="separation">Séparation</option>
                <option value="contours">Contours</option>
              </select>
            </div>

            {/* Filtre corrélation minimale */}
            <div>
              <label className="block text-sm font-medium text-teal-100/80 mb-2">
                Corrélation min: {minCorrelation === -1 ? 'Aucun' : minCorrelation.toFixed(2)}
              </label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={minCorrelation}
                onChange={(e) => setMinCorrelation(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-teal-100/45 mt-1">
                <span>Toutes</span>
                <span>0.0</span>
                <span>1.0</span>
              </div>
            </div>

            {/* Filtre significativité */}
            <div>
              <label className="block text-sm font-medium text-teal-100/80 mb-2">
                Affichage
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlySignificant}
                  onChange={(e) => setShowOnlySignificant(e.target.checked)}
                  className="w-4 h-4 rounded bg-black border border-[#0F4C5C]/45 border-[#0F4C5C]/45 text-teal-300 focus:ring-[#0F5C45]/50"
                />
                <span className="text-sm text-teal-100/80">Seulement significatifs</span>
              </label>
            </div>

            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-teal-100/80 mb-2">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-[#0F4C5C]/45 rounded-lg text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/50"
              >
                <option value="impact">Impact</option>
                <option value="correlation">Corrélation</option>
                <option value="r2">R² (Qualité)</option>
                <option value="exercise">Nom exercice</option>
              </select>
            </div>
          </div>

          {/* Reset filtres */}
          {(minCorrelation !== -1 || showOnlySignificant || sortBy !== 'impact') && (
            <div className="mt-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setMinCorrelation(-1);
                  setShowOnlySignificant(false);
                  setSortBy('impact');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Réinitialiser filtres
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/15">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Exercices {chartData.length < correlationData.totalExercises ? 'filtrés' : 'analysés'}</div>
            <div className="text-2xl font-bold text-sky-300">
              {chartData.length}
            </div>
            <div className="text-xs text-teal-100/45 mt-1">
              {chartData.filter(d => d.significance === 'significant').length} significatifs
              {chartData.length < correlationData.totalExercises && (
                <span className="ml-1">({correlationData.totalExercises - chartData.length} masqués)</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/20">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Meilleure corrélation</div>
            <div className="text-2xl font-bold text-sky-300/90">
              {chartData[0]?.correlation.toFixed(3) || 'N/A'}
            </div>
            <div className="text-xs text-teal-100/45 mt-1">
              {chartData[0]?.exercise || 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-600/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">R² moyen</div>
            <div className="text-2xl font-bold text-green-400">
              {chartData.length > 0 
                ? (chartData.reduce((sum, d) => sum + (d.r2 || 0), 0) / chartData.length).toFixed(2)
                : '0.00'
              }
            </div>
            <div className="text-xs text-teal-100/45 mt-1">
              Qualité prédictive
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique corrélations par exercice */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-300" />
              Corrélations par Exercice - {muscle.charAt(0).toUpperCase() + muscle.slice(1)} ({selectedMetric})
              {chartData.length < correlationData.totalExercises && (
                <span className="text-sm font-normal text-teal-100/55 ml-2">
                  ({chartData.length}/{correlationData.totalExercises} affichés)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="exercise"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#9CA3AF"
                />
                <YAxis domain={[-1, 1]} stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="correlation" name="Corrélation" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorByCorrelation(entry.correlation)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Message si aucun résultat après filtres */}
      {chartData.length === 0 && correlationData && correlationData.correlations && correlationData.correlations.length > 0 && (
        <Card className="bg-yellow-600/10 border-yellow-500/30">
          <CardContent className="p-12 text-center">
            <Filter className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-semibold text-teal-100 mb-2">
              Aucun résultat après filtres
            </h3>
            <p className="text-teal-100/55 mb-4">
              Aucun exercice ne correspond aux critères de filtrage sélectionnés.
            </p>
            <Button
              onClick={() => {
                setMinCorrelation(-1);
                setShowOnlySignificant(false);
              }}
            >
              Réinitialiser filtres
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tableau exercices détaillés */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-sky-300/90" />
              Impact des Exercices (Top {Math.min(10, chartData.length)})
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#0F4C5C]/35">
                  <th className="text-left py-3 px-4 text-teal-100/80 font-medium">Exercice</th>
                  <th className="text-center py-3 px-4 text-teal-100/80 font-medium">Corrélation</th>
                  <th className="text-center py-3 px-4 text-teal-100/80 font-medium">R²</th>
                  <th className="text-center py-3 px-4 text-teal-100/80 font-medium">Significativité</th>
                  <th className="text-center py-3 px-4 text-teal-100/80 font-medium">Impact</th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice(0, 10).map((corr, index) => (
                  <tr
                    key={index}
                    className="border-b border-[#0F4C5C]/35/50 hover:bg-teal-950/25 transition-colors"
                  >
                    <td className="py-3 px-4 text-teal-100 font-medium">{corr.exercise}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${
                        Math.abs(corr.correlation) > 0.6 
                          ? 'text-green-400' 
                          : Math.abs(corr.correlation) > 0.3
                          ? 'text-orange-400'
                          : 'text-teal-100/55'
                      }`}>
                        {corr.correlation.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-teal-100/80">
                      {(corr.r2 * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        corr.significance === 'significant'
                          ? 'bg-green-500/20 text-green-400'
                          : corr.significance === 'marginally_significant'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-teal-950/25 text-teal-100/55'
                      }`}>
                        {corr.significance === 'significant' 
                          ? 'Significatif' 
                          : corr.significance === 'marginally_significant'
                          ? 'Marginal'
                          : 'Non significatif'
                        }
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {corr.correlation > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-teal-100/80 font-medium">
                          {(corr.impact * 100).toFixed(0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default CorrelationsView;

