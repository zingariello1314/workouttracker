import React from 'react';
import { useTranslation } from '../../../utils/translations';
import { useBudget } from '../../../hooks/useBudget';
import DashboardMetrics from './DashboardMetrics';
import BudgetCharts from './BudgetCharts';
import PredictiveAnalysis from './PredictiveAnalysis';
import DisciplineScore from './DisciplineScore';
import GamificationScore from './GamificationScore';
import AIRecommendations from './AIRecommendations';

const DashboardSubTab = () => {
  const t = useTranslation();
  const { loading, error, warnings, budget } = useBudget();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement du budget...</p>
        </div>
      </div>
    );
  }

  // ✅ SOLUTION 1.4 : Ne bloquer que si erreur critique ET pas de données du tout
  // Les warnings permettent de continuer avec données par défaut
  if (error && !budget) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-900/20 border border-red-500/50 rounded-lg p-6">
          <p className="text-red-400 font-semibold mb-2">Erreur de chargement</p>
          <p className="text-slate-400 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-sub-tab space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Dashboard Global</h3>
        {/* ✅ SOLUTION 1.4 : Afficher warnings si présents */}
        {warnings && warnings.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3">
            <div className="text-yellow-400 text-sm font-semibold mb-1">
              ⚠️ Avertissements ({warnings.length})
            </div>
            <div className="text-xs text-yellow-300">
              {warnings.map((w, i) => (
                <div key={i}>{w.type}: {w.error} (données par défaut utilisées)</div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Métriques clés */}
      <DashboardMetrics />
      
      {/* Graphiques */}
      <BudgetCharts />
      
      {/* Analyse prédictive */}
      <PredictiveAnalysis />
      
      {/* Score discipline */}
      <DisciplineScore />
      
      {/* Gamification */}
      <GamificationScore />

      {/* Recommandations IA */}
      <AIRecommendations />
    </div>
  );
};

export default DashboardSubTab;

