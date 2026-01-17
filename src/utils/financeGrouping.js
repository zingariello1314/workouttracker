/**
 * Utilitaires pour grouper les positions par ticker/entreprise
 * 
 * @module utils/financeGrouping
 */

/**
 * Grouper les positions par ticker
 * 
 * @param {Array} positions - Liste des positions
 * @returns {Map<string, Array>} Map avec ticker comme clé et array de positions comme valeur
 */
export function groupPositionsByTicker(positions) {
  const grouped = new Map();
  
  for (const position of positions) {
    const ticker = position.ticker?.toUpperCase() || 'UNKNOWN';
    if (!grouped.has(ticker)) {
      grouped.set(ticker, []);
    }
    grouped.get(ticker).push(position);
  }
  
  return grouped;
}

/**
 * Calculer les métriques agrégées pour toutes les positions d'un ticker
 * 
 * @param {Array} positions - Liste des positions pour un même ticker
 * @returns {Object} Métriques agrégées
 */
export function calculateTickerAggregatedMetrics(positions) {
  if (!positions || positions.length === 0) {
    return {
      totalQuantite: 0,
      totalInvestissement: 0,
      totalValeur: 0,
      totalPlusValue: 0,
      totalPlusValuePourcent: 0,
      prixMoyenAchat: 0,
      nombrePositions: 0,
      entreprise: null,
      ticker: null,
      yahooData: null
    };
  }

  // Utiliser les données de la première position pour les infos communes
  const firstPosition = positions[0];
  const ticker = firstPosition.ticker;
  const entreprise = firstPosition.entreprise || ticker;
  
  // Utiliser yahooData de la première position (toutes les positions d'un même ticker ont le même prix actuel)
  const yahooData = firstPosition.yahooData || null;
  const prixActuel = yahooData?.prixActuel || firstPosition.prixEntree;

  // Calculer totaux
  const totalQuantite = positions.reduce((sum, pos) => sum + (pos.quantite || 0), 0);
  const totalInvestissement = positions.reduce((sum, pos) => {
    const investi = pos.calculs?.investissementConverti 
      || pos.investissementTotal 
      || ((pos.quantite || 0) * (pos.prixEntree || 0));
    return sum + (Number.isFinite(investi) ? investi : 0);
  }, 0);
  
  const totalValeur = positions.reduce((sum, pos) => {
    const valeur = pos.calculs?.valeurPosition || 0;
    return sum + (Number.isFinite(valeur) ? valeur : 0);
  }, 0);
  
  const totalPlusValue = positions.reduce((sum, pos) => {
    const plusValue = pos.calculs?.plusValueEuro || 0;
    return sum + (Number.isFinite(plusValue) ? plusValue : 0);
  }, 0);

  // Prix moyen d'achat (pondéré par quantité)
  const prixMoyenAchat = totalQuantite > 0 
    ? positions.reduce((sum, pos) => sum + ((pos.prixEntree || 0) * (pos.quantite || 0)), 0) / totalQuantite
    : 0;

  // Plus-value en pourcentage (basée sur investissement total)
  const totalPlusValuePourcent = totalInvestissement > 0
    ? (totalPlusValue / totalInvestissement) * 100
    : 0;

  return {
    totalQuantite,
    totalInvestissement,
    totalValeur,
    totalPlusValue,
    totalPlusValuePourcent,
    prixMoyenAchat,
    nombrePositions: positions.length,
    entreprise,
    ticker,
    yahooData,
    prixActuel,
    positions // Garder référence aux positions individuelles
  };
}

/**
 * Créer un objet "position groupée" pour l'affichage
 * 
 * @param {string} ticker - Ticker de l'entreprise
 * @param {Array} positions - Liste des positions pour ce ticker
 * @returns {Object} Position groupée avec métriques agrégées
 */
export function createGroupedPosition(ticker, positions) {
  const metrics = calculateTickerAggregatedMetrics(positions);
  
  return {
    id: `grouped-${ticker}`, // ID unique pour la position groupée
    ticker,
    entreprise: metrics.entreprise,
    quantite: metrics.totalQuantite,
    prixEntree: metrics.prixMoyenAchat,
    yahooData: metrics.yahooData,
    calculs: {
      valeurPosition: metrics.totalValeur,
      plusValueEuro: metrics.totalPlusValue,
      plusValuePourcent: metrics.totalPlusValuePourcent,
      investissementConverti: metrics.totalInvestissement,
      prixActuel: metrics.prixActuel
    },
    _grouped: true, // Flag pour indiquer que c'est une position groupée
    _positions: positions // Référence aux positions individuelles
  };
}
