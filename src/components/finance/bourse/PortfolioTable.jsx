import React, { useState, useMemo } from 'react';
import { useFinance } from '../../../hooks/useFinance';
import { useToast } from '../../ui/Toast';

const PortfolioTable = ({ portfolio }) => {
  const { deletePosition, refreshYahooData } = useFinance();
  const { showToast } = useToast();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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
  }, [portfolio, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshYahooData();
      showToast('Données actualisées', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'actualisation', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id, ticker) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la position ${ticker} ?`)) {
      try {
        await deletePosition(id);
        showToast(`${ticker} supprimé du portfolio`, 'success');
      } catch (error) {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

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
      {useVirtualScrolling ? (
        <VirtualizedTable
          portfolio={filteredData}
          onDelete={handleDelete}
          onSort={handleSort}
          sortConfig={sortConfig}
          searchTerm={searchTerm}
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
                  className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
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
                      onClick={() => handleDelete(position.id, position.ticker)}
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
    </div>
  );
};

export default PortfolioTable;

