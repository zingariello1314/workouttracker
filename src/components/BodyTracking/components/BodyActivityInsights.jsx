/**
 * 🧠 BODY ACTIVITY INSIGHTS
 * 
 * Composant dédié pour afficher les analyses intelligentes :
 * - "Pourquoi j'ai perdu/pris du poids ?"
 * - "Pourquoi j'ai développé du muscle ?"
 * - Interface avec sélecteurs période/type
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Calendar,
  BarChart3,
  Zap,
  Heart,
  AlertCircle,
  CheckCircle,
  Info,
  Flame,
  Award,
  ArrowRight,
  RefreshCw,
  Settings,
  Filter
} from 'lucide-react';
import { useWorkout } from '../../../context/WorkoutContext';
import { useGarminData } from '../../../hooks/useGarminData';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { formatDate } from '../../../utils/dateUtils';
import {
  explainWeightChange,
  explainMuscleDevelopment
} from '../utils/intelligentAnalysis';
import logger from '../../../utils/logger';

const log = logger.component('BodyActivityInsights');

const BodyActivityInsights = () => {
  const { data, getWorkoutHistory } = useWorkout();
  const { loadAllData, dbReady } = useGarminData();
  const [selectedPeriod, setSelectedPeriod] = useState('4weeks');
  const [analysisType, setAnalysisType] = useState('weight'); // 'weight' or 'muscle'
  const [garminData, setGarminData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Charger données Garmin
  useEffect(() => {
    if (dbReady) {
      setIsLoading(true);
      loadAllData()
        .then(loaded => {
          setGarminData(loaded);
          setIsLoading(false);
        })
        .catch(error => {
          log.error('Erreur chargement données Garmin pour BodyActivityInsights', error);
          setGarminData(null);
          setIsLoading(false);
        });
    }
  }, [dbReady, loadAllData]);

  // Calculer dates selon période sélectionnée
  const dateRange = useMemo(() => {
    const periodWeeks = parseInt(selectedPeriod.replace('weeks', '')) || 4;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (periodWeeks * 7));
    return { startDate, endDate };
  }, [selectedPeriod]);

  // Analyse de changement de poids (async)
  const [weightAnalysis, setWeightAnalysis] = useState(null);
  
  useEffect(() => {
    if (analysisType !== 'weight') {
      setWeightAnalysis(null);
      return;
    }
    
    // ✅ CORRIGÉ : Vérifier poids dans les deux types (metrics + impedance)
    // Le poids peut être présent dans type 'metrics' ou type 'impedance'
    const hasWeightData = data?.progressEntries?.some(entry => {
      // Vérifier dans metrics
      if (entry.type === 'metrics' && entry.weight != null && !isNaN(entry.weight) && entry.weight > 0) {
        return true;
      }
      // Vérifier dans impedance aussi (l'impédancemètre mesure aussi le poids)
      if (entry.type === 'impedance' && entry.weight != null && !isNaN(entry.weight) && entry.weight > 0) {
        return true;
      }
      return false;
    });
    
    if (!hasWeightData) {
      setWeightAnalysis(null);
      return;
    }
    
    let cancelled = false;
    
    const analyze = async () => {
      try {
        const workoutHistory = getWorkoutHistory ? getWorkoutHistory() : [];
        const enduranceData = data?.enduranceData || {};
        
        const result = await explainWeightChange(
          dateRange.startDate,
          dateRange.endDate,
          data?.progressEntries || [],
          garminData || {},
          workoutHistory,
          enduranceData
        );
        
        if (!cancelled) {
          setWeightAnalysis(result);
        }
      } catch (error) {
        log.error('Erreur lors de l\'analyse de changement de poids', error);
        if (!cancelled) {
          setWeightAnalysis(null);
        }
      }
    };
    
    analyze();
    
    return () => {
      cancelled = true;
    };
  }, [analysisType, dateRange, data?.progressEntries, data?.enduranceData, garminData, getWorkoutHistory]);

  // Analyse de développement musculaire
  const muscleAnalysis = useMemo(() => {
    if (analysisType !== 'muscle') return null;
    
    try {
      const workoutHistory = getWorkoutHistory ? getWorkoutHistory() : [];
      const enduranceData = data?.enduranceData || {};
      
      return explainMuscleDevelopment(
        dateRange.startDate,
        dateRange.endDate,
        data?.progressEntries || [],
        garminData || {},
        workoutHistory,
        enduranceData
      );
    } catch (error) {
      log.error('Erreur lors de l\'analyse de développement musculaire', error);
      return null;
    }
  }, [analysisType, dateRange, data?.progressEntries, data?.enduranceData, garminData, getWorkoutHistory]);

  const currentAnalysis = analysisType === 'weight' ? weightAnalysis : muscleAnalysis;

  const periods = [
    { value: '1week', label: '1 semaine' },
    { value: '2weeks', label: '2 semaines' },
    { value: '4weeks', label: '4 semaines' },
    { value: '8weeks', label: '8 semaines' },
    { value: '12weeks', label: '12 semaines' }
  ];

  if (isLoading) {
    return (
      <Card variant="sport">
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 text-sky-300/90 mx-auto mb-4 animate-spin" />
          <p className="text-teal-100/80">Chargement des analyses...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentAnalysis) {
    return (
      <Card variant="sport">
        <CardHeader variant="sport">
          <CardTitle tone="sport" className="flex items-center gap-2 normal-case tracking-normal">
            <Brain className="w-5 h-5 text-sky-300/90" />
            Analyses Intelligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="w-12 h-12 text-teal-100/55 mx-auto mb-4" />
            <p className="text-teal-100/80 mb-2">
              {analysisType === 'weight'
                ? 'Pas assez de données pour analyser le changement de poids.'
                : 'Pas assez de données pour analyser le développement musculaire.'}
            </p>
            <p className="text-teal-100/55 text-sm">
              Enregistrez au moins 2 mesures corporelles sur la période sélectionnée.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteurs */}
      <Card className="bg-black border border-[#0F4C5C]/50 border-[#0F4C5C]/35">
        <CardHeader>
          <CardTitle className="text-teal-100 flex items-center gap-2">
            <Brain className="w-5 h-5 text-sky-300/90" />
            Analyses Intelligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-100/55" />
              <label htmlFor="analysisType" className="text-teal-100/80 text-sm">Type d'analyse:</label>
              <select
                id="analysisType"
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="p-2 rounded-md bg-black border border-[#0F4C5C]/45 text-teal-100 text-sm"
              >
                <option value="weight">Pourquoi j'ai perdu/pris du poids ?</option>
                <option value="muscle">Pourquoi j'ai développé du muscle ?</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-100/55" />
              <label htmlFor="period" className="text-teal-100/80 text-sm">Période:</label>
              <select
                id="period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="p-2 rounded-md bg-black border border-[#0F4C5C]/45 text-teal-100 text-sm"
              >
                {periods.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé principal */}
      <Card
        variant="sport"
        className={
          analysisType === 'weight' && currentAnalysis.weightChange.change > 0
            ? 'border-[#0F5C45]/55'
            : analysisType === 'weight' && currentAnalysis.weightChange.change < 0
              ? 'border-sky-400/45'
              : ''
        }
      >
        <CardHeader variant="sport">
          <CardTitle tone="sport" className="flex items-center gap-2 normal-case tracking-normal">
            {analysisType === 'weight' ? (
              currentAnalysis.weightChange.change > 0 ? (
                <TrendingDown className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              )
            ) : (
              <TrendingUp className="w-5 h-5 text-sky-300/90" />
            )}
            {analysisType === 'weight' ? (
              currentAnalysis.weightChange.change > 0 ? 'Perte de poids' : currentAnalysis.weightChange.change < 0 ? 'Prise de poids' : 'Poids stable'
            ) : 'Développement musculaire'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Résumé textuel */}
            <div className="bg-black border border-[#0F4C5C]/40 rounded-lg p-4">
              <p className="text-teal-100/90 leading-relaxed">{currentAnalysis.summary}</p>
            </div>

            {/* Métriques principales */}
            {analysisType === 'weight' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black border border-[#0F4C5C]/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {currentAnalysis.weightChange?.change != null && !isNaN(currentAnalysis.weightChange.change)
                      ? `${currentAnalysis.weightChange.change > 0 ? '-' : '+'}${Math.abs(currentAnalysis.weightChange.change).toFixed(1)} kg`
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-teal-100/55">Changement réel</div>
                </div>
                <div className="bg-black border border-[#0F4C5C]/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-sky-300/90 mb-1">
                    {Math.round(currentAnalysis.calories.avgDailyBurned)} kcal
                  </div>
                  <div className="text-sm text-teal-100/55">Calories/jour (hors basal)</div>
                </div>
                <div className="bg-black border border-[#0F4C5C]/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-sky-300 mb-1">
                    {Math.round(currentAnalysis.calories.totalBurned)}
                  </div>
                  <div className="text-sm text-teal-100/55">Total période</div>
                </div>
                <div className="bg-black border border-[#0F4C5C]/40 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    currentAnalysis.analysis.coherence === 'high' ? 'text-green-400' :
                    currentAnalysis.analysis.coherence === 'medium' ? 'text-yellow-400' : 'text-orange-400'
                  }`}>
                    {currentAnalysis.analysis.coherence === 'high' ? 'Cohérent' :
                     currentAnalysis.analysis.coherence === 'medium' ? 'Partiel' : 'Incohérent'}
                  </div>
                  <div className="text-sm text-teal-100/55">Cohérence</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black border border-[#0F4C5C]/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-sky-300/90 mb-1">
                    {currentAnalysis.muscleChange?.change != null && !isNaN(currentAnalysis.muscleChange.change)
                      ? `+${currentAnalysis.muscleChange.change.toFixed(1)} kg`
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-teal-100/55">Gain musculaire</div>
                </div>
                <div className="bg-black border border-[#0F4C5C]/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-sky-300 mb-1">
                    {Math.round(currentAnalysis.training.weeklyVolume.average)}
                  </div>
                  <div className="text-sm text-teal-100/55">Répétitions/semaine</div>
                </div>
                <div className="bg-black border border-[#0F4C5C]/40 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {currentAnalysis.training?.weeklyVolume?.sessions != null && !isNaN(currentAnalysis.training.weeklyVolume.sessions)
                      ? currentAnalysis.training.weeklyVolume.sessions.toFixed(1)
                      : '0.0'}
                  </div>
                  <div className="text-sm text-teal-100/55">Séances/semaine</div>
                </div>
                <div className="bg-black border border-[#0F4C5C]/40 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    currentAnalysis.recovery.status === 'optimal' ? 'text-green-400' :
                    currentAnalysis.recovery.status === 'good' ? 'text-sky-300/90' : 'text-yellow-400'
                  }`}>
                    {currentAnalysis.recovery.averageScore != null ? Math.round(currentAnalysis.recovery.averageScore) : '—'}
                  </div>
                  <div className="text-sm text-teal-100/55">Récupération (/100)</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Facteurs d'influence */}
      {currentAnalysis.factors && currentAnalysis.factors.length > 0 && (
        <Card variant="sport">
          <CardHeader variant="sport">
            <CardTitle tone="sport" className="flex items-center gap-2 normal-case tracking-normal">
              <BarChart3 className="w-5 h-5 text-sky-300" />
              Facteurs d'influence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentAnalysis.factors.map((factor, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    factor.impact === 'positive' ? 'bg-green-900/20 border border-green-700/30' :
                    factor.impact === 'negative' ? 'bg-red-900/20 border border-red-700/30' :
                    'bg-black border border-[#0F4C5C]/40'
                  }`}
                >
                  {factor.impact === 'positive' ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : factor.impact === 'negative' ? (
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-sky-300/90 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-teal-100/90 font-medium">{factor.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        factor.contribution === 'high' ? 'bg-[#0F4C5C]/35 text-sky-200/90' :
                        factor.contribution === 'medium' ? 'bg-[#0F4C5C]/30 text-sky-300' :
                        'bg-[#0F4C5C]/25 text-teal-100/80'
                      }`}>
                        {factor.contribution === 'high' ? 'Impact élevé' :
                         factor.contribution === 'medium' ? 'Impact moyen' : 'Impact faible'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {currentAnalysis.insights && currentAnalysis.insights.length > 0 && (
        <Card variant="sport">
          <CardHeader variant="sport">
            <CardTitle tone="sport" className="flex items-center gap-2 normal-case tracking-normal">
              <Brain className="w-5 h-5 text-sky-300/90" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentAnalysis.insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-black border border-[#0F4C5C]/45"
                >
                  <Info className="w-5 h-5 text-sky-300/90 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-teal-100/90">{insight.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        insight.confidence === 'high' ? 'bg-green-600/30 text-green-300' :
                        insight.confidence === 'medium' ? 'bg-yellow-600/30 text-yellow-300' :
                        'bg-[#0F4C5C]/25 text-teal-100/80'
                      }`}>
                        {insight.confidence === 'high' ? 'Confiance élevée' :
                         insight.confidence === 'medium' ? 'Confiance moyenne' : 'Confiance faible'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommandations */}
      {currentAnalysis.recommendations && currentAnalysis.recommendations.length > 0 && (
        <Card variant="sport">
          <CardHeader variant="sport">
            <CardTitle tone="sport" className="flex items-center gap-2 normal-case tracking-normal">
              <Target className="w-5 h-5 text-sky-300" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentAnalysis.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    rec.priority === 'high' ? 'border border-[#0F5C45]/50 bg-[#0F4C5C]/20' :
                    'bg-black border border-[#0F4C5C]/40'
                  }`}
                >
                  <ArrowRight className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                    rec.priority === 'high' ? 'text-sky-300' : 'text-sky-300/90'
                  }`} />
                  <p className="text-teal-100/90">{rec.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Détails techniques (optionnel, collapsible) */}
      {analysisType === 'weight' && currentAnalysis.calories.breakdown && (
        <Card variant="sport">
          <CardHeader variant="sport">
            <CardTitle tone="sport" className="flex items-center gap-2 normal-case tracking-normal">
              <Flame className="w-5 h-5 text-sky-300" />
              Détails caloriques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-teal-100/55 mb-1">Garmin</div>
                <div className="text-lg font-semibold text-teal-100">
                  {Math.round(currentAnalysis.calories.breakdown.garmin)} kcal
                </div>
              </div>
              <div>
                <div className="text-sm text-teal-100/55 mb-1">Exercices force</div>
                <div className="text-lg font-semibold text-teal-100">
                  {Math.round(currentAnalysis.calories.breakdown.workouts)} kcal
                </div>
              </div>
              <div>
                <div className="text-sm text-teal-100/55 mb-1">Endurance</div>
                <div className="text-lg font-semibold text-teal-100">
                  {Math.round(currentAnalysis.calories.breakdown.endurance)} kcal
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BodyActivityInsights;

