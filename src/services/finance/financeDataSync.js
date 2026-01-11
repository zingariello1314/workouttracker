/**
 * Service de synchronisation des données entre sous-onglets Finance
 * 
 * ✅ FIX : Synchronisation portfolio (BourseSubTab) <-> bourseCrypto (InvestissementsSubTab)
 * 
 * Problème identifié :
 * - BourseSubTab utilise FinanceContext.portfolio
 * - BourseCryptoSubTab utilise useInvestissements.bourseCrypto.positions
 * - Ces deux systèmes sont séparés et ne se synchronisent pas
 * 
 * Solution :
 * - Service de synchronisation bidirectionnelle
 * - Écoute des changements dans les deux sens
 * - Synchronisation automatique via IndexedDB
 * 
 * @module services/finance/financeDataSync
 */

import { financeStorage } from './financeStorage';
import { investissementsStorage } from './investissementsStorage';
import logger from '../../utils/logger';

const log = logger.module('financeDataSync');

/**
 * Service de synchronisation des données Finance
 */
class FinanceDataSync {
  constructor() {
    this.listeners = new Set();
    this.syncing = false;
  }

  /**
   * Synchronise le portfolio (FinanceContext) vers bourseCrypto (useInvestissements)
   * 
   * @param {Array} portfolio - Portfolio depuis FinanceContext
   * @returns {Promise<Object>} Données bourseCrypto synchronisées
   */
  async syncPortfolioToBourseCrypto(portfolio) {
    if (this.syncing) {
      log.debug('[syncPortfolioToBourseCrypto] Synchronisation déjà en cours, skip');
      return null;
    }

    try {
      this.syncing = true;
      log.debug(`[syncPortfolioToBourseCrypto] Synchronisation de ${portfolio.length} positions`);

      // Récupérer données bourseCrypto actuelles
      const currentBourseCrypto = await investissementsStorage.getBourseCryptoData();
      
      // Convertir portfolio en positions bourseCrypto
      const positions = portfolio.map(pos => ({
        id: pos.id || `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ticker: pos.ticker,
        type: this._detectType(pos.ticker, pos.entreprise),
        montant: (pos.quantite || 0) * (pos.yahooData?.prixActuel || pos.prixEntree || 0),
        quantite: pos.quantite || 0,
        prixEntree: pos.prixEntree || 0,
        dateAchat: pos.dateAchat || new Date().toISOString(),
        source: 'bourse', // Marquer comme venant de BourseSubTab
        _syncedFrom: 'portfolio'
      }));

      // Fusionner avec positions existantes (éviter doublons)
      const existingPositions = currentBourseCrypto?.positions || [];
      const existingTickers = new Set(existingPositions.map(p => p.ticker));
      
      // Ajouter seulement les nouvelles positions
      const newPositions = positions.filter(p => !existingTickers.has(p.ticker));
      const mergedPositions = [...existingPositions, ...newPositions];

      // Mettre à jour bourseCrypto
      const updatedBourseCrypto = {
        ...currentBourseCrypto,
        positions: mergedPositions,
        lastSync: Date.now()
      };

      await investissementsStorage.saveBourseCryptoData(updatedBourseCrypto);
      
      log.info(`[syncPortfolioToBourseCrypto] ✅ Synchronisé ${newPositions.length} nouvelles positions`);
      
      // Notifier les listeners
      this._notifyListeners('bourseCrypto', updatedBourseCrypto);
      
      return updatedBourseCrypto;
    } catch (error) {
      log.error('[syncPortfolioToBourseCrypto] Erreur synchronisation:', error);
      throw error;
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Synchronise bourseCrypto (useInvestissements) vers portfolio (FinanceContext)
   * 
   * @param {Object} bourseCrypto - Données bourseCrypto depuis useInvestissements
   * @returns {Promise<Array>} Portfolio synchronisé
   */
  async syncBourseCryptoToPortfolio(bourseCrypto) {
    if (this.syncing) {
      log.debug('[syncBourseCryptoToPortfolio] Synchronisation déjà en cours, skip');
      return null;
    }

    try {
      this.syncing = true;
      const positions = bourseCrypto?.positions || [];
      log.debug(`[syncBourseCryptoToPortfolio] Synchronisation de ${positions.length} positions`);

      // Récupérer portfolio actuel
      const currentPortfolio = await financeStorage.getPortfolio();
      
      // Filtrer seulement les positions de type "action" ou "etf" (pas crypto)
      const boursePositions = positions.filter(p => 
        (p.type === 'action' || p.type === 'etf' || !p.type) && p.source !== 'crypto'
      );

      // Convertir en format portfolio
      const portfolioPositions = boursePositions.map(pos => ({
        id: pos.id || `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ticker: pos.ticker,
        entreprise: pos.entreprise || pos.ticker,
        quantite: pos.quantite || 0,
        prixEntree: pos.prixEntree || (pos.montant && pos.quantite ? pos.montant / pos.quantite : 0),
        dateAchat: pos.dateAchat || new Date().toISOString(),
        _syncedFrom: 'bourseCrypto'
      }));

      // Fusionner avec portfolio existant (éviter doublons)
      const existingTickers = new Set(currentPortfolio.map(p => p.ticker));
      const newPositions = portfolioPositions.filter(p => !existingTickers.has(p.ticker));
      const mergedPortfolio = [...currentPortfolio, ...newPositions];

      // Sauvegarder portfolio
      await financeStorage.savePortfolio(mergedPortfolio);
      
      log.info(`[syncBourseCryptoToPortfolio] ✅ Synchronisé ${newPositions.length} nouvelles positions`);
      
      // Notifier les listeners
      this._notifyListeners('portfolio', mergedPortfolio);
      
      return mergedPortfolio;
    } catch (error) {
      log.error('[syncBourseCryptoToPortfolio] Erreur synchronisation:', error);
      throw error;
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Détecte le type d'investissement depuis le ticker
   * 
   * @private
   */
  _detectType(ticker, entreprise) {
    if (!ticker) return 'action';
    
    const tickerUpper = ticker.toUpperCase();
    
    // Détecter crypto (BTC, ETH, etc.)
    const cryptoPattern = /^(BTC|ETH|BNB|ADA|SOL|XRP|DOT|DOGE|MATIC|AVAX|LINK|UNI|ATOM|LTC|BCH|XLM|ALGO|VET|FIL|TRX|ETC|THETA|EOS|AAVE|MKR|COMP|SNX|SUSHI|YFI|CRV|1INCH|BAL|REN|KNC|ZRX|BAT|ZEC|DASH|XMR|IOTA|NEO|ONT|QTUM|WAVES|STRAT|SC|STEEM|DCR|ZIL|ICX|WAN|WTC|GNT|REP|KMD|ARK|STORJ|FUN|POWR|MANA|PART|KNC|CVC|OMG|GAS|PAY|RLC|SALT|SUB|ENG|AST|DNT|ZRX|BAT|BNT|MKR|CVC|OMG|GNT|REP|AE|ZEC|ZRX|BAT|BNT|MKR|CVC|OMG|GNT|REP|AE|ZEC|ZRX|BAT|BNT|MKR|CVC|OMG|GNT|REP|AE|ZEC)$/i;
    if (cryptoPattern.test(tickerUpper)) {
      return 'crypto';
    }
    
    // Détecter ETF (souvent contient "ETF" ou patterns spécifiques)
    if (tickerUpper.includes('ETF') || tickerUpper.includes('ETP')) {
      return 'etf';
    }
    
    // Par défaut : action
    return 'action';
  }

  /**
   * Ajoute un listener pour les changements de synchronisation
   * 
   * @param {Function} callback - Callback appelé lors des changements
   * @returns {Function} Fonction pour retirer le listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notifie tous les listeners
   * 
   * @private
   */
  _notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        log.error('[financeDataSync] Erreur dans listener:', error);
      }
    });
  }

  /**
   * Synchronisation bidirectionnelle complète
   * 
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async syncAll() {
    try {
      log.debug('[syncAll] Début synchronisation complète');
      
      // 1. Charger les deux sources
      const portfolio = await financeStorage.getPortfolio();
      const bourseCrypto = await investissementsStorage.getBourseCryptoData();
      
      // 2. Synchroniser dans les deux sens
      const [syncedBourseCrypto, syncedPortfolio] = await Promise.all([
        this.syncPortfolioToBourseCrypto(portfolio),
        this.syncBourseCryptoToPortfolio(bourseCrypto)
      ]);
      
      log.info('[syncAll] ✅ Synchronisation complète terminée');
      
      return {
        portfolio: syncedPortfolio,
        bourseCrypto: syncedBourseCrypto
      };
    } catch (error) {
      log.error('[syncAll] Erreur synchronisation complète:', error);
      throw error;
    }
  }
}

export const financeDataSync = new FinanceDataSync();
