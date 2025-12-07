/**
 * AnalyticsPerformance - Métriques et analytics performance
 * KPIs, tendances, patterns comportementaux
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Target, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const AnalyticsPerformance = ({ listes, budget }) => {
  // Calculs métriques
  const metrics = useMemo(() => {
    const completees = listes.filter(l => l.statut === 'completee');
    
    if (completees.length === 0) {
      return {
        panierMoyen: 0,
        totalDepense: 0,
        economiesMoyennes: 0,
        tauxCompletion: 0,
        articlesParListe: 0,
        budgetRespect: 0
      };
    }
    
    const totalDepense = completees.reduce((sum, l) => {
      return sum + l.articles.reduce((s, a) => s + ((a.prixReel || 0) * a.quantite), 0);
    }, 0);
    
    const panierMoyen = totalDepense / completees.length;
    
    const economiesMoyennes = completees.reduce((sum, l) => {
      const estime = l.articles.reduce((s, a) => s + (a.prixEstime * a.quantite), 0);
      const reel = l.articles.reduce((s, a) => s + ((a.prixReel || a.prixEstime) * a.quantite), 0);
      return sum + (estime - reel);
    }, 0) / completees.length;
    
    const totalArticles = completees.reduce((sum, l) => sum + l.articles.length, 0);
    const articlesAchetes = completees.reduce((sum, l) => {
      return sum + l.articles.filter(a => a.statut === 'achete').length;
    }, 0);
    const tauxCompletion = totalArticles > 0 ? (articlesAchetes / totalArticles) * 100 : 0;
    
    const articlesParListe = totalArticles / completees.length;
    
    const listesRespectBudget = completees.filter(l => {
      const coutReel = l.articles.reduce((s, a) => s + ((a.prixReel || 0) * a.quantite), 0);
      return coutReel <= l.budget;
    }).length;
    const budgetRespect = (listesRespectBudget / completees.length) * 100;
    
    return {
      panierMoyen,
      totalDepense,
      economiesMoyennes,
      tauxCompletion,
      articlesParListe,
      budgetRespect
    };
  }, [listes]);

  // Tendances mensuelles
  const tendances = useMemo(() => {
    const completees = listes.filter(l => l.statut === 'completee');
    const maintenant = Date.now();
    const unMoisAgo = maintenant - (30 * 24 * 60 * 60 * 1000);
    
    const ceMois = completees.filter(l => l.dateCompletion && l.dateCompletion >= unMoisAgo);
    const depenseCeMois = ceMois.reduce((sum, l) => {
      return sum + l.articles.reduce((s, a) => s + ((a.prixReel || 0) * a.quantite), 0);
    }, 0);
    
    return {
      listesCeMois: ceMois.length,
      depenseCeMois,
      moyenneCeMois: ceMois.length > 0 ? depenseCeMois / ceMois.length : 0
    };
  }, [listes]);

  return (
    <div className="analytics-performance space-y-6">
      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Panier Moyen */}
        <div className="group p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl hover:scale-105 transform transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-blue-400 font-bold px-2 py-1 bg-blue-500/20 rounded-lg">
              PANIER MOYEN
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {formatCurrency(metrics.panierMoyen)}
          </div>
          <div className="text-sm text-slate-400">
            Par liste complétée
          </div>
        </div>

        {/* Total Dépensé */}
        <div className="group p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl hover:scale-105 transform transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-purple-400 font-bold px-2 py-1 bg-purple-500/20 rounded-lg">
              TOTAL DÉPENSÉ
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {formatCurrency(metrics.totalDepense)}
          </div>
          <div className="text-sm text-slate-400">
            Toutes listes confondues
          </div>
        </div>

        {/* Économies Moyennes */}
        <div className={`group p-6 bg-gradient-to-br ${
          metrics.economiesMoyennes >= 0 
            ? 'from-green-500/10 to-green-600/10 border-green-500/30' 
            : 'from-red-500/10 to-red-600/10 border-red-500/30'
        } border rounded-xl hover:scale-105 transform transition-all duration-300`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-xl ${
              metrics.economiesMoyennes >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {metrics.economiesMoyennes >= 0 
                ? <TrendingDown className="w-6 h-6 text-green-400" />
                : <TrendingUp className="w-6 h-6 text-red-400" />
              }
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
              metrics.economiesMoyennes >= 0 
                ? 'text-green-400 bg-green-500/20' 
                : 'text-red-400 bg-red-500/20'
            }`}>
              ÉCONOMIES
            </span>
          </div>
          <div className={`text-3xl font-bold mb-2 ${
            metrics.economiesMoyennes >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {metrics.economiesMoyennes >= 0 ? '+' : ''}{formatCurrency(metrics.economiesMoyennes)}
          </div>
          <div className="text-sm text-slate-400">
            Par liste en moyenne
          </div>
        </div>

        {/* Taux Complétion */}
        <div className="group p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl hover:scale-105 transform transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <Target className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-xs text-orange-400 font-bold px-2 py-1 bg-orange-500/20 rounded-lg">
              COMPLÉTION
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {metrics.tauxCompletion.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-400">
            Articles achetés
          </div>
        </div>

        {/* Articles par Liste */}
        <div className="group p-6 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/30 rounded-xl hover:scale-105 transform transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-xs text-cyan-400 font-bold px-2 py-1 bg-cyan-500/20 rounded-lg">
              ARTICLES/LISTE
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {metrics.articlesParListe.toFixed(1)}
          </div>
          <div className="text-sm text-slate-400">
            En moyenne
          </div>
        </div>

        {/* Respect Budget */}
        <div className="group p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl hover:scale-105 transform transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs text-green-400 font-bold px-2 py-1 bg-green-500/20 rounded-lg">
              RESPECT BUDGET
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {metrics.budgetRespect.toFixed(0)}%
          </div>
          <div className="text-sm text-slate-400">
            Des listes
          </div>
        </div>
      </div>

      {/* Tendances ce mois */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-400" />
          Tendances ce mois
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="text-sm text-slate-400 mb-1">Listes complétées</div>
            <div className="text-2xl font-bold text-white">{tendances.listesCeMois}</div>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="text-sm text-slate-400 mb-1">Dépense totale</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(tendances.depenseCeMois)}</div>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="text-sm text-slate-400 mb-1">Moyenne par liste</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(tendances.moyenneCeMois)}</div>
          </div>
        </div>
      </div>

      {/* Message si pas de données */}
      {listes.filter(l => l.statut === 'completee').length === 0 && (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-lg text-slate-400 mb-2">Aucune donnée disponible</div>
          <div className="text-sm text-slate-500">
            Complétez vos premières listes pour voir vos analytics
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPerformance;
