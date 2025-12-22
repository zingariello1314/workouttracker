/**
 * Synthèse Financière - Dashboard consolidé
 * Vue d'ensemble patrimoine avec métriques temps réel
 */

import { useState } from 'react';
import { useSynthese } from '../../../hooks/useSynthese';
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertTriangle, BarChart3, LineChart as LineChartIcon, Table, Calculator, Edit, TrendingUpIcon, Settings, Bell, Target, Activity } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';
import TheorieReeliteCharts from './TheorieReeliteCharts';
import DashboardNetWorth from './DashboardNetWorth';
import PerformanceTable from './PerformanceTable';
import NetWorthDetails from './NetWorthDetails';
import UpdateQuantities from './UpdateQuantities';
import Projections from './Projections';
import ProjectionSettings from './ProjectionSettings';
import AllocationAlerts from './AllocationAlerts';
import RebalancingSuggestions from './RebalancingSuggestions';
import TrendsAnalysis from './TrendsAnalysis';

const SyntheseTab = () => {
  const {
    patrimoine,
    projections,
    planEpargne,
    historique,
    alertes,
    loading,
    error,
    updatePatrimoine,
    updateProjections,
    updatePlanEpargne,
    refreshData
  } = useSynthese();

  const [activeSection, setActiveSection] = useState('metriques');
  const [projectionDuree, setProjectionDuree] = useState(5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Chargement de la synthèse...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-400 mb-4">Erreur: {error}</div>
          <button
            type="button"
            onClick={refreshData}
            className="gradient-button-premium gradient-button-premium-md rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="synthese-tab space-y-6">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-purple-600/20 border border-purple-500/30 p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-400/30">
                <PieChart className="w-7 h-7 text-purple-400" />
              </div>
              Synthèse Financière
            </h2>
            <p className="text-slate-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Vue d'ensemble de votre patrimoine en temps réel
            </p>
          </div>
          <button
            type="button"
            onClick={refreshData}
            className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2"
            aria-label="Rafraîchir les données"
          >
            <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Alertes avec design amélioré */}
      {alertes && alertes.length > 0 && (
        <div className="space-y-3">
          {alertes.map((alerte, index) => {
            const colors = {
              error: 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/50 text-red-400 shadow-red-500/20',
              warning: 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50 text-yellow-400 shadow-yellow-500/20',
              info: 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/50 text-blue-400 shadow-blue-500/20'
            };

            return (
              <div
                key={index}
                className={`group p-5 rounded-xl border-2 ${colors[alerte.priorite]} hover:scale-[1.02] transition-all duration-300 shadow-lg backdrop-blur-sm`}
                role="alert"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl" aria-hidden="true">{alerte.icon}</span>
                  </div>
                  <span className="font-semibold text-base">{alerte.message}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Métriques Principales avec animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Or */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50 rounded-2xl p-6 hover:border-yellow-400 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 hover:scale-105 transform cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-600/0 group-hover:from-yellow-400/10 group-hover:to-yellow-600/10 transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl" aria-hidden="true">🪙</span>
              </div>
              <span className="text-xs text-yellow-400 font-bold tracking-wider px-2 py-1 bg-yellow-500/20 rounded-lg">OR</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-yellow-100 transition-colors">
              {formatCurrency(patrimoine?.or?.valorisation || 0)}
            </div>
            <div className="text-sm text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
              {patrimoine?.or?.grammes?.toFixed(2) || 0}g détenus
            </div>
            <div className={`text-sm font-semibold flex items-center gap-1 ${
              (patrimoine?.or?.plusValue || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(patrimoine?.or?.plusValue || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {(patrimoine?.or?.plusValue || 0) >= 0 ? '+' : ''}
              {formatCurrency(patrimoine?.or?.plusValue || 0)} 
              <span className="text-xs">
                ({(patrimoine?.or?.plusValuePourcent || 0) >= 0 ? '+' : ''}
                {(patrimoine?.or?.plusValuePourcent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Bourse */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-500/50 rounded-2xl p-6 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105 transform cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl" aria-hidden="true">📈</span>
              </div>
              <span className="text-xs text-blue-400 font-bold tracking-wider px-2 py-1 bg-blue-500/20 rounded-lg">BOURSE</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-blue-100 transition-colors">
              {formatCurrency(patrimoine?.bourse?.valorisation || 0)}
            </div>
            <div className="text-sm text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              {patrimoine?.bourse?.positions || 0} positions
            </div>
            <div className={`text-sm font-semibold flex items-center gap-1 ${
              (patrimoine?.bourse?.plusValue || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(patrimoine?.bourse?.plusValue || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {(patrimoine?.bourse?.plusValue || 0) >= 0 ? '+' : ''}
              {formatCurrency(patrimoine?.bourse?.plusValue || 0)} 
              <span className="text-xs">
                ({(patrimoine?.bourse?.plusValuePourcent || 0) >= 0 ? '+' : ''}
                {(patrimoine?.bourse?.plusValuePourcent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Cash */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-2xl p-6 hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-105 transform cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-green-600/0 group-hover:from-green-400/10 group-hover:to-green-600/10 transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl" aria-hidden="true">💵</span>
              </div>
              <span className="text-xs text-green-400 font-bold tracking-wider px-2 py-1 bg-green-500/20 rounded-lg">CASH</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-green-100 transition-colors">
              {formatCurrency(patrimoine?.cash?.valorisation || 0)}
            </div>
            <div className="text-sm text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              Liquidités
            </div>
            <div className="text-sm font-semibold text-slate-400 flex items-center gap-1">
              <span className="w-4 h-4"></span>
              {formatCurrency(patrimoine?.cash?.plusValue || 0)} 
              <span className="text-xs">
                ({(patrimoine?.cash?.plusValuePourcent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-600/20 border-2 border-purple-500/50 rounded-2xl p-6 hover:border-purple-400 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transform cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-pink-400/0 to-purple-600/0 group-hover:from-purple-400/10 group-hover:via-pink-400/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300 group-hover:rotate-12">
                <span className="text-3xl" aria-hidden="true">💎</span>
              </div>
              <span className="text-xs text-purple-400 font-bold tracking-wider px-2 py-1 bg-purple-500/20 rounded-lg">TOTAL</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-purple-100 transition-colors">
              {formatCurrency(patrimoine?.total?.valorise || 0)}
            </div>
            <div className="text-sm text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
              Patrimoine total
            </div>
            <div className={`text-sm font-semibold flex items-center gap-1 ${
              (patrimoine?.total?.plusValue || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(patrimoine?.total?.plusValue || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {(patrimoine?.total?.plusValue || 0) >= 0 ? '+' : ''}
              {formatCurrency(patrimoine?.total?.plusValue || 0)} 
              <span className="text-xs">
                ({(patrimoine?.total?.plusValuePourcent || 0) >= 0 ? '+' : ''}
                {(patrimoine?.total?.plusValuePourcent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Épargne Actuel avec design moderne */}
      {planEpargne && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              Plan d'Épargne Actuel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group p-5 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl hover:border-yellow-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 hover:scale-105 transform cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🪙</span>
                  <div className="text-sm text-yellow-400 font-semibold">Or</div>
                </div>
                <div className="text-2xl font-bold text-white group-hover:text-yellow-100 transition-colors">
                  {formatCurrency(planEpargne.or?.dca || 0)}<span className="text-sm text-slate-400">/mois</span>
                </div>
              </div>
              <div className="group p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-105 transform cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📈</span>
                  <div className="text-sm text-blue-400 font-semibold">Bourse</div>
                </div>
                <div className="text-2xl font-bold text-white group-hover:text-blue-100 transition-colors">
                  {formatCurrency(planEpargne.bourse?.dca || 0)}<span className="text-sm text-slate-400">/mois</span>
                </div>
              </div>
              <div className="group p-5 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 hover:scale-105 transform cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💵</span>
                  <div className="text-sm text-green-400 font-semibold">Cash</div>
                </div>
                <div className="text-2xl font-bold text-white group-hover:text-green-100 transition-colors">
                  {formatCurrency(planEpargne.cash?.dca || 0)}<span className="text-sm text-slate-400">/mois</span>
                </div>
              </div>
            </div>
            <div className="mt-5 p-5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                  Total mensuel
                </span>
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {formatCurrency(planEpargne.totalMensuel || 0)}<span className="text-lg text-slate-400">/mois</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sections en grille - tous visibles sans scroll */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { id: 'metriques', icon: PieChart, label: 'Métriques', ariaLabel: 'Afficher les métriques principales' },
          { id: 'networth', icon: BarChart3, label: 'Net Worth', ariaLabel: 'Afficher le dashboard Net Worth' },
          { id: 'graphiques', icon: LineChartIcon, label: 'Graphiques', ariaLabel: 'Afficher les graphiques théorie vs réalité' },
          { id: 'performance', icon: Table, label: 'Performance', ariaLabel: 'Afficher la table de performance' },
          { id: 'details', icon: Calculator, label: 'Détails', ariaLabel: 'Afficher les détails calculs' },
          { id: 'update', icon: Edit, label: 'Modifier', ariaLabel: 'Mettre à jour les quantités' },
          { id: 'projections', icon: TrendingUpIcon, label: 'Projections', ariaLabel: 'Afficher les projections' },
          { id: 'settings', icon: Settings, label: 'Paramètres', ariaLabel: 'Paramètres projections' },
          { id: 'alerts', icon: Bell, label: 'Alertes', ariaLabel: 'Afficher les alertes' },
          { id: 'rebalancing', icon: Target, label: 'Rééquilibrage', ariaLabel: 'Suggestions rééquilibrage' },
          { id: 'trends', icon: Activity, label: 'Tendances', ariaLabel: 'Analyse tendances' }
        ].map(({ id, icon: Icon, label, ariaLabel }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={`gradient-button-premium gradient-button-premium-md rounded-lg flex flex-col items-center gap-2 ${
              activeSection === id
                ? 'gradient-button-premium-variant'
                : ''
            }`}
            aria-label={ariaLabel}
          >
            <Icon className={`w-5 h-5 transition-transform duration-300 ${activeSection === id ? 'rotate-12' : 'group-hover:rotate-12'}`} />
            <span className="text-xs sm:text-sm">{label}</span>
          </button>
        ))}
      </div>

      {/* Contenu selon section active */}
      {activeSection === 'metriques' && (
        <>
          {/* Métriques Principales déjà affichées ci-dessus */}
        </>
      )}

      {activeSection === 'networth' && (
        <DashboardNetWorth patrimoine={patrimoine} />
      )}

      {activeSection === 'graphiques' && (
        <TheorieReeliteCharts 
          patrimoine={patrimoine} 
          planEpargne={planEpargne}
          historique={historique}
        />
      )}

      {activeSection === 'performance' && (
        <PerformanceTable patrimoine={patrimoine} />
      )}

      {activeSection === 'details' && (
        <NetWorthDetails patrimoine={patrimoine} />
      )}

      {activeSection === 'update' && (
        <UpdateQuantities patrimoine={patrimoine} onUpdate={updatePatrimoine} />
      )}

      {activeSection === 'projections' && (
        <Projections 
          patrimoine={patrimoine} 
          planEpargne={planEpargne}
          projections={projections}
          duree={projectionDuree}
        />
      )}

      {activeSection === 'settings' && (
        <ProjectionSettings 
          projections={projections}
          planEpargne={planEpargne}
          onUpdateProjections={updateProjections}
          onUpdatePlanEpargne={updatePlanEpargne}
          duree={projectionDuree}
          onDureeChange={setProjectionDuree}
        />
      )}

      {activeSection === 'alerts' && (
        <AllocationAlerts patrimoine={patrimoine} />
      )}

      {activeSection === 'rebalancing' && (
        <RebalancingSuggestions patrimoine={patrimoine} />
      )}

      {activeSection === 'trends' && (
        <TrendsAnalysis 
          patrimoine={patrimoine}
          planEpargne={planEpargne}
          historique={historique}
        />
      )}

      {/* Message si pas de données avec design moderne */}
      {(!patrimoine || patrimoine.total.valorise === 0) && (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/30 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="relative">
            <div className="inline-block p-4 bg-blue-500/20 rounded-2xl mb-6 animate-bounce">
              <div className="text-6xl">📊</div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Bienvenue dans votre Synthèse Financière
            </h3>
            <p className="text-slate-300 mb-6 text-lg max-w-2xl mx-auto">
              Commencez par configurer vos investissements dans les modules Or, Bourse et Cash.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              <p>
                Les données seront automatiquement synchronisées ici pour vous donner une vue d'ensemble complète.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyntheseTab;
