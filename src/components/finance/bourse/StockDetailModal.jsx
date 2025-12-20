/**
 * Modal de détail pour une action du portfolio
 * 
 * ✅ OPTIMISATION Phase 2.5 : Modal Détail Action avec TradingView et Métriques Avancées
 * 
 * Fonctionnalités :
 * - Graphique TradingView professionnel intégré
 * - Quantité détenue et valeur totale en euros
 * - Plus haut/bas prix depuis achat (avec barres de progression visuelles)
 * - Plus haut/bas prix sur 52 semaines (dernière année)
 * - Métriques de performance (plus-value, %)
 * - Calculs optimisés avec memoization
 * 
 * Optimisations :
 * - useMemo pour métriques calculées (évite recalculs)
 * - useHistoricalData avec cache partagé (évite requêtes dupliquées)
 * - Chargement conditionnel données historiques (seulement si modal ouvert)
 * - TradingViewWidget avec key pour remount propre
 * 
 * @module components/finance/bourse/StockDetailModal
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 11
 */

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import Modal from '../../ui/Modal';
import { useHistoricalData } from '../../../hooks/useHistoricalData';
import { calculatePriceStats } from '../../../services/finance/financeCalculations';
import TradingViewWidget from './TradingViewWidget';

/**
 * Modal de détail pour une position
 * 
 * ✅ OPTIMISATION Phase 2.5 : React.memo pour éviter re-renders inutiles
 */
const StockDetailModal = memo(({ position, isOpen, onClose }) => {
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

  // ✅ OPTIMISATION Phase 2.5 : useMemo pour formatters (évite recréation fonctions)
  const formatCurrency = useCallback((value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const formatPercent = useCallback((value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

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
      title={`Détails - ${position.ticker}${position.entreprise ? ` (${position.entreprise})` : ''}`}
      variant="info"
      className="max-w-6xl"
      showCloseButton={true}
    >
      <div className="space-y-6">
        {/* Graphique TradingView */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Graphique TradingView</h3>
          <TradingViewWidget key={position.ticker} ticker={position.ticker} />
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Position détenue */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Position détenue</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">Quantité:</span>
                <span className="text-white font-semibold">{position.quantite}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Valeur totale:</span>
                <span className="text-white font-semibold text-lg">
                  {valeurTotale ? formatCurrency(valeurTotale) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Prix d'achat:</span>
                <span className="text-white">{formatCurrency(position.prixEntree)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Prix actuel:</span>
                <span className={`font-semibold ${
                  (metrics?.currentPrice || position.yahooData?.prixActuel || position.prixEntree) >= position.prixEntree
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {formatCurrency(metrics?.currentPrice || position.yahooData?.prixActuel || position.prixEntree)}
                </span>
              </div>
            </div>
          </div>

          {/* Plus-value */}
          {position.calculs && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">Plus-value:</span>
                  <span className={`font-semibold ${
                    position.calculs.plusValueEuro >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {position.calculs.plusValueEuro >= 0 ? '+' : ''}
                    {formatCurrency(position.calculs.plusValueEuro)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Plus-value %:</span>
                  <span className={`font-semibold ${
                    position.calculs.plusValuePourcent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {position.calculs.plusValuePourcent >= 0 ? '+' : ''}
                    {position.calculs.plusValuePourcent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Métriques historiques */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Depuis achat */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-3">
                Depuis l'achat ({position.dateAchat ? new Date(position.dateAchat).toLocaleDateString('fr-FR') : 'N/A'})
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 text-sm">Plus haut prix:</span>
                    <span className="text-green-400 font-semibold">
                      {metrics.highSincePurchase ? formatCurrency(metrics.highSincePurchase) : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    {metrics.highSincePurchase && metrics.lowSincePurchase && position.prixEntree && (
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((metrics.highSincePurchase - position.prixEntree) / position.prixEntree) * 100))}%`
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
                    {metrics.highSincePurchase && metrics.lowSincePurchase && metrics.currentPrice && position.prixEntree && (
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, Math.abs(((metrics.lowSincePurchase - position.prixEntree) / position.prixEntree) * 100)))}%`
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Écart max:</span>
                    <span className="text-white font-semibold">
                      {metrics.highSincePurchase && metrics.lowSincePurchase
                        ? formatCurrency(metrics.highSincePurchase - metrics.lowSincePurchase)
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 52 semaines */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-3">
                52 semaines (dernière année)
              </h4>
              <div className="space-y-3">
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
                          width: `${Math.min(100, Math.max(0, ((metrics.high52Weeks - metrics.low52Weeks) / metrics.low52Weeks) * 100))}%`
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
                          width: `${Math.min(100, Math.max(0, ((metrics.currentPrice - metrics.low52Weeks) / (metrics.high52Weeks - metrics.low52Weeks)) * 100))}%`
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
}, (prevProps, nextProps) => {
  // Comparaison optimisée : seulement si position ou isOpen changent
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.position?.id === nextProps.position?.id &&
    prevProps.position?.ticker === nextProps.position?.ticker &&
    prevProps.position?.yahooData?.prixActuel === nextProps.position?.yahooData?.prixActuel &&
    prevProps.position?.calculs?.plusValueEuro === nextProps.position?.calculs?.plusValueEuro
  );
});

StockDetailModal.displayName = 'StockDetailModal';

export default StockDetailModal;
