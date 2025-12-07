/**
 * Analytics Phase - Analyse post-achat avec learning automatique
 * Wrapper AnalyticsPerformance + Pattern Learning + Mise à jour profil
 */

import { useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, Brain, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';
import AnalyticsPerformance from './AnalyticsPerformance';
import { smartShoppingStorage } from '../../../services/finance/smartShoppingStorage';

const AnalyticsPhase = ({ liste, workflowState, onFinish }) => {
  // ==========================================================================
  // CALCUL ÉCARTS
  // ==========================================================================

  const ecarts = useMemo(() => {
    if (!liste || !liste.articles) return [];

    return liste.articles
      .filter(a => a.statut === 'achete' || a.statut === 'remplace')
      .map(article => {
        const estime = article.prixEstime * article.quantite;
        const reel = (article.prixReel || article.prixEstime) * article.quantite;
        const ecart = reel - estime;
        const ecartPourcent = estime > 0 ? (ecart / estime) * 100 : 0;

        return {
          articleId: article.id,
          articleNom: article.nom,
          estime,
          reel,
          ecart,
          ecartPourcent,
          significatif: Math.abs(ecartPourcent) > 15
        };
      })
      .sort((a, b) => Math.abs(b.ecartPourcent) - Math.abs(a.ecartPourcent));
  }, [liste]);

  // ==========================================================================
  // PERFORMANCE METRICS
  // ==========================================================================

  const performance = useMemo(() => {
    if (!liste || !workflowState) return null;

    const budgetEstime = workflowState.planning.budgetEstime;
    const budgetReel = workflowState.execution.budgetReel;
    const respectBudget = budgetReel <= liste.budget;
    const economiesRealisees = budgetEstime - budgetReel;

    const articlesOublies = liste.articles
      .filter(a => a.statut === 'a-acheter')
      .map(a => a.nom);

    const tauxCompletion = liste.articles.length > 0
      ? ((liste.articles.length - articlesOublies.length) / liste.articles.length) * 100
      : 0;

    return {
      respectBudget,
      economiesRealisees,
      articlesOublies,
      tauxCompletion,
      budgetEstime,
      budgetReel,
      budgetAlloue: liste.budget
    };
  }, [liste, workflowState]);

  // ==========================================================================
  // PATTERN LEARNING
  // ==========================================================================

  const learnings = useMemo(() => {
    const insights = [];

    // Learning 1: Écarts prix significatifs
    const ecartsSignificatifs = ecarts.filter(e => e.significatif);
    if (ecartsSignificatifs.length > 0) {
      insights.push({
        type: 'prix',
        icon: '💰',
        description: `${ecartsSignificatifs.length} article(s) avec écarts de prix significatifs (>15%)`,
        action: 'Mise à jour des prix estimés pour les futures listes',
        confiance: 90
      });
    }

    // Learning 2: Articles oubliés
    if (performance && performance.articlesOublies.length > 0) {
      insights.push({
        type: 'oublis',
        icon: '📝',
        description: `${performance.articlesOublies.length} article(s) non acheté(s)`,
        action: 'Ajout de rappels pour ces articles dans les futures listes',
        confiance: 85
      });
    }

    // Learning 3: Respect budget
    if (performance) {
      if (performance.respectBudget && performance.economiesRealisees > 0) {
        insights.push({
          type: 'budget',
          icon: '✅',
          description: `Budget respecté avec ${formatCurrency(performance.economiesRealisees)} d'économies`,
          action: 'Profil d\'achat optimisé confirmé',
          confiance: 95
        });
      } else if (!performance.respectBudget) {
        const depassement = performance.budgetReel - performance.budgetAlloue;
        insights.push({
          type: 'budget',
          icon: '⚠️',
          description: `Budget dépassé de ${formatCurrency(depassement)}`,
          action: 'Ajustement des estimations et suggestions d\'alternatives',
          confiance: 90
        });
      }
    }

    // Learning 4: Taux de complétion
    if (performance && performance.tauxCompletion < 80) {
      insights.push({
        type: 'completion',
        icon: '📊',
        description: `Taux de complétion: ${performance.tauxCompletion.toFixed(0)}%`,
        action: 'Optimisation de la liste pour réduire les oublis',
        confiance: 80
      });
    }

    return insights;
  }, [ecarts, performance]);

  // ==========================================================================
  // APPLY LEARNINGS
  // ==========================================================================

  useEffect(() => {
    if (!liste || !ecarts || ecarts.length === 0) return;

    // Mettre à jour les prix estimés pour les écarts significatifs
    ecarts.forEach(ecart => {
      if (ecart.significatif) {
        // Dans une vraie app, mettre à jour la DB des prix
        console.log(`Learning: Mise à jour prix estimé pour ${ecart.articleNom}: ${formatCurrency(ecart.reel / liste.articles.find(a => a.id === ecart.articleId)?.quantite || 1)}`);
      }
    });

    // Sauvegarder les learnings
    const data = smartShoppingStorage.loadData();
    if (!data.learnings) {
      data.learnings = [];
    }
    
    data.learnings.push({
      date: Date.now(),
      listeId: liste.id,
      insights: learnings,
      ecarts: ecarts.filter(e => e.significatif)
    });

    // Garder seulement les 50 derniers learnings
    if (data.learnings.length > 50) {
      data.learnings = data.learnings.slice(-50);
    }

    smartShoppingStorage.saveData(data);
  }, [liste, ecarts, learnings]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!liste || !performance) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Analyse en cours...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-phase space-y-6">
      {/* Performance Summary */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            Analyse de Performance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Budget Estimé vs Réel */}
            <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl">
              <div className="text-sm text-blue-400 mb-2">Budget</div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(performance.budgetReel)}
                </div>
                <div className="text-sm text-slate-400">
                  / {formatCurrency(performance.budgetAlloue)}
                </div>
              </div>
              <div className={`text-xs mt-2 flex items-center gap-1 ${
                performance.respectBudget ? 'text-green-400' : 'text-red-400'
              }`}>
                {performance.respectBudget ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Budget respecté
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Budget dépassé
                  </>
                )}
              </div>
            </div>

            {/* Économies */}
            <div className={`p-5 bg-gradient-to-br rounded-xl border ${
              performance.economiesRealisees >= 0
                ? 'from-green-500/10 to-green-600/10 border-green-500/30'
                : 'from-red-500/10 to-red-600/10 border-red-500/30'
            }`}>
              <div className={`text-sm mb-2 ${
                performance.economiesRealisees >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {performance.economiesRealisees >= 0 ? 'Économies' : 'Dépassement'}
              </div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                performance.economiesRealisees >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {performance.economiesRealisees >= 0 ? (
                  <TrendingDown className="w-6 h-6" />
                ) : (
                  <TrendingUp className="w-6 h-6" />
                )}
                {formatCurrency(Math.abs(performance.economiesRealisees))}
              </div>
              <div className="text-xs text-slate-400 mt-2">
                vs estimation
              </div>
            </div>

            {/* Taux de complétion */}
            <div className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl">
              <div className="text-sm text-purple-400 mb-2">Complétion</div>
              <div className="text-2xl font-bold text-white">
                {performance.tauxCompletion.toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400 mt-2">
                {liste.articles.length - performance.articlesOublies.length} / {liste.articles.length} articles
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Écarts Significatifs */}
      {ecarts.filter(e => e.significatif).length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              Écarts de Prix Significatifs
            </h3>

            <div className="space-y-3">
              {ecarts.filter(e => e.significatif).map(ecart => (
                <div
                  key={ecart.articleId}
                  className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{ecart.articleNom}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        Estimé: {formatCurrency(ecart.estime)} → Réel: {formatCurrency(ecart.reel)}
                      </div>
                    </div>
                    <div className={`text-right ${
                      ecart.ecart > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      <div className="text-lg font-bold flex items-center gap-1">
                        {ecart.ecart > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {ecart.ecart > 0 ? '+' : ''}
                        {formatCurrency(ecart.ecart)}
                      </div>
                      <div className="text-xs">
                        ({ecart.ecart > 0 ? '+' : ''}{ecart.ecartPourcent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Learnings & Insights */}
      {learnings.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Lightbulb className="w-5 h-5 text-blue-400" />
              </div>
              Insights & Apprentissage
            </h3>

            <div className="space-y-3">
              {learnings.map((learning, index) => (
                <div
                  key={index}
                  className="p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{learning.icon}</div>
                    <div className="flex-1">
                      <div className="text-white font-medium mb-2">
                        {learning.description}
                      </div>
                      <div className="text-sm text-slate-400 mb-3">
                        {learning.action}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-blue-400">
                          Confiance: {learning.confiance}%
                        </div>
                        <div className="flex-1 bg-slate-700/50 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${learning.confiance}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Performance Component */}
      <AnalyticsPerformance
        listes={[liste]}
        budget={{
          mensuel: liste.budget,
          depenseCeMois: performance.budgetReel,
          restant: liste.budget - performance.budgetReel
        }}
      />

      {/* Finish Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={onFinish}
          className="group px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-green-500/50 hover:scale-105 transform transition-all duration-300 text-lg"
        >
          <span className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            Terminer l'Analyse
          </span>
        </button>
      </div>
    </div>
  );
};

export default AnalyticsPhase;
