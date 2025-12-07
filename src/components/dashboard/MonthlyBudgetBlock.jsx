/**
 * MonthlyBudgetBlock - Bloc Budget Mensuel (PRIORITY-HIGH)
 * Suivi budget avec top 3 catégories et alertes
 */

import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Plus } from 'lucide-react';
import CircularGauge from './CircularGauge';

const MonthlyBudgetBlock = ({ budgetData, onAddExpense }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', amount: '' });

  if (!budgetData) {
    return (
      <div className="monthly-budget-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-3">💰</div>
          <div>Aucune donnée budgétaire</div>
        </div>
      </div>
    );
  }

  const { totalBudget, totalSpent, remaining, percentUsed, daysRemaining, topCategories } = budgetData;
  
  const isWarning = percentUsed >= 90 && percentUsed < 100;
  const isCritical = percentUsed >= 100;
  
  const statusColor = isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400';
  const statusBg = isCritical ? 'from-red-500/20 to-red-600/20' : 
                   isWarning ? 'from-yellow-500/20 to-yellow-600/20' : 
                   'from-green-500/20 to-green-600/20';
  const statusBorder = isCritical ? 'border-red-500/50' : 
                       isWarning ? 'border-yellow-500/50' : 
                       'border-green-500/50';

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) return;
    
    await onAddExpense(newExpense.category, parseFloat(newExpense.amount));
    setNewExpense({ category: '', amount: '' });
    setShowAddExpense(false);
  };

  return (
    <div className="monthly-budget-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-xl">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          Budget Mensuel
        </h3>
        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105 transform flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Dépense
        </button>
      </div>

      {/* Add Expense Form */}
      {showAddExpense && (
        <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            >
              <option value="">Catégorie</option>
              {Object.keys(budgetData.categories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Montant"
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <button
            onClick={handleAddExpense}
            disabled={!newExpense.category || !newExpense.amount}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter la dépense
          </button>
        </div>
      )}

      {/* Circular Progress */}
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <CircularGauge
            value={percentUsed}
            max={100}
            size={160}
            strokeWidth={12}
            color={isCritical ? '#ef4444' : isWarning ? '#eab308' : '#10b981'}
            showPercentage={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold ${statusColor}`}>
              {Math.round(percentUsed)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">utilisé</div>
          </div>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl text-center">
          <div className="text-xs text-slate-400 mb-1">Revenus</div>
          <div className="text-lg font-bold text-white">{totalBudget}€</div>
        </div>
        <div className="p-3 bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl text-center">
          <div className="text-xs text-slate-400 mb-1">Dépensé</div>
          <div className="text-lg font-bold text-white">{totalSpent}€</div>
        </div>
        <div className={`p-3 bg-gradient-to-br ${statusBg} border ${statusBorder} rounded-xl text-center`}>
          <div className="text-xs text-slate-400 mb-1">Restant</div>
          <div className={`text-lg font-bold ${statusColor}`}>{remaining}€</div>
        </div>
      </div>

      {/* Alert */}
      {(isWarning || isCritical) && (
        <div className={`mb-6 p-4 bg-gradient-to-r ${statusBg} border ${statusBorder} rounded-xl`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${statusColor}`} />
            <div>
              <div className={`text-sm font-semibold ${statusColor}`}>
                {isCritical ? '⚠️ Budget dépassé !' : '⚠️ Attention au budget !'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isCritical ? 'Vous avez dépassé votre budget mensuel' : 
                 'Vous approchez de la limite de votre budget'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Categories */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-slate-300 mb-3">Top 3 Catégories Remarquables</div>
        <div className="space-y-2">
          {topCategories.map((cat, index) => (
            <div
              key={cat.name}
              className={`p-3 bg-gradient-to-r ${
                cat.status === 'exceeded' ? 'from-red-500/10 to-red-600/10 border-red-500/30' :
                cat.status === 'warning' ? 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/30' :
                'from-green-500/10 to-green-600/10 border-green-500/30'
              } border rounded-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="text-sm font-semibold text-white capitalize">{cat.name}</span>
                </div>
                <div className={`text-sm font-bold ${
                  cat.status === 'exceeded' ? 'text-red-400' :
                  cat.status === 'warning' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {Math.round(cat.percentUsed)}%
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{cat.spent}€ / {cat.budget}€</span>
                {cat.status === 'exceeded' && (
                  <span className="text-red-400 font-semibold">Dépassé de {cat.spent - cat.budget}€</span>
                )}
                {cat.status === 'warning' && (
                  <span className="text-yellow-400 font-semibold">Proche de la limite</span>
                )}
                {cat.status === 'ok' && cat.percentUsed < 50 && (
                  <span className="text-green-400 font-semibold">Économie de {cat.budget - cat.spent}€</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Days Remaining */}
      <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Jours restants ce mois</div>
            <div className="text-2xl font-bold text-white mt-1">{daysRemaining}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Budget/jour restant</div>
            <div className="text-lg font-bold text-indigo-400 mt-1">
              {daysRemaining > 0 ? Math.round(remaining / daysRemaining) : 0}€
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBudgetBlock;
