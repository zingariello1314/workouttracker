/**
 * Page de détail pour une action du portfolio
 * 
 * ✅ PHASE 6 - Étape 6.1 : Page dédiée avec navigation retour
 * 
 * Fonctionnalités :
 * - Graphique TradingView professionnel intégré
 * - Quantité détenue et valeur totale en euros
 * - Plus haut/bas prix depuis achat (avec barres de progression visuelles)
 * - Plus haut/bas prix sur 52 semaines (dernière année)
 * - Métriques de performance (plus-value, %)
 * - Calculs optimisés avec memoization
 * - Navigation retour avec flèche
 * 
 * Optimisations :
 * - useMemo pour métriques calculées (évite recalculs)
 * - useHistoricalData avec cache partagé (évite requêtes dupliquées)
 * - Chargement conditionnel données historiques (seulement si page visible)
 * - TradingViewWidget avec key pour remount propre
 * 
 * @module components/finance/bourse/StockDetailPage
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 11 (mise à jour)
 */

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useHistoricalData } from '../../../hooks/useHistoricalData';
import { calculatePriceStats } from '../../../services/finance/financeCalculations';
import TradingViewWidget from './TradingViewWidget';
// ✅ PHASE 4 - Étape 4.9 : Import service devises pour affichage correct
import { formatCurrency as formatCurrencyWithDevise, detectCurrency } from '../../../services/finance/currencyService';

/**
 * Page de détail pour une position
 * 
 * ✅ PHASE 6 - Étape 6.1 : Page dédiée avec navigation retour
 */
const StockDetailPage = memo(({ position, onBack }) => {
  const [loading, setLoading] = useState(true);
  
  // Charger données historiques pour calculer les statistiques
  const { data: historicalDataMap, loading: historicalLoading } = useHistoricalData(
    position ? [position.ticker] : [],
    '1a', // 1 an pour calculer 52 semaines
    { enabled: !!position }
  );

  // Calculer les métriques depuis les données historiques
  const metrics = useMemo(() => {
    if (!position || !historicalDataMap || !historicalDataMap[position.ticker]) {
      return null;
    }

    const historicalData = historicalDataMap[position.ticker];
    // ✅ PHASE 4 - Étape 4.10 : Vérifier que historicalData est un tableau
    if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
      return null;
    }

    // Utiliser dateAchat si disponible, sinon dateAjout
    const dateAchat = position.dateAchat || position.dateAjout || new Date();
    
    return calculatePriceStats(historicalData, dateAchat, 52);
  }, [position, historicalDataMap]);

  useEffect(() => {
    if (position) {
      setLoading(true);
      // Attendre que les données historiques soient chargées
      if (!historicalLoading && historicalDataMap && historicalDataMap[position.ticker]) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [position, historicalLoading, historicalDataMap]);

  // ✅ PHASE 4 - Étape 4.9 : Détecter devise de la position
  const positionCurrency = useMemo(() => {
    return position?.calculs?.currency || position?.currency || detectCurrency(position?.ticker) || 'EUR';
  }, [position]);

  // ✅ PHASE 4 - Étape 4.9 : Formater prix selon devise originale
  const formatPrice = useCallback((value) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
    return formatCurrencyWithDevise(value, positionCurrency, 'fr-FR');
  }, [positionCurrency]);
  
  // ✅ PHASE 4 - Étape 4.9 : Formater valeurs converties en EUR
  const formatCurrencyEUR = useCallback((value) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
    return formatCurrencyWithDevise(value, 'EUR', 'fr-FR');
  }, []);

  const formatPercent = useCallback((value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

  // Calculer valeur totale de la position (en devise originale)
  // ✅ FIX : Pour positions groupées, utiliser les métriques agrégées
  const valeurTotale = useMemo(() => {
    if (!position) return null;
    
    // Si position groupée, utiliser valeur totale agrégée
    if (position._grouped && position.calculs?.valeurPosition) {
      return position.calculs.valeurPosition;
    }
    
    // Sinon, calculer pour position individuelle
    if (!metrics) return null;
    const prixActuel = metrics.currentPrice || position.yahooData?.prixActuel || position.prixEntree;
    return position.quantite * prixActuel;
  }, [position, metrics]);

  if (!position) return null;

  return (
    <div className="stock-detail-page space-y-6">
      {/* Header avec flèche retour */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center justify-center w-10 h-10"
          aria-label="Retour au portfolio"
          title="Retour au portfolio"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {position.ticker}
            {position.entreprise && (
              <span className="text-xl font-normal text-slate-400 ml-2">
                ({position.entreprise})
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-1">
            {position._grouped ? `Détails de l'entreprise (${position._positions?.length || 0} position${(position._positions?.length || 0) > 1 ? 's' : ''})` : 'Détails de la position'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* ✅ FIX : Afficher toutes les positions si position groupée */}
        {position._grouped && position._positions && position._positions.length > 1 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Toutes les positions</h2>
            <div className="space-y-4">
              {position._positions.map((pos, index) => (
                <div key={pos.id || index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Quantité</div>
                      <div className="text-lg font-semibold text-white">{pos.quantite}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Prix d'achat</div>
                      <div className="text-lg font-semibold text-white">
                        {formatPrice(pos.prixEntree)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Date d'achat</div>
                      <div className="text-lg font-semibold text-white">
                        {pos.dateAchat ? new Date(pos.dateAchat).toLocaleDateString('fr-FR') : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Plus-value</div>
                      <div className={`text-lg font-semibold ${
                        (pos.calculs?.plusValueEuro || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {pos.calculs?.plusValueEuro !== undefined 
                          ? `${pos.calculs.plusValueEuro >= 0 ? '+' : ''}${formatCurrencyEUR(pos.calculs.plusValueEuro)}`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {pos.calculs?.plusValuePourcent !== undefined && (
                    <div className="mt-2 text-center">
                      <span className={`text-sm font-semibold ${
                        pos.calculs.plusValuePourcent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercent(pos.calculs.plusValuePourcent)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
                <span className="text-white font-semibold">
                  {position._grouped ? (position.totalQuantite || position.quantite) : position.quantite}
                  {position._grouped && position._positions && position._positions.length > 1 && (
                    <span className="text-slate-400 text-sm ml-2">
                      ({position._positions.length} position{(position._positions.length > 1 ? 's' : '')})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Valeur totale:</span>
                {/* ✅ PHASE 4 - Étape 4.9 : Valeur totale en devise originale */}
                <span className="text-white font-semibold text-lg">
                  {valeurTotale ? formatPrice(valeurTotale) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Prix d'achat:</span>
                {/* ✅ PHASE 4 - Étape 4.9 : Prix d'achat dans devise originale */}
                <span className="text-white">{formatPrice(position.prixEntree)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Prix actuel:</span>
                {/* ✅ PHASE 4 - Étape 4.9 : Prix actuel dans devise originale */}
                <span className={`font-semibold ${
                  (metrics?.currentPrice || position.yahooData?.prixActuel || position.prixEntree) >= position.prixEntree
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {formatPrice(metrics?.currentPrice || position.yahooData?.prixActuel || position.prixEntree)}
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
                  {/* ✅ PHASE 4 - Étape 4.9 : Plus-value en EUR (convertie) */}
                  <span className={`font-semibold ${
                    position.calculs.plusValueEuro >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {position.calculs.plusValueEuro >= 0 ? '+' : ''}
                    {formatCurrencyEUR(position.calculs.plusValueEuro)}
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
                    {/* ✅ PHASE 4 - Étape 4.9 : Prix historique dans devise originale */}
                    <span className="text-green-400 font-semibold">
                      {metrics.highSincePurchase ? formatPrice(metrics.highSincePurchase) : 'N/A'}
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
                    {/* ✅ PHASE 4 - Étape 4.9 : Prix historique dans devise originale */}
                    <span className="text-red-400 font-semibold">
                      {metrics.lowSincePurchase ? formatPrice(metrics.lowSincePurchase) : 'N/A'}
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
                    {/* ✅ PHASE 4 - Étape 4.9 : Écart en devise originale */}
                    <span className="text-white font-semibold">
                      {metrics.highSincePurchase && metrics.lowSincePurchase
                        ? formatPrice(metrics.highSincePurchase - metrics.lowSincePurchase)
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
                    {/* ✅ PHASE 4 - Étape 4.9 : Prix historique dans devise originale */}
                    <span className="text-green-400 font-semibold">
                      {metrics.high52Weeks ? formatPrice(metrics.high52Weeks) : 'N/A'}
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
                    {/* ✅ PHASE 4 - Étape 4.9 : Prix historique dans devise originale */}
                    <span className="text-red-400 font-semibold">
                      {metrics.low52Weeks ? formatPrice(metrics.low52Weeks) : 'N/A'}
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
                    {/* ✅ PHASE 4 - Étape 4.9 : Écart en devise originale */}
                    <span className="text-white font-semibold">
                      {metrics.high52Weeks && metrics.low52Weeks
                        ? formatPrice(metrics.high52Weeks - metrics.low52Weeks)
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
                      {/* ✅ PHASE 4 - Étape 4.9 : Prix actuel dans devise originale */}
                      {metrics.currentPrice ? formatPrice(metrics.currentPrice) : 'N/A'}
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
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison optimisée : seulement si position change
  return (
    prevProps.position?.id === nextProps.position?.id &&
    prevProps.position?.ticker === nextProps.position?.ticker &&
    prevProps.position?.yahooData?.prixActuel === nextProps.position?.yahooData?.prixActuel &&
    prevProps.position?.calculs?.plusValueEuro === nextProps.position?.calculs?.plusValueEuro
  );
});

StockDetailPage.displayName = 'StockDetailPage';

export default StockDetailPage;
