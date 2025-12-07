/**
 * Smart Shopping Tab - Module principal
 * Command Center + Mode Exécution + Orchestrateur + Analytics
 */

import { useState } from 'react';
import { useSmartShopping } from '../../../hooks/useSmartShopping';
import { 
  ShoppingCart, AlertTriangle, Package, TrendingUp, 
  List, BarChart3, Settings, Zap, Target, Activity,
  DollarSign, CheckCircle
} from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';
import ListesManager from './ListesManager';
import ExecutionMode from './ExecutionMode';
import InventaireManager from './InventaireManager';
import AnalyticsPerformance from './AnalyticsPerformance';
import WorkflowManager from './WorkflowManager';
import ModesAdaptatifs from './ModesAdaptatifs';
import SettingsManager from './SettingsManager';

const SmartShoppingTab = () => {
  const {
    budget,
    listes,
    inventaire,
    metrics,
    alertes,
    loading,
    error,
    refreshData,
    createListe,
    updateListe,
    deleteListe,
    addArticle,
    updateArticle,
    deleteArticle,
    addInventaireItem,
    updateInventaireItem,
    deleteInventaireItem
  } = useSmartShopping();

  const [activeSection, setActiveSection] = useState('command-center');
  const [modeActuel, setModeActuel] = useState('strategie'); // strategie | tactique | execution | analysis

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Chargement Smart Shopping...</div>
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
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-shopping-tab space-y-6">
      {/* Header Premium avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-green-600/20 to-blue-600/20 border border-blue-500/30 p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10 animate-pulse"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <ShoppingCart className="w-7 h-7 text-blue-400" />
              </div>
              Smart Shopping
            </h2>
            <p className="text-slate-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Optimisation budgétaire intelligente
            </p>
          </div>
          <button
            onClick={refreshData}
            className="group px-5 py-2.5 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-blue-500/50 hover:scale-105 transform"
            aria-label="Rafraîchir les données"
          >
            <span className="flex items-center gap-2">
              <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
              Rafraîchir
            </span>
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

      {/* Command Center - Métriques Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Mensuel */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-500/50 rounded-2xl p-6 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105 transform cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs text-blue-400 font-bold tracking-wider px-2 py-1 bg-blue-500/20 rounded-lg">BUDGET</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-blue-100 transition-colors">
              {formatCurrency(budget?.mensuel || 0)}
            </div>
            <div className="text-sm text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Budget mensuel
            </div>
          </div>
        </div>

        {/* Dépensé */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-500/50 rounded-2xl p-6 hover:border-orange-400 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20 hover:scale-105 transform cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-orange-600/0 group-hover:from-orange-400/10 group-hover:to-orange-600/10 transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-xs text-orange-400 font-bold tracking-wider px-2 py-1 bg-orange-500/20 rounded-lg">DÉPENSÉ</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-orange-100 transition-colors">
              {formatCurrency(budget?.depenseCeMois || 0)}
            </div>
            <div className="text-sm text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
              Ce mois-ci
            </div>
          </div>
        </div>

        {/* Restant */}
        <div className={`group relative overflow-hidden bg-gradient-to-br ${
          (budget?.restant || 0) >= 0 
            ? 'from-green-500/20 to-green-600/20 border-green-500/50 hover:border-green-400 hover:shadow-green-500/20' 
            : 'from-red-500/20 to-red-600/20 border-red-500/50 hover:border-red-400 hover:shadow-red-500/20'
        } border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 transform cursor-pointer`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${
            (budget?.restant || 0) >= 0
              ? 'from-green-400/0 to-green-600/0 group-hover:from-green-400/10 group-hover:to-green-600/10'
              : 'from-red-400/0 to-red-600/0 group-hover:from-red-400/10 group-hover:to-red-600/10'
          } transition-all duration-300`}></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 ${
                (budget?.restant || 0) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
              } rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                <Target className={`w-6 h-6 ${
                  (budget?.restant || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`} />
              </div>
              <span className={`text-xs ${
                (budget?.restant || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              } font-bold tracking-wider px-2 py-1 ${
                (budget?.restant || 0) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
              } rounded-lg`}>RESTANT</span>
            </div>
            <div className={`text-3xl font-bold text-white mb-2 ${
              (budget?.restant || 0) >= 0 ? 'group-hover:text-green-100' : 'group-hover:text-red-100'
            } transition-colors`}>
              {formatCurrency(budget?.restant || 0)}
            </div>
            <div className="text-sm text-slate-300 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 ${
                (budget?.restant || 0) >= 0 ? 'bg-green-400' : 'bg-red-400'
              } rounded-full`}></span>
              {(budget?.restant || 0) >= 0 ? 'Disponible' : 'Dépassement'}
            </div>
          </div>
        </div>

        {/* Listes Actives */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/50 rounded-2xl p-6 hover:border-purple-400 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105 transform cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-600/0 group-hover:from-purple-400/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <List className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs text-purple-400 font-bold tracking-wider px-2 py-1 bg-purple-500/20 rounded-lg">LISTES</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:text-purple-100 transition-colors">
              {listes?.length || 0}
            </div>
            <div className="text-sm text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
              {metrics?.listesEnCours || 0} en cours
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections en grille */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { id: 'command-center', icon: BarChart3, label: 'Command Center', ariaLabel: 'Afficher le command center' },
          { id: 'workflow', icon: Target, label: 'Workflow', ariaLabel: 'Workflow complet' },
          { id: 'listes', icon: List, label: 'Mes Listes', ariaLabel: 'Afficher les listes' },
          { id: 'execution', icon: Zap, label: 'Exécution', ariaLabel: 'Mode exécution' },
          { id: 'inventaire', icon: Package, label: 'Inventaire', ariaLabel: 'Gérer inventaire' },
          { id: 'analytics', icon: Activity, label: 'Analytics', ariaLabel: 'Voir analytics' },
          { id: 'settings', icon: Settings, label: 'Paramètres', ariaLabel: 'Paramètres' }
        ].map(({ id, icon: Icon, label, ariaLabel }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`group px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              activeSection === id
                ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50 hover:border-blue-500/50'
            }`}
            aria-label={ariaLabel}
          >
            <div className="flex flex-col items-center gap-2">
              <Icon className={`w-5 h-5 transition-transform duration-300 ${activeSection === id ? 'rotate-12' : 'group-hover:rotate-12'}`} />
              <span className="text-xs sm:text-sm">{label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Contenu selon section active */}
      {activeSection === 'command-center' && (
        <div className="space-y-6">
          {/* Message si pas de listes */}
          {(!listes || listes.length === 0) && (
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-green-500/10 to-blue-500/10 border border-blue-500/30 rounded-2xl p-12 text-center backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="relative">
                <div className="inline-block p-4 bg-blue-500/20 rounded-2xl mb-6 animate-bounce">
                  <div className="text-6xl">🛒</div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  Bienvenue dans Smart Shopping
                </h3>
                <p className="text-slate-300 mb-6 text-lg max-w-2xl mx-auto">
                  Créez votre première liste de courses intelligente pour commencer à optimiser votre budget.
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-medium shadow-lg hover:shadow-blue-500/50 hover:scale-105 transform transition-all duration-300">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Créer ma première liste
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'listes' && (
        <ListesManager
          listes={listes}
          onCreateListe={createListe}
          onUpdateListe={updateListe}
          onDeleteListe={deleteListe}
        />
      )}

      {activeSection === 'execution' && (
        <ExecutionMode
          listes={listes}
          onUpdateArticle={updateArticle}
          onAddArticle={addArticle}
        />
      )}

      {activeSection === 'inventaire' && (
        <InventaireManager
          inventaire={inventaire}
          onAddItem={addInventaireItem}
          onUpdateItem={updateInventaireItem}
          onDeleteItem={deleteInventaireItem}
        />
      )}

      {activeSection === 'analytics' && (
        <AnalyticsPerformance
          listes={listes}
          budget={budget}
        />
      )}

      {activeSection === 'workflow' && (
        <ModesAdaptatifs modeActuel={modeActuel} onChangeMode={setModeActuel}>
          <WorkflowManager
            listeId={null}
            listes={listes}
            onUpdateListe={updateListe}
            onAddArticle={addArticle}
            onUpdateArticle={updateArticle}
            onComplete={() => {
              setActiveSection('analytics');
              refreshData();
            }}
          />
        </ModesAdaptatifs>
      )}

      {activeSection === 'settings' && (
        <SettingsManager />
      )}
    </div>
  );
};

export default SmartShoppingTab;
