/**
 * NutritionCorrelations - Composant Affichage Corrélations
 * 
 * Affiche les corrélations nutritionnelles calculées :
 * - Coefficient de corrélation (r)
 * - p-value et significativité
 * - Force de la corrélation
 * - Insights et recommandations
 * - Warnings pour petits échantillons
 * 
 * @module components/tabs/nutrition/components/NutritionCorrelations
 */

import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Info, 
  CheckCircle, 
  RefreshCw,
  BarChart3,
  XCircle
} from 'lucide-react';
import { useNutritionCorrelations } from '../../../../hooks/useNutritionCorrelations';

const NutritionCorrelations = () => {
  const {
    correlations,
    metadata,
    loading,
    error,
    lastUpdate,
    refresh,
    hasData,
    hasGarminData,
    getSignificantCorrelations
  } = useNutritionCorrelations({ minDays: 10, maxDays: 90 });

  // Couleur selon force corrélation
  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'strong': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'weak': return 'text-blue-400';
      case 'negligible': return 'text-slate-400';
      case 'non_significant': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  // Badge force
  const getStrengthBadge = (strength) => {
    const badges = {
      strong: { label: 'Forte', color: 'bg-green-500 text-white' },
      moderate: { label: 'Modérée', color: 'bg-yellow-500 text-white' },
      weak: { label: 'Faible', color: 'bg-blue-500 text-white' },
      negligible: { label: 'Négligeable', color: 'bg-slate-500 text-white' },
      non_significant: { label: 'Non significative', color: 'bg-red-500 text-white' }
    };
    return badges[strength] || badges.negligible;
  };

  // Icône direction
  const getDirectionIcon = (direction) => {
    return direction === 'positive' ? 
      <TrendingUp size={16} className="text-green-400" /> : 
      <TrendingDown size={16} className="text-red-400" />;
  };

  // Format coefficient
  const formatCorrelation = (r) => {
    if (r == null || isNaN(r)) return 'N/A';
    return r.toFixed(3);
  };

  // Format p-value
  const formatPValue = (pValue) => {
    if (pValue == null || isNaN(pValue)) return 'N/A';
    if (pValue < 0.001) return '< 0.001';
    return pValue.toFixed(4);
  };

  if (loading && !correlations) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 size={20} className="text-blue-400" /> Corrélations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Analyse en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || metadata.hasError) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle size={20} className="text-red-400" /> Corrélations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400">
            {error?.message || metadata.errorMessage || 'Erreur lors du chargement des corrélations.'}
          </p>
          <Button onClick={refresh} variant="outline" className="mt-4">
            <RefreshCw size={16} className="mr-2" /> Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 size={20} className="text-blue-400" /> Corrélations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info size={48} className="text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg font-medium mb-2">Données insuffisantes</p>
            <p className="text-slate-400 mb-4">
              {metadata.totalDays < 10 
                ? `Seulement ${metadata.totalDays} jours de données (minimum 10 requis)`
                : 'Aucune corrélation disponible. Collectez plus de données nutrition et Garmin.'}
            </p>
            {!hasGarminData && (
              <p className="text-slate-500 text-sm mt-2">
                💡 Connectez Garmin pour analyser les corrélations avec vos performances.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const significantCorrelations = getSignificantCorrelations();
  const allCorrelations = Object.entries(correlations).map(([key, value]) => ({ key, ...value }));

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 size={20} className="text-blue-400" /> Corrélations Nutritionnelles
          </CardTitle>
          <Button
            onClick={refresh}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques globales */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{metadata.correlationsCount}</div>
            <div className="text-xs text-slate-400 mt-1">Corrélations</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{metadata.actionableCount}</div>
            <div className="text-xs text-slate-400 mt-1">Actionnables</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-300">{metadata.totalDays}</div>
            <div className="text-xs text-slate-400 mt-1">Jours analysés</div>
          </div>
        </div>

        {/* Liste des corrélations */}
        {allCorrelations.length === 0 ? (
          <div className="text-center py-8">
            <XCircle size={48} className="text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300">Aucune corrélation disponible</p>
            <p className="text-slate-400 text-sm mt-2">
              Collectez plus de données pour analyser les corrélations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allCorrelations.map((corr) => {
              if (corr.error) {
                return (
                  <div
                    key={corr.key}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-red-400" />
                      <span className="text-red-400 font-medium">
                        {corr.variable1} vs {corr.variable2}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{corr.message || corr.error}</p>
                  </div>
                );
              }

              const strengthBadge = getStrengthBadge(corr.strength);
              const isActionable = corr.actionable;
              const isSignificant = corr.significant;

              return (
                <div
                  key={corr.key}
                  className={`rounded-lg p-4 border transition-all ${
                    isActionable
                      ? 'border-green-500/30 bg-green-500/10'
                      : isSignificant
                      ? 'border-yellow-500/30 bg-yellow-500/10'
                      : 'border-slate-700 bg-slate-900/50'
                  }`}
                >
                  {/* En-tête */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-semibold">
                          {corr.variable1} vs {corr.variable2}
                        </h3>
                        {getDirectionIcon(corr.direction)}
                      </div>
                      <p className="text-slate-400 text-sm">{corr.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-2xl font-bold ${getStrengthColor(corr.strength)}`}>
                        {formatCorrelation(corr.r)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${strengthBadge.color}`}>
                        {strengthBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Métriques statistiques */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-400">p-value</div>
                      <div className="text-sm font-medium text-white">
                        {formatPValue(corr.pValue)}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-400">Échantillon</div>
                      <div className="text-sm font-medium text-white">
                        n = {corr.sampleSize}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-400">Significatif</div>
                      <div className="text-sm font-medium text-white">
                        {isSignificant ? (
                          <CheckCircle size={16} className="text-green-400 inline" />
                        ) : (
                          <XCircle size={16} className="text-red-400 inline" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {corr.warning && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-yellow-400" />
                        <p className="text-yellow-400 text-xs">{corr.warning}</p>
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {corr.insights && corr.insights.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-slate-300 text-sm font-medium mb-2">Insights :</h4>
                      <ul className="space-y-1">
                        {corr.insights.map((insight, idx) => (
                          <li key={idx} className="text-slate-400 text-sm flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommandation */}
                  {corr.recommendation && (
                    <div className={`rounded p-2 ${
                      isActionable 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-slate-800/50 border border-slate-700'
                    }`}>
                      <div className="flex items-start gap-2">
                        {isActionable ? (
                          <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        )}
                        <p className={`text-sm ${
                          isActionable ? 'text-green-300' : 'text-slate-300'
                        }`}>
                          {corr.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Métadonnées */}
        {lastUpdate && (
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {metadata.correlationsCount} corrélation{metadata.correlationsCount > 1 ? 's' : ''} analysée{metadata.correlationsCount > 1 ? 's' : ''}
                {hasGarminData && ' + données Garmin'}
              </span>
              <span>
                Mis à jour {new Date(lastUpdate).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionCorrelations;

