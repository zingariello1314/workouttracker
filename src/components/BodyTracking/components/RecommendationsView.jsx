/**
 * Vue Recommandations IA
 * 
 * Affiche recommandations personnalisées basées sur:
 * - Corrélations entraînement/métriques
 * - Progression/stagnation
 * - Problèmes de symétrie
 * - Qualité photos
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Section 7 (Recommandations)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader,
  Info,
  Zap,
  ArrowRight,
  Award
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { generateRecommendations } from '../services/recommendationsEngine';
import logger from '../../../utils/logger';

const log = logger.component('RecommendationsView');

/**
 * Obtient icône selon type recommandation
 */
const getRecommendationIcon = (type) => {
  switch (type) {
    case 'increase_volume':
    case 'optimize_volume':
      return <TrendingUp className="w-5 h-5 text-green-400" />;
    case 'maintain':
      return <CheckCircle className="w-5 h-5 text-blue-400" />;
    case 'optimize':
    case 'optimize_no_correlation':
      return <Zap className="w-5 h-5 text-yellow-400" />;
    case 'regression':
      return <AlertTriangle className="w-5 h-5 text-red-400" />;
    case 'symmetry':
      return <Target className="w-5 h-5 text-purple-400" />;
    case 'diversify':
      return <Award className="w-5 h-5 text-orange-400" />;
    case 'photo_quality':
      return <Info className="w-5 h-5 text-slate-400" />;
    default:
      return <Lightbulb className="w-5 h-5 text-blue-400" />;
  }
};

/**
 * Obtient couleur selon priorité
 */
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500/20 border-red-500/50 text-red-400';
    case 'medium':
      return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
    case 'low':
      return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    default:
      return 'bg-slate-500/20 border-slate-500/50 text-slate-400';
  }
};

/**
 * Obtient label priorité
 */
const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'high':
      return 'Priorité Haute';
    case 'medium':
      return 'Priorité Moyenne';
    case 'low':
      return 'Priorité Basse';
    default:
      return 'Priorité';
  }
};

const RecommendationsView = ({
  photos = [],
  workoutHistory = [],
  muscle = null // Si spécifié, filtre recommandations pour ce muscle
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRecommendations, setExpandedRecommendations] = useState(new Set());
  const [filterPriority, setFilterPriority] = useState('all'); // 'all', 'high', 'medium', 'low'

  /**
   * Génère recommandations
   */
  useEffect(() => {
    if (!photos || photos.length < 3) {
      setRecommendationsData(null);
      setError({
        type: 'insufficient_photos',
        message: 'Minimum 3 photos analysées nécessaires pour recommandations'
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    generateRecommendations(photos, workoutHistory)
      .then(result => {
        if (result.error) {
          setError({
            type: result.error,
            message: result.message || 'Erreur lors de la génération des recommandations'
          });
          setIsLoading(false);
          return;
        }

        // Filtrer par muscle si spécifié
        let filteredRecs = result.recommendations;
        if (muscle) {
          filteredRecs = result.recommendations.filter(rec => rec.muscle === muscle);
        }

        setRecommendationsData({
          ...result,
          recommendations: filteredRecs
        });
        setIsLoading(false);
      })
      .catch(err => {
        log.error('Erreur génération recommandations', err);
        setError({
          type: 'generation_error',
          message: err.message || 'Erreur lors de la génération des recommandations'
        });
        setIsLoading(false);
      });
  }, [photos, workoutHistory, muscle]);

  /**
   * Toggle expansion recommandation
   */
  const toggleExpansion = (index) => {
    setExpandedRecommendations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  /**
   * Filtre recommandations par priorité
   */
  const filteredRecommendations = useMemo(() => {
    if (!recommendationsData || !recommendationsData.recommendations) {
      return [];
    }

    if (filterPriority === 'all') {
      return recommendationsData.recommendations;
    }

    return recommendationsData.recommendations.filter(rec => rec.priority === filterPriority);
  }, [recommendationsData, filterPriority]);

  // États insuffisants
  if (!photos || photos.length < 3) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-12 text-center">
          <Lightbulb className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Données insuffisantes
          </h3>
          <p className="text-slate-400">
            Minimum 3 photos analysées nécessaires pour générer des recommandations personnalisées.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-12 text-center">
          <Loader className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-spin" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Génération des recommandations...
          </h3>
          <p className="text-slate-400">
            Analyse de {photos.length} photos et calcul des corrélations...
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
          <h3 className="text-xl font-semibold text-white mb-2">Erreur</h3>
          <p className="text-slate-400">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendationsData || !recommendationsData.recommendations || recommendationsData.recommendations.length === 0) {
    return (
      <Card className="bg-green-600/10 border-green-500/30">
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Programme Optimal !
          </h3>
          <p className="text-slate-400 mb-4">
            {muscle 
              ? `Aucune recommandation spécifique pour ${muscle}. Continue comme ça !`
              : 'Ton programme est bien équilibré. Continue comme ça !'
            }
          </p>
          {recommendationsData?.dataQuality && (
            <div className="text-sm text-slate-500 mt-4">
              Analyse basée sur: {recommendationsData.dataQuality.hasCorrelations ? 'Corrélations' : ''} 
              {recommendationsData.dataQuality.hasGains ? ' • Progression' : ''}
              {recommendationsData.dataQuality.hasSymmetryIssues ? ' • Symétrie' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques recommandations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-purple-600/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-1">Total recommandations</div>
            <div className="text-2xl font-bold text-purple-400">
              {recommendationsData.summary.total}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {muscle ? `pour ${muscle}` : 'toutes priorités'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-600/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-1">Priorité haute</div>
            <div className="text-2xl font-bold text-red-400">
              {recommendationsData.summary.high}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              à traiter en priorité
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-600/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-1">Priorité moyenne</div>
            <div className="text-2xl font-bold text-yellow-400">
              {recommendationsData.summary.medium}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              à considérer
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-600/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-1">Priorité basse</div>
            <div className="text-2xl font-bold text-blue-400">
              {recommendationsData.summary.low}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              optimisations optionnelles
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Recommandations IA Personnalisées
            {muscle && (
              <span className="text-sm font-normal text-slate-400">
                - {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Filtrer par priorité
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filterPriority === 'all' ? 'default' : 'ghost'}
                onClick={() => setFilterPriority('all')}
              >
                Toutes ({recommendationsData.summary.total})
              </Button>
              <Button
                size="sm"
                variant={filterPriority === 'high' ? 'default' : 'ghost'}
                onClick={() => setFilterPriority('high')}
                className={filterPriority === 'high' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Haute ({recommendationsData.summary.high})
              </Button>
              <Button
                size="sm"
                variant={filterPriority === 'medium' ? 'default' : 'ghost'}
                onClick={() => setFilterPriority('medium')}
                className={filterPriority === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                Moyenne ({recommendationsData.summary.medium})
              </Button>
              <Button
                size="sm"
                variant={filterPriority === 'low' ? 'default' : 'ghost'}
                onClick={() => setFilterPriority('low')}
                className={filterPriority === 'low' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Basse ({recommendationsData.summary.low})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste recommandations */}
      <div className="space-y-4">
        {filteredRecommendations.map((rec, index) => {
          const isExpanded = expandedRecommendations.has(index);

          return (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:border-opacity-100 ${
                rec.priority === 'high' ? 'border-red-500/50 bg-red-600/5' :
                rec.priority === 'medium' ? 'border-yellow-500/50 bg-yellow-600/5' :
                'border-blue-500/50 bg-blue-600/5'
              }`}
              onClick={() => toggleExpansion(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className="flex-shrink-0 mt-1">
                    {getRecommendationIcon(rec.type)}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{rec.title}</h4>
                        <p className="text-sm text-slate-300">{rec.message}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                        {getPriorityLabel(rec.priority)}
                      </span>
                    </div>

                    {/* Action recommandée */}
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border-l-2 border-purple-500">
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs font-medium text-slate-400 mb-1">Action recommandée:</div>
                          <div className="text-sm text-white font-medium">{rec.action}</div>
                        </div>
                      </div>
                    </div>

                    {/* Détails supplémentaires (si expanded) */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                        {rec.exercise && (
                          <div className="text-xs text-slate-400">
                            <span className="font-medium">Exercice:</span> {rec.exercise}
                          </div>
                        )}
                        {rec.correlation !== undefined && (
                          <div className="text-xs text-slate-400">
                            <span className="font-medium">Corrélation:</span> {rec.correlation.toFixed(3)}
                          </div>
                        )}
                        {rec.currentVolume !== undefined && rec.targetVolume && (
                          <div className="text-xs text-slate-400">
                            <span className="font-medium">Volume:</span> {rec.currentVolume.toFixed(0)} → {rec.targetVolume} reps/semaine
                          </div>
                        )}
                        {rec.confidence && (
                          <div className="text-xs text-slate-400">
                            <span className="font-medium">Confiance:</span> {rec.confidence === 'high' ? 'Élevée' : rec.confidence === 'medium' ? 'Moyenne' : 'Faible'}
                          </div>
                        )}
                        {rec.muscle && (
                          <div className="text-xs text-slate-400">
                            <span className="font-medium">Muscle:</span> {rec.muscle.charAt(0).toUpperCase() + rec.muscle.slice(1)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Note qualité données */}
      {recommendationsData?.dataQuality && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-400">
                <span className="font-medium">Analyse basée sur:</span>{' '}
                {recommendationsData.dataQuality.hasCorrelations && 'Corrélations entraînement'}
                {recommendationsData.dataQuality.hasCorrelations && recommendationsData.dataQuality.hasGains && ' • '}
                {recommendationsData.dataQuality.hasGains && 'Progression temporelle'}
                {recommendationsData.dataQuality.hasSymmetryIssues && ' • Détection asymétries'}
                {recommendationsData.dataQuality.qualityAnalyzed && ' • Qualité photos'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendationsView;

