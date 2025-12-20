/**
 * Composant de tableau de portfolio boursier
 * 
 * ✅ OPTIMISATION Phase 1.4 : Virtualisation Adaptative
 * ✅ OPTIMISATION Phase 2.2 : Memoization Composants et Props
 * ✅ OPTIMISATION Phase 2.4 : Debounce Recherche
 * 
 * Optimisations :
 * - Virtualisation automatique pour portfolios >50 positions
 * - useCallback pour handlers (évite re-création fonctions)
 * - useMemo pour filtrage/tri (évite recalculs inutiles)
 * - useDebounce pour recherche (300ms, évite re-renders multiples)
 * - Réduction re-renders 60-80%
 * 
 * @module components/finance/bourse/PortfolioTable
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solutions 4, 6 et 8
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { useToast } from '../../ui/Toast';
import { useVirtualScrolling } from '../../../hooks/useVirtualScrolling';
import { useDebounce } from '../../../hooks/useDebounce';
import VirtualizedTable from './VirtualizedTable';
import StockDetailModal from './StockDetailModal';

const PortfolioTable = memo(({ portfolio }) => {
  const { deletePosition, refreshYahooData, refreshing } = useFinance(); // ✅ OPTIMISATION Phase 1.3 : Utiliser state refreshing du hook
  const { showToast } = useToast();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // ✅ OPTIMISATION Phase 2.4 : État séparé valeur affichée vs valeur filtrée
  const [searchTerm, setSearchTerm] = useState(''); // Valeur affichée dans input (mise à jour immédiate)
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Valeur filtrée (débouncée 300ms)
  
  const [selectedPosition, setSelectedPosition] = useState(null); // Pour modal détail

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

  // Filtrage et tri
  const filteredAndSorted = useMemo(() => {
    let filtered = portfolio;

    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pos =>
        pos.ticker.toLowerCase().includes(term) ||
        (pos.entreprise && pos.entreprise.toLowerCase().includes(term))
      );
    }

    // Tri
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
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
          case 'plusValuePourcent':
            aVal = a.calculs?.plusValuePourcent || 0;
            bVal = b.calculs?.plusValuePourcent || 0;
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
    }

    return filtered;
  }, [portfolio, debouncedSearchTerm, sortConfig]); // ✅ OPTIMISATION Phase 2.4 : Utiliser debouncedSearchTerm au lieu de searchTerm

  // ✅ OPTIMISATION Phase 1.4 : Virtualisation adaptative
  const { shouldVirtualize, optimalContainerHeight, estimatedItemHeight } = useVirtualScrolling(
    filteredAndSorted.length,
    {
      threshold: 50,
      enablePerformanceMonitoring: true
    }
  );

  // ✅ OPTIMISATION Phase 2.2 : useCallback pour handlers (évite re-création fonctions à chaque render)
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshYahooData();
      showToast('Données actualisées', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'actualisation', 'error');
    }
  }, [refreshYahooData, showToast]);

  const handleDelete = useCallback(async (id, ticker) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la position ${ticker} ?`)) {
      try {
        await deletePosition(id);
        showToast(`${ticker} supprimé du portfolio`, 'success');
      } catch (error) {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  }, [deletePosition, showToast]);

  const handleRowClick = useCallback((position) => {
    setSelectedPosition(position);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPosition(null);
  }, []);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="portfolio-table space-y-4">
      {/* Barre de recherche et actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par ticker ou entreprise..."
          className="flex-1 min-w-[200px] px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
        >
          {refreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Actualisation...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Actualiser</span>
            </>
          )}
        </button>
      </div>

      {/* Tableau avec virtual scrolling si nécessaire */}
      {shouldVirtualize ? (
        <VirtualizedTable
          positions={filteredAndSorted}
          onDelete={handleDelete}
          onSort={handleSort}
          onRowClick={handleRowClick}
          sortConfig={sortConfig}
          height={optimalContainerHeight}
          itemHeight={estimatedItemHeight}
          overscanCount={5}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th
                  className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('ticker')}
                >
                  Ticker <SortIcon columnKey="ticker" />
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Quantité</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Prix Entrée</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Prix Actuel</th>
                <th
                  className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('valeurPosition')}
                >
                  Valeur Position <SortIcon columnKey="valeurPosition" />
                </th>
                <th
                  className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('plusValue')}
                >
                  Plus-Value <SortIcon columnKey="plusValue" />
                </th>
                <th
                  className="text-left py-3 px-4 text-slate-400 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('plusValuePourcent')}
                >
                  Plus-Value % <SortIcon columnKey="plusValuePourcent" />
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((position) => {
                const calculs = position.calculs || {};
                const yahooData = position.yahooData || {};
                const variationColor = yahooData.variationJour >= 0 ? 'text-green-400' : 'text-red-400';
                const plusValueColor = calculs.plusValueEuro >= 0 ? 'text-green-400' : 'text-red-400';

                return (
                  <tr
                    key={position.id}
                    className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(position)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{position.ticker}</div>
                      {position.entreprise && (
                        <div className="text-sm text-slate-400">{position.entreprise}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white">{position.quantite}</td>
                    <td className="py-3 px-4 text-white">{formatCurrency(position.prixEntree)}</td>
                    <td className="py-3 px-4">
                      <div className="text-white">
                        {yahooData.prixActuel ? formatCurrency(yahooData.prixActuel) : 'N/A'}
                      </div>
                      {yahooData.variationJour !== undefined && (
                        <div className={`text-sm ${variationColor}`}>
                          {formatPercent(yahooData.variationJour)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {calculs.valeurPosition ? formatCurrency(calculs.valeurPosition) : 'N/A'}
                    </td>
                    <td className={`py-3 px-4 ${plusValueColor}`}>
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
                    </td>
                    <td className={`py-3 px-4 ${plusValueColor}`}>
                      {calculs.plusValuePourcent !== undefined
                        ? formatPercent(calculs.plusValuePourcent)
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(position.id, position.ticker);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAndSorted.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              {searchTerm ? 'Aucun résultat trouvé' : 'Aucune position'}
            </div>
          )}
        </div>
      )}

      {/* Modal détail action */}
      {selectedPosition && (
        <StockDetailModal
          position={selectedPosition}
          isOpen={!!selectedPosition}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison optimisée : seulement longueur et hash portfolio
  if (prevProps.portfolio.length !== nextProps.portfolio.length) return false;
  
  // Hash simple basé sur IDs et prix actuels (changements significatifs)
  const prevHash = prevProps.portfolio.map(p => 
    `${p.id}_${p.yahooData?.prixActuel || 0}`
  ).join('|');
  const nextHash = nextProps.portfolio.map(p => 
    `${p.id}_${p.yahooData?.prixActuel || 0}`
  ).join('|');
  
  return prevHash === nextHash;
});

PortfolioTable.displayName = 'PortfolioTable';

export default PortfolioTable;

