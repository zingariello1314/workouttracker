/**
 * NutritionRecommendations - Composant Affichage Recommandations
 * 
 * Affiche les recommandations nutritionnelles générées par le système expert :
 * - Recommandations triées par priorité
 * - Résumé global
 * - Badges de catégorie
 * - Actions de rafraîchissement
 * 
 * @module components/tabs/nutrition/components/NutritionRecommendations
 */

import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  Droplet,
  Clock,
  Apple,
  Target
} from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useNutritionRecommendations } from '../../../../hooks/useNutritionRecommendations';

// ✅ OPTIMISATION 2.5 : React.memo pour éviter re-renders inutiles (50-80% réduction)
const NutritionRecommendations = React.memo(() => {
  const t = useTranslation();
  const {
    recommendations,
    summary,
    loading,
    error,
    lastUpdate,
    refresh,
    hasRecommendations,
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    dataQuality
  } = useNutritionRecommendations({ autoRefresh: true });

  // Icônes par catégorie
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'protein': return <Target size={16} className="text-orange-400" />;
      case 'calories': return <TrendingUp size={16} className="text-red-400" />;
      case 'hydration': return <Droplet size={16} className="text-blue-400" />;
      case 'timing': return <Clock size={16} className="text-purple-400" />;
      case 'macros': return <Apple size={16} className="text-green-400" />;
      case 'variety': return <Apple size={16} className="text-yellow-400" />;
      case 'consistency': return <CheckCircle size={16} className="text-indigo-400" />;
      default: return <Info size={16} className="text-slate-400" />;
    }
  };

  // Couleurs par priorité
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-500/10';
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'low': return 'border-blue-500/30 bg-blue-500/10';
      default: return 'border-slate-500/30 bg-slate-500/10';
    }
  };

  // Badge priorité
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return { label: 'Critique', color: 'bg-red-500 text-white' };
      case 'medium': return { label: 'Important', color: 'bg-yellow-500 text-white' };
      case 'low': return { label: 'Optimisation', color: 'bg-blue-500 text-white' };
      default: return { label: 'Info', color: 'bg-slate-500 text-white' };
    }
  };

  // Badge catégorie
  const getCategoryLabel = (category) => {
    const labels = {
      protein: 'Protéines',
      calories: 'Calories',
      hydration: 'Hydratation',
      timing: 'Timing',
      macros: 'Macros',
      variety: 'Variété',
      consistency: 'Régularité'
    };
    return labels[category] || category;
  };

  if (loading && !recommendations) {
    return (
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lightbulb size={20} className="text-yellow-400" /> Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Analyse en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle size={20} className="text-red-400" /> Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400">Erreur lors du chargement des recommandations.</p>
          <button
            type="button"
            onClick={refresh}
            className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg mt-4 flex items-center gap-2"
          >
            <RefreshCw size={16} /> Réessayer
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="sport">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Lightbulb size={20} className="text-yellow-400" /> {t('nutritionAnalyses.recommendations.title')}
          </CardTitle>
          <Button
            onClick={refresh}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('nutritionAnalyses.recommendations.refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-300 leading-relaxed">{summary}</p>
        </div>

        {/* Statistiques rapides */}
        {hasRecommendations && (
          <div className="grid grid-cols-3 gap-3">
            {highPriorityCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{highPriorityCount}</div>
                <div className="text-xs text-slate-400 mt-1">Critique{highPriorityCount > 1 ? 's' : ''}</div>
              </div>
            )}
            {mediumPriorityCount > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{mediumPriorityCount}</div>
                <div className="text-xs text-slate-400 mt-1">Important{mediumPriorityCount > 1 ? 's' : ''}</div>
              </div>
            )}
            {lowPriorityCount > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{lowPriorityCount}</div>
                <div className="text-xs text-slate-400 mt-1">Optimisation{lowPriorityCount > 1 ? 's' : ''}</div>
              </div>
            )}
          </div>
        )}

        {/* Liste des recommandations */}
        {!hasRecommendations ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg font-medium mb-2">Excellent travail !</p>
            <p className="text-slate-400">Votre nutrition est équilibrée. Continuez ainsi !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const priorityBadge = getPriorityBadge(rec.priority);
              
              return (
                <div
                  key={rec.id || index}
                  className={`rounded-lg p-4 border ${getPriorityColor(rec.priority)} transition-all hover:shadow-lg`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône catégorie */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getCategoryIcon(rec.category)}
                    </div>
                    
                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${priorityBadge.color}`}>
                          {priorityBadge.label}
                        </span>
                        <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-700/50">
                          {getCategoryLabel(rec.category)}
                        </span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{rec.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Métadonnées qualité données */}
        {dataQuality && (
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Analyse basée sur {dataQuality.daysAnalyzed} jour{dataQuality.daysAnalyzed > 1 ? 's' : ''}
                {dataQuality.hasGarminData && ' + données Garmin'}
                {dataQuality.hasActiveProgram && ' + programme actif'}
              </span>
              {lastUpdate && (
                <span>
                  Mis à jour {new Date(lastUpdate).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

NutritionRecommendations.displayName = 'NutritionRecommendations';

export default NutritionRecommendations;

