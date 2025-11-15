/**
 * NutritionAnalyses - Analyses Avancées Nutrition
 * 
 * Composant pour les analyses approfondies :
 * - Programme vs Réalité (conformité sur période)
 * - Bilan calorique (calories consommées vs dépensées avec Garmin)
 * - Tendances et statistiques (évolution macros, calories)
 * - Statistiques globales
 * 
 * @module components/tabs/nutrition/components/NutritionAnalyses
 * @see ../../../../../nouvelongletnutritionplan.md
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { DateHelper } from '../../../../utils/dateHelper';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  BarChart3,
  Activity,
  Flame,
  Droplet,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useNutritionData } from '../../../../hooks/useNutritionData';
import { useGarminData } from '../../../../hooks/useGarminData';
import { calculateDailyTotals, calculateProgramCompliance, getNutritionStats } from '../../../../hooks/nutritionCalculations';
import { typography } from '../../../../styles/typography';
import logger from '../../../../utils/logger';
import NutritionRecommendations from './NutritionRecommendations';
import NutritionCorrelations from './NutritionCorrelations';
import NutritionChronobiology from './NutritionChronobiology';
import NutritionHealthScore from './NutritionHealthScore';
import NutritionPredictions from './NutritionPredictions';

const log = logger.component('NutritionAnalyses');

const NutritionAnalyses = ({ nutritionData, garminData }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [chartsReady, setChartsReady] = useState(false); // État pour différer le rendu des graphiques
  // ✅ OPTIMISATION 15 : Préférer prop garminData si fournie (évite duplication initialisation)
  // Note : Hook toujours appelé pour respecter Règles des Hooks, mais prop utilisée en priorité
  const hookGarminData = useGarminData();
  const { dbReady: garminDbReady, loadDataByRange } = garminData || hookGarminData;

  // Attendre que le DOM soit prêt avant de rendre les graphiques
  useEffect(() => {
    // Double requestAnimationFrame pour garantir que le layout CSS est calculé
    // 1er RAF : attendre que le layout soit calculé
    // 2ème RAF : attendre que le paint soit fait
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

  // Périodes disponibles
  const periods = [
    { value: '7days', label: '7 jours', days: 7 },
    { value: '30days', label: '30 jours', days: 30 },
    { value: '90days', label: '90 jours', days: 90 },
    { value: '1year', label: '1 an', days: 365 }
  ];

  // ✅ OPTIMISATION 29-30 : Mémoriser processDataForAnalysis avec useCallback (évite recréation)
  // IMPORTANT : Définir AVANT loadAnalysisData car elle l'utilise
  const processDataForAnalysis = useCallback(async (dailyMeals, program, garminData, startDate, endDate) => {
    // Créer map des données Garmin par date
    const garminMap = new Map();
    if (garminData && Array.isArray(garminData)) {
      garminData.forEach(metric => {
        if (metric.date) {
          garminMap.set(metric.date, metric);
        }
      });
    }

    // Charger tous les meals pour la période en une fois (optimisation)
    const { getMealsByDateRange } = await import('../../../../hooks/nutritionDataCRUD').catch(() => ({ getMealsByDateRange: null }));
    const allMeals = getMealsByDateRange 
      ? await getMealsByDateRange(startDate, endDate)
      : [];
      
      // Créer map des meals par date pour accès rapide
      const mealsByDate = new Map();
      if (allMeals && Array.isArray(allMeals)) {
        allMeals.forEach(meal => {
          if (meal.date) {
            if (!mealsByDate.has(meal.date)) {
              mealsByDate.set(meal.date, []);
            }
            mealsByDate.get(meal.date).push(meal);
          }
        });
      }

      // Traiter chaque jour
      const dailyData = [];
      const stats = {
        totalDays: 0,
        daysWithMeals: 0,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalWater: 0,
        avgCompliance: 0,
        complianceScores: []
      };

      // Parcourir chaque jour de la période
      const start = DateHelper.fromYYYYMMDD(startDate);
      const end = DateHelper.fromYYYYMMDD(endDate);
      const currentDate = new Date(start);

      while (currentDate <= end) {
        // ✅ OPTIMISATION 27-28 : Utiliser DateHelper pour cohérence timezone locale
        const dateStr = DateHelper.toYYYYMMDD(currentDate);
        const dailyMeal = dailyMeals.find(dm => dm.date === dateStr);
        
        // Charger meals pour ce jour depuis la map
        const meals = mealsByDate.get(dateStr) || [];

        // Calculer totaux
        const totals = calculateDailyTotals(meals, program);
        const compliance = calculateProgramCompliance(totals, program);

        // Récupérer données Garmin
        const garminMetric = garminMap.get(dateStr);
        const caloriesBurned = garminMetric?.calories || null;
        const caloricBalance = caloriesBurned ? totals.calories - caloriesBurned : null;

        // Ajouter aux données
        dailyData.push({
          date: dateStr,
          dateLabel: new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          water: totals.waterIntake,
          targetCalories: totals.targetCalories,
          targetProtein: totals.targetProtein,
          targetCarbs: totals.targetCarbs,
          targetFat: totals.targetFat,
          complianceScore: compliance.score,
          complianceCalories: totals.complianceCalories,
          complianceProtein: totals.complianceProtein,
          caloriesBurned,
          caloricBalance,
          hasData: meals.length > 0
        });

        // Accumuler statistiques
        if (meals.length > 0) {
          stats.daysWithMeals++;
          stats.totalCalories += totals.calories;
          stats.totalProtein += totals.protein;
          stats.totalCarbs += totals.carbs;
          stats.totalFat += totals.fat;
          stats.totalWater += totals.waterIntake;
          stats.complianceScores.push(compliance.score);
        }

        stats.totalDays++;
        currentDate.setDate(currentDate.getDate() + 1);
      }

    // Calculer moyennes
    if (stats.daysWithMeals > 0) {
      stats.avgCalories = Math.round(stats.totalCalories / stats.daysWithMeals);
      stats.avgProtein = Math.round((stats.totalProtein / stats.daysWithMeals) * 10) / 10;
      stats.avgCarbs = Math.round((stats.totalCarbs / stats.daysWithMeals) * 10) / 10;
      stats.avgFat = Math.round((stats.totalFat / stats.daysWithMeals) * 10) / 10;
      stats.avgWater = Math.round(stats.totalWater / stats.daysWithMeals);
      stats.avgCompliance = Math.round(
        stats.complianceScores.reduce((a, b) => a + b, 0) / stats.complianceScores.length
      );
    }

    // Calculer tendances (comparaison première vs dernière moitié)
    const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
    const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));
    
    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, d) => sum + (d.calories || 0), 0) / firstHalf.length
      : 0;
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, d) => sum + (d.calories || 0), 0) / secondHalf.length
      : 0;

    const trend = secondHalfAvg > 0 && firstHalfAvg > 0
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
      : 0;

    return {
      dailyData,
      stats,
      trend,
      program,
      hasGarminData: garminMap.size > 0
    };
  }, []); // Pas de dépendances car fonction pure (paramètres passés en arguments)

  // ✅ OPTIMISATION 29-30 : Mémoriser loadAnalysisData avec useCallback (évite recréation et respecte Règles des Hooks)
  const loadAnalysisData = useCallback(async () => {
    try {
      setLoading(true);
      
      const period = periods.find(p => p.value === selectedPeriod) || periods[1];
      // ✅ OPTIMISATION 27-28 : Utiliser DateHelper pour cohérence timezone locale
      const startDateStr = DateHelper.getDaysAgoLocal(period.days);
      const endDateStr = DateHelper.getTodayLocal();

      // Charger dailyMeals pour la période
      const dailyMeals = await nutritionData.getDailyMealsByRange(startDateStr, endDateStr);
      
      // Charger programme actif
      const activeProgram = await nutritionData.getActiveProgram();
      
      // Charger données Garmin si disponible
      let garminData = null;
      if (garminDbReady && loadDataByRange) {
        try {
          const garminDataResult = await loadDataByRange(startDateStr, endDateStr);
          // Extraire dailyMetrics de la réponse (format: { activities, dailyMetrics })
          // dailyMetrics est un objet { [date]: metrics }, convertir en tableau avec date
          if (garminDataResult?.dailyMetrics) {
            garminData = Object.entries(garminDataResult.dailyMetrics).map(([date, metrics]) => ({
              date,
              ...metrics
            }));
          }
        } catch (garminError) {
          // ✅ OPTIMISATION 32 : Logger standardisé pour warnings Garmin
          log.warn('Erreur chargement Garmin', garminError);
        }
      }

      // Traiter données pour graphiques
      const processedData = await processDataForAnalysis(dailyMeals, activeProgram, garminData, startDateStr, endDateStr);

      setAnalysisData(processedData);
    } catch (error) {
      // ✅ OPTIMISATION 33 : Logger standardisé pour erreurs chargement données
      log.error('Erreur chargement données', error);
    } finally {
      setLoading(false);
    }
  }, [nutritionData.dbReady, selectedPeriod, garminDbReady, nutritionData.getDailyMealsByRange, nutritionData.getActiveProgram, loadDataByRange, processDataForAnalysis]);

  // Charger données d'analyse
  useEffect(() => {
    if (nutritionData.dbReady) {
      loadAnalysisData();
    }
  }, [nutritionData.dbReady, loadAnalysisData]);

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}{entry.unit || ''}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // ✅ OPTIMISATION 31 : Mémoriser filtres de dailyData avec useMemo (évite recalcul à chaque rendu)
  // IMPORTANT : Les hooks doivent être appelés AVANT les early returns pour respecter les Règles des Hooks
  const dailyData = analysisData?.dailyData || [];
  const filteredDailyData = useMemo(() => dailyData.filter(d => d.hasData), [dailyData]);
  const filteredDailyDataWithGarmin = useMemo(() => dailyData.filter(d => d.hasData && d.caloriesBurned !== null), [dailyData]);

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Chargement des analyses...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData || analysisData.dailyData.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-12">
          <BarChart3 size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-4">Aucune donnée disponible pour cette période</p>
          <p className="text-slate-500 text-sm">
            Commencez à enregistrer vos repas pour voir les analyses
          </p>
        </CardContent>
      </Card>
    );
  }

  const { stats, trend, program, hasGarminData } = analysisData;

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur période */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${typography.presets.h2} text-white mb-2 flex items-center gap-2`}>
            <BarChart3 size={28} className="text-blue-400" />
            Analyses Avancées
          </h2>
          <p className="text-slate-400">
            Analysez vos habitudes nutritionnelles et votre conformité au programme
          </p>
        </div>
        <div className="flex gap-2">
          {periods.map((period) => (
            <Button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              variant={selectedPeriod === period.value ? 'default' : 'ghost'}
              size="sm"
              className={selectedPeriod === period.value 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'text-slate-300 hover:text-white'
              }
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Recommandations personnalisées */}
      <NutritionRecommendations />

      {/* Corrélations nutritionnelles */}
      <NutritionCorrelations />

      {/* Chronobiologie (Timing Optimal) */}
      <NutritionChronobiology />

      {/* Score Santé Globale */}
      <NutritionHealthScore />

      {/* Prédictions Offline (ML) */}
      <NutritionPredictions />

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Calories moyennes</span>
              <Flame size={18} className="text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.avgCalories || 0}
              <span className="text-sm text-slate-400 ml-1">kcal</span>
            </div>
            {program && (
              <div className="text-xs text-slate-500 mt-1">
                Cible: {program.targetCalories} kcal
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Conformité moyenne</span>
              <Target size={18} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.avgCompliance || 0}
              <span className="text-sm text-slate-400 ml-1">%</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.daysWithMeals} jour{stats.daysWithMeals > 1 ? 's' : ''} avec données
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Protéines moyennes</span>
              <Activity size={18} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.avgProtein || 0}
              <span className="text-sm text-slate-400 ml-1">g</span>
            </div>
            {program && (
              <div className="text-xs text-slate-500 mt-1">
                Cible: {program.targetProtein} g
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Eau moyenne</span>
              <Droplet size={18} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.avgWater ? Math.round(stats.avgWater / 100) / 10 : 0}
              <span className="text-sm text-slate-400 ml-1">L</span>
            </div>
            {program && program.targetWater && (
              <div className="text-xs text-slate-500 mt-1">
                Cible: {Math.round(program.targetWater / 100) / 10} L
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphique Conformité Programme */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={20} className="text-blue-400" />
            Conformité au Programme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: '320px' }}>
            {chartsReady ? (
              <ResponsiveContainer width="100%" height={320} minHeight={320}>
                <ComposedChart data={filteredDailyData}>
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
                  yAxisId="left"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  label={{ value: 'Calories', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  label={{ value: 'Conformité (%)', angle: 90, position: 'insideRight', fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="calories" 
                  fill="#F59E0B" 
                  name="Calories consommées"
                  opacity={0.7}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="targetCalories" 
                  stroke="#3B82F6" 
                  strokeDasharray="5 5"
                  name="Cible calories"
                  dot={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="complianceScore" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Conformité (%)"
                  dot={{ r: 4 }}
                />
                <ReferenceLine 
                  yAxisId="right"
                  y={80} 
                  stroke="#EF4444" 
                  strokeDasharray="3 3"
                  label={{ value: 'Seuil 80%', position: 'right', fill: '#EF4444' }}
                />
              </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Graphique Bilan Calorique (si Garmin disponible) */}
      {hasGarminData && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={20} className="text-green-400" />
              Bilan Calorique (avec Garmin)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: '320px' }}>
              {chartsReady ? (
                <ResponsiveContainer width="100%" height={320} minHeight={320}>
                  <ComposedChart data={filteredDailyDataWithGarmin}>
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
                    label={{ value: 'Calories', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="calories" 
                    fill="#F59E0B" 
                    name="Calories consommées"
                    opacity={0.7}
                  />
                  <Bar 
                    dataKey="caloriesBurned" 
                    fill="#EF4444" 
                    name="Calories dépensées"
                    opacity={0.7}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="caloricBalance" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Bilan (consommé - dépensé)"
                    dot={{ r: 4 }}
                  />
                  <ReferenceLine 
                    y={0} 
                    stroke="#9CA3AF" 
                    strokeDasharray="3 3"
                  />
                </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-400 mt-0.5" />
                <p className="text-blue-300 text-sm">
                  Le bilan calorique est calculé à partir des calories consommées (nutrition) 
                  moins les calories dépensées (Garmin). Un bilan positif indique un surplus, 
                  un bilan négatif indique un déficit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphique Évolution Macros */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-400" />
            Évolution des Macros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: '320px' }}>
            {chartsReady ? (
              <ResponsiveContainer width="100%" height={320} minHeight={320}>
                <AreaChart data={filteredDailyData}>
                <defs>
                  <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCarbs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                  label={{ value: 'Grammes', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="protein" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="url(#colorProtein)" 
                  name="Protéines (g)"
                />
                <Area 
                  type="monotone" 
                  dataKey="carbs" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="url(#colorCarbs)" 
                  name="Glucides (g)"
                />
                <Area 
                  type="monotone" 
                  dataKey="fat" 
                  stackId="1"
                  stroke="#F59E0B" 
                  fill="url(#colorFat)" 
                  name="Lipides (g)"
                />
              </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tendances */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {trend >= 0 ? (
              <TrendingUp size={20} className="text-green-400" />
            ) : (
              <TrendingDown size={20} className="text-red-400" />
            )}
            Tendances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-slate-400 text-sm mb-1">Évolution calories</div>
                <div className="text-2xl font-bold text-white">
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Comparaison première vs dernière moitié de période
                </div>
              </div>
              {trend >= 0 ? (
                <TrendingUp size={32} className="text-green-400" />
              ) : (
                <TrendingDown size={32} className="text-red-400" />
              )}
            </div>

            {program && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-400 mt-0.5" />
                  <div>
                    <div className="text-blue-300 font-medium mb-1">Programme actif</div>
                    <div className="text-blue-200 text-sm">
                      {program.name} - Objectif: {program.goal === 'bulk' ? 'Prise de masse' : 
                        program.goal === 'cut' ? 'Sèche' : 
                        program.goal === 'recomp' ? 'Recomposition' : 'Maintien'}
                    </div>
                    <div className="text-blue-200 text-sm mt-1">
                      Cibles: {program.targetCalories} kcal, {program.targetProtein}g protéines, 
                      {program.targetCarbs}g glucides, {program.targetFat}g lipides
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NutritionAnalyses;
