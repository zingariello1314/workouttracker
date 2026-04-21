/**
 * Vue Progression - Timeline Interactive
 * 
 * Timeline avec miniatures, filtres, animations morphing
 * Graphiques multi-muscles, statistiques globales, prédictions
 * 
 * Référence: suiviphotoapprofondi.md - Section 7 (Vue Progression)
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Filter,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  TrendingUp,
  Activity,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  LineChart,
  Line,
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
import InteractiveChart from './components/InteractiveChart';
import LazyChart from './components/LazyChart';
import { getPhotoUrl } from './utils/photoNormalizer';
import logger from '../../utils/logger';

const log = logger.component('PhotoProgressionTimeline');

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

const PhotoProgressionTimeline = () => {
  const { data } = useWorkout();
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all', '3months', '6months', '1year'
  const [selectedMuscles, setSelectedMuscles] = useState([]); // Muscles à afficher dans graphiques
  const [minQualityScore, setMinQualityScore] = useState(0);
  const [timelineOrientation, setTimelineOrientation] = useState('horizontal'); // 'horizontal' | 'vertical'
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 1x, 2x, 3x
  const timelineRef = useRef(null);

  // ✅ PHASE 3.2 : Hash stable pour éviter recalculs inutiles
  const photosHash = useMemo(() => {
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return '';
    }
    return `${data.progressPhotos.length}_${data.progressPhotos.map(p => p.id).join(',')}`;
  }, [data?.progressPhotos]);

  /**
   * Extrait toutes les photos analysées avec métriques
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
        summary: photo.analysis.summary,
        metrics: photo.analysis.metrics,
        poseDetection: photo.analysis.poseDetection,
        angle: photo.angle || 'unknown',
        qualityScore: photo.capture?.qualityScore || photo.analysis?.preprocessing?.qualityScore || 0
      }))
      .sort((a, b) => a.date - b.date); // Trier chronologiquement
  }, [photosHash]);

  /**
   * Filtre photos selon période et qualité
   */
  const filteredPhotos = useMemo(() => {
    let filtered = [...allAnalyzedPhotos];

    // Filtre période
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const periods = {
        '3months': 3 * 30 * 24 * 60 * 60 * 1000,
        '6months': 6 * 30 * 24 * 60 * 60 * 1000,
        '1year': 12 * 30 * 24 * 60 * 60 * 1000
      };
      const cutoffDate = new Date(now.getTime() - periods[selectedPeriod]);
      filtered = filtered.filter(photo => photo.date >= cutoffDate);
    }

    // Filtre qualité
    filtered = filtered.filter(photo => photo.qualityScore >= minQualityScore);

    return filtered;
  }, [allAnalyzedPhotos, selectedPeriod, minQualityScore]);

  /**
   * Tous muscles disponibles
   */
  const availableMuscles = useMemo(() => {
    const muscles = new Set();
    filteredPhotos.forEach(photo => {
      if (photo.metrics) {
        Object.keys(photo.metrics).forEach(muscle => {
          if (photo.metrics[muscle]?.success) {
            muscles.add(muscle);
          }
        });
      }
    });
    return Array.from(muscles).sort();
  }, [filteredPhotos]);

  /**
   * Prépare données pour graphiques multi-muscles
   */
  const multiMuscleData = useMemo(() => {
    const musclesToShow = selectedMuscles.length > 0 ? selectedMuscles : availableMuscles.slice(0, 3);
    
    return filteredPhotos.map(photo => {
      const dataPoint = {
        date: photo.date.toISOString(),
        timestamp: photo.date.getTime()
      };

      musclesToShow.forEach(muscle => {
        const muscleMetrics = photo.metrics?.[muscle]?.metrics;
        if (muscleMetrics) {
          // Score global muscle (moyenne pondérée)
          const muscleScore = Math.round(
            (muscleMetrics.volume?.score || 0) * 0.40 +
            (muscleMetrics.definition?.score || 0) * 0.30 +
            (muscleMetrics.symmetry?.score || 0) * 0.20 +
            (muscleMetrics.vascularity?.score || 0) * 0.10
          );
          dataPoint[muscle] = muscleScore;
        }
      });

      return dataPoint;
    });
  }, [filteredPhotos, selectedMuscles, availableMuscles]);

  /**
   * Calcule statistiques globales
   */
  const globalStats = useMemo(() => {
    if (filteredPhotos.length === 0) {
      return {
        totalPhotos: 0,
        dateRange: null,
        avgOverallScore: 0,
        weightEvolution: null,
        totalDays: 0
      };
    }

    const first = filteredPhotos[0];
    const last = filteredPhotos[filteredPhotos.length - 1];
    const totalDays = Math.ceil((last.date - first.date) / (1000 * 60 * 60 * 24));

    const avgOverallScore = filteredPhotos.reduce((sum, p) => 
      sum + (p.summary.overallScore || 0), 0) / filteredPhotos.length;

    // Évolution poids (si disponible dans progressEntries)
    let weightEvolution = null;
    if (data?.progressEntries) {
      const weightEntries = data.progressEntries
        .filter(e => e.type === 'metrics' && e.weight)
        .map(e => ({
          date: e.date ? new Date(e.date) : new Date(e.timestamp || 0),
          weight: parseFloat(e.weight)
        }))
        .sort((a, b) => a.date - b.date);

      if (weightEntries.length > 0) {
        const firstWeight = weightEntries[0].weight;
        const lastWeight = weightEntries[weightEntries.length - 1].weight;
        weightEvolution = {
          first: firstWeight,
          last: lastWeight,
          change: lastWeight - firstWeight,
          changePercent: ((lastWeight - firstWeight) / firstWeight * 100).toFixed(1)
        };
      }
    }

    return {
      totalPhotos: filteredPhotos.length,
      dateRange: {
        start: first.date,
        end: last.date
      },
      avgOverallScore: Math.round(avgOverallScore),
      weightEvolution,
      totalDays
    };
  }, [filteredPhotos, data?.progressEntries]);

  /**
   * Animation morphing
   */
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const animationIntervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying && filteredPhotos.length > 0) {
      const interval = 2000 / playSpeed; // 2 secondes par photo (ajustable selon speed)
      
      animationIntervalRef.current = setInterval(() => {
        setCurrentAnimationIndex((prev) => {
          if (prev >= filteredPhotos.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, interval);
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isPlaying, playSpeed, filteredPhotos.length]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && currentAnimationIndex >= filteredPhotos.length - 1) {
      setCurrentAnimationIndex(0); // Reset si on relance
    }
  };

  if (filteredPhotos.length === 0) {
    return (
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-teal-100/45" />
          <h3 className="text-xl font-semibold text-teal-100 mb-2">
            Aucune photo analysée disponible
          </h3>
          <p className="text-teal-100/55">
            Lancez des analyses IA sur vos photos pour voir la timeline de progression ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentPhoto = isPlaying ? filteredPhotos[currentAnimationIndex] : filteredPhotos[filteredPhotos.length - 1];

  return (
    <div className="space-y-6">
      {/* Filtres et contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-300" />
            Timeline de Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtre période */}
            <div>
              <label className="block text-sm font-medium text-teal-100/80 mb-2">Période</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-[#0F4C5C]/45 rounded-lg text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/50"
              >
                <option value="all">Toutes</option>
                <option value="3months">3 derniers mois</option>
                <option value="6months">6 derniers mois</option>
                <option value="1year">1 an</option>
              </select>
            </div>

            {/* Filtre qualité */}
            <div>
              <label className="block text-sm font-medium text-teal-100/80 mb-2">
                Qualité min: {minQualityScore}/100
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minQualityScore}
                onChange={(e) => setMinQualityScore(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Orientation timeline */}
            <div>
              <label className="block text-sm font-medium text-teal-100/80 mb-2">Orientation</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={timelineOrientation === 'horizontal' ? 'default' : 'ghost'}
                  onClick={() => setTimelineOrientation('horizontal')}
                >
                  Horizontal
                </Button>
                <Button
                  size="sm"
                  variant={timelineOrientation === 'vertical' ? 'default' : 'ghost'}
                  onClick={() => setTimelineOrientation('vertical')}
                >
                  Vertical
                </Button>
              </div>
            </div>

            {/* Animation contrôles */}
            <div>
              <label className="block text-sm font-medium text-teal-100/80 mb-2">Animation</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={togglePlay}
                  className={isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <select
                  value={playSpeed}
                  onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
                  className="px-2 py-1 bg-black border border-[#0F4C5C]/45 rounded text-teal-100 text-sm"
                  disabled={!isPlaying}
                >
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/15">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Photos analysées</div>
            <div className="text-2xl font-bold text-sky-300">{globalStats.totalPhotos}</div>
            <div className="text-xs text-teal-100/45 mt-1">
              {globalStats.dateRange && (
                <>
                  {formatDate(globalStats.dateRange.start)} → {formatDate(globalStats.dateRange.end)}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/20">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Score moyen</div>
            <div className="text-2xl font-bold text-sky-300/90">{globalStats.avgOverallScore}/100</div>
            <div className="text-xs text-teal-100/45 mt-1">
              {globalStats.totalDays > 0 && `${globalStats.totalDays} jours de suivi`}
            </div>
          </CardContent>
        </Card>

        {globalStats.weightEvolution && (
          <Card className="bg-green-600/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="text-sm text-teal-100/55 mb-1">Évolution poids</div>
              <div className="text-2xl font-bold text-green-400">
                {globalStats.weightEvolution.first} → {globalStats.weightEvolution.last} kg
              </div>
              <div className={`text-xs mt-1 ${
                globalStats.weightEvolution.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {globalStats.weightEvolution.change >= 0 ? '+' : ''}{globalStats.weightEvolution.change} kg 
                ({globalStats.weightEvolution.changePercent}%)
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-orange-600/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-teal-100/55 mb-1">Muscles suivis</div>
            <div className="text-2xl font-bold text-orange-400">{availableMuscles.length}</div>
            <div className="text-xs text-teal-100/45 mt-1">muscles différents</div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline avec miniatures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-300" />
            Timeline Chronologique
            {isPlaying && (
              <span className="text-sm font-normal text-sky-300 ml-auto">
                Lecture: {currentAnimationIndex + 1}/{filteredPhotos.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={timelineRef}
            className={`${timelineOrientation === 'horizontal' ? 'overflow-x-auto' : 'overflow-y-auto max-h-96'} pb-4`}
          >
            <div className={timelineOrientation === 'horizontal' ? 'flex gap-4' : 'space-y-4'}>
              {filteredPhotos.map((photo, index) => {
                const isCurrent = isPlaying ? index === currentAnimationIndex : index === filteredPhotos.length - 1;
                const isActive = isCurrent;

                return (
                  <div
                    key={photo.id}
                    className={`flex-shrink-0 transition-all ${
                      timelineOrientation === 'horizontal' ? 'flex flex-col items-center' : 'flex gap-4 items-center'
                    } ${isActive ? 'scale-110 z-10' : 'opacity-70'}`}
                  >
                    {/* Ligne timeline */}
                    {index < filteredPhotos.length - 1 && (
                      <div
                        className={`${timelineOrientation === 'horizontal' ? 'w-16 h-1' : 'w-1 h-16'} bg-[#0F4C5C]/40 ${
                          isActive ? 'bg-[#0F5C45]' : ''
                        } transition-all`}
                      />
                    )}

                    {/* Miniature photo */}
                    <div
                      className={`relative ${isActive ? 'ring-4 ring-[#0F5C45]/50' : 'ring-2 ring-[#0F4C5C]/50'} rounded-lg overflow-hidden transition-all`}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${formatDate(photo.date)}`}
                        className={`${timelineOrientation === 'horizontal' ? 'w-24 h-32' : 'w-32 h-24'} object-cover`}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-xs text-teal-100 text-center">
                        {formatDate(photo.date)}
                      </div>
                      {photo.analysis?.analyzed && (
                        <div className="absolute top-1 right-1">
                          <Sparkles className="w-4 h-4 text-sky-300" />
                        </div>
                      )}
                    </div>

                    {/* Infos rapides */}
                    <div className={`${timelineOrientation === 'horizontal' ? 'mt-2 text-center' : 'flex-1'} text-xs text-teal-100/55`}>
                      <div>Score: {photo.summary.overallScore || 0}/100</div>
                      {photo.qualityScore > 0 && (
                        <div>Qualité: {photo.qualityScore}/100</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo principale (si animation active) */}
      {isPlaying && currentPhoto && (
        <Card className="bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-sky-300 animate-pulse" />
              Photo Actuelle - {formatDate(currentPhoto.date)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <img
                src={currentPhoto.url}
                alt="Photo actuelle"
                className="w-64 h-96 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-teal-100/55">Score Global</div>
                    <div className="text-2xl font-bold text-sky-300">
                      {currentPhoto.summary.overallScore || 0}/100
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-teal-100/55">Volume Moyen</div>
                    <div className="text-2xl font-bold text-sky-300/90">
                      {currentPhoto.summary.averageScores?.volume || 0}/100
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-teal-100/55">Définition Moyenne</div>
                    <div className="text-2xl font-bold text-green-400">
                      {currentPhoto.summary.averageScores?.definition || 0}/100
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-teal-100/55">Muscles Analysés</div>
                    <div className="text-2xl font-bold text-orange-400">
                      {currentPhoto.summary.musclesAnalyzed || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphique Multi-Muscles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-300/90" />
            Comparaison Multi-Muscles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sélection muscles */}
          {availableMuscles.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-teal-100/80 mb-2">
                Muscles à comparer (max 5)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableMuscles.map(muscle => (
                  <button
                    key={muscle}
                    onClick={() => {
                      setSelectedMuscles(prev => {
                        if (prev.includes(muscle)) {
                          return prev.filter(m => m !== muscle);
                        } else if (prev.length < 5) {
                          return [...prev, muscle];
                        }
                        return prev;
                      });
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      selectedMuscles.includes(muscle)
                        ? 'bg-[#0F4C5C]/50 text-teal-100'
                        : 'bg-black border border-[#0F4C5C]/45 text-teal-100/80 hover:bg-[#0F4C5C]/40'
                    }`}
                  >
                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Graphique */}
          {/* ✅ OPTIMISATION: Lazy rendering - Graphique rendu seulement si visible */}
          <LazyChart height={450} placeholderText="Chargement comparaison multi-muscles...">
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
                {(selectedMuscles.length > 0 ? selectedMuscles : availableMuscles.slice(0, 3)).map((muscle, index) => {
                  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#EF4444', '#F59E0B'];
                  return (
                    <Line
                      key={muscle}
                      type="monotone"
                      dataKey={muscle}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      name={muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                      dot={{ fill: colors[index % colors.length], r: 4 }}
                    />
                  );
                })}
              </LineChart>
              }
              data={multiMuscleData}
              exportFilename="comparaison-multi-muscles"
              showZoom={multiMuscleData.length > 10}
              showExport={true}
            />
          </LazyChart>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotoProgressionTimeline;

