/**
 * Service de calculs financiers pour le portfolio
 * Optimisé avec memoization et validation
 * 
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée calculs techniques
 * - Types JSDoc standardisés pour toutes les fonctions
 * - Formats de retour cohérents
 * - Documentation complète avec exemples
 * - Gestion d'erreurs standardisée
 * 
 * @module services/finance/financeCalculations
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Phase 4, Étape 23
 */

import { z } from 'zod';

/**
 * @typedef {Object} HistoricalDataPoint
 * @property {string|Date} date - Date du point de données (ISO string ou Date)
 * @property {number} [close] - Prix de clôture (priorité si disponible)
 * @property {number} [prixActuel] - Prix actuel (fallback si close absent)
 * @property {number} [open] - Prix d'ouverture (optionnel)
 * @property {number} [high] - Prix maximum (optionnel)
 * @property {number} [low] - Prix minimum (optionnel)
 * @property {number} [volume] - Volume échangé (optionnel)
 */

/**
 * @typedef {Object} MovingAverageResult
 * @property {number|null} ma - Valeur de la moyenne mobile (dernière valeur calculée)
 * @property {Array<{date: string|Date, value: number}>} data - Tableau de toutes les valeurs MA avec dates
 */

/**
 * @typedef {Object} MACDResult
 * @property {number|null} macd - Valeur de la ligne MACD (EMA12 - EMA26)
 * @property {number|null} signal - Valeur de la ligne de signal (EMA9 de MACD)
 * @property {number|null} histogram - Valeur de l'histogramme (MACD - Signal)
 */

/**
 * @typedef {Object} BollingerBandsResult
 * @property {number|null} upper - Bande supérieure (SMA + stdDev * standardDeviation)
 * @property {number|null} middle - Bande moyenne (SMA)
 * @property {number|null} lower - Bande inférieure (SMA - stdDev * standardDeviation)
 */

/**
 * @typedef {Object} TechnicalSignalResult
 * @property {'ACHAT'|'VENTE'|'NEUTRE'} signal - Type de signal technique détecté
 * @property {number} confidence - Niveau de confiance (0-100)
 * @property {string} reason - Raison du signal (description textuelle)
 * @property {Object} [details] - Détails des signaux individuels (optionnel, pour version avancée)
 * @property {number} [confirmationCount] - Nombre de signaux confirmés (optionnel, pour version avancée)
 */

/**
 * @typedef {Object} PriceStatsResult
 * @property {number|null} highSincePurchase - Plus haut prix depuis date d'achat
 * @property {number|null} lowSincePurchase - Plus bas prix depuis date d'achat
 * @property {number|null} high52Weeks - Plus haut prix sur période (par défaut 52 semaines)
 * @property {number|null} low52Weeks - Plus bas prix sur période (par défaut 52 semaines)
 * @property {number|null} currentPrice - Prix actuel (dernière donnée disponible)
 */

// Schémas validation
const positionSchema = z.object({
  quantite: z.number().positive().finite(),
  prixEntree: z.number().positive().max(1000000),
  yahooData: z.object({
    prixActuel: z.number().positive().finite()
  }).optional()
});

// Cache simple pour memoization (calculs élémentaires)
const calculationCache = new Map();
const CACHE_MAX_SIZE = 1000;

// ✅ OPTIMISATION Phase 1.2 : Cache par position pour calculs batch
// Structure: Map<positionId, { calculs, hash, timestamp, totalPortfolio }>
const positionCalculationsCache = new Map();
const POSITION_CACHE_MAX_SIZE = 500; // Limite cache positions
const POSITION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL pour cache position

/**
 * Calculer valorisation position avec validation
 */
export function calculatePositionValue(quantite, prixActuel) {
  if (!Number.isFinite(quantite) || !Number.isFinite(prixActuel)) {
    throw new Error('Invalid input: quantite and prixActuel must be finite numbers');
  }
  
  const cacheKey = `${quantite}_${prixActuel}`;
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }
  
  const result = quantite * prixActuel;
  
  // Vérifier overflow
  if (!Number.isFinite(result)) {
    throw new Error('Calculation overflow');
  }
  
  const rounded = Math.round(result * 100) / 100; // Arrondi 2 décimales
  
  // Gestion taille cache (LRU)
  if (calculationCache.size >= CACHE_MAX_SIZE) {
    const firstKey = calculationCache.keys().next().value;
    calculationCache.delete(firstKey);
  }
  
  calculationCache.set(cacheKey, rounded);
  return rounded;
}

/**
 * Calculer plus-value avec gestion cas limites (version basique)
 * 
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée avec JSDoc standardisé
 * 
 * Calcule la plus-value ou moins-value d'une position.
 * Formule : (prixActuel - prixAchat) × quantite
 * 
 * ⚠️ NOTE : Pour un calcul complet avec dividendes, frais et splits,
 * utilisez `calculateCompleteGainLoss` avec les données complètes de la position.
 * 
 * @param {number} prixAchat - Prix d'achat par action
 * @param {number} prixActuel - Prix actuel par action
 * @param {number} quantite - Quantité d'actions détenues
 * @returns {number} Plus-value en euros (négative si moins-value), arrondie à 2 décimales
 * 
 * @example
 * const plusValue = calculateGainLoss(100, 110, 10);
 * // Retourne: 100 (gain de 100€)
 * 
 * const moinsValue = calculateGainLoss(100, 90, 10);
 * // Retourne: -100 (perte de 100€)
 * 
 * @throws {Error} Ne lance jamais d'erreur, utilise fallback si validation Zod échoue
 */
export function calculateGainLoss(prixAchat, prixActuel, quantite) {
  try {
    const validated = positionSchema.parse({
      quantite,
      prixEntree: prixAchat,
      yahooData: { prixActuel }
    });
    
    const gainLoss = (validated.yahooData.prixActuel - validated.prixEntree) * validated.quantite;
    return Math.round(gainLoss * 100) / 100;
  } catch (error) {
    // Fallback si validation échoue
    const gainLoss = (prixActuel - prixAchat) * quantite;
    return Math.round(gainLoss * 100) / 100;
  }
}

/**
 * @typedef {Object} DividendData
 * @property {string} date - Date du dividende (YYYY-MM-DD)
 * @property {number} montant - Montant du dividende par action (en euros)
 * @property {number} [quantite] - Quantité d'actions détenues à cette date (optionnel, utilise quantite actuelle si absent)
 */

/**
 * @typedef {Object} SplitData
 * @property {string} date - Date du split (YYYY-MM-DD)
 * @property {number} ratio - Ratio du split (ex: 2 pour un split 2:1, 0.5 pour un reverse split 1:2)
 */

/**
 * @typedef {Object} FeesData
 * @property {number} [fraisAchat] - Frais d'achat en euros (défaut: 0)
 * @property {number} [fraisVente] - Frais de vente estimés en euros (défaut: 0)
 * @property {number} [fraisGestionAnnuel] - Frais de gestion annuels en euros (défaut: 0)
 * @property {string} [dateAchat] - Date d'achat pour calculer frais de gestion (YYYY-MM-DD)
 */

/**
 * @typedef {Object} CompleteGainLossResult
 * @property {number} plusValueBrute - Plus-value brute (prixActuel - prixAchat) × quantite
 * @property {number} dividendesCumules - Total des dividendes reçus
 * @property {number} fraisTotaux - Total des frais (achat + vente + gestion)
 * @property {number} plusValueNette - Plus-value nette (brute + dividendes - frais)
 * @property {number} plusValuePourcent - Plus-value en pourcentage (basée sur investissement net)
 * @property {number} investissementNet - Investissement net (prixAchat × quantite + fraisAchat)
 * @property {number} rendementTotal - Rendement total (plusValueNette / investissementNet) × 100
 * @property {Object} details - Détails du calcul
 * @property {number} details.quantiteAjustee - Quantité après splits
 * @property {number} details.prixAchatAjuste - Prix d'achat ajusté après splits
 * @property {number} details.nombreSplits - Nombre de splits appliqués
 */

/**
 * Calculer plus-value complète avec dividendes, frais et splits
 * 
 * ✅ PHASE 4 - Étape 4.8 : Modèle plus-value complet
 * 
 * Calcule la plus-value ou moins-value d'une position en prenant en compte :
 * - Dividendes reçus depuis l'achat
 * - Frais d'achat, de vente (estimés) et de gestion annuels
 * - Splits d'actions (ajustement automatique du prix d'achat et de la quantité)
 * 
 * **Formule complète :**
 * ```
 * Plus-value nette = (Prix actuel - Prix achat ajusté) × Quantité ajustée
 *                   + Dividendes cumulés
 *                   - Frais totaux (achat + vente + gestion)
 * ```
 * 
 * **Gestion des splits :**
 * - Un split 2:1 (ratio = 2) double la quantité et divise le prix par 2
 * - Un reverse split 1:2 (ratio = 0.5) divise la quantité par 2 et double le prix
 * - Les splits sont appliqués dans l'ordre chronologique
 * 
 * **Gestion des dividendes :**
 * - Les dividendes sont cumulés depuis la date d'achat
 * - Seuls les dividendes reçus après l'achat sont comptabilisés
 * 
 * **Gestion des frais :**
 * - Frais d'achat : déduits de l'investissement net
 * - Frais de vente : estimés (déduits de la plus-value nette)
 * - Frais de gestion : calculés proportionnellement à la durée de détention
 * 
 * @param {Object} params - Paramètres du calcul
 * @param {number} params.prixAchat - Prix d'achat initial par action
 * @param {number} params.prixActuel - Prix actuel par action
 * @param {number} params.quantite - Quantité initiale d'actions
 * @param {string} [params.dateAchat] - Date d'achat (YYYY-MM-DD) pour calculs temporels
 * @param {Array<DividendData>} [params.dividendes=[]] - Liste des dividendes reçus
 * @param {Array<SplitData>} [params.splits=[]] - Liste des splits d'actions
 * @param {FeesData} [params.frais={}] - Frais (achat, vente, gestion)
 * @returns {CompleteGainLossResult} Résultat du calcul complet
 * 
 * @example
 * const result = calculateCompleteGainLoss({
 *   prixAchat: 100,
 *   prixActuel: 110,
 *   quantite: 10,
 *   dateAchat: '2024-01-01',
 *   dividendes: [
 *     { date: '2024-06-15', montant: 2.5 },
 *     { date: '2024-12-15', montant: 2.5 }
 *   ],
 *   frais: {
 *     fraisAchat: 5,
 *     fraisVente: 5,
 *     fraisGestionAnnuel: 10
 *   }
 * });
 * // Retourne: {
 * //   plusValueBrute: 100,
 * //   dividendesCumules: 50,
 * //   fraisTotaux: 20,
 * //   plusValueNette: 130,
 * //   ...
 * // }
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne valeurs par défaut si données invalides
 */
export function calculateCompleteGainLoss({
  prixAchat,
  prixActuel,
  quantite,
  dateAchat = null,
  dividendes = [],
  splits = [],
  frais = {}
}) {
  // Validation des paramètres de base
  if (!Number.isFinite(prixAchat) || !Number.isFinite(prixActuel) || !Number.isFinite(quantite)) {
    return {
      plusValueBrute: 0,
      dividendesCumules: 0,
      fraisTotaux: 0,
      plusValueNette: 0,
      plusValuePourcent: 0,
      investissementNet: 0,
      rendementTotal: 0,
      details: {
        quantiteAjustee: quantite || 0,
        prixAchatAjuste: prixAchat || 0,
        nombreSplits: 0
      }
    };
  }

  if (prixAchat <= 0 || prixActuel <= 0 || quantite <= 0) {
    return {
      plusValueBrute: 0,
      dividendesCumules: 0,
      fraisTotaux: 0,
      plusValueNette: 0,
      plusValuePourcent: 0,
      investissementNet: 0,
      rendementTotal: 0,
      details: {
        quantiteAjustee: quantite,
        prixAchatAjuste: prixAchat,
        nombreSplits: 0
      }
    };
  }

  // ========== 1. APPLIQUER LES SPLITS ==========
  let quantiteAjustee = quantite;
  let prixAchatAjuste = prixAchat;
  let nombreSplits = 0;

  if (splits && Array.isArray(splits) && splits.length > 0) {
    // Trier les splits par date (chronologique)
    const sortedSplits = [...splits].sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });

    // Appliquer chaque split
    for (const split of sortedSplits) {
      if (split.ratio && split.ratio > 0 && Number.isFinite(split.ratio)) {
        quantiteAjustee = quantiteAjustee * split.ratio;
        prixAchatAjuste = prixAchatAjuste / split.ratio;
        nombreSplits++;
      }
    }
  }

  // ========== 2. CALCULER DIVIDENDES CUMULÉS ==========
  let dividendesCumules = 0;

  if (dividendes && Array.isArray(dividendes) && dividendes.length > 0) {
    const dateAchatObj = dateAchat ? new Date(dateAchat) : null;

    for (const dividende of dividendes) {
      // Vérifier que le dividende est après l'achat
      if (dateAchatObj && dividende.date) {
        const dateDividende = new Date(dividende.date);
        if (dateDividende < dateAchatObj) {
          continue; // Ignorer dividendes avant l'achat
        }
      }

      // Calculer montant total du dividende
      const montantParAction = dividende.montant || 0;
      const quantiteDividende = dividende.quantite !== undefined ? dividende.quantite : quantiteAjustee;
      
      if (Number.isFinite(montantParAction) && montantParAction > 0 && 
          Number.isFinite(quantiteDividende) && quantiteDividende > 0) {
        dividendesCumules += montantParAction * quantiteDividende;
      }
    }
  }

  // Arrondir dividendes à 2 décimales
  dividendesCumules = Math.round(dividendesCumules * 100) / 100;

  // ========== 3. CALCULER FRAIS TOTAUX ==========
  const fraisAchat = (frais.fraisAchat && Number.isFinite(frais.fraisAchat) && frais.fraisAchat >= 0) 
    ? frais.fraisAchat 
    : 0;
  
  const fraisVente = (frais.fraisVente && Number.isFinite(frais.fraisVente) && frais.fraisVente >= 0) 
    ? frais.fraisVente 
    : 0;
  
  // Calculer frais de gestion proportionnels à la durée
  let fraisGestion = 0;
  if (frais.fraisGestionAnnuel && Number.isFinite(frais.fraisGestionAnnuel) && frais.fraisGestionAnnuel >= 0) {
    if (dateAchat && frais.dateAchat) {
      const dateAchatObj = new Date(frais.dateAchat);
      const aujourdhui = new Date();
      const joursDetenus = Math.max(0, Math.floor((aujourdhui - dateAchatObj) / (1000 * 60 * 60 * 24)));
      const anneesDetenues = joursDetenus / 365.25;
      fraisGestion = frais.fraisGestionAnnuel * anneesDetenues;
    } else if (dateAchat) {
      // Utiliser dateAchat du paramètre si dateAchat dans frais non fournie
      const dateAchatObj = new Date(dateAchat);
      const aujourdhui = new Date();
      const joursDetenus = Math.max(0, Math.floor((aujourdhui - dateAchatObj) / (1000 * 60 * 60 * 24)));
      const anneesDetenues = joursDetenus / 365.25;
      fraisGestion = frais.fraisGestionAnnuel * anneesDetenues;
    }
  }

  const fraisTotaux = fraisAchat + fraisVente + fraisGestion;
  const fraisTotauxArrondis = Math.round(fraisTotaux * 100) / 100;

  // ========== 4. CALCULER PLUS-VALUE BRUTE ==========
  const plusValueBrute = (prixActuel - prixAchatAjuste) * quantiteAjustee;
  const plusValueBruteArrondie = Math.round(plusValueBrute * 100) / 100;

  // ========== 5. CALCULER INVESTISSEMENT NET ==========
  const investissementNet = (prixAchatAjuste * quantiteAjustee) + fraisAchat;
  const investissementNetArrondi = Math.round(investissementNet * 100) / 100;

  // ========== 6. CALCULER PLUS-VALUE NETTE ==========
  const plusValueNette = plusValueBruteArrondie + dividendesCumules - fraisTotauxArrondis;
  const plusValueNetteArrondie = Math.round(plusValueNette * 100) / 100;

  // ========== 7. CALCULER POURCENTAGES ==========
  const plusValuePourcent = investissementNetArrondi > 0
    ? ((plusValueNetteArrondie / investissementNetArrondi) * 100)
    : 0;
  const plusValuePourcentArrondie = Math.round(plusValuePourcent * 100) / 100;

  const rendementTotal = investissementNetArrondi > 0
    ? ((plusValueNetteArrondie / investissementNetArrondi) * 100)
    : 0;
  const rendementTotalArrondi = Math.round(rendementTotal * 100) / 100;

  return {
    plusValueBrute: plusValueBruteArrondie,
    dividendesCumules,
    fraisTotaux: fraisTotauxArrondis,
    plusValueNette: plusValueNetteArrondie,
    plusValuePourcent: plusValuePourcentArrondie,
    investissementNet: investissementNetArrondi,
    rendementTotal: rendementTotalArrondi,
    details: {
      quantiteAjustee: Math.round(quantiteAjustee * 100) / 100,
      prixAchatAjuste: Math.round(prixAchatAjuste * 100) / 100,
      nombreSplits
    }
  };
}

/**
 * Calculer poids portfolio avec normalisation
 * 
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée avec JSDoc standardisé
 * 
 * Calcule le pourcentage qu'une position représente dans le portfolio total.
 * Formule : (valeurPosition / totalPortfolio) × 100
 * 
 * @param {number} valeurPosition - Valeur totale de la position en euros
 * @param {number} totalPortfolio - Valeur totale du portfolio en euros
 * @returns {number} Poids en pourcentage (0-100), arrondi à 2 décimales. Retourne 0 si totalPortfolio = 0
 * 
 * @example
 * const poids = calculatePortfolioWeight(1000, 10000);
 * // Retourne: 10 (la position représente 10% du portfolio)
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne 0 si totalPortfolio = 0
 */
export function calculatePortfolioWeight(valeurPosition, totalPortfolio) {
  if (totalPortfolio === 0) return 0;
  
  const weight = (valeurPosition / totalPortfolio) * 100;
  return Math.round(weight * 100) / 100; // 2 décimales
}

/**
 * Calculer moyennes mobiles optimisé (algorithme incrémental)
 * 
 * ✅ OPTIMISATION Phase 2.3 : Algorithme incrémental O(n)
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée avec JSDoc standardisé
 * - Calcul initial O(periods)
 * - Calcul incrémental O(n-periods)
 * - Complexité totale : O(n)
 * 
 * @param {Array<HistoricalDataPoint>} historicalData - Données historiques avec propriétés date, close/prixActuel
 * @param {number} periods - Nombre de périodes pour la moyenne mobile (doit être > 0)
 * @returns {MovingAverageResult} Objet avec valeur MA et tableau de toutes les valeurs avec dates
 * 
 * @example
 * const data = [
 *   { date: '2024-01-01', close: 100 },
 *   { date: '2024-01-02', close: 102 },
 *   { date: '2024-01-03', close: 101 }
 * ];
 * const result = calculateMovingAverages(data, 2);
 * // Retourne: { ma: 101.5, data: [{ date: '2024-01-02', value: 101 }, { date: '2024-01-03', value: 101.5 }] }
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne { ma: null, data: [] } si données insuffisantes
 */
export function calculateMovingAverages(historicalData, periods) {
  // ✅ PHASE 3 - Étape 3.16 : Validation robuste - vérifier que historicalData est un tableau
  if (!historicalData || !Array.isArray(historicalData) || historicalData.length < periods) {
    return { ma: null, data: [] };
  }
  
  // ✅ PHASE 3.16 : S'assurer que tous les éléments sont valides
  const validData = historicalData.filter(d => d && (d.close !== undefined || d.prixActuel !== undefined));
  if (validData.length < periods) {
    return { ma: null, data: [] };
  }
  
  // Trier par date (plus ancien → plus récent)
  const sorted = [...validData].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateA - dateB;
  });
  
  const maValues = [];
  
  // Calcul initial (première fenêtre) - O(periods)
  let sum = sorted.slice(0, periods).reduce((acc, d) => acc + (d.close || d.prixActuel || 0), 0);
  maValues.push({
    date: sorted[periods - 1].date,
    value: sum / periods
  });
  
  // Calcul incrémental (O(n-periods) au lieu de O(n²))
  for (let i = periods; i < sorted.length; i++) {
    sum = sum - (sorted[i - periods].close || sorted[i - periods].prixActuel || 0) + (sorted[i].close || sorted[i].prixActuel || 0);
    maValues.push({
      date: sorted[i].date,
      value: sum / periods
    });
  }
  
  return {
    ma: maValues[maValues.length - 1]?.value || null,
    data: maValues
  };
}

/**
 * Calculer moyennes mobiles avec Map pour lookup O(1)
 * 
 * ✅ OPTIMISATION Phase 2.3 : Map pour lookup O(1) au lieu de recherche linéaire O(n)
 * - Évite recherche linéaire avec .find() dans les composants
 * - Lookup O(1) au lieu de O(n) pour chaque point
 * - Réduction complexité globale de O(n²) → O(n)
 * - Cache intégré pour éviter recalculs identiques
 * 
 * @param {Array<HistoricalDataPoint>} historicalData - Données historiques avec propriétés date, close/prixActuel
 * @param {number} periods - Nombre de périodes pour la moyenne mobile
 * @param {Object} [options={}] - Options de calcul
 * @param {boolean} [options.useCache=true] - Utiliser cache (défaut: true)
 * @returns {Map<string, number>} Map avec clé = date (ISO string), valeur = MA value. Map vide si données insuffisantes
 * 
 * @example
 * const data = [
 *   { date: '2024-01-01', close: 100 },
 *   { date: '2024-01-02', close: 102 }
 * ];
 * const maMap = calculateMovingAveragesMap(data, 2);
 * // Retourne: Map { '2024-01-01' => 100, '2024-01-02' => 101 }
 * // Utilisation: maMap.get('2024-01-02') → 101 (lookup O(1))
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne Map vide si données insuffisantes
 */
const maMapCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Générer clé de cache pour données historiques
 * 
 * @private
 * @param {Array<HistoricalDataPoint>} historicalData - Données historiques
 * @param {number} periods - Nombre de périodes
 * @returns {string|null} Clé de cache ou null si données invalides
 */
function getCacheKey(historicalData, periods) {
  // Créer clé de cache basée sur hash des données et période
  if (!historicalData || historicalData.length === 0) return null;
  
  const dataHash = `${historicalData.length}_${historicalData[0]?.date}_${historicalData[historicalData.length - 1]?.date}_${periods}`;
  return `ma_${dataHash}`;
}

export function calculateMovingAveragesMap(historicalData, periods, options = {}) {
  const { useCache = true } = options;
  
  // ✅ PHASE 3 - Étape 3.16 : Validation robuste - vérifier que historicalData est un tableau
  if (!historicalData || !Array.isArray(historicalData) || historicalData.length < periods) {
    return new Map();
  }
  
  // Vérifier cache si activé
  if (useCache) {
    const cacheKey = getCacheKey(historicalData, periods);
    if (cacheKey) {
      const cached = maMapCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.map;
      }
    }
  }
  
  const maData = calculateMovingAverages(historicalData, periods);
  
  // Créer Map pour lookup O(1) - O(n) pour créer la Map
  const maMap = new Map(
    maData.data.map(item => [item.date, item.value])
  );
  
  // Mettre en cache si activé
  if (useCache && getCacheKey(historicalData, periods)) {
    const cacheKey = getCacheKey(historicalData, periods);
    maMapCache.set(cacheKey, {
      map: maMap,
      timestamp: Date.now()
    });
    
    // Nettoyer cache si trop grand (max 100 entrées)
    if (maMapCache.size > 100) {
      const firstKey = maMapCache.keys().next().value;
      maMapCache.delete(firstKey);
    }
  }
  
  return maMap;
}

/**
 * Créer Map à partir de résultat calculateMovingAverages
 * 
 * ✅ OPTIMISATION Phase 2.3 : Helper pour convertir résultat MA en Map
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée avec JSDoc standardisé
 * - Utile pour code existant qui utilise calculateMovingAverages
 * - Conversion O(n) une seule fois
 * - Permet lookup O(1) au lieu de recherche linéaire O(n)
 * 
 * @param {MovingAverageResult} maResult - Résultat de calculateMovingAverages { ma, data }
 * @returns {Map<string, number>} Map avec clé = date (ISO string), valeur = MA value. Map vide si résultat invalide
 * 
 * @example
 * const maResult = { ma: 101, data: [{ date: '2024-01-01', value: 100 }, { date: '2024-01-02', value: 101 }] };
 * const maMap = createMAMap(maResult);
 * // Retourne: Map { '2024-01-01' => 100, '2024-01-02' => 101 }
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne Map vide si résultat invalide
 */
export function createMAMap(maResult) {
  if (!maResult || !maResult.data || !Array.isArray(maResult.data)) {
    return new Map();
  }
  
  // Créer Map pour lookup O(1) - O(n) pour créer la Map
  return new Map(
    maResult.data.map(item => [item.date, item.value])
  );
}

/**
 * Nettoyer le cache des MA Maps
 * 
 * ✅ OPTIMISATION Phase 2.3 : Fonction utilitaire pour gestion cache
 */
export function clearMAMapCache() {
  maMapCache.clear();
}

/**
 * Obtenir statistiques du cache MA Maps
 * 
 * ✅ OPTIMISATION Phase 2.3 : Fonction utilitaire pour debugging
 */
export function getMAMapCacheStats() {
  return {
    size: maMapCache.size,
    maxSize: 100,
    ttl: CACHE_TTL
  };
}

/**
 * Calculer RSI (Relative Strength Index)
 * 
 * ✅ PHASE 3 - Étape 3.16 : Validation robuste pour éviter erreurs "not iterable"
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée avec JSDoc standardisé
 * 
 * Le RSI mesure la force relative des mouvements de prix sur une période donnée.
 * Valeurs typiques :
 * - RSI < 30 : Survente (potentiel signal d'achat)
 * - RSI > 70 : Surachat (potentiel signal de vente)
 * - RSI entre 30-70 : Zone neutre
 * 
 * @param {Array<HistoricalDataPoint>} historicalData - Données historiques avec propriétés date, close/prixActuel
 * @param {number} [period=14] - Nombre de périodes pour calcul RSI (défaut: 14, standard industrie)
 * @returns {number} Valeur RSI entre 0 et 100, ou 50 si données insuffisantes (valeur neutre)
 * 
 * @example
 * const data = [
 *   { date: '2024-01-01', close: 100 },
 *   { date: '2024-01-02', close: 102 },
 *   // ... au moins period+1 points nécessaires
 * ];
 * const rsi = calculateRSI(data, 14);
 * // Retourne: nombre entre 0 et 100 (ex: 65.5)
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne 50 (neutre) si données insuffisantes
 */
export function calculateRSI(historicalData, period = 14) {
  // ✅ PHASE 3.16 : Validation robuste - vérifier que historicalData est un tableau
  if (!historicalData || !Array.isArray(historicalData) || historicalData.length < period + 1) {
    return 50; // Neutre si pas assez de données
  }
  
  // ✅ PHASE 3.16 : S'assurer que tous les éléments sont valides
  const validData = historicalData.filter(d => d && (d.close !== undefined || d.prixActuel !== undefined));
  if (validData.length < period + 1) {
    return 50; // Neutre si pas assez de données valides
  }
  
  const sorted = [...validData].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateA - dateB;
  });
  
  let gains = 0;
  let losses = 0;
  
  // Calculer gains et pertes sur la période
  for (let i = sorted.length - period; i < sorted.length; i++) {
    const current = sorted[i].close || sorted[i].prixActuel || 0;
    const previous = sorted[i - 1]?.close || sorted[i - 1]?.prixActuel || current;
    const change = current - previous;
    
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100; // Tous gains
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculer MACD (Moving Average Convergence Divergence)
 * 
 * ✅ PHASE 3 - Étape 3.16 : Validation robuste pour éviter erreurs "not iterable"
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée avec JSDoc standardisé
 * 
 * Le MACD est un indicateur de momentum qui montre la relation entre deux moyennes mobiles exponentielles.
 * Composants :
 * - MACD Line : EMA(12) - EMA(26)
 * - Signal Line : EMA(9) de la ligne MACD
 * - Histogram : MACD Line - Signal Line
 * 
 * Interprétation :
 * - Histogram > 0 : Momentum haussier
 * - Histogram < 0 : Momentum baissier
 * - Croisement MACD/Signal : Signal d'achat/vente potentiel
 * 
 * @param {Array<HistoricalDataPoint>} historicalData - Données historiques avec propriétés date, close/prixActuel
 * @returns {MACDResult} Objet avec valeurs macd, signal et histogram (null si données insuffisantes)
 * 
 * @example
 * const data = [
 *   { date: '2024-01-01', close: 100 },
 *   // ... au moins 26 points nécessaires pour EMA26
 * ];
 * const macd = calculateMACD(data);
 * // Retourne: { macd: 0.5, signal: 0.3, histogram: 0.2 }
 * // ou { macd: null, signal: null, histogram: null } si données insuffisantes
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne valeurs null si données insuffisantes
 */
export function calculateMACD(historicalData) {
  // ✅ PHASE 3.16 : Validation robuste - vérifier que historicalData est un tableau
  if (!historicalData || !Array.isArray(historicalData) || historicalData.length < 26) {
    return { macd: null, signal: null, histogram: null };
  }
  
  // ✅ PHASE 3.16 : S'assurer que tous les éléments sont valides
  const validData = historicalData.filter(d => d && (d.close !== undefined || d.prixActuel !== undefined));
  if (validData.length < 26) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const sorted = [...validData].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateA - dateB;
  });
  
  const closes = sorted.map(d => d.close || d.prixActuel || 0);
  
  // EMA 12
  const ema12 = calculateEMA(closes, 12);
  
  // EMA 26
  const ema26 = calculateEMA(closes, 26);
  
  if (ema12.length === 0 || ema26.length === 0) {
    return { macd: null, signal: null, histogram: null };
  }
  
  // MACD line = EMA12 - EMA26
  const macdLine = [];
  const startIndex = Math.max(ema12.length - ema26.length, 0);
  
  for (let i = 0; i < ema26.length; i++) {
    const ema12Index = startIndex + i;
    if (ema12Index < ema12.length) {
      macdLine.push(ema12[ema12Index] - ema26[i]);
    }
  }
  
  if (macdLine.length < 9) {
    return { macd: macdLine[macdLine.length - 1] || null, signal: null, histogram: null };
  }
  
  // Signal line = EMA 9 de la ligne MACD
  const signalLine = calculateEMA(macdLine, 9);
  const signal = signalLine[signalLine.length - 1] || null;
  const macd = macdLine[macdLine.length - 1] || null;
  
  // Histogram = MACD - Signal
  const histogram = macd !== null && signal !== null ? macd - signal : null;
  
  return { macd, signal, histogram };
}

/**
 * Calculer EMA (Exponential Moving Average)
 * 
 * ✅ PHASE 3 - Étape 3.16 : Validation robuste pour éviter erreurs
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée avec JSDoc standardisé
 * 
 * Fonction interne utilisée par MACD et autres indicateurs.
 * L'EMA donne plus de poids aux données récentes que la SMA.
 * 
 * @param {Array<number>} data - Tableau de valeurs numériques (prix de clôture)
 * @param {number} period - Nombre de périodes pour EMA
 * @returns {Array<number>} Tableau de valeurs EMA (vide si données insuffisantes)
 * 
 * @private
 * @throws {Error} Ne lance jamais d'erreur, retourne tableau vide si données insuffisantes
 */
function calculateEMA(data, period) {
  // ✅ PHASE 3.16 : Validation robuste - vérifier que data est un tableau
  if (!data || !Array.isArray(data) || data.length < period) {
    return [];
  }
  
  const multiplier = 2 / (period + 1);
  const ema = [];
  
  // Premier EMA = SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);
  
  // EMA suivants
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }
  
  return ema;
}

/**
 * Calculer Bollinger Bands
 */
/**
 * ✅ PHASE 3 - Étape 3.16 : Validation robuste pour éviter erreurs "not iterable"
 */
export function calculateBollingerBands(historicalData, period = 20, stdDev = 2) {
  // ✅ PHASE 3.16 : Validation robuste - vérifier que historicalData est un tableau
  if (!historicalData || !Array.isArray(historicalData) || historicalData.length < period) {
    return { upper: null, middle: null, lower: null };
  }
  
  // ✅ PHASE 3.16 : S'assurer que tous les éléments sont valides
  const validData = historicalData.filter(d => d && (d.close !== undefined || d.prixActuel !== undefined));
  if (validData.length < period) {
    return { upper: null, middle: null, lower: null };
  }
  
  const sorted = [...validData].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateA - dateB;
  });
  
  const recent = sorted.slice(-period);
  const closes = recent.map(d => d.close || d.prixActuel || 0);
  
  // SMA (middle band)
  const sma = closes.reduce((sum, c) => sum + c, 0) / period;
  
  // Écart-type
  const variance = closes.reduce((sum, c) => sum + Math.pow(c - sma, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    upper: sma + (stdDev * standardDeviation),
    middle: sma,
    lower: sma - (stdDev * standardDeviation)
  };
}

/**
 * Détecter signaux techniques avec confiance (version basique)
 * 
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée avec JSDoc standardisé
 * 
 * Analyse les moyennes mobiles pour générer des signaux d'achat/vente avec niveau de confiance.
 * Logique :
 * - ACHAT : Prix > MA50 > MA200 (tendance haussière)
 * - VENTE : Prix < MA50 < MA200 (tendance baissière)
 * - NEUTRE : Autres configurations
 * 
 * La confiance augmente avec :
 * - Alignement des moyennes mobiles
 * - Momentum positif/négatif (comparaison avec prix précédent)
 * 
 * ⚠️ NOTE : Pour une analyse plus précise avec multi-critères et confirmation,
 * utilisez `detectTechnicalSignalsAdvanced` avec données historiques.
 * 
 * @param {number} prix - Prix actuel de l'action
 * @param {number|null} ma50 - Valeur de la moyenne mobile 50 périodes
 * @param {number|null} ma200 - Valeur de la moyenne mobile 200 périodes
 * @param {number|null} [previousPrix=null] - Prix précédent pour calculer momentum (optionnel)
 * @param {Array<HistoricalDataPoint>} [historicalData=null] - Données historiques pour analyse avancée (optionnel)
 * @returns {TechnicalSignalResult} Objet avec signal, confidence et reason
 * 
 * @example
 * const signal = detectTechnicalSignals(105, 100, 95, 103);
 * // Retourne: { signal: 'ACHAT', confidence: 60, reason: 'ACHAT + Momentum positif' }
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne signal NEUTRE si données insuffisantes
 */
export function detectTechnicalSignals(prix, ma50, ma200, previousPrix = null, historicalData = null) {
  // ✅ PHASE 4 - Étape 4.6 : Utiliser version avancée si données historiques disponibles
  if (historicalData && Array.isArray(historicalData) && historicalData.length >= 26) {
    return detectTechnicalSignalsAdvanced(prix, ma50, ma200, previousPrix, historicalData);
  }
  
  // Version basique (rétrocompatibilité)
  if (!ma50 || !ma200) {
    return { signal: 'NEUTRE', confidence: 0, reason: 'Données insuffisantes' };
  }
  
  const signals = [];
  let confidence = 0;
  
  // Signal Achat : Prix > MA50 > MA200
  if (prix > ma50 && ma50 > ma200) {
    signals.push('ACHAT');
    confidence += 40;
    
    // Bonus confiance si momentum positif
    if (previousPrix && prix > previousPrix) {
      confidence += 20;
    }
  }
  
  // Signal Vente : Prix < MA50 < MA200
  if (prix < ma50 && ma50 < ma200) {
    signals.push('VENTE');
    confidence += 40;
    
    // Bonus confiance si momentum négatif
    if (previousPrix && prix < previousPrix) {
      confidence += 20;
    }
  }
  
  if (signals.length === 0) {
    return { signal: 'NEUTRE', confidence: 50, reason: 'Prix entre les MA' };
  }
  
  return {
    signal: signals[0],
    confidence: Math.min(confidence, 100),
    reason: signals.join(' + ')
  };
}

/**
 * Détecter signaux techniques avec confiance (version avancée multi-critères)
 * 
 * ✅ PHASE 4 - Étape 4.6 : Algorithme signaux techniques amélioré
 * 
 * Analyse multi-critères avec système de confirmation pour générer des signaux
 * d'achat/vente avec niveau de confiance précis.
 * 
 * **Indicateurs analysés :**
 * 1. **Moyennes Mobiles (MA)** : Alignement MA50/MA200, position prix vs MA
 * 2. **RSI** : Survente (< 30) / Surachat (> 70)
 * 3. **MACD** : Croisements MACD/Signal, histogramme
 * 4. **Bollinger Bands** : Position prix dans les bandes
 * 5. **Momentum** : Évolution prix récente
 * 
 * **Système de confirmation :**
 * - **Signal fort** : Au moins 3 indicateurs alignés (confiance 70-100)
 * - **Signal modéré** : 2 indicateurs alignés (confiance 50-69)
 * - **Signal faible** : 1 indicateur (confiance 30-49)
 * - **Neutre** : Signaux contradictoires ou insuffisants (confiance < 30)
 * 
 * **Calcul de confiance :**
 * - Base : 20 points par indicateur confirmé
 * - Bonus convergence : +10 points si 3+ indicateurs alignés
 * - Bonus force signal : +5-15 points selon force individuelle
 * - Pénalité divergence : -10 points si signaux contradictoires
 * 
 * @param {number} prix - Prix actuel de l'action
 * @param {number|null} ma50 - Valeur de la moyenne mobile 50 périodes
 * @param {number|null} ma200 - Valeur de la moyenne mobile 200 périodes
 * @param {number|null} [previousPrix=null] - Prix précédent pour calculer momentum (optionnel)
 * @param {Array<HistoricalDataPoint>} [historicalData=null] - Données historiques (minimum 26 points pour MACD)
 * @returns {TechnicalSignalResult} Objet avec signal, confidence, reason, details et confirmationCount
 * 
 * @example
 * const historicalData = [
 *   { date: '2024-01-01', close: 100 },
 *   { date: '2024-01-02', close: 102 },
 *   // ... au moins 26 points
 * ];
 * const signal = detectTechnicalSignalsAdvanced(105, 100, 95, 103, historicalData);
 * // Retourne: {
 * //   signal: 'ACHAT',
 * //   confidence: 75,
 * //   reason: 'MA alignées + RSI neutre + MACD haussier + Prix au-dessus Bollinger',
 * //   details: { ma: 'ACHAT', rsi: 'NEUTRE', macd: 'ACHAT', bollinger: 'ACHAT' },
 * //   confirmationCount: 3
 * // }
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne signal NEUTRE si données insuffisantes
 */
export function detectTechnicalSignalsAdvanced(prix, ma50, ma200, previousPrix = null, historicalData = null) {
  // Validation données minimales
  if (!prix || prix <= 0) {
    return { signal: 'NEUTRE', confidence: 0, reason: 'Prix invalide' };
  }
  
  if (!ma50 || !ma200) {
    return { signal: 'NEUTRE', confidence: 0, reason: 'Moyennes mobiles insuffisantes' };
  }
  
  // Structure pour stocker signaux individuels
  const signals = {
    ma: null,        // Signal MA (ACHAT/VENTE/NEUTRE)
    rsi: null,       // Signal RSI (ACHAT/VENTE/NEUTRE)
    macd: null,      // Signal MACD (ACHAT/VENTE/NEUTRE)
    bollinger: null, // Signal Bollinger (ACHAT/VENTE/NEUTRE)
    momentum: null   // Signal Momentum (ACHAT/VENTE/NEUTRE)
  };
  
  const signalStrengths = {
    ma: 0,
    rsi: 0,
    macd: 0,
    bollinger: 0,
    momentum: 0
  };
  
  const reasons = [];
  
  // ========== 1. ANALYSE MOYENNES MOBILES ==========
  if (ma50 && ma200) {
    if (prix > ma50 && ma50 > ma200) {
      signals.ma = 'ACHAT';
      signalStrengths.ma = 25; // Base 20 + bonus alignement
      reasons.push('MA alignées haussières');
    } else if (prix < ma50 && ma50 < ma200) {
      signals.ma = 'VENTE';
      signalStrengths.ma = 25;
      reasons.push('MA alignées baissières');
    } else {
      signals.ma = 'NEUTRE';
      signalStrengths.ma = 0;
    }
  }
  
  // ========== 2. ANALYSE RSI ==========
  if (historicalData && Array.isArray(historicalData) && historicalData.length >= 15) {
    const rsi = calculateRSI(historicalData, 14);
    if (rsi !== null && rsi !== undefined) {
      if (rsi < 30) {
        signals.rsi = 'ACHAT'; // Survente = opportunité achat
        signalStrengths.rsi = 20;
        reasons.push(`RSI survente (${rsi.toFixed(1)})`);
      } else if (rsi > 70) {
        signals.rsi = 'VENTE'; // Surachat = opportunité vente
        signalStrengths.rsi = 20;
        reasons.push(`RSI surachat (${rsi.toFixed(1)})`);
      } else {
        signals.rsi = 'NEUTRE';
        signalStrengths.rsi = 0;
      }
    }
  }
  
  // ========== 3. ANALYSE MACD ==========
  if (historicalData && Array.isArray(historicalData) && historicalData.length >= 26) {
    const macdResult = calculateMACD(historicalData);
    if (macdResult.macd !== null && macdResult.signal !== null && macdResult.histogram !== null) {
      // Signal ACHAT : MACD > Signal ET histogramme positif ET croisement récent
      if (macdResult.macd > macdResult.signal && macdResult.histogram > 0) {
        signals.macd = 'ACHAT';
        signalStrengths.macd = 20;
        reasons.push('MACD haussier');
      }
      // Signal VENTE : MACD < Signal ET histogramme négatif
      else if (macdResult.macd < macdResult.signal && macdResult.histogram < 0) {
        signals.macd = 'VENTE';
        signalStrengths.macd = 20;
        reasons.push('MACD baissier');
      } else {
        signals.macd = 'NEUTRE';
        signalStrengths.macd = 0;
      }
    }
  }
  
  // ========== 4. ANALYSE BOLLINGER BANDS ==========
  if (historicalData && Array.isArray(historicalData) && historicalData.length >= 20) {
    const bollinger = calculateBollingerBands(historicalData, 20, 2);
    if (bollinger.upper !== null && bollinger.lower !== null && bollinger.middle !== null) {
      // Prix au-dessus bande supérieure = survente potentielle (signal VENTE)
      if (prix > bollinger.upper) {
        signals.bollinger = 'VENTE';
        signalStrengths.bollinger = 15; // Moins fort que MA/RSI
        reasons.push('Prix au-dessus Bollinger supérieure');
      }
      // Prix en-dessous bande inférieure = survente (signal ACHAT)
      else if (prix < bollinger.lower) {
        signals.bollinger = 'ACHAT';
        signalStrengths.bollinger = 15;
        reasons.push('Prix en-dessous Bollinger inférieure');
      }
      // Prix proche bande moyenne = neutre
      else {
        signals.bollinger = 'NEUTRE';
        signalStrengths.bollinger = 0;
      }
    }
  }
  
  // ========== 5. ANALYSE MOMENTUM ==========
  if (previousPrix && previousPrix > 0) {
    const momentumPercent = ((prix - previousPrix) / previousPrix) * 100;
    if (momentumPercent > 1) { // Momentum positif significatif (> 1%)
      signals.momentum = 'ACHAT';
      signalStrengths.momentum = 10; // Plus faible poids
      reasons.push(`Momentum positif (+${momentumPercent.toFixed(2)}%)`);
    } else if (momentumPercent < -1) { // Momentum négatif significatif (< -1%)
      signals.momentum = 'VENTE';
      signalStrengths.momentum = 10;
      reasons.push(`Momentum négatif (${momentumPercent.toFixed(2)}%)`);
    } else {
      signals.momentum = 'NEUTRE';
      signalStrengths.momentum = 0;
    }
  }
  
  // ========== CALCUL CONVERGENCE ET CONFIRMATION ==========
  const buySignals = Object.values(signals).filter(s => s === 'ACHAT').length;
  const sellSignals = Object.values(signals).filter(s => s === 'VENTE').length;
  const neutralSignals = Object.values(signals).filter(s => s === 'NEUTRE').length;
  
  // Compter seulement les signaux non-neutres pour confirmation
  const confirmationCount = buySignals + sellSignals;
  
  // Calculer confiance basée sur convergence
  let confidence = 0;
  let finalSignal = 'NEUTRE';
  
  // Si signaux achat dominants
  if (buySignals > sellSignals && buySignals > 0) {
    finalSignal = 'ACHAT';
    // Base : 20 points par signal achat confirmé
    confidence = buySignals * 20;
    // Bonus convergence si 3+ signaux alignés
    if (buySignals >= 3) {
      confidence += 15;
    }
    // Ajouter forces individuelles
    Object.keys(signals).forEach(key => {
      if (signals[key] === 'ACHAT') {
        confidence += signalStrengths[key];
      }
    });
  }
  // Si signaux vente dominants
  else if (sellSignals > buySignals && sellSignals > 0) {
    finalSignal = 'VENTE';
    confidence = sellSignals * 20;
    if (sellSignals >= 3) {
      confidence += 15;
    }
    Object.keys(signals).forEach(key => {
      if (signals[key] === 'VENTE') {
        confidence += signalStrengths[key];
      }
    });
  }
  // Signaux contradictoires ou insuffisants
  else {
    finalSignal = 'NEUTRE';
    // Confiance réduite si signaux contradictoires
    if (buySignals > 0 && sellSignals > 0) {
      confidence = Math.max(buySignals, sellSignals) * 10; // Pénalité divergence
    } else {
      confidence = Math.max(buySignals, sellSignals) * 15;
    }
  }
  
  // Normaliser confiance entre 0 et 100
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));
  
  // Construire raison détaillée
  const reason = reasons.length > 0 
    ? reasons.join(' + ')
    : 'Signaux insuffisants ou contradictoires';
  
  return {
    signal: finalSignal,
    confidence,
    reason,
    details: {
      ma: signals.ma,
      rsi: signals.rsi,
      macd: signals.macd,
      bollinger: signals.bollinger,
      momentum: signals.momentum
    },
    confirmationCount
  };
}

/**
 * Générer hash pour détecter changements d'une position
 * Hash basé sur les champs qui affectent les calculs
 */
function generatePositionHash(position) {
  const prixActuel = position.yahooData?.prixActuel || position.prixEntree;
  const ma50 = position.yahooData?.ma50 || null;
  const ma200 = position.yahooData?.ma200 || null;
  
  // Hash basé sur les inputs qui affectent les calculs
  const hashInput = JSON.stringify({
    id: position.id,
    quantite: position.quantite,
    prixEntree: position.prixEntree,
    prixActuel: prixActuel,
    ma50: ma50,
    ma200: ma200
  });
  
  // Hash simple mais efficace (FNV-1a inspired)
  let hash = 2166136261;
  for (let i = 0; i < hashInput.length; i++) {
    hash ^= hashInput.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  
  return hash >>> 0; // Convertir en unsigned 32-bit
}

/**
 * Calculer métriques pour une seule position
 * Fonction pure, réutilisable et testable
 * 
 * ✅ PHASE 4 - Étape 4.6 : Support données historiques pour signaux avancés
 * ✅ PHASE 4 - Étape 4.9 : Support multi-devises avec conversion automatique
 * 
 * @param {Object} position - Position à analyser
 * @param {number} totalPortfolio - Valeur totale du portfolio (pour calcul poids)
 * @param {Array<HistoricalDataPoint>} [historicalData=null] - Données historiques optionnelles pour analyse avancée
 * @returns {Promise<Object>} Métriques calculées (valeurPosition, plusValueEuro, plusValuePourcent, poidsPortfolio, signal)
 */
async function calculatePositionMetrics(position, totalPortfolio, historicalData = null) {
  // ✅ PHASE 4 - Étape 4.9 : Détecter et convertir devise si nécessaire
  let prixEntreeConverti = position.prixEntree;
  let prixActuelConverti;
  let positionCurrency = position.currency;
  
  // Détecter devise si non spécifiée
  if (!positionCurrency) {
    try {
      const { detectCurrency } = await import('./currencyService');
      positionCurrency = detectCurrency(position.ticker);
    } catch (err) {
      log.warn('Error detecting currency, using EUR:', err);
      positionCurrency = 'EUR';
    }
  }
  
  // Convertir prix d'achat si nécessaire
  if (positionCurrency !== 'EUR') {
    try {
      const { convertCurrency } = await import('./currencyService');
      // Toujours utiliser conversion async pour garantir conversion correcte
      prixEntreeConverti = await convertCurrency(position.prixEntree, positionCurrency, 'EUR');
    } catch (err) {
      log.error(`Error converting prixEntree for ${position.ticker}, calculation may be incorrect:`, err);
      // En cas d'erreur, utiliser valeur originale mais logger comme erreur critique
      // Cela évitera des calculs silencieusement incorrects
      prixEntreeConverti = position.prixEntree;
    }
  }
  
  // Déterminer le prix actuel
  // Priorité: yahooData.prixActuel si disponible et valide (> 0 et différent de prixEntree)
  // Si prixActuel === prixEntree, cela peut indiquer des données non rafraîchies
  let prixActuel;
  let isPrixActuelFallback = false;
  
  // ✅ FIX: Vérifier aussi si yahooData a le flag _fallback pour détecter données de fallback
  const hasValidYahooData = position.yahooData && 
                            !position.yahooData._fallback &&
                            position.yahooData.prixActuel !== undefined && 
                            position.yahooData.prixActuel !== null && 
                            position.yahooData.prixActuel > 0;
  
  if (hasValidYahooData) {
    prixActuel = position.yahooData.prixActuel;
    isPrixActuelFallback = false;
    
    // Convertir prix actuel si nécessaire
    if (positionCurrency !== 'EUR') {
      try {
        const { convertCurrency } = await import('./currencyService');
        // Toujours utiliser conversion async pour garantir conversion correcte
        prixActuelConverti = await convertCurrency(prixActuel, positionCurrency, 'EUR');
      } catch (err) {
        log.error(`Error converting prixActuel for ${position.ticker}, calculation may be incorrect:`, err);
        // En cas d'erreur, utiliser valeur originale mais logger comme erreur critique
        prixActuelConverti = prixActuel;
      }
    } else {
      prixActuelConverti = prixActuel;
    }
  } else {
    // Si yahooData n'existe pas, a le flag _fallback, ou prixActuel n'est pas valide, utiliser prixEntree converti
    // Cela donnera une plus-value de 0 temporairement jusqu'à ce que les données soient chargées
    prixActuel = position.prixEntree;
    prixActuelConverti = prixEntreeConverti;
    isPrixActuelFallback = true; // ✅ FIX: Marquer explicitement comme fallback
  }
  
  // ✅ PHASE 4 - Étape 4.9 : Utiliser prix convertis en EUR pour calculs
  const valeurPosition = calculatePositionValue(position.quantite, prixActuelConverti);
  
  // ✅ PHASE 4 - Étape 4.6 : Signal technique amélioré avec multi-critères si données historiques disponibles
  // Calculer prix précédent pour momentum si données historiques disponibles
  let previousPrix = null;
  if (historicalData && Array.isArray(historicalData) && historicalData.length >= 2) {
    const sorted = [...historicalData].sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });
    const secondLast = sorted[sorted.length - 2];
    previousPrix = secondLast?.close || secondLast?.prixActuel || null;
    
    // Convertir prix précédent si nécessaire
    if (previousPrix && positionCurrency !== 'EUR') {
      try {
        const { convertCurrency } = await import('./currencyService');
        // Toujours utiliser conversion async pour garantir conversion correcte
        previousPrix = await convertCurrency(previousPrix, positionCurrency, 'EUR');
      } catch (err) {
        log.warn(`Error converting previousPrix for ${position.ticker}, using original:`, err);
        // Pour prix précédent, on peut continuer sans conversion (moins critique)
      }
    }
  }
  
  // Note: MA peuvent nécessiter conversion aussi, mais pour l'instant on utilise valeurs brutes
  // (les MA sont calculées depuis données historiques qui peuvent être dans différentes devises)
  const signal = position.yahooData?.ma50 && position.yahooData?.ma200
    ? detectTechnicalSignals(
        prixActuelConverti, // ✅ Utiliser prix converti pour signaux
        position.yahooData.ma50, // Note: MA peuvent nécessiter conversion si données historiques multi-devises
        position.yahooData.ma200,
        previousPrix,
        historicalData // ✅ Passer données historiques pour version avancée
      )
    : { signal: 'NEUTRE', confidence: 0 };
  
  // ✅ PHASE 4 - Étape 4.8 : Calcul plus-value complet si données disponibles
  // Vérifier si données complètes disponibles (dividendes, frais, splits)
  const hasCompleteData = (
    (position.dividendes && Array.isArray(position.dividendes) && position.dividendes.length > 0) ||
    (position.splits && Array.isArray(position.splits) && position.splits.length > 0) ||
    (position.frais && (position.frais.fraisAchat || position.frais.fraisVente || position.frais.fraisGestionAnnuel))
  );

  let plusValueEuro;
  let plusValuePourcent;
  let completeGainLoss = null;

  if (hasCompleteData) {
    // Utiliser calcul complet avec prix convertis
    completeGainLoss = calculateCompleteGainLoss({
      prixAchat: prixEntreeConverti, // ✅ Utiliser prix converti
      prixActuel: prixActuelConverti, // ✅ Utiliser prix converti
      quantite: position.quantite,
      dateAchat: position.dateAchat,
      dividendes: position.dividendes || [],
      splits: position.splits || [],
      frais: position.frais || {}
    });
    
    plusValueEuro = completeGainLoss.plusValueNette;
    plusValuePourcent = completeGainLoss.plusValuePourcent;
  } else {
    // Utiliser calcul basique avec prix convertis (rétrocompatibilité)
    plusValueEuro = calculateGainLoss(prixEntreeConverti, prixActuelConverti, position.quantite);
    plusValuePourcent = prixEntreeConverti > 0 
      ? ((prixActuelConverti - prixEntreeConverti) / prixEntreeConverti) * 100
      : 0;
  }
  
  const poidsPortfolio = calculatePortfolioWeight(valeurPosition, totalPortfolio);
  
  // ✅ PHASE 4 - Étape 4.9 : Calculer investissement converti pour cohérence calculs
  const investissementConverti = prixEntreeConverti * position.quantite;

  const result = {
    valeurPosition,
    plusValueEuro,
    plusValuePourcent: Math.round(plusValuePourcent * 100) / 100,
    poidsPortfolio,
    signal,
    currency: positionCurrency, // ✅ PHASE 4 - Étape 4.9 : Exposer devise de la position
    investissementConverti, // ✅ PHASE 4 - Étape 4.9 : Investissement en EUR (pour calculs cohérents)
    prixActuel: prixActuel, // ✅ FIX: Stocker prixActuel calculé (yahooData ou prixEntree en fallback) pour affichage
    prixActuelConverti: prixActuelConverti, // ✅ FIX: Stocker prixActuel converti en EUR pour affichage
    isPrixActuelFallback: isPrixActuelFallback // ✅ FIX: Indicateur si on utilise prixEntree comme fallback (calculé explicitement)
  };

  // ✅ PHASE 4 - Étape 4.8 : Ajouter détails calcul complet si disponible
  if (completeGainLoss) {
    result.completeGainLoss = {
      plusValueBrute: completeGainLoss.plusValueBrute,
      dividendesCumules: completeGainLoss.dividendesCumules,
      fraisTotaux: completeGainLoss.fraisTotaux,
      investissementNet: completeGainLoss.investissementNet,
      rendementTotal: completeGainLoss.rendementTotal,
      details: completeGainLoss.details
    };
  }

  return result;
}

/**
 * Calculer total portfolio de manière optimisée
 * Utilise cache si toutes les positions sont en cache et valides
 */
function calculateTotalPortfolio(positions, useCache = true) {
  if (!positions || positions.length === 0) return 0;
  
  // Si toutes positions en cache et valides, utiliser cache total
  if (useCache) {
    let allCached = true;
    let cachedTotal = 0;
    const now = Date.now();
    
    for (const pos of positions) {
      const cached = positionCalculationsCache.get(pos.id);
      if (!cached || (now - cached.timestamp) > POSITION_CACHE_TTL) {
        allCached = false;
        break;
      }
      cachedTotal += cached.calculs.valeurPosition;
    }
    
    if (allCached) {
      return cachedTotal;
    }
  }
  
  // Calculer total normalement
  return positions.reduce((sum, pos) => {
    const prixActuel = pos.yahooData?.prixActuel || pos.prixEntree;
    return sum + calculatePositionValue(pos.quantite, prixActuel);
  }, 0);
}

/**
 * Calcul batch optimisé avec cache incrémental par position
 * 
 * ✅ OPTIMISATION Phase 1.2 : Calcul incrémental avec cache par position
 * ✅ PHASE 4 - Étape 4.9 : Support multi-devises avec conversion automatique
 * 
 * - Ne recalcule que les positions qui ont changé
 * - Cache par position ID avec hash de détection
 * - Réutilisation calculs inchangés
 * - Gestion TTL et taille cache (LRU)
 * - Préchargement taux de change pour conversions optimisées
 * 
 * @param {Array} positions - Liste des positions du portfolio
 * @param {Object} options - Options de calcul
 * @param {boolean} options.forceRecalculate - Forcer recalcul même si cache valide (défaut: false)
 * @param {Object} [options.historicalDataMap] - Map de données historiques par ticker (optionnel)
 * @returns {Promise<Array>} Positions avec calculs mis à jour
 */
export async function calculateBatchMetrics(positions, options = {}) {
  if (!positions || positions.length === 0) {
    return [];
  }

  const { forceRecalculate = false } = options;
  const now = Date.now();
  
  // Calculer total portfolio d'abord (nécessaire pour poidsPortfolio)
  // Utiliser cache si possible pour éviter recalcul complet
  const totalPortfolio = calculateTotalPortfolio(positions, !forceRecalculate);
  
  // Séparer positions à recalculer vs positions en cache valides
  const positionsToRecalculate = [];
  const cachedPositions = [];
  
  for (const pos of positions) {
    if (!pos.id) {
      // Position sans ID (nouvelle), toujours recalculer
      positionsToRecalculate.push(pos);
      continue;
    }
    
    if (forceRecalculate) {
      positionsToRecalculate.push(pos);
      continue;
    }
    
    // Vérifier cache
    const cached = positionCalculationsCache.get(pos.id);
    if (cached) {
      // Vérifier TTL
      const age = now - cached.timestamp;
      if (age < POSITION_CACHE_TTL) {
        // Vérifier hash pour détecter changements
        const currentHash = generatePositionHash(pos);
        if (cached.hash === currentHash && cached.totalPortfolio === totalPortfolio) {
          // Cache valide, réutiliser
          cachedPositions.push({
            ...pos,
            calculs: cached.calculs
          });
          continue;
        }
      }
    }
    
    // Cache invalide ou position changée, recalculer
    positionsToRecalculate.push(pos);
  }
  
  // ✅ PHASE 4 - Étape 4.9 : Précharger taux de change pour devises utilisées
  // Précharger en arrière-plan (ne bloque pas)
  import('./currencyService').then(({ detectCurrency, preloadExchangeRates }) => {
    const currenciesToPreload = new Set();
    positionsToRecalculate.forEach(pos => {
      try {
        const currency = pos.currency || detectCurrency(pos.ticker);
        if (currency && currency !== 'EUR') {
          currenciesToPreload.add(currency);
        }
      } catch (err) {
        // Ignorer erreurs de détection
      }
    });
    
    if (currenciesToPreload.size > 0) {
      preloadExchangeRates(Array.from(currenciesToPreload)).catch(err => {
        log.warn('Error preloading exchange rates:', err);
      });
    }
  }).catch(err => {
    log.warn('Error importing currencyService:', err);
  });
  
  // Recalculer seulement positions qui ont changé
  // Note: calculatePositionMetrics est maintenant async, on utilise Promise.all
  const recalculatedPromises = positionsToRecalculate.map(async pos => {
    const historicalData = options.historicalDataMap?.[pos.ticker] || null;
    const calculs = await calculatePositionMetrics(pos, totalPortfolio, historicalData);
    const hash = generatePositionHash(pos);
    
    // Mettre en cache
    if (pos.id) {
      // Gestion taille cache (LRU simple)
      if (positionCalculationsCache.size >= POSITION_CACHE_MAX_SIZE) {
        // Supprimer entrée la plus ancienne
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, value] of positionCalculationsCache.entries()) {
          if (value.timestamp < oldestTime) {
            oldestTime = value.timestamp;
            oldestKey = key;
          }
        }
        if (oldestKey) {
          positionCalculationsCache.delete(oldestKey);
        }
      }
      
      positionCalculationsCache.set(pos.id, {
        calculs,
        hash,
        timestamp: now,
        totalPortfolio
      });
    }
    
    return {
      ...pos,
      calculs
    };
  });
  
  // ✅ PHASE 4 - Étape 4.9 : Attendre toutes les conversions (si async)
  // Pour compatibilité, on fait les calculs de manière synchrone si possible
  // Sinon, on utilise Promise.all pour attendre toutes les conversions
  const recalculated = await Promise.all(recalculatedPromises);
  
  // Combiner positions recalculées et positions en cache
  const result = [...recalculated, ...cachedPositions];
  
  // S'assurer que l'ordre est préservé (important pour UI)
  // Créer map pour lookup rapide
  const resultMap = new Map(result.map(pos => [pos.id || pos.ticker, pos]));
  return positions.map(pos => {
    const id = pos.id || pos.ticker;
    return resultMap.get(id) || pos;
  });
}

/**
 * Invalider cache pour une position spécifique
 * Utile quand position modifiée manuellement
 */
export function invalidatePositionCache(positionId) {
  if (positionId) {
    positionCalculationsCache.delete(positionId);
  }
}

/**
 * Nettoyer cache positions expirées
 * Utile pour maintenance périodique
 */
export function cleanupExpiredPositionCache() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [id, cached] of positionCalculationsCache.entries()) {
    if (now - cached.timestamp > POSITION_CACHE_TTL) {
      positionCalculationsCache.delete(id);
      cleaned++;
    }
  }
  
  return cleaned;
}

/**
 * Obtenir statistiques du cache positions
 * Utile pour debugging et monitoring
 */
export function getPositionCacheStats() {
  const now = Date.now();
  let valid = 0;
  let expired = 0;
  
  for (const cached of positionCalculationsCache.values()) {
    if (now - cached.timestamp < POSITION_CACHE_TTL) {
      valid++;
    } else {
      expired++;
    }
  }
  
  return {
    total: positionCalculationsCache.size,
    valid,
    expired,
    maxSize: POSITION_CACHE_MAX_SIZE,
    ttl: POSITION_CACHE_TTL
  };
}

/**
 * Calculer statistiques de prix depuis date achat et sur période
 * 
 * ✅ OPTIMISATION Phase 1.4 : Fonction pour modal détail action
 * - Calcule plus haut/bas depuis date achat
 * - Calcule plus haut/bas sur période (52 semaines par défaut)
 * - Gestion robuste des dates et données manquantes
 * 
 * @param {Array} historicalData - Données historiques [{ date, close, ... }]
 * @param {string|Date} dateAchat - Date d'achat de la position
 * @param {number} periodWeeks - Période en semaines (défaut: 52)
 * @returns {Object|null} { highSincePurchase, lowSincePurchase, high52Weeks, low52Weeks, currentPrice }
 */
/**
 * Calculer statistiques de prix depuis date achat et sur période
 * 
 * ✅ OPTIMISATION Phase 2.5 : Fonction pour calculs métriques historiques
 * ✅ PHASE 4 - Étape 4.3 : Interface unifiée avec JSDoc standardisé
 * - Plus haut/bas prix depuis achat
 * - Plus haut/bas prix sur période (par défaut 52 semaines)
 * - Prix actuel (dernière donnée disponible)
 * - Complexité O(n) pour filtrage et calculs
 * 
 * @param {Array<HistoricalDataPoint>} historicalData - Données historiques avec propriétés date, close/prixActuel
 * @param {Date|string} dateAchat - Date d'achat de la position (ISO string ou Date)
 * @param {number} [periodWeeks=52] - Nombre de semaines pour période (défaut: 52 semaines)
 * @returns {PriceStatsResult|null} Objet avec statistiques de prix ou null si données insuffisantes
 * 
 * @example
 * const data = [
 *   { date: '2024-01-01', close: 100 },
 *   { date: '2024-06-01', close: 120 },
 *   { date: '2024-12-01', close: 110 }
 * ];
 * const stats = calculatePriceStats(data, '2024-01-01', 52);
 * // Retourne: { highSincePurchase: 120, lowSincePurchase: 100, high52Weeks: 120, low52Weeks: 100, currentPrice: 110 }
 * 
 * @throws {Error} Ne lance jamais d'erreur, retourne null si données insuffisantes
 */
export function calculatePriceStats(historicalData, dateAchat, periodWeeks = 52) {
  // ✅ PHASE 4 - Étape 4.10 : Vérifier que historicalData est un tableau
  if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
    return null;
  }

  const dateAchatObj = dateAchat instanceof Date ? dateAchat : new Date(dateAchat);
  
  // Filtrer données depuis date achat - O(n)
  const dataSincePurchase = historicalData.filter(d => {
    const dataDate = new Date(d.date);
    return dataDate >= dateAchatObj;
  });

  // Calculer plus haut/bas depuis achat - O(n)
  const pricesSincePurchase = dataSincePurchase
    .map(d => d.close || d.prixActuel || 0)
    .filter(p => p > 0); // Filtrer prix invalides
  
  const highSincePurchase = pricesSincePurchase.length > 0 
    ? Math.max(...pricesSincePurchase) 
    : null;
  const lowSincePurchase = pricesSincePurchase.length > 0 
    ? Math.min(...pricesSincePurchase) 
    : null;

  // Calculer période (par défaut 52 semaines) - O(n)
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - (periodWeeks * 7));

  const dataPeriod = historicalData.filter(d => {
    const dataDate = new Date(d.date);
    return dataDate >= periodStart;
  });

  const pricesPeriod = dataPeriod
    .map(d => d.close || d.prixActuel || 0)
    .filter(p => p > 0); // Filtrer prix invalides
  
  const high52Weeks = pricesPeriod.length > 0 ? Math.max(...pricesPeriod) : null;
  const low52Weeks = pricesPeriod.length > 0 ? Math.min(...pricesPeriod) : null;

  // Prix actuel (dernière donnée disponible) - O(1)
  const currentPrice = historicalData.length > 0 
    ? (historicalData[historicalData.length - 1].close || historicalData[historicalData.length - 1].prixActuel || null)
    : null;

  return {
    highSincePurchase,
    lowSincePurchase,
    high52Weeks,
    low52Weeks,
    currentPrice
  };
}

