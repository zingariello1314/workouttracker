/**
 * Smart Shopping Tab - Module principal
 * Command Center + Mode Exécution + Orchestrateur + Analytics
 * 
 * ✅ PHASE 2 - Étape 2.2 : Refactorisé avec sous-composants
 * ✅ PHASE 2 - Étape 2.4 : Memoization métriques
 */

import { useState, useMemo } from 'react';
import { useSmartShopping } from '../../../hooks/useSmartShopping';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import ListesManager from './ListesManager';
import ExecutionMode from './ExecutionMode';
import InventaireManager from './InventaireManager';
import AnalyticsPerformance from './AnalyticsPerformance';
import WorkflowManager from './WorkflowManager';
import ModesAdaptatifs from './ModesAdaptatifs';
import SettingsManager from './SettingsManager';
import CommandCenter from './CommandCenter';
import NavigationSections from './NavigationSections';

const SmartShoppingTab = () => {
  const {
    budget,
    listes,
    inventaire,
    metrics: rawMetrics,
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

  // ✅ PHASE 2 - Étape 2.4 : Memoization métriques pour éviter recalculs
  const metrics = useMemo(() => {
    if (!rawMetrics) return null;
    
    // Calculer listesEnCours si non présent
    const listesEnCours = rawMetrics.listesEnCours ?? 
      (listes?.filter(liste => liste.statut === 'en_cours' || liste.statut === 'active').length || 0);
    
    return {
      ...rawMetrics,
      listesEnCours
    };
  }, [rawMetrics, listes]);

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

      {/* ✅ PHASE 2 - Étape 2.2 : Command Center extrait en composant */}
      <CommandCenter budget={budget} listes={listes} metrics={metrics} />

      {/* ✅ PHASE 2 - Étape 2.2 : Navigation Sections extraite en composant */}
      <NavigationSections 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />

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
                <button
                  type="button"
                  className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2"
                  onClick={() => setActiveSection('listes')}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Créer ma première liste
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
