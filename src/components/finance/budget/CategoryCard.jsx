import React, { useState, useMemo, memo, useCallback } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { useToast } from '../../ui/Toast';
import CategoryRules from './CategoryRules';

const CategoryCard = memo(({ category, onEdit, onDelete }) => {
  const { depensesMoisActuel, updateCategory } = useBudget();
  const { showToast } = useToast();
  const [showRules, setShowRules] = useState(false);

  const { depenseActuelle, budgetMensuel, pourcentUtilise } = useMemo(() => {
    const depensesCategorie = depensesMoisActuel.filter(d => d.categorie === category.id);
    const depenseActuelle = depensesCategorie.reduce((sum, d) => sum + d.montant, 0);
    const budgetMensuel = category.budgetMensuel || 0;
    const pourcentUtilise = budgetMensuel > 0 ? (depenseActuelle / budgetMensuel) * 100 : 0;
    return { depenseActuelle, budgetMensuel, pourcentUtilise };
  }, [depensesMoisActuel, category.id, category.budgetMensuel]);

  const formatCurrency = useMemo(() => (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const getStatusColor = useMemo(() => () => {
    if (pourcentUtilise >= 120) return 'bg-red-600/20 border-red-500/50';
    if (pourcentUtilise >= 100) return 'bg-orange-600/20 border-orange-500/50';
    if (pourcentUtilise >= 80) return 'bg-yellow-600/20 border-yellow-500/50';
    return 'bg-green-600/20 border-green-500/50';
  }, [pourcentUtilise]);

  const getStatusText = useMemo(() => () => {
    if (pourcentUtilise >= 120) return 'Critique';
    if (pourcentUtilise >= 100) return 'Dépassé';
    if (pourcentUtilise >= 80) return 'Attention';
    return 'OK';
  }, [pourcentUtilise]);

  return (
    <div className={`category-card bg-slate-800/50 border rounded-lg p-4 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.icone || '📁'}</span>
          <div>
            <h4 className="font-semibold text-white text-lg">{category.nom}</h4>
            {category.sousCategories && category.sousCategories.length > 0 && (
              <div className="text-xs text-slate-400">
                {category.sousCategories.length} sous-catégorie{category.sousCategories.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={useCallback(() => setShowRules(prev => !prev), [])}
            className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded text-sm transition-colors"
            title="Règles"
          >
            ⚙️
          </button>
          {onEdit && (
            <button
              onClick={useCallback(() => onEdit(category), [onEdit, category])}
              className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded text-sm transition-colors"
              title="Modifier"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={useCallback(() => onDelete(category.id), [onDelete, category.id])}
              className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded text-sm transition-colors"
              title="Supprimer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-xs text-slate-400 mb-1">Budget</div>
          <div className="text-lg font-bold text-white">
            {formatCurrency(budgetMensuel)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">Dépensé</div>
          <div className={`text-lg font-bold ${
            pourcentUtilise >= 100 ? 'text-red-400' : 'text-white'
          }`}>
            {formatCurrency(depenseActuelle)}
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Utilisation</span>
          <span className={`text-xs font-semibold ${
            pourcentUtilise >= 100 ? 'text-red-400' :
            pourcentUtilise >= 80 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {pourcentUtilise.toFixed(1)}% - {getStatusText()}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              pourcentUtilise >= 120 ? 'bg-red-500' :
              pourcentUtilise >= 100 ? 'bg-orange-500' :
              pourcentUtilise >= 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(pourcentUtilise, 150)}%` }}
          />
        </div>
      </div>

      {/* Restant */}
      {budgetMensuel > 0 && (
        <div className="text-sm">
          <span className="text-slate-400">Restant: </span>
          <span className={`font-semibold ${
            (budgetMensuel - depenseActuelle) < 0 ? 'text-red-400' : 'text-green-400'
          }`}>
            {formatCurrency(budgetMensuel - depenseActuelle)}
          </span>
        </div>
      )}

      {/* Règles */}
      {showRules && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <CategoryRules category={category} />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour React.memo
  return (
    prevProps.category.id === nextProps.category.id &&
    prevProps.category.budgetMensuel === nextProps.category.budgetMensuel &&
    prevProps.category.nom === nextProps.category.nom &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
});

CategoryCard.displayName = 'CategoryCard';

export default CategoryCard;

