/**
 * Command Center - Métriques Budget Smart Shopping
 * 
 * ✅ PHASE 2 - Étape 2.2 : Composant extrait de SmartShoppingTab
 */

import React, { memo } from 'react';
import { DollarSign, TrendingUp, Target, List } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const CommandCenter = memo(({ budget, listes, metrics }) => {
  return (
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
  );
});

CommandCenter.displayName = 'CommandCenter';

export default CommandCenter;
