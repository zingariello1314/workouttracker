/**
 * Composant carte d'une position boursière
 * 
 * ✅ OPTIMISATION Phase 2.2 : Memoization Composants et Props
 * - React.memo avec comparaison optimisée basée sur données position
 * - Réduction re-renders inutiles
 * 
 * @module components/finance/bourse/StockCard
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 6
 */

import React, { useState, memo, useCallback } from 'react';
import StockChart from './StockChart';
import TechnicalIndicators from './TechnicalIndicators';
import AlertSettings from './AlertSettings';
// ✅ PHASE 4 - Étape 4.9 : Import service devises pour affichage correct
import { formatCurrency as formatCurrencyWithDevise, detectCurrency } from '../../../services/finance/currencyService';

/**
 * Comparaison optimisée pour détecter changements position
 */
function arePositionsEqual(prevPos, nextPos) {
  // Comparaison basée sur champs critiques seulement
  return (
    prevPos.id === nextPos.id &&
    prevPos.quantite === nextPos.quantite &&
    prevPos.prixEntree === nextPos.prixEntree &&
    prevPos.yahooData?.prixActuel === nextPos.yahooData?.prixActuel &&
    prevPos.yahooData?.variationJour === nextPos.yahooData?.variationJour &&
    prevPos.calculs?.valeurPosition === nextPos.calculs?.valeurPosition &&
    prevPos.calculs?.plusValueEuro === nextPos.calculs?.plusValueEuro &&
    prevPos.calculs?.plusValuePourcent === nextPos.calculs?.plusValuePourcent &&
    prevPos.calculs?.signal?.signal === nextPos.calculs?.signal?.signal
  );
}

const StockCard = memo(({ position, onPositionClick }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);

  // ✅ OPTIMISATION Phase 2.2 : useCallback pour handlers (évite re-création fonctions)
  const toggleDetails = useCallback(() => setShowDetails(prev => !prev), []);
  const toggleChart = useCallback(() => setShowChart(prev => !prev), []);
  const toggleIndicators = useCallback(() => setShowIndicators(prev => !prev), []);
  const toggleAlertSettings = useCallback(() => setShowAlertSettings(prev => !prev), []);
  
  // ✅ OPTIMISATION Phase 2.5 : Handler pour ouvrir page détail
  const handleCardClick = useCallback(() => {
    if (onPositionClick) {
      onPositionClick(position.id);
    }
  }, [onPositionClick, position.id]);

  const calculs = position.calculs || {};
  const yahooData = position.yahooData || {};
  const variationColor = yahooData.variationJour >= 0 ? 'text-green-400' : 'text-red-400';
  const plusValueColor = calculs.plusValueEuro >= 0 ? 'text-green-400' : 'text-red-400';
  
  // ✅ PHASE 4 - Étape 4.9 : Détecter devise de la position
  const positionCurrency = calculs.currency || position.currency || detectCurrency(position.ticker) || 'EUR';
  
  // ✅ PHASE 4 - Étape 4.9 : Formater prix selon devise originale
  const formatPrice = useCallback((value) => {
    if (!Number.isFinite(value)) return 'N/A';
    return formatCurrencyWithDevise(value, positionCurrency, 'fr-FR');
  }, [positionCurrency]);
  
  // ✅ PHASE 4 - Étape 4.9 : Formater valeurs converties en EUR
  const formatCurrencyEUR = useCallback((value) => {
    if (!Number.isFinite(value)) return 'N/A';
    return formatCurrencyWithDevise(value, 'EUR', 'fr-FR');
  }, []);

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <>
      <div 
        className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-4 cursor-pointer hover:border-blue-500/50 transition-colors"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        aria-label={`Voir détails de ${position.ticker}`}
      >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{position.ticker}</h3>
          {position.entreprise && (
            <p className="text-slate-400 text-sm">{position.entreprise}</p>
          )}
        </div>
        <div className="text-right">
          {/* ✅ PHASE 4 - Étape 4.9 : Afficher prix actuel dans devise originale */}
          <div className="text-2xl font-bold text-white">
            {yahooData.prixActuel ? formatPrice(yahooData.prixActuel) : 'N/A'}
          </div>
          {yahooData.variationJour !== undefined && (
            <div className={`text-sm ${variationColor}`}>
              {formatPercent(yahooData.variationJour)}
            </div>
          )}
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-400 mb-1">Quantité</div>
          <div className="text-lg font-semibold text-white">{position.quantite}</div>
        </div>
        <div>
          <div className="text-sm text-slate-400 mb-1">Prix d'achat</div>
          {/* ✅ PHASE 4 - Étape 4.9 : Afficher prix d'achat dans devise originale */}
          <div className="text-lg font-semibold text-white">{formatPrice(position.prixEntree)}</div>
        </div>
        <div>
          <div className="text-sm text-slate-400 mb-1">Valeur position</div>
          {/* ✅ PHASE 4 - Étape 4.9 : Valeur position en EUR (convertie) */}
          <div className="text-lg font-semibold text-white">
            {calculs.valeurPosition ? formatCurrencyEUR(calculs.valeurPosition) : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400 mb-1">Plus-value</div>
          {/* ✅ PHASE 4 - Étape 4.9 : Plus-value en EUR (convertie) */}
          <div className={`text-lg font-semibold ${plusValueColor}`}>
            {calculs.plusValueEuro !== undefined ? (
              <>
                {calculs.plusValueEuro >= 0 ? '+' : ''}
                {formatCurrencyEUR(calculs.plusValueEuro)}
              </>
            ) : (
              'N/A'
            )}
          </div>
        </div>
      </div>

      {/* Plus-value pourcentage */}
      {calculs.plusValuePourcent !== undefined && (
        <div className={`text-center py-2 rounded-lg ${
          calculs.plusValuePourcent >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'
        }`}>
          <div className={`text-2xl font-bold ${plusValueColor}`}>
            {formatPercent(calculs.plusValuePourcent)}
          </div>
        </div>
      )}

      {/* Données Yahoo détaillées */}
      {showDetails && yahooData && (
        <div className="border-t border-slate-700 pt-4 space-y-2">
          <h4 className="font-semibold text-white mb-2">Données de marché</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {yahooData.volume && (
              <>
                <div className="text-slate-400">Volume</div>
                <div className="text-white">
                  {new Intl.NumberFormat('fr-FR').format(yahooData.volume)}
                </div>
              </>
            )}
            {yahooData.capitalisation > 0 && (
              <>
                <div className="text-slate-400">Capitalisation</div>
                <div className="text-white">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    notation: 'compact'
                  }).format(yahooData.capitalisation)}
                </div>
              </>
            )}
            {yahooData.ma20 && (
              <>
                <div className="text-slate-400">MA20</div>
                {/* ✅ PHASE 4 - Étape 4.9 : MA dans devise originale */}
                <div className="text-white">{formatPrice(yahooData.ma20)}</div>
              </>
            )}
            {yahooData.ma50 && (
              <>
                <div className="text-slate-400">MA50</div>
                {/* ✅ PHASE 4 - Étape 4.9 : MA dans devise originale */}
                <div className="text-white">{formatPrice(yahooData.ma50)}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Signal technique */}
      {calculs.signal && calculs.signal.signal !== 'NEUTRE' && (
        <div className="border-t border-slate-700 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Signal technique</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
              calculs.signal.signal === 'ACHAT' 
                ? 'bg-green-900/30 text-green-400'
                : 'bg-red-900/30 text-red-400'
            }`}>
              {calculs.signal.signal}
            </span>
          </div>
          {calculs.signal.confidence > 0 && (
            <div className="mt-2">
              <div className="text-xs text-slate-400 mb-1">Confiance: {calculs.signal.confidence}%</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${calculs.signal.confidence}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // ✅ OPTIMISATION Phase 2.5 : Empêcher ouverture modal lors clic bouton
            toggleDetails();
          }}
          className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex-1"
        >
          {showDetails ? 'Masquer détails' : 'Voir détails'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // ✅ OPTIMISATION Phase 2.5 : Empêcher ouverture modal lors clic bouton
            toggleChart();
          }}
          className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex-1"
        >
          {showChart ? 'Masquer graphique' : 'Voir graphique'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // ✅ OPTIMISATION Phase 2.5 : Empêcher ouverture modal lors clic bouton
            toggleIndicators();
          }}
          className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex-1"
        >
          {showIndicators ? 'Masquer indicateurs' : 'Indicateurs'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // ✅ OPTIMISATION Phase 2.5 : Empêcher ouverture modal lors clic bouton
            toggleAlertSettings();
          }}
          className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex-1"
        >
          {showAlertSettings ? 'Masquer paramètres' : 'Paramètres alertes'}
        </button>
      </div>

      {/* Paramètres alertes */}
      {showAlertSettings && (
        <div className="border-t border-slate-700 pt-4">
          <AlertSettings position={position} onClose={() => setShowAlertSettings(false)} />
        </div>
      )}

      {/* Indicateurs techniques */}
      {showIndicators && (
        <div className="border-t border-slate-700 pt-4">
          <TechnicalIndicators ticker={position.ticker} />
        </div>
      )}

      {/* Graphique */}
      {showChart && (
        <div className="border-t border-slate-700 pt-4">
          <StockChart
            ticker={position.ticker}
            dateAchat={position.dateAchat}
            prixEntree={position.prixEntree}
          />
        </div>
      )}
      </div>

    </>
  );
}, arePositionsEqual);

StockCard.displayName = 'StockCard';

export default StockCard;

