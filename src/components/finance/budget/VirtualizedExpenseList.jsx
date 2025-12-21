/**
 * Composant de liste virtualisée pour les dépenses
 * 
 * ✅ SOLUTION 1.3 : Virtualisation pour grandes listes de dépenses
 * 
 * Utilise react-window pour virtualiser le rendu des dépenses,
 * améliorant les performances pour les listes > 20 items.
 * 
 * @module components/finance/budget/VirtualizedExpenseList
 * @see docs/finance/ANALYSE_PROFONDE_4_SOUS_ONGLETS_BOURSE.md - Phase 1, Solution 1.3
 */

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import { BudgetConfig } from '../../../config/budget.config';

/**
 * Composant de ligne virtualisée pour une dépense
 * Mémoïsé pour éviter re-renders inutiles
 */
const ExpenseRow = React.memo(({ index, style, data }) => {
  const { items, renderItem, onItemClick } = data;
  const item = items[index];
  
  if (!item) {
    return null;
  }
  
  const handleClick = useCallback(() => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  }, [item, index, onItemClick]);
  
  return (
    <div
      style={{
        ...style,
        paddingBottom: index < items.length - 1 ? '0.5rem' : 0
      }}
      onClick={handleClick}
    >
      {renderItem ? renderItem(item, index) : null}
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ OPTIMISATION : Comparaison personnalisée pour éviter re-renders
  // Vérifier si l'item a changé (par ID ou référence)
  const prevItem = prevProps.data.items[prevProps.index];
  const nextItem = nextProps.data.items[nextProps.index];
  
  if (!prevItem || !nextItem) {
    return false; // Re-render si item manquant
  }
  
  // Si les items ont des IDs, comparer par ID
  if (prevItem.id && nextItem.id) {
    if (prevItem.id !== nextItem.id) return false;
  } else {
    // Sinon, comparer par référence
    if (prevItem !== nextItem) return false;
  }
  
  // Comparer la fonction renderItem (peut changer)
  if (prevProps.data.renderItem !== nextProps.data.renderItem) {
    return false;
  }
  
  // Comparer onItemClick
  if (prevProps.data.onItemClick !== nextProps.data.onItemClick) {
    return false;
  }
  
  // Si toutes les comparaisons passent, skip re-render
  return true;
});

ExpenseRow.displayName = 'ExpenseRow';

/**
 * Composant de liste virtualisée pour dépenses
 * 
 * @param {Object} props
 * @param {Array} props.items - Liste des items à afficher
 * @param {Function} props.renderItem - Fonction pour rendre un item (item, index) => ReactNode
 * @param {Function} [props.onItemClick] - Callback appelé au clic sur un item
 * @param {number} [props.height] - Hauteur du conteneur (défaut: 600px)
 * @param {number} [props.itemHeight] - Hauteur d'un item (défaut: config)
 * @param {number} [props.threshold] - Seuil pour activer virtualisation (défaut: config)
 * @param {string} [props.className] - Classes CSS additionnelles
 * @param {Object} [props.listProps] - Props additionnelles pour FixedSizeList
 */
const VirtualizedExpenseList = ({
  items = [],
  renderItem,
  onItemClick,
  height,
  itemHeight,
  threshold,
  className = '',
  listProps = {}
}) => {
  // ✅ SOLUTION 1.3 : Configuration centralisée
  const config = BudgetConfig.virtualScroll;
  
  const finalThreshold = threshold ?? config.threshold;
  const finalItemHeight = itemHeight ?? config.expenseItemHeight;
  const finalHeight = height ?? config.maxContainerHeight;
  
  // ✅ OPTIMISATION : Mémoïsation des données passées à FixedSizeList
  const listData = useMemo(() => ({
    items,
    renderItem,
    onItemClick
  }), [items, renderItem, onItemClick]);
  
  // ✅ SOLUTION 1.3 : Virtualisation seulement si seuil dépassé
  // Pour petites listes, le rendu normal est plus performant (pas d'overhead)
  if (!items || items.length === 0) {
    return (
      <div className={`text-center py-8 text-slate-400 ${className}`}>
        Aucun élément à afficher
      </div>
    );
  }
  
  if (items.length < finalThreshold) {
    // Rendu normal pour petites listes (pas besoin de virtualisation)
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={item.id || index} onClick={() => onItemClick?.(item, index)}>
            {renderItem ? renderItem(item, index) : null}
          </div>
        ))}
      </div>
    );
  }
  
  // ✅ SOLUTION 1.3 : Virtualisation pour grandes listes
  return (
    <div className={className}>
      <FixedSizeList
        height={Math.min(finalHeight, items.length * finalItemHeight)}
        itemCount={items.length}
        itemSize={finalItemHeight}
        itemData={listData}
        overscanCount={config.overscan}
        width="100%"
        {...listProps}
      >
        {ExpenseRow}
      </FixedSizeList>
    </div>
  );
};

export default VirtualizedExpenseList;

