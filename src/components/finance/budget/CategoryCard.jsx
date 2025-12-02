/**
 * Composant CategoryCard - Carte d'affichage d'une catégorie
 */

import React from 'react';
import { useBudget } from '../../../hooks/useBudget';
import CategoryRules from './CategoryRules';

const CategoryCard = ({ category, onEdit, onDelete }) => {
  const { depensesMoisActuel } = useBudget();

  const depensesCat = depensesMoisActuel.filter(d => d.categorie === category.id);
  const totalDepenses = depensesCat.reduce((sum, d) => sum + (d.montant || 0), 0);
  const budgetCat = category.budgetMensuel || 0;
  const pourcentUtilise = budgetCat > 0 ? (totalDepenses / budgetCat) * 100 : 0;
  const restant = budgetCat - totalDepenses;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (pourcent) => {
    if (pourcent >= 100) return 'text-red-400';
    if (pourcent >= 80) return 'text-orange-400';
    if (pourcent >= 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressColor = (pourcent) => {
    if (pourcent >= 100) return 'bg-red-500';
    if (pourcent >= 80) return 'bg-orange-500';
    if (pourcent >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="text-3xl p-2 rounded-lg"
            style={{ backgroundColor: `${category.couleur || '#3b82f6'}20` }}
          >
            {category.icone || '💰'}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">{category.nom}</h4>
            {category.sousCategories && category.sousCategories.length > 0 && (
              <div className="text-xs text-slate-400 mt-1">
                {category.sousCategories.join(', ')}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
          >
            ✏️ Modifier
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>

      {/* Budget et dépenses */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-xs text-slate-400 mb-1">Budget</div>
          <div className="text-lg font-semibold text-white">{formatCurrency(budgetCat)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">Dépensé</div>
          <div className={`text-lg font-semibold ${getStatusColor(pourcentUtilise)}`}>
            {formatCurrency(totalDepenses)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">Restant</div>
          <div className={`text-lg font-semibold ${restant >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(restant)}
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{pourcentUtilise.toFixed(1)}% utilisé</span>
          <span className={getStatusColor(pourcentUtilise)}>
            {pourcentUtilise >= 100 ? 'Dépassé' : pourcentUtilise >= 80 ? 'Attention' : 'OK'}
          </span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressColor(pourcentUtilise)}`}
            style={{ width: `${Math.min(pourcentUtilise, 100)}%` }}
          />
        </div>
      </div>

      {/* Règles et alertes */}
      <CategoryRules category={category} depenses={depensesCat} />
    </div>
  );
};

export default CategoryCard;

