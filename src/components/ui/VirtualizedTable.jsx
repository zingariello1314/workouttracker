/**
 * Composant de tableau virtualisé réutilisable
 * 
 * ✅ PHASE 2 : Virtualisation pour listes longues
 * 
 * Utilise react-window pour virtualiser le rendu des lignes de tableau,
 * améliorant les performances pour les listes > 50 items.
 * 
 * @module components/ui/VirtualizedTable
 */

import React, { useMemo } from 'react';
import { FixedSizeList } from 'react-window';

/**
 * Composant de ligne virtualisée pour un tableau
 * @param {Object} props
 * @param {number} props.index - Index de la ligne
 * @param {Object} props.style - Style injecté par react-window
 * @param {Object} props.data - Données (items, renderRow, headerHeight)
 */
const TableRow = React.memo(({ index, style, data }) => {
  const { items, renderRow, headerHeight } = data;
  const item = items[index];

  if (!item) {
    return null;
  }

  return (
    <div
      style={{
        ...style,
        top: `${parseFloat(style.top) + headerHeight}px`,
      }}
    >
      {renderRow(item, index)}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  return (
    prevProps.index === nextProps.index &&
    prevProps.data.items === nextProps.data.items &&
    prevProps.data.renderRow === nextProps.data.renderRow
  );
});

TableRow.displayName = 'TableRow';

/**
 * Composant de tableau virtualisé
 * 
 * @param {Object} props
 * @param {Array} props.items - Liste des items à afficher
 * @param {Function} props.renderRow - Fonction pour rendre une ligne (item, index) => ReactNode
 * @param {ReactNode} props.renderHeader - Header du tableau
 * @param {number} props.rowHeight - Hauteur d'une ligne en pixels (défaut: 60)
 * @param {number} props.height - Hauteur totale du tableau en pixels (défaut: 400)
 * @param {number} props.threshold - Seuil pour activer la virtualisation (défaut: 50)
 * @param {string} props.className - Classes CSS additionnelles
 */
const VirtualizedTable = ({
  items = [],
  renderRow,
  renderHeader,
  rowHeight = 60,
  height = 400,
  threshold = 50,
  className = '',
}) => {
  // Calculer la hauteur du header
  const headerHeight = useMemo(() => {
    if (!renderHeader) return 0;
    // Estimation basée sur le contenu typique d'un header
    return 48; // ~48px pour un header standard
  }, [renderHeader]);

  // Hauteur disponible pour la liste (hauteur totale - header)
  const listHeight = height - headerHeight;

  // Décider si on virtualise ou non
  const shouldVirtualize = items.length > threshold;

  if (!shouldVirtualize) {
    // Rendu normal si peu d'items
    return (
      <div className={`virtualized-table ${className}`}>
        {renderHeader && (
          <div className="virtualized-table-header" style={{ height: `${headerHeight}px` }}>
            {renderHeader()}
          </div>
        )}
        <div className="virtualized-table-body">
          {items.map((item, index) => (
            <div key={item.id || index}>
              {renderRow(item, index)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Rendu virtualisé
  const listData = useMemo(() => ({
    items,
    renderRow,
    headerHeight,
  }), [items, renderRow, headerHeight]);

  return (
    <div className={`virtualized-table ${className}`}>
      {renderHeader && (
        <div className="virtualized-table-header" style={{ height: `${headerHeight}px` }}>
          {renderHeader()}
        </div>
      )}
      <div className="virtualized-table-body" style={{ height: `${listHeight}px` }}>
        <FixedSizeList
          height={listHeight}
          itemCount={items.length}
          itemSize={rowHeight}
          width="100%"
          itemData={listData}
        >
          {TableRow}
        </FixedSizeList>
      </div>
    </div>
  );
};

export default VirtualizedTable;
