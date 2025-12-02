import React, { useState } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useFinance } from '../../../hooks/useFinance';
import PortfolioTable from './PortfolioTable';
import AddPositionForm from './AddPositionForm';
import PortfolioSummary from './PortfolioSummary';
import PortfolioChart from './PortfolioChart';
import StockCard from './StockCard';
import RecommendationsPanel from './RecommendationsPanel';
import AlertsPanel from './AlertsPanel';
import ExportCSV from './ExportCSV';
import { PortfolioTableSkeleton, SummarySkeleton, ChartSkeleton } from './SkeletonLoader';

const BourseSubTab = () => {
  const t = useTranslation();
  const { portfolio, loading, error } = useFinance();
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'cards'

  if (loading) {
    return (
      <div className="bourse-sub-tab space-y-6">
        <SummarySkeleton />
        <PortfolioTableSkeleton />
      </div>
    );
  }

  if (error) {
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
    <div className="bourse-sub-tab space-y-6">
      {/* Header avec bouton ajouter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t('finance.subTabs.bourse')}
          </h2>
          <p className="text-slate-400">
            {portfolio.length} position{portfolio.length > 1 ? 's' : ''} dans votre portfolio
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>Ajouter une position</span>
        </button>
      </div>

      {/* Formulaire ajout position */}
      {showAddForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <AddPositionForm onClose={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Résumé portfolio */}
      {portfolio.length > 0 && (
        <PortfolioSummary portfolio={portfolio} />
      )}

      {/* Alertes */}
      {portfolio.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <AlertsPanel />
        </div>
      )}

      {/* Recommandations IA */}
      {portfolio.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <RecommendationsPanel />
        </div>
      )}

      {/* Graphiques portfolio */}
      {portfolio.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <PortfolioChart portfolio={portfolio} />
        </div>
      )}

      {/* Sélecteur vue */}
      {portfolio.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            📊 Tableau
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            🃏 Cartes
          </button>
        </div>
      )}

      {/* Tableau ou Cartes portfolio */}
      {portfolio.length > 0 ? (
        viewMode === 'table' ? (
          <PortfolioTable portfolio={portfolio} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolio.map((position) => (
              <StockCard key={position.id} position={position} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Portfolio vide
          </h3>
          <p className="text-slate-400 mb-6">
            Commencez par ajouter votre première position boursière
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Ajouter une position
          </button>
        </div>
      )}
    </div>
  );
};

export default BourseSubTab;
