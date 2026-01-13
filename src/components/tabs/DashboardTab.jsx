/**
 * Dashboard Tab - Onglet principal Dashboard
 * Vue d'ensemble avec modules essentiels : Surveillance, Rythme lecture, Actualités financières
 */

import { LayoutDashboard, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import NewsBlock from '../dashboard/NewsBlock';
import GlobalXPBar from '../dashboard/GlobalXPBar';

const DashboardTab = () => {
  const {
    loading,
    error,
    newsData,
    refreshAll,
    refreshNews
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Chargement du Dashboard...</div>
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
            onClick={refreshNews}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 dashboard-tab min-h-[calc(100vh-140px)]">
        <div className="max-w-[2400px] mx-auto p-4 md:p-6 space-y-6">
          {/* Header Premium */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 animate-pulse"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                    <LayoutDashboard className="w-7 h-7 text-indigo-400" />
                  </div>
                  Dashboard Global
                </h1>
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Actualités financières
                </p>
              </div>
              <button
                onClick={refreshNews}
                className="group px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-purple-500/50 hover:scale-105 transform"
                aria-label="Rafraîchir les actualités"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  Rafraîchir
                </span>
              </button>
            </div>
          </div>

          {/* Module du Dashboard */}
          <div className="space-y-6">
            {/* Barre XP Globale */}
            <GlobalXPBar />
            
            {/* News - Full width */}
            <NewsBlock newsData={newsData} onRefresh={refreshNews} />
          </div>

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <span>Dashboard: <span className="text-white font-semibold">1 module actif</span></span>
              </div>
              <div className="text-slate-500 text-xs">
                Version: 4.0.0 ✅
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
