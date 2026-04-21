/**
 * Vue Par Muscle - Analyse Profonde
 * 
 * Interface dédiée avec onglets pour analyse complète par muscle
 * - Vue d'ensemble avec comparaison photos
 * - Métriques détaillées avec graphiques
 * - Évolution temporelle
 * - Corrélations entraînement
 * - Comparaisons visuelles
 * - Recommandations
 * 
 * Référence: suiviphotoapprofondi.md - Section 7 (Vue Par Muscle)
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Image,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import PhotoComparisonView from './components/PhotoComparisonView';
import InteractiveChart from './components/InteractiveChart';
import LazyChart from './components/LazyChart';
import CorrelationsView from './components/CorrelationsView';
import RecommendationsView from './components/RecommendationsView';
import { getPhotoUrl } from './utils/photoNormalizer';
import logger from '../../utils/logger';

const log = logger.component('PhotoMuscleAnalysis');

/**
 * Liste des muscles disponibles
 */
const MUSCLE_OPTIONS = [
  { value: 'pectoraux', label: 'Pectoraux', icon: '💪' },
  { value: 'biceps', label: 'Biceps', icon: '💪' },
  { value: 'triceps', label: 'Triceps', icon: '💪' },
  { value: 'deltoides', label: 'Deltoïdes', icon: '💪' },
  { value: 'quadriceps', label: 'Quadriceps', icon: '💪' },
  { value: 'mollets', label: 'Mollets', icon: '💪' },
  { value: 'dorsaux', label: 'Dorsaux', icon: '💪' },
  { value: 'abdominaux', label: 'Abdominaux', icon: '💪' },
  { value: 'trapèzes', label: 'Trapèzes', icon: '💪' },
  { value: 'ischio_jambiers', label: 'Ischio-jambiers', icon: '💪' },
  { value: 'obliques', label: 'Obliques', icon: '💪' }
];

/**
 * Onglets de la vue muscle
 */
const TABS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
  { id: 'metrics', label: 'Métriques détaillées', icon: Activity },
  { id: 'evolution', label: 'Évolution temporelle', icon: TrendingUp },
  { id: 'correlations', label: 'Corrélations', icon: Target },
  { id: 'comparison', label: 'Comparaisons visuelles', icon: Image },
  { id: 'recommendations', label: 'Recommandations', icon: Lightbulb }
];

/**
 * Tooltip personnalisé
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-[#0F4C5C]/45 rounded-lg p-3 shadow-xl">
        <p className="text-teal-100 font-medium mb-2">{formatDate(new Date(label))}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}/100</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PhotoMuscleAnalysis = () => {
  const { data, getWorkoutHistory } = useWorkout();
  const [selectedMuscle, setSelectedMuscle] = useState('pectoraux');
  const [activeTab, setActiveTab] = useState('overview');
  const [photoIndex, setPhotoIndex] = useState(0); // Pour slider comparaison photos

  // ✅ PHASE 3.2 : Hash stable pour éviter recalculs inutiles
  const photosHash = useMemo(() => {
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return '';
    }
    return `${data.progressPhotos.length}_${data.progressPhotos.map(p => p.id).join(',')}`;
  }, [data?.progressPhotos]);

  /**
   * Extrait toutes les photos analysées (pour corrélations)
   * ✅ PHASE 3.2 : useMemo optimisé avec hash stable
   */
  const allAnalyzedPhotos = useMemo(() => {
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
   * Extrait toutes les photos analysées pour le muscle sélectionné
   * ✅ PHASE 3.2 : useMemo optimisé avec hash stable
   */
  const muscleData = useMemo(() => {
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return [];
    }

    return data.progressPhotos
      .filter(photo => {
        const metrics = photo.analysis?.metrics;
        return metrics && metrics[selectedMuscle]?.success;
      })
      .map(photo => ({
        id: photo.id,
        url: getPhotoUrl(photo), // ✅ NORMALISATION: Utilise helper pour obtenir URL
        date: photo.date ? new Date(photo.date) : new Date(photo.timestamp || 0),
        metrics: photo.analysis.metrics[selectedMuscle],
        summary: photo.analysis.summary,
        poseDetection: photo.analysis.poseDetection
      }))
      .sort((a, b) => a.date - b.date); // Trier chronologiquement
  }, [photosHash, selectedMuscle]);

  /**
   * Calcule statistiques pour le muscle sélectionné
   * ✅ PHASE 3.2 : useMemo optimisé
   */
  const muscleStats = useMemo(() => {
    if (muscleData.length === 0) {
      return {
        totalAnalyses: 0,
        avgVolume: 0,
        avgDefinition: 0,
        avgSymmetry: 0,
        improvementVolume: 0,
        improvementDefinition: 0,
        improvementSymmetry: 0,
        globalScore: 0
      };
    }

    const first = muscleData[0];
    const last = muscleData[muscleData.length - 1];
    const firstMetrics = first.metrics.metrics || {};
    const lastMetrics = last.metrics.metrics || {};

    const avgVolume = muscleData.reduce((sum, d) => 
      sum + (d.metrics.metrics?.volume?.score || 0), 0) / muscleData.length;
    
    const avgDefinition = muscleData.reduce((sum, d) => 
      sum + (d.metrics.metrics?.definition?.score || 0), 0) / muscleData.length;
    
    const avgSymmetry = muscleData.reduce((sum, d) => 
      sum + (d.metrics.metrics?.symmetry?.score || 0), 0) / muscleData.length;

    // Score global (moyenne pondérée)
    const globalScore = Math.round(
      avgVolume * 0.40 + avgDefinition * 0.30 + avgSymmetry * 0.20 +
      (muscleData.reduce((sum, d) => sum + (d.metrics.metrics?.vascularity?.score || 0), 0) / muscleData.length) * 0.10
    );

    return {
      totalAnalyses: muscleData.length,
      avgVolume: Math.round(avgVolume),
      avgDefinition: Math.round(avgDefinition),
      avgSymmetry: Math.round(avgSymmetry),
      improvementVolume: Math.round((lastMetrics.volume?.score || 0) - (firstMetrics.volume?.score || 0)),
      improvementDefinition: Math.round((lastMetrics.definition?.score || 0) - (firstMetrics.definition?.score || 0)),
      improvementSymmetry: Math.round((lastMetrics.symmetry?.score || 0) - (firstMetrics.symmetry?.score || 0)),
      globalScore,
      firstDate: first.date,
      lastDate: last.date
    };
  }, [muscleData]);

  /**
   * Prépare données pour graphiques d'évolution
   * ✅ PHASE 3.2 : useMemo optimisé
   */
  const evolutionData = useMemo(() => {
    return muscleData.map(photo => {
      const metrics = photo.metrics.metrics || {};
      return {
        date: photo.date.toISOString(),
        timestamp: photo.date.getTime(),
        volume: metrics.volume?.score || 0,
        definition: metrics.definition?.score || 0,
        symmetry: metrics.symmetry?.score || 0,
        vascularity: metrics.vascularity?.score || 0,
        separation: metrics.separation?.score || 0,
        contours: metrics.contours?.score || 0
      };
    });
  }, [muscleData]);

  /**
   * Navigation slider photos
   */
  const navigatePhoto = (direction) => {
    if (direction === 'next') {
      setPhotoIndex((prev) => (prev + 1) % muscleData.length);
    } else {
      setPhotoIndex((prev) => (prev - 1 + muscleData.length) % muscleData.length);
    }
  };

  if (muscleData.length === 0) {
    return (
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardContent className="p-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-teal-100/45" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Aucune analyse disponible pour ce muscle
          </h3>
          <p className="text-teal-100/55 mb-4">
            Lancez des analyses IA sur vos photos pour voir les données de progression ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentPhoto = muscleData[photoIndex];
  const currentMetrics = currentPhoto?.metrics.metrics || {};

  return (
    <div className="space-y-6">
      {/* Sélecteur muscle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-300" />
            Analyse par Muscle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-teal-100/80">Muscle:</label>
            <select
              value={selectedMuscle}
              onChange={(e) => {
                setSelectedMuscle(e.target.value);
                setPhotoIndex(0); // Reset photo index
              }}
              className="px-4 py-2 bg-black border border-[#0F4C5C]/45 rounded-lg text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/50"
            >
              {MUSCLE_OPTIONS.map(muscle => (
                <option key={muscle.value} value={muscle.value}>
                  {muscle.icon} {muscle.label}
                </option>
              ))}
            </select>
            <div className="ml-auto text-sm text-teal-100/55">
              {muscleStats.totalAnalyses} analyse{muscleStats.totalAnalyses > 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/15">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Score Global</div>
            <div className="text-3xl font-bold text-sky-300">{muscleStats.globalScore}/100</div>
            <div className="text-xs text-teal-100/45 mt-1">
              {muscleStats.firstDate && muscleStats.lastDate && (
                <>
                  {formatDate(muscleStats.firstDate)} → {formatDate(muscleStats.lastDate)}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/20">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Volume Moyen</div>
            <div className="text-3xl font-bold text-sky-300/90">{muscleStats.avgVolume}/100</div>
            <div className="flex items-center gap-1 mt-1">
              {muscleStats.improvementVolume >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${
                muscleStats.improvementVolume >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {muscleStats.improvementVolume >= 0 ? '+' : ''}{muscleStats.improvementVolume} points
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-600/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Définition Moyenne</div>
            <div className="text-3xl font-bold text-green-400">{muscleStats.avgDefinition}/100</div>
            <div className="flex items-center gap-1 mt-1">
              {muscleStats.improvementDefinition >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${
                muscleStats.improvementDefinition >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {muscleStats.improvementDefinition >= 0 ? '+' : ''}{muscleStats.improvementDefinition} points
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-600/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Symétrie Moyenne</div>
            <div className="text-3xl font-bold text-orange-400">{muscleStats.avgSymmetry}/100</div>
            <div className="flex items-center gap-1 mt-1">
              {muscleStats.improvementSymmetry >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${
                muscleStats.improvementSymmetry >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {muscleStats.improvementSymmetry >= 0 ? '+' : ''}{muscleStats.improvementSymmetry} points
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 border-b border-[#0F4C5C]/35">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-[#0F4C5C]/55 text-sky-300'
                      : 'border-transparent text-teal-100/55 hover:text-teal-100/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Onglet Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Comparaison photos slider */}
              {muscleData.length > 1 && (
                <div>
                  <h4 className="font-semibold text-teal-100 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-sky-300" />
                    Comparaison Photos ({photoIndex + 1}/{muscleData.length})
                  </h4>
                  <div className="relative">
                    <div className="grid grid-cols-2 gap-4">
                      {photoIndex > 0 && (
                        <div className="relative">
                          <img
                            src={muscleData[photoIndex - 1].url}
                            alt="Photo précédente"
                            className="w-full h-64 object-cover rounded-lg opacity-70"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded text-teal-100 text-xs">
                            {formatDate(muscleData[photoIndex - 1].date)}
                          </div>
                        </div>
                      )}
                      <div className="relative">
                        <img
                          src={currentPhoto.url}
                          alt="Photo actuelle"
                          className="w-full h-64 object-cover rounded-lg border-2 border-[#0F4C5C]/55"
                        />
                        <div className="absolute bottom-2 left-2 bg-[#0F4C5C]/85 px-3 py-1 rounded text-teal-100 text-xs font-bold">
                          {formatDate(currentPhoto.date)}
                        </div>
                      </div>
                      {photoIndex < muscleData.length - 1 && (
                        <div className="relative">
                          <img
                            src={muscleData[photoIndex + 1].url}
                            alt="Photo suivante"
                            className="w-full h-64 object-cover rounded-lg opacity-70"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded text-teal-100 text-xs">
                            {formatDate(muscleData[photoIndex + 1].date)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigatePhoto('prev')}
                        disabled={photoIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex gap-1">
                        {muscleData.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPhotoIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === photoIndex ? 'bg-[#0F5C45]/40 w-6' : 'bg-[#0F4C5C]/40'
                            }`}
                          />
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigatePhoto('next')}
                        disabled={photoIndex === muscleData.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Graphique évolution 6 métriques */}
              <div>
                <h4 className="font-semibold text-teal-100 mb-4">Évolution des 6 Métriques</h4>
                {/* ✅ OPTIMISATION: Lazy rendering - Graphique rendu seulement si visible */}
                <LazyChart height={450} placeholderText={`Chargement évolution ${selectedMuscle}...`}>
                  <InteractiveChart
                    chartComponent={
                      <AreaChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDefinition" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => formatDate(new Date(value))}
                        stroke="#9CA3AF"
                      />
                      <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="#8B5CF6"
                        fillOpacity={1}
                        fill="url(#colorVolume)"
                        name="Volume"
                      />
                      <Area
                        type="monotone"
                        dataKey="definition"
                        stroke="#3B82F6"
                        fillOpacity={1}
                        fill="url(#colorDefinition)"
                        name="Définition"
                      />
                      <Line
                        type="monotone"
                        dataKey="symmetry"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Symétrie"
                        dot={{ fill: '#10B981', r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="vascularity"
                        stroke="#EF4444"
                        strokeWidth={2}
                        name="Vascularité"
                        dot={{ fill: '#EF4444', r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="separation"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        name="Séparation"
                        dot={{ fill: '#F59E0B', r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="contours"
                        stroke="#06B6D4"
                        strokeWidth={2}
                        name="Contours"
                        dot={{ fill: '#06B6D4', r: 4 }}
                      />
                    </AreaChart>
                  }
                    data={evolutionData}
                    exportFilename={`evolution-${selectedMuscle}-6-metriques`}
                    showZoom={evolutionData.length > 10}
                    showExport={true}
                  />
                </LazyChart>
              </div>
            </div>
          )}

          {/* Onglet Métriques Détaillées */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {Object.entries({
                volume: { label: 'Volume', color: '#8B5CF6' },
                definition: { label: 'Définition', color: '#3B82F6' },
                symmetry: { label: 'Symétrie', color: '#10B981' },
                vascularity: { label: 'Vascularité', color: '#EF4444' },
                separation: { label: 'Séparation', color: '#F59E0B' },
                contours: { label: 'Contours', color: '#06B6D4' }
              }).map(([key, config]) => {
                const metric = currentMetrics[key];
                if (!metric) return null;

                return (
                  <Card key={key} className="bg-black border border-[#0F4C5C]/45">
                    <CardHeader>
                      <CardTitle size="sm" style={{ color: config.color }}>
                        {config.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-teal-100/55">Score actuel</span>
                            <span className="text-2xl font-bold text-teal-100">{metric.score || 0}/100</span>
                          </div>
                          <div className="w-full bg-[#0F4C5C]/40 rounded-full h-3">
                            <div
                              className="h-3 rounded-full transition-all"
                              style={{
                                width: `${metric.score || 0}%`,
                                backgroundColor: config.color
                              }}
                            />
                          </div>
                        </div>

                        {metric.percentage !== undefined && (
                          <div className="text-sm text-teal-100/55">
                            Pourcentage surface: <span className="text-teal-100 font-medium">{metric.percentage}%</span>
                          </div>
                        )}

                        {metric.breakdown && (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {Object.entries(metric.breakdown).map(([breakdownKey, value]) => (
                              <div key={breakdownKey} className="text-center">
                                <div className="text-teal-100/55 capitalize">{breakdownKey}</div>
                                <div className="text-teal-100 font-bold">{value}/100</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {metric.interpretation && (
                          <div className="text-sm text-teal-100/80 italic">
                            {metric.interpretation}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Onglet Évolution Temporelle */}
          {activeTab === 'evolution' && (
            <div className="space-y-6">
              {/* ✅ OPTIMISATION: Lazy rendering - Graphique rendu seulement si visible */}
              <LazyChart height={450} placeholderText={`Chargement évolution temporelle ${selectedMuscle}...`}>
                <InteractiveChart
                  chartComponent={
                    <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => formatDate(new Date(value))}
                      stroke="#9CA3AF"
                    />
                    <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      name="Volume"
                      dot={{ fill: '#8B5CF6', r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="definition"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="Définition"
                      dot={{ fill: '#3B82F6', r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="symmetry"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Symétrie"
                      dot={{ fill: '#10B981', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="vascularity"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Vascularité"
                      dot={{ fill: '#EF4444', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="separation"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Séparation"
                      dot={{ fill: '#F59E0B', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="contours"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      name="Contours"
                      dot={{ fill: '#06B6D4', r: 4 }}
                    />
                  </LineChart>
                }
                  data={evolutionData}
                  exportFilename={`evolution-temporelle-${selectedMuscle}`}
                  showZoom={evolutionData.length > 10}
                  showExport={true}
                />
              </LazyChart>
            </div>
          )}

          {/* Onglet Corrélations */}
          {activeTab === 'correlations' && (
            <CorrelationsView
              photos={allAnalyzedPhotos}
              workoutHistory={getWorkoutHistory() || []}
              muscle={selectedMuscle}
              selectedMetric="volume"
            />
          )}

          {activeTab === 'comparison' && (
            <PhotoComparisonView
              photos={muscleData.map(p => ({
                url: p.url,
                date: p.date,
                summary: p.summary,
                metrics: p.metrics
              }))}
              showMetrics={true}
              initialIndex={0}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationsView
              photos={allAnalyzedPhotos}
              workoutHistory={getWorkoutHistory() || []}
              muscle={selectedMuscle}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotoMuscleAnalysis;

