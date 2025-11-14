/**
 * NutritionHealthScore - Score Santé Globale
 * 
 * Composant pour afficher le score santé global composite
 * avec sous-scores, tendances et recommandations.
 * 
 * @module components/tabs/nutrition/components/NutritionHealthScore
 */

import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Apple,
  Dumbbell,
  Moon,
  Flame,
  Target
} from 'lucide-react';
import { typography } from '../../../../styles/typography';
import { useNutritionHealthScore } from '../../../../hooks/useNutritionHealthScore';

const NutritionHealthScore = () => {
  const { healthScore, loading, error, lastUpdate, refresh } = useNutritionHealthScore({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  });

  if (loading && !healthScore) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Calcul du score santé global en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-12 text-red-400">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p>Erreur lors du calcul du score santé global</p>
          <p className="text-sm text-slate-400 mt-2">{error.message}</p>
          <Button onClick={refresh} variant="secondary" className="mt-4">
            <RefreshCw size={16} className="mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!healthScore) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-12 text-slate-400">
          <Info size={48} className="mx-auto mb-4" />
          <p>Aucune donnée disponible pour calculer le score santé global</p>
          <p className="text-sm text-slate-500 mt-2">
            Enregistrez des repas et des entraînements pour obtenir votre score.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { global, subScores, trends, recommendations } = healthScore;

  // Valider que le score global est un nombre valide
  const safeGlobal = isFinite(global) && !isNaN(global) ? global : 50;

  // Couleur selon score global
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    if (score >= 40) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  // Icônes et labels pour sous-scores
  const subScoreConfig = {
    nutrition: { icon: Apple, label: 'Nutrition', color: 'text-pink-400' },
    workout: { icon: Dumbbell, label: 'Entraînement', color: 'text-blue-400' },
    recovery: { icon: Moon, label: 'Récupération', color: 'text-purple-400' },
    consistency: { icon: Flame, label: 'Consistance', color: 'text-orange-400' },
    balance: { icon: Target, label: 'Équilibre', color: 'text-green-400' }
  };

  // Trend icon
  const TrendIcon = trends.direction === 'up' 
    ? TrendingUp 
    : trends.direction === 'down' 
      ? TrendingDown 
      : Minus;

  const trendColor = trends.direction === 'up'
    ? 'text-green-400'
    : trends.direction === 'down'
      ? 'text-red-400'
      : 'text-slate-400';

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className={`${typography.presets.h2} text-white flex items-center gap-2`}>
          <Activity size={28} className="text-blue-400" /> Score Santé Globale
        </h2>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-slate-500">
              Mis à jour {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button onClick={refresh} variant="ghost" size="sm">
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      {/* Score Global Principal */}
      <Card className={`bg-slate-800/50 border-slate-700 ${getScoreBgColor(safeGlobal)}`}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            {/* Jauge circulaire simplifiée (utilisant barre de progression) */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              {/* Fond cercle */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-700"
                />
                {/* Cercle progression */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - safeGlobal / 100)}`}
                  className={getScoreColor(safeGlobal)}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              {/* Score au centre */}
              <div className="relative z-10 text-center">
                <div className={`text-6xl font-bold ${getScoreColor(safeGlobal)}`}>
                  {safeGlobal}
                </div>
                <div className="text-slate-400 text-sm mt-1">/ 100</div>
              </div>
            </div>

            {/* Label et tendance */}
            <h3 className={`text-2xl font-semibold mb-4 ${getScoreColor(safeGlobal)}`}>
              {safeGlobal >= 80 ? 'Excellent' : safeGlobal >= 60 ? 'Bon' : safeGlobal >= 40 ? 'Moyen' : 'À améliorer'}
            </h3>

            {/* Tendances */}
            {trends && (
              <div className="flex items-center gap-4 text-sm">
                {trends.lastWeek !== 0 && (
                  <div className={`flex items-center gap-1 ${trendColor}`}>
                    <TrendIcon size={16} />
                    <span>
                      {trends.lastWeek > 0 ? '+' : ''}{trends.lastWeek} cette semaine
                    </span>
                  </div>
                )}
                {trends.lastMonth !== 0 && trends.lastMonth !== trends.lastWeek && (
                  <div className={`flex items-center gap-1 ${trendColor}`}>
                    <TrendIcon size={16} />
                    <span>
                      {trends.lastMonth > 0 ? '+' : ''}{trends.lastMonth} ce mois
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sous-Scores */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={20} className="text-blue-400" />
            Détail des Sous-Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(subScores).map(([category, score]) => {
              const config = subScoreConfig[category];
              if (!config) return null;

              const Icon = config.icon;
              const progressPercent = Math.max(0, Math.min(100, score));

              return (
                <div
                  key={category}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className={config.color} />
                      <span className="text-slate-300 font-medium">{config.label}</span>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                      {score}
                    </span>
                  </div>
                  {/* Barre de progression */}
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        score >= 80 ? 'bg-green-500' :
                        score >= 60 ? 'bg-yellow-500' :
                        score >= 40 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      {recommendations && recommendations.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-yellow-400" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    rec.priority === 'high'
                      ? 'bg-red-900/30 border-red-700/50'
                      : 'bg-yellow-900/30 border-yellow-700/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={20}
                      className={rec.priority === 'high' ? 'text-red-400 mt-0.5' : 'text-yellow-400 mt-0.5'}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">
                          {subScoreConfig[rec.category]?.label || rec.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            rec.priority === 'high'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {rec.priority === 'high' ? 'Priorité Haute' : 'Priorité Moyenne'}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{rec.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aucune recommandation si tout va bien */}
      {(!recommendations || recommendations.length === 0) && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="text-center py-8">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
            <p className="text-green-300 font-semibold">Excellent travail !</p>
            <p className="text-slate-400 text-sm mt-2">
              Tous vos sous-scores sont au-dessus de 60/100. Continuez ainsi !
            </p>
          </CardContent>
        </Card>
      )}

      {/* Détails calcul (optionnel, peut être masqué) */}
      {healthScore.breakdown && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-400">
              <Info size={16} />
              Calcul du Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-slate-500">
              {Object.entries(healthScore.breakdown.calculation || {}).map(([category, formula]) => (
                <div key={category} className="flex justify-between">
                  <span className="capitalize">{category}:</span>
                  <span>{formula}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NutritionHealthScore;

