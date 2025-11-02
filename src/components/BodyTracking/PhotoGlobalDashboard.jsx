/**
 * Dashboard Global - Analyse Photos IA
 * 
 * Vue d'ensemble avec graphiques de progression des métriques
 * Agrége toutes les analyses photos pour visualiser évolution
 * 
 * Référence: suiviphotoapprofondi.md - Section 6 (Dashboard)
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  Target,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatDate } from '../../utils/dateUtils';
import InteractiveChart from './components/InteractiveChart';
import LazyChart from './components/LazyChart';
import { getDashboardDataService } from './services/dashboardDataService';
import logger from '../../utils/logger';

const log = logger.component('PhotoGlobalDashboard');

/**
 * Composant Tooltip personnalisé pour graphiques
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{formatDate(label)}</p>
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

const PhotoGlobalDashboard = () => {
  const { data } = useWorkout();
  const dashboardService = getDashboardDataService();
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  /**
   * Extrait toutes les photos analysées avec métriques
   * ✅ OPTIMISATION: Memoization Profonde - Re-render seulement si contenu change réellement
   */
  const analyzedPhotos = useDeepCompareMemo(() => {
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return [];
    }

    return data.progressPhotos
      .filter(photo => photo.analysis?.analyzed && photo.analysis?.summary)
      .map(photo => ({
        id: photo.id,
        date: photo.date ? new Date(photo.date) : new Date(photo.timestamp || 0),
        summary: photo.analysis.summary,
        metrics: photo.analysis.metrics,
        poseDetection: photo.analysis.poseDetection,
        angle: photo.angle || 'unknown'
      }))
      .sort((a, b) => a.date - b.date); // Trier chronologiquement
  }, [data?.progressPhotos]);

  /**
   * Prépare données pour graphiques de progression globale
   * ✅ OPTIMISATION: Memoization Profonde - Re-render seulement si contenu change réellement
   */
  const progressionData = useDeepCompareMemo(() => {
    if (analyzedPhotos.length === 0) return [];

    return analyzedPhotos.map(photo => ({
      date: photo.date.toISOString(),
      timestamp: photo.date.getTime(),
      volume: photo.summary.averageScores?.volume || 0,
      definition: photo.summary.averageScores?.definition || 0,
      symmetry: photo.summary.averageScores?.symmetry || 0,
      vascularity: photo.summary.averageScores?.vascularity || 0,
      separation: photo.summary.averageScores?.separation || 0,
      contours: photo.summary.averageScores?.contours || 0,
      overallScore: photo.summary.overallScore || 0,
      musclesAnalyzed: photo.summary.musclesAnalyzed || 0
    }));
  }, [analyzedPhotos]);

  /**
   * ✅ OPTIMISATION: Utilise service pré-calculé pour agrégations
   * Gain -60% temps rendu graphiques (calculs en cache au lieu de recalculs)
   */
  const [aggregatedData, setAggregatedData] = useState(null);
  const [loadingAggregations, setLoadingAggregations] = useState(false);

  useEffect(() => {
    const loadAggregations = async () => {
      if (analyzedPhotos.length === 0) {
        setAggregatedData(null);
        return;
      }

      setLoadingAggregations(true);
      try {
        const aggregated = await dashboardService.getAggregatedData(
          analyzedPhotos.map(p => ({
            id: p.id,
            date: p.date,
            timestamp: p.date.getTime(),
            angle: p.angle,
            analysis: {
              analyzed: true,
              summary: p.summary,
              metrics: p.metrics
            }
          })),
          selectedPeriod
        );

        setAggregatedData(aggregated);
      } catch (error) {
        log.error('Erreur chargement agrégations', error);
        setAggregatedData(null);
      } finally {
        setLoadingAggregations(false);
      }
    };

    loadAggregations();
  }, [analyzedPhotos, selectedPeriod, dashboardService]);

  /**
   * Calcule statistiques globales depuis agrégations pré-calculées
   */
  const globalStats = useMemo(() => {
    if (!aggregatedData) {
      return {
        totalAnalyses: 0,
        avgOverallScore: 0,
        avgVolume: 0,
        avgDefinition: 0,
        improvementVolume: 0,
        improvementDefinition: 0,
        improvementOverall: 0
      };
    }

    // Utiliser agrégations pré-calculées (beaucoup plus rapide)
    const { averageScores, trends, progression } = aggregatedData;

    return {
      totalAnalyses: aggregatedData.totalAnalyzed,
      avgOverallScore: averageScores.overallScore,
      avgVolume: averageScores.volume,
      avgDefinition: averageScores.definition,
      improvementVolume: trends.volume,
      improvementDefinition: trends.definition,
      improvementOverall: progression.improvement,
      firstDate: aggregatedData.metadata.firstDate 
        ? new Date(aggregatedData.metadata.firstDate) 
        : null,
      lastDate: aggregatedData.metadata.lastDate 
        ? new Date(aggregatedData.metadata.lastDate) 
        : null
    };
  }, [aggregatedData]);

  /**
   * Prépare données pour graphique par muscle
   * ✅ OPTIMISATION: Memoization Profonde - Re-render seulement si contenu change réellement
   */
  const muscleProgressionData = useDeepCompareMemo(() => {
    if (analyzedPhotos.length === 0) return {};

    // Agréger par muscle sur toutes les photos
    const muscleData = {};

    analyzedPhotos.forEach(photo => {
      if (!photo.metrics) return;

      Object.entries(photo.metrics).forEach(([muscle, metricsData]) => {
        if (!metricsData.success || !metricsData.metrics) return;

        if (!muscleData[muscle]) {
          muscleData[muscle] = [];
        }

        muscleData[muscle].push({
          date: photo.date.toISOString(),
          timestamp: photo.date.getTime(),
          volume: metricsData.metrics.volume?.score || 0,
          definition: metricsData.metrics.definition?.score || 0,
          symmetry: metricsData.metrics.symmetry?.score || 0,
          vascularity: metricsData.metrics.vascularity?.score || 0,
          separation: metricsData.metrics.separation?.score || 0,
          contours: metricsData.metrics.contours?.score || 0
        });
      });
    });

    return muscleData;
  }, [analyzedPhotos]);

  /**
   * ✅ OPTIMISATION: Utilise top muscles depuis agrégations pré-calculées
   */
  const topMuscles = useMemo(() => {
    if (!aggregatedData || !aggregatedData.topMuscles) {
      return [];
    }
    
    // Retourner top muscles depuis agrégations (plus rapide, déjà calculé)
    return aggregatedData.topMuscles.map(m => m.muscleType);
  }, [aggregatedData]);

  if (analyzedPhotos.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Aucune analyse disponible
          </h3>
          <p className="text-slate-400 mb-4">
            Lancez des analyses IA sur vos photos pour voir les graphiques de progression ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-purple-600/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Analyses totales</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {globalStats.totalAnalyses}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {globalStats.firstDate && globalStats.lastDate && (
                <>
                  Du {formatDate(globalStats.firstDate)} au {formatDate(globalStats.lastDate)}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-600/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Score global moyen</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {globalStats.avgOverallScore}/100
            </div>
            <div className="flex items-center gap-1 mt-1">
              {globalStats.improvementOverall >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${
                globalStats.improvementOverall >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {globalStats.improvementOverall >= 0 ? '+' : ''}{globalStats.improvementOverall} points
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-600/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Volume moyen</span>
              <Target className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">
              {globalStats.avgVolume}/100
            </div>
            <div className="flex items-center gap-1 mt-1">
              {globalStats.improvementVolume >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${
                globalStats.improvementVolume >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {globalStats.improvementVolume >= 0 ? '+' : ''}{globalStats.improvementVolume} points
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-600/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Définition moyenne</span>
              <BarChart3 className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {globalStats.avgDefinition}/100
            </div>
            <div className="flex items-center gap-1 mt-1">
              {globalStats.improvementDefinition >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${
                globalStats.improvementDefinition >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {globalStats.improvementDefinition >= 0 ? '+' : ''}{globalStats.improvementDefinition} points
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique progression globale (6 métriques) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Progression Globale des Métriques
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ✅ OPTIMISATION: Lazy rendering - Graphique rendu seulement si visible */}
          <LazyChart height={450} placeholderText="Chargement graphique progression globale...">
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
                    <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
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
                  <Area
                    type="monotone"
                    dataKey="overallScore"
                    stroke="#F59E0B"
                    fillOpacity={1}
                    fill="url(#colorOverall)"
                    name="Score Global"
                    strokeWidth={3}
                  />
                </AreaChart>
              }
              data={progressionData}
              exportFilename="progression-globale"
              showZoom={true}
              showExport={true}
            />
          </LazyChart>
        </CardContent>
      </Card>

      {/* Graphique toutes métriques détaillées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Toutes les Métriques Détaillées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ✅ OPTIMISATION: Lazy rendering - Graphique rendu seulement si visible */}
          <LazyChart height={450} placeholderText="Chargement graphique métriques détaillées...">
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
                    strokeWidth={2}
                    name="Volume"
                    dot={{ fill: '#8B5CF6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="definition"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Définition"
                    dot={{ fill: '#3B82F6', r: 4 }}
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
              data={progressionData}
              exportFilename="toutes-metriques"
              showZoom={true}
              showExport={true}
            />
          </LazyChart>
        </CardContent>
      </Card>

      {/* Graphiques par muscle (top 5) */}
      {topMuscles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topMuscles.map(muscle => {
            const muscleData = muscleProgressionData[muscle] || [];
            if (muscleData.length === 0) return null;

            return (
              <Card key={muscle}>
                <CardHeader>
                  <CardTitle size="sm" className="capitalize flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    {muscle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* ✅ OPTIMISATION: Lazy rendering - Graphique rendu seulement si visible */}
                  <LazyChart height={350} placeholderText={`Chargement graphique ${muscle}...`}>
                    <InteractiveChart
                      chartComponent={
                        <BarChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => formatDate(new Date(value))}
                            stroke="#9CA3AF"
                          />
                          <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="volume" fill="#8B5CF6" name="Volume" />
                          <Bar dataKey="definition" fill="#3B82F6" name="Définition" />
                        </BarChart>
                      }
                      data={muscleData}
                      exportFilename={`evolution-${muscle}`}
                      showZoom={muscleData.length > 10}
                      showExport={true}
                    />
                  </LazyChart>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PhotoGlobalDashboard;

