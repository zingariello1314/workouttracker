/**
 * Composant de tableau virtualisé pour le portfolio boursier
 * 
 * ✅ OPTIMISATION Phase 1.4 : Virtualisation Adaptative
 * - Accepte données déjà filtrées/triées (évite duplication)
 * - Hauteur dynamique basée sur le conteneur
 * - Mémoïsation optimale pour éviter re-renders
 * - Support clic pour modal détail
 * 
 * @module components/finance/bourse/VirtualizedTable
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 1
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { FixedSizeList } from 'react-window';

/**
 * Composant de ligne virtualisée
 * Mémoïsé pour éviter re-renders inutiles
 */
const TableRow = React.memo(({ index, style, data }) => {
  const { positions, onDelete, onRowClick, formatCurrency, formatPercent } = data;
  const position = positions[index];

  if (!position) return null;

  const calculs = position.calculs || {};
  const yahooData = position.yahooData || {};
  const variationColor = yahooData.variationJour >= 0 ? 'text-green-400' : 'text-red-400';
  const plusValueColor = calculs.plusValueEuro >= 0 ? 'text-green-400' : 'text-red-400';

  const handleRowClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(position);
    }
  }, [position, onRowClick]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation(); // Empêcher déclenchement du clic sur la ligne
    if (onDelete) {
      onDelete(position.id, position.ticker);
    }
  }, [position, onDelete]);

  return (
    <div
      style={style}
      className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
      onClick={handleRowClick}
    >
      <div className="grid grid-cols-8 gap-4 py-3 px-4 items-center">
        <div>
          <div className="font-semibold text-white">{position.ticker}</div>
          {position.entreprise && (
            <div className="text-sm text-slate-400">{position.entreprise}</div>
          )}
        </div>
        <div className="text-white">{position.quantite}</div>
        <div className="text-white">{formatCurrency(position.prixEntree)}</div>
        <div>
          <div className="text-white">
            {yahooData.prixActuel ? formatCurrency(yahooData.prixActuel) : 'N/A'}
          </div>
          {yahooData.variationJour !== undefined && (
            <div className={`text-sm ${variationColor}`}>
              {formatPercent(yahooData.variationJour)}
            </div>
          )}
        </div>
        <div className="text-white">
          {calculs.valeurPosition ? formatCurrency(calculs.valeurPosition) : 'N/A'}
        </div>
        <div className={plusValueColor}>
          {calculs.plusValueEuro !== undefined ? (
            <>
              <div>{formatCurrency(calculs.plusValueEuro)}</div>
              {calculs.plusValuePourcent !== undefined && (
                <div className="text-sm">
                  ({formatPercent(calculs.plusValuePourcent)})
                </div>
              )}
            </>
          ) : (
            'N/A'
          )}
        </div>
        <div className={plusValueColor}>
          {calculs.plusValuePourcent !== undefined
            ? formatPercent(calculs.plusValuePourcent)
            : 'N/A'}
        </div>
        <div>
          <button
            onClick={handleDeleteClick}
            className="text-red-400 hover:text-red-300 transition-colors"
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  return (
    prevProps.index === nextProps.index &&
    prevProps.data.positions === nextProps.data.positions &&
    prevProps.style.top === nextProps.style.top &&
    prevProps.style.height === nextProps.style.height
  );
});

TableRow.displayName = 'TableRow';

/**
 * Composant de tableau virtualisé
 * 
 * @param {Object} props
 * @param {Array} props.positions - Positions déjà filtrées et triées (pas besoin de refiltrer)
 * @param {Function} props.onDelete - Callback pour suppression
 * @param {Function} props.onSort - Callback pour tri
 * @param {Function} props.onRowClick - Callback pour clic sur ligne (ouvre modal détail)
 * @param {Object} props.sortConfig - Configuration de tri actuelle
 * @param {number} props.height - Hauteur du conteneur (px)
 * @param {number} props.itemHeight - Hauteur d'un item (px, défaut: 80)
 * @param {number} props.overscanCount - Nombre d'items à rendre hors viewport (défaut: 5)
 */
const VirtualizedTable = ({
  positions = [],
  onDelete,
  onSort,
  onRowClick,
  sortConfig,
  height = 600,
  itemHeight = 80,
  overscanCount = 5
}) => {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(height);

  /**
   * Formatters mémoïsés pour éviter recréation à chaque render
   */
  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const formatPercent = useCallback((value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

  /**
   * Données pour react-window (mémoïsées)
   */
  const listData = useMemo(() => ({
    positions,
    onDelete,
    onRowClick,
    formatCurrency,
    formatPercent
  }), [positions, onDelete, onRowClick, formatCurrency, formatPercent]);

  /**
   * Mesurer la hauteur du conteneur dynamiquement
   */
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Réserver espace pour header (~60px) et marges
        const availableHeight = window.innerHeight - rect.top - 100;
        setContainerHeight(Math.max(300, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        Aucune position à afficher
      </div>
    );
  }

  return (
    <div ref={containerRef} className="virtualized-table">
      {/* Header fixe */}
      <div className="grid grid-cols-8 gap-4 py-3 px-4 border-b border-slate-700 bg-slate-800/50 sticky top-0 z-10">
        <div
          className="text-slate-400 font-medium cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort?.('ticker')}
        >
          Ticker {sortConfig?.key === 'ticker' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="text-slate-400 font-medium">Quantité</div>
        <div className="text-slate-400 font-medium">Prix Entrée</div>
        <div className="text-slate-400 font-medium">Prix Actuel</div>
        <div
          className="text-slate-400 font-medium cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort?.('valeurPosition')}
        >
          Valeur Position {sortConfig?.key === 'valeurPosition' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div
          className="text-slate-400 font-medium cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort?.('plusValue')}
        >
          Plus-Value {sortConfig?.key === 'plusValue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div
          className="text-slate-400 font-medium cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort?.('plusValuePourcent')}
        >
          Plus-Value % {sortConfig?.key === 'plusValuePourcent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="text-slate-400 font-medium">Actions</div>
      </div>

      {/* Liste virtualisée */}
      <FixedSizeList
        height={containerHeight}
        itemCount={positions.length}
        itemSize={itemHeight}
        itemData={listData}
        overscanCount={overscanCount}
        width="100%"
        className="virtualized-list"
      >
        {TableRow}
      </FixedSizeList>
    </div>
  );
};

export default VirtualizedTable;



