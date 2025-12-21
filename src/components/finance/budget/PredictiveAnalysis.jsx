import React, { useMemo, useCallback, memo } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import VirtualizedExpenseList from './VirtualizedExpenseList';
import { BudgetConfig } from '../../../config/budget.config';

/**
 * ✅ SOLUTION 1.16 : Optimisation Mémoïsation Composants
 * 
 * Composant mémoïsé avec React.memo pour éviter re-renders inutiles
 * Les useMemo internes optimisent déjà les calculs lourds
 */
const PredictiveAnalysis = memo(() => {
  const { budget, depenses, depensesMoisActuel, calculateMetrics } = useBudget();

  const analysis = useMemo(() => {
    if (!budget || depensesMoisActuel.length === 0) return null;

    const metrics = calculateMetrics();
    if (!metrics) return null;

    const joursEcoules = new Date().getDate();
    const joursTotal = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const joursRestants = joursTotal - joursEcoules;

    // Projection fin de mois
    const rythmeActuel = joursEcoules > 0 ? metrics.depenses / joursEcoules : 0;
    const projection = rythmeActuel * joursTotal;
    const ecartProjection = projection - metrics.revenus;

    // Analyse par catégorie
    const categoriesAnalysis = budget.depenses?.categories?.map(categorie => {
      const depensesCategorie = depensesMoisActuel.filter(d => d.categorie === categorie.id);
      const depenseActuelle = depensesCategorie.reduce((sum, d) => sum + d.montant, 0);
      const budgetCategorie = categorie.budgetMensuel || 0;
      const pourcentUtilise = budgetCategorie > 0 ? (depenseActuelle / budgetCategorie) * 100 : 0;
      
      // Projection catégorie
      const rythmeCategorie = joursEcoules > 0 ? depenseActuelle / joursEcoules : 0;
      const projectionCategorie = rythmeCategorie * joursTotal;
      const ecartCategorie = projectionCategorie - budgetCategorie;

      return {
        ...categorie,
        depenseActuelle,
        pourcentUtilise,
        projectionCategorie,
        ecartCategorie,
        statut: pourcentUtilise >= 100 ? 'DEPASSE' : 
                pourcentUtilise >= 80 ? 'ATTENTION' : 
                'OK'
      };
    }) || [];

    // Alertes contextuelles
    const alertes = [];
    
    if (ecartProjection > 0) {
      alertes.push({
        type: 'CRITIQUE',
        message: `Projection : dépassement de ${Math.abs(ecartProjection).toFixed(0)}€ prévu`,
        action: 'Réduire les dépenses'
      });
    }

    categoriesAnalysis.forEach(cat => {
      if (cat.statut === 'DEPASSE') {
        alertes.push({
          type: 'HIGH',
          message: `${cat.nom} : Budget épuisé (${cat.pourcentUtilise.toFixed(0)}%)`,
          action: 'Surveiller cette catégorie'
        });
      } else if (cat.statut === 'ATTENTION') {
        alertes.push({
          type: 'MEDIUM',
          message: `${cat.nom} : ${cat.pourcentUtilise.toFixed(0)}% utilisé`,
          action: 'Attention, proche de la limite'
        });
      }
    });

    // Recommandations
    const recommendations = [];
    
    if (ecartProjection > 0) {
      const reductionNecessaire = ecartProjection / joursRestants;
      recommendations.push({
        type: 'REBALANCE',
        message: `Réduire les dépenses de ${reductionNecessaire.toFixed(0)}€/jour pour équilibrer`,
        priority: 'high'
      });
    }

    // Trouver catégories avec marge pour rééquilibrer
    const categoriesAvecMarge = categoriesAnalysis
      .filter(cat => cat.pourcentUtilise < 70 && cat.budgetMensuel > 0)
      .sort((a, b) => (b.budgetMensuel - b.depenseActuelle) - (a.budgetMensuel - a.depenseActuelle));

    const categoriesDepassees = categoriesAnalysis.filter(cat => cat.statut === 'DEPASSE');
    
    if (categoriesDepassees.length > 0 && categoriesAvecMarge.length > 0) {
      const source = categoriesAvecMarge[0];
      const cible = categoriesDepassees[0];
      const montantTransfert = Math.min(
        cible.ecartCategorie,
        source.budgetMensuel - source.depenseActuelle
      );
      
      if (montantTransfert > 0) {
        recommendations.push({
          type: 'TRANSFER',
          message: `Réduire ${source.nom} de ${montantTransfert.toFixed(0)}€ → Augmenter ${cible.nom}`,
          priority: 'medium'
        });
      }
    }

    return {
      projection,
      ecartProjection,
      joursRestants,
      categoriesAnalysis,
      alertes,
      recommendations
    };
  }, [budget, depensesMoisActuel, depenses, calculateMetrics]);

  if (!analysis) {
    return (
      <div className="predictive-analysis bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Analyse Prédictive</h4>
        <div className="text-center py-8 text-slate-400">
          Aucune donnée disponible pour l'analyse
        </div>
      </div>
    );
  }

  // ✅ OPTIMISATION : Mémoïsation de formatCurrency pour éviter recréation
  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  // ✅ SOLUTION 1.3 : Renderer pour catégories avec formatCurrency mémorisé
  const renderCategoryItem = useCallback((cat, index) => {
    const statutColor = {
      OK: 'text-green-400',
      ATTENTION: 'text-yellow-400',
      DEPASSE: 'text-red-400'
    }[cat.statut] || 'text-slate-400';

    return (
      <div
        key={cat.id}
        className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-white">{cat.nom}</span>
          <span className={`text-sm font-medium ${statutColor}`}>
            {cat.statut}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400">Actuel</div>
            <div className="text-white font-semibold">
              {formatCurrency(cat.depenseActuelle)}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Projection</div>
            <div className={`font-semibold ${
              cat.ecartCategorie > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {formatCurrency(cat.projectionCategorie)}
            </div>
          </div>
        </div>
        <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              cat.pourcentUtilise >= 100 ? 'bg-red-500' :
              cat.pourcentUtilise >= 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(cat.pourcentUtilise, 150)}%` }}
          />
        </div>
      </div>
    );
  }, [formatCurrency]);

  return (
    <div className="predictive-analysis space-y-6">
      <h4 className="text-lg font-semibold text-white">Analyse Prédictive</h4>

      {/* Projection fin de mois */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h5 className="text-md font-semibold text-white mb-4">Projection Fin de Mois</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-400 mb-1">Projection totale</div>
            <div className={`text-2xl font-bold ${
              analysis.ecartProjection > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {formatCurrency(analysis.projection)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">Écart prévu</div>
            <div className={`text-2xl font-bold ${
              analysis.ecartProjection > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {analysis.ecartProjection > 0 ? '+' : ''}{formatCurrency(analysis.ecartProjection)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">Jours restants</div>
            <div className="text-2xl font-bold text-white">
              {analysis.joursRestants}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SOLUTION 1.3 : Alertes avec virtualisation */}
      {analysis.alertes.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Alertes Contextuelles ({analysis.alertes.length})</h5>
          <VirtualizedExpenseList
            items={analysis.alertes}
            renderItem={useCallback((alerte, index) => {
              const colorClass = {
                CRITIQUE: 'bg-red-900/30 border-red-500/50 text-red-400',
                HIGH: 'bg-orange-900/30 border-orange-500/50 text-orange-400',
                MEDIUM: 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400'
              }[alerte.type] || 'bg-slate-700/30 border-slate-600/50 text-slate-300';

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${colorClass}`}
                >
                  <div className="font-semibold mb-1">{alerte.message}</div>
                  <div className="text-sm opacity-80">{alerte.action}</div>
                </div>
              );
            }, [])}
            itemHeight={BudgetConfig.virtualScroll.alertItemHeight}
            height={Math.min(analysis.alertes.length * BudgetConfig.virtualScroll.alertItemHeight, BudgetConfig.virtualScroll.maxContainerHeight)}
            className="space-y-2"
          />
        </div>
      )}

      {/* ✅ SOLUTION 1.3 : Recommandations avec virtualisation */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Recommandations ({analysis.recommendations.length})</h5>
          <VirtualizedExpenseList
            items={analysis.recommendations}
            renderItem={useCallback((rec, index) => (
              <div
                key={index}
                className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 text-blue-300"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div>
                    <div className="font-semibold mb-1">{rec.message}</div>
                    <div className="text-xs opacity-80">
                      Priorité: {rec.priority === 'high' ? 'Haute' : 'Moyenne'}
                    </div>
                  </div>
                </div>
              </div>
            ), [])}
            itemHeight={BudgetConfig.virtualScroll.alertItemHeight}
            height={Math.min(analysis.recommendations.length * BudgetConfig.virtualScroll.alertItemHeight, BudgetConfig.virtualScroll.maxContainerHeight)}
            className="space-y-2"
          />
        </div>
      )}

      {/* ✅ SOLUTION 1.3 : Analyse par catégorie avec virtualisation */}
      {analysis.categoriesAnalysis.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Analyse par Catégorie ({analysis.categoriesAnalysis.length})</h5>
          <VirtualizedExpenseList
            items={analysis.categoriesAnalysis}
            renderItem={renderCategoryItem}
            itemHeight={BudgetConfig.virtualScroll.categoryItemHeight}
            height={Math.min(analysis.categoriesAnalysis.length * BudgetConfig.virtualScroll.categoryItemHeight, BudgetConfig.virtualScroll.maxContainerHeight)}
            className="space-y-3"
          />
        </div>
      )}
    </div>
  );
});

PredictiveAnalysis.displayName = 'PredictiveAnalysis';

export default PredictiveAnalysis;
