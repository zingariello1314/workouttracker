/**
 * Composant de liste de cartes virtualisée réutilisable
 * 
 * ✅ PHASE 2 : Virtualisation pour listes longues
 * 
 * Utilise react-window pour virtualiser le rendu des cartes,
 * améliorant les performances pour les listes > 30 items.
 * 
 * @module components/ui/VirtualizedCardList
 */

import React, { useMemo } from 'react';
import { FixedSizeList, VariableSizeList } from 'react-window';

/**
 * Composant de carte virtualisée
 * @param {Object} props
 * @param {number} props.index - Index de la carte
 * @param {Object} props.style - Style injecté par react-window
 * @param {Object} props.data - Données (items, renderCard, gap)
 */
const CardItem = React.memo(({ index, style, data }) => {
  const { items, renderCard, gap } = data;
  const item = items[index];

  if (!item) {
    return null;
  }

  return (
    <div
      style={{
        ...style,
        paddingBottom: index < items.length - 1 ? `${gap}px` : 0,
      }}
    >
      {renderCard(item, index)}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  return (
    prevProps.index === nextProps.index &&
    prevProps.data.items === nextProps.data.items &&
    prevProps.data.renderCard === nextProps.data.renderCard
  );
});

CardItem.displayName = 'CardItem';

/**
 * Composant de liste de cartes virtualisée
 * 
 * @param {Object} props
 * @param {Array} props.items - Liste des items à afficher
 * @param {Function} props.renderCard - Fonction pour rendre une carte (item, index) => ReactNode
 * @param {number} props.cardHeight - Hauteur d'une carte en pixels (défaut: 200)
 * @param {number} props.height - Hauteur totale de la liste en pixels (défaut: 600)
 * @param {number} props.gap - Espacement entre les cartes en pixels (défaut: 16)
 * @param {number} props.threshold - Seuil pour activer la virtualisation (défaut: 30)
 * @param {boolean} props.variableSize - Si true, utilise VariableSizeList (défaut: false)
 * @param {Function} props.getItemSize - Fonction pour calculer la taille d'un item (index) => number (requis si variableSize=true)
 * @param {string} props.className - Classes CSS additionnelles
 */
const VirtualizedCardList = ({
  items = [],
  renderCard,
  cardHeight = 200,
  height = 600,
  gap = 16,
  threshold = 30,
  variableSize = false,
  getItemSize,
  className = '',
}) => {
  // Décider si on virtualise ou non
  const shouldVirtualize = items.length > threshold;

  if (!shouldVirtualize) {
    // Rendu normal si peu d'items
    return (
      <div className={`virtualized-card-list ${className}`} style={{ height: `${height}px`, overflow: 'auto' }}>
        {items.map((item, index) => (
          <div key={item.id || index} style={{ marginBottom: index < items.length - 1 ? `${gap}px` : 0 }}>
            {renderCard(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // Calculer la taille effective avec gap
  const effectiveItemSize = cardHeight + gap;

  // Rendu virtualisé avec taille fixe
  if (!variableSize) {
    const listData = useMemo(() => ({
      items,
      renderCard,
      gap,
    }), [items, renderCard, gap]);

    return (
      <div className={`virtualized-card-list ${className}`} style={{ height: `${height}px` }}>
        <FixedSizeList
          height={height}
          itemCount={items.length}
          itemSize={effectiveItemSize}
          width="100%"
          itemData={listData}
        >
          {CardItem}
        </FixedSizeList>
      </div>
    );
  }

  // Rendu virtualisé avec taille variable
  if (!getItemSize) {
    console.warn('[VirtualizedCardList] getItemSize requis pour variableSize=true');
    return null;
  }

  const listData = useMemo(() => ({
    items,
    renderCard,
    gap,
  }), [items, renderCard, gap]);

  // Créer une fonction qui inclut le gap dans le calcul
  const itemSizeWithGap = useMemo(() => {
    return (index) => {
      const size = getItemSize(index);
      return size + (index < items.length - 1 ? gap : 0);
    };
  }, [getItemSize, gap, items.length]);

  return (
    <div className={`virtualized-card-list ${className}`} style={{ height: `${height}px` }}>
      <VariableSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemSizeWithGap}
        width="100%"
        itemData={listData}
        estimatedItemSize={cardHeight}
      >
        {CardItem}
      </VariableSizeList>
    </div>
  );
};

export default VirtualizedCardList;
