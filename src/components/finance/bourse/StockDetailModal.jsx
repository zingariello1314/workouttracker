/**
 * Modal de détail pour une action du portfolio
 * 
 * ✅ OPTIMISATION Phase 1.4 : Modal Détail Action avec TradingView
 * - Affiche quantité détenue et valeur en euros
 * - Plus haut/bas depuis achat
 * - Plus haut/bas sur 52 semaines
 * - Graphique TradingView intégré
 * 
 * @module components/finance/bourse/StockDetailModal
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 11
 */

import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../ui/Modal';
import { useHistoricalData } from '../../../hooks/useHistoricalData';
import { calculatePriceStats } from '../../../services/finance/financeCalculations';
import TradingViewWidget from './TradingViewWidget';

/**
 * Modal de détail pour une position
 */
const StockDetailModal = ({ position, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  
  // Charger données historiques pour calculer les statistiques
  const { data: historicalDataMap, loading: historicalLoading } = useHistoricalData(
    position ? [position.ticker] : [],
    '1a', // 1 an pour calculer 52 semaines
    { enabled: !!position && isOpen }
  );

  // Calculer les métriques depuis les données historiques
  const metrics = useMemo(() => {
    if (!position || !historicalDataMap || !historicalDataMap[position.ticker]) {
      return null;
    }

    const historicalData = historicalDataMap[position.ticker];
    if (!historicalData || historicalData.length === 0) {
      return null;
    }

    // Utiliser dateAchat si disponible, sinon dateAjout
    const dateAchat = position.dateAchat || position.dateAjout || new Date();
    
    return calculatePriceStats(historicalData, dateAchat, 52);
  }, [position, historicalDataMap]);

  useEffect(() => {
    if (isOpen && position) {
      setLoading(true);
      // Attendre que les données historiques soient chargées
      if (!historicalLoading && historicalDataMap && historicalDataMap[position.ticker]) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [isOpen, position, historicalLoading, historicalDataMap]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Calculer valeur totale de la position
  const valeurTotale = useMemo(() => {
    if (!position || !metrics) return null;
    const prixActuel = metrics.currentPrice || position.yahooData?.prixActuel || position.prixEntree;
    return position.quantite * prixActuel;
  }, [position, metrics]);

  if (!position) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Détails - ${position.ticker}`}
      variant="info"
      className="max-w-5xl"
    >
      <div className="space-y-6">
        {/* Graphique TradingView */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Graphique TradingView</h3>
          <TradingViewWidget key={position.ticker} ticker={position.ticker} />
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Quantité détenue</div>
            <div className="text-2xl font-bold text-white">{position.quantite}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Valeur totale</div>
            <div className="text-2xl font-bold text-white">
              {valeurTotale ? formatCurrency(valeurTotale) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Statistiques depuis achat */}
        {metrics && (
          <div className="bg-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Statistiques depuis l'achat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 text-sm">Plus haut prix:</span>
                  <span className="text-green-400 font-semibold">
                    {metrics.highSincePurchase ? formatCurrency(metrics.highSincePurchase) : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  {metrics.highSincePurchase && metrics.lowSincePurchase && (
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${((metrics.highSincePurchase - metrics.lowSincePurchase) / metrics.lowSincePurchase) * 100}%`
                      }}
                    />
                  )}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 text-sm">Plus bas prix:</span>
                  <span className="text-red-400 font-semibold">
                    {metrics.lowSincePurchase ? formatCurrency(metrics.lowSincePurchase) : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  {metrics.highSincePurchase && metrics.lowSincePurchase && metrics.currentPrice && (
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${((metrics.currentPrice - metrics.lowSincePurchase) / (metrics.highSincePurchase - metrics.lowSincePurchase)) * 100}%`
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques 52 semaines */}
        {metrics && (
          <div className="bg-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Statistiques sur 52 semaines</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 text-sm">Plus haut prix:</span>
                  <span className="text-green-400 font-semibold">
                    {metrics.high52Weeks ? formatCurrency(metrics.high52Weeks) : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  {metrics.high52Weeks && metrics.low52Weeks && (
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${((metrics.high52Weeks - metrics.low52Weeks) / metrics.low52Weeks) * 100}%`
                      }}
                    />
                  )}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 text-sm">Plus bas prix:</span>
                  <span className="text-red-400 font-semibold">
                    {metrics.low52Weeks ? formatCurrency(metrics.low52Weeks) : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  {metrics.currentPrice && metrics.high52Weeks && metrics.low52Weeks && (
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${((metrics.currentPrice - metrics.low52Weeks) / (metrics.high52Weeks - metrics.low52Weeks)) * 100}%`
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-300 text-sm">Écart max:</span>
                  <span className="text-white font-semibold">
                    {metrics.high52Weeks && metrics.low52Weeks
                      ? formatCurrency(metrics.high52Weeks - metrics.low52Weeks)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-300 text-sm">Position actuelle:</span>
                  <span className={`font-semibold ${
                    metrics.currentPrice && metrics.high52Weeks && metrics.low52Weeks &&
                    metrics.currentPrice >= (metrics.high52Weeks + metrics.low52Weeks) / 2
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {metrics.currentPrice ? formatCurrency(metrics.currentPrice) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-slate-400">
            Chargement des données historiques...
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StockDetailModal;
