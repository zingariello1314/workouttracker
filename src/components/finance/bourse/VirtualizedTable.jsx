import React, { useMemo } from 'react';
import { FixedSizeList } from 'react-window';

const VirtualizedTable = ({ portfolio, onDelete, onSort, sortConfig, searchTerm }) => {
  const filteredData = useMemo(() => {
    if (!searchTerm) return portfolio;
    const term = searchTerm.toLowerCase();
    return portfolio.filter(pos =>
      pos.ticker.toLowerCase().includes(term) ||
      (pos.entreprise && pos.entreprise.toLowerCase().includes(term))
    );
  }, [portfolio, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'ticker':
          aVal = a.ticker;
          bVal = b.ticker;
          break;
        case 'valeurPosition':
          aVal = a.calculs?.valeurPosition || 0;
          bVal = b.calculs?.valeurPosition || 0;
          break;
        case 'plusValue':
          aVal = a.calculs?.plusValueEuro || 0;
          bVal = b.calculs?.plusValueEuro || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredData, sortConfig]);

  const Row = ({ index, style }) => {
    const position = sortedData[index];
    if (!position) return null;

    const calculs = position.calculs || {};
    const yahooData = position.yahooData || {};
    const variationColor = yahooData.variationJour >= 0 ? 'text-green-400' : 'text-red-400';
    const plusValueColor = calculs.plusValueEuro >= 0 ? 'text-green-400' : 'text-red-400';

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    };

    const formatPercent = (value) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    return (
      <div style={style} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
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
                <div className="text-sm">
                  ({formatPercent(calculs.plusValuePourcent)})
                </div>
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
              onClick={() => onDelete(position.id, position.ticker)}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        {searchTerm ? 'Aucun résultat trouvé' : 'Aucune position'}
      </div>
    );
  }

  return (
    <div className="virtualized-table">
      {/* Header */}
      <div className="grid grid-cols-8 gap-4 py-3 px-4 border-b border-slate-700 bg-slate-800/50">
        <div className="text-slate-400 font-medium cursor-pointer" onClick={() => onSort('ticker')}>
          Ticker {sortConfig.key === 'ticker' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="text-slate-400 font-medium">Quantité</div>
        <div className="text-slate-400 font-medium">Prix Entrée</div>
        <div className="text-slate-400 font-medium">Prix Actuel</div>
        <div className="text-slate-400 font-medium cursor-pointer" onClick={() => onSort('valeurPosition')}>
          Valeur {sortConfig.key === 'valeurPosition' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="text-slate-400 font-medium cursor-pointer" onClick={() => onSort('plusValue')}>
          Plus-Value {sortConfig.key === 'plusValue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="text-slate-400 font-medium">Plus-Value %</div>
        <div className="text-slate-400 font-medium">Actions</div>
      </div>

      {/* Virtualized list */}
      <FixedSizeList
        height={600}
        itemCount={sortedData.length}
        itemSize={80}
        width="100%"
      >
        {Row}
      </FixedSizeList>
    </div>
  );
};

export default VirtualizedTable;



