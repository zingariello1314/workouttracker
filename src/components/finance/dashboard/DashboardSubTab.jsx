/**
 * Dashboard SubTab - Vue d'ensemble globale Finance
 * En cours de développement
 */

import { LayoutDashboard, FileText, Sparkles } from 'lucide-react';

const DashboardSubTab = () => {
  return (
    <div className="dashboard-subtab min-h-[600px]">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 p-8 mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 animate-pulse"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-white flex items-center gap-4 mb-3">
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30">
                  <LayoutDashboard className="w-8 h-8 text-indigo-400" />
                </div>
                Dashboard Finance
              </h2>
              <p className="text-slate-300 text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Vue d'ensemble globale de votre situation financière
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message En Développement */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-indigo-900/20 to-slate-800/80 border border-slate-700/50 rounded-2xl p-12 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative text-center max-w-3xl mx-auto">
          {/* Icon animé */}
          <div className="inline-block mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl border-2 border-indigo-400/30 backdrop-blur-sm">
                <Sparkles className="w-20 h-20 text-indigo-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Titre */}
          <h3 className="text-4xl font-bold mb-6">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dashboard en Cours de Développement
            </span>
          </h3>

          {/* Description */}
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Cette section sera bientôt disponible avec une vue d'ensemble complète de votre situation financière.
          </p>

          {/* Features à venir */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-500/30 rounded-xl backdrop-blur-sm">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-sm font-semibold text-indigo-400 mb-2">Métriques Globales</div>
              <div className="text-xs text-slate-400">Vue consolidée de tous vos actifs</div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <div className="text-4xl mb-3">📈</div>
              <div className="text-sm font-semibold text-purple-400 mb-2">Graphiques Temps Réel</div>
              <div className="text-xs text-slate-400">Évolution de votre patrimoine</div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-pink-500/10 to-pink-600/10 border border-pink-500/30 rounded-xl backdrop-blur-sm">
              <div className="text-4xl mb-3">🎯</div>
              <div className="text-sm font-semibold text-pink-400 mb-2">Objectifs & Alertes</div>
              <div className="text-xs text-slate-400">Suivi de vos objectifs financiers</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm">
            <div className="flex items-start gap-4 text-left">
              <div className="p-3 bg-blue-500/20 rounded-lg flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-semibold mb-2">Prochaine Étape</div>
                <div className="text-sm text-slate-400 leading-relaxed">
                  Importez votre fichier MD avec les consignes détaillées pour créer le dashboard personnalisé que vous attendez. 
                  Toute la structure est prête pour une implémentation rapide.
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-full">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
            <span className="text-yellow-400 font-semibold text-sm">En Développement</span>
          </div>
        </div>
      </div>

      {/* Info supplémentaire */}
      <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span>Module: <span className="text-white font-semibold">Dashboard Finance</span></span>
          </div>
          <div className="text-slate-500 text-xs">
            Version: 0.1.0 (Beta)
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSubTab;
