/**
 * Utilitaires d'export/import pour le module Finance
 * 
 * ✅ OPTIMISATION Phase 2.2 : Export JSON Finance
 * - Fonction prepareFinanceExportData pour export complet
 * - Compatible avec système export SettingsTab
 * - Export portfolio, historique, métriques calculées
 * 
 * @module utils/financeExportImport
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md
 */

import { financeStorage } from '../services/finance/financeStorage';
import logger from './logger';

const log = logger.module('financeExportImport');

const FINANCE_EXPORT_VERSION = '1.0.0';

/**
 * Prépare les données Finance pour l'export JSON
 * 
 * @param {Object} options - Options d'export
 * @param {boolean} options.includeCalculations - Inclure les métriques calculées (défaut: true)
 * @param {boolean} options.includeYahooData - Inclure les données Yahoo Finance (défaut: true)
 * @param {boolean} options.includeHistory - Inclure l'historique des actions (défaut: true)
 * @returns {Promise<Object>} Données formatées pour export
 */
export const prepareFinanceExportData = async (options = {}) => {
  try {
    const opts = {
      includeCalculations: true,
      includeYahooData: true,
      includeHistory: true,
      ...options
    };

    // Charger portfolio depuis IndexedDB
    const portfolio = await financeStorage.loadPortfolio();

    // Normaliser les positions pour l'export
    const normalizedPortfolio = portfolio.map((position) => {
      const normalized = {
        id: position.id,
        ticker: position.ticker,
        entreprise: position.entreprise || position.ticker,
        quantite: position.quantite,
        prixEntree: position.prixEntree,
        dateAchat: position.dateAchat,
        investissementTotal: position.investissementTotal || (position.quantite * position.prixEntree),
        createdAt: position.createdAt || null,
        updatedAt: position.updatedAt || null,
      };

      // Inclure données Yahoo si demandé
      if (opts.includeYahooData && position.yahooData) {
        normalized.yahooData = {
          prixActuel: position.yahooData.prixActuel,
          variationJour: position.yahooData.variationJour,
          volume: position.yahooData.volume,
          capitalisation: position.yahooData.capitalisation,
          ma20: position.yahooData.ma20,
          ma50: position.yahooData.ma50,
          ma200: position.yahooData.ma200,
          timestamp: position.yahooData.timestamp,
        };
      }

      // Inclure métriques calculées si demandé
      if (opts.includeCalculations && position.calculs) {
        normalized.calculs = {
          valeurPosition: position.calculs.valeurPosition,
          plusValueEuro: position.calculs.plusValueEuro,
          plusValuePourcent: position.calculs.plusValuePourcent,
          poidsPortfolio: position.calculs.poidsPortfolio,
          signal: position.calculs.signal ? {
            signal: position.calculs.signal.signal,
            confidence: position.calculs.signal.confidence,
          } : null,
        };
      }

      return normalized;
    });

    // Charger historique si demandé
    let history = [];
    if (opts.includeHistory) {
      try {
        history = await financeStorage.loadHistory();
      } catch (err) {
        log.warn('Erreur chargement historique pour export:', err);
        history = [];
      }
    }

    // Calculer résumé portfolio
    const summary = {
      totalPositions: normalizedPortfolio.length,
      totalInvesti: normalizedPortfolio.reduce((sum, pos) => 
        sum + (pos.investissementTotal || pos.quantite * pos.prixEntree), 0
      ),
      totalValorise: normalizedPortfolio.reduce((sum, pos) => 
        sum + (pos.calculs?.valeurPosition || pos.investissementTotal || pos.quantite * pos.prixEntree), 0
      ),
      totalPlusValue: normalizedPortfolio.reduce((sum, pos) => 
        sum + (pos.calculs?.plusValueEuro || 0), 0
      ),
      historyEntries: history.length,
    };

    // Calculer plus-value totale en pourcentage
    if (summary.totalInvesti > 0) {
      summary.totalPlusValuePourcent = (summary.totalPlusValue / summary.totalInvesti) * 100;
    } else {
      summary.totalPlusValuePourcent = 0;
    }

    const exportData = {
      version: FINANCE_EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      module: 'finance',
      exportType: 'Finance Portfolio Data',
      appName: 'Workout Tracker - Finance',
      data: {
        portfolio: normalizedPortfolio,
        history: opts.includeHistory ? history : [],
      },
      summary,
      metadata: {
        includeCalculations: opts.includeCalculations,
        includeYahooData: opts.includeYahooData,
        includeHistory: opts.includeHistory,
      },
    };

    log.info(`Finance export prepared: ${normalizedPortfolio.length} positions, ${history.length} history entries`);
    return exportData;
  } catch (error) {
    log.error('Erreur préparation export Finance:', error);
    throw error;
  }
};

/**
 * Exporte les données Finance en JSON
 * 
 * @param {Object} options - Options d'export (voir prepareFinanceExportData)
 * @returns {Promise<void>}
 */
export const exportFinanceData = async (options = {}) => {
  try {
    const data = await prepareFinanceExportData(options);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log.info('Finance data exported successfully');
  } catch (error) {
    log.error('Erreur export Finance:', error);
    throw error;
  }
};

/**
 * Importe les données Finance depuis JSON
 * 
 * @param {Object} importData - Données JSON importées
 * @param {Object} options - Options d'import
 * @param {boolean} options.merge - Fusionner avec portfolio existant (défaut: false)
 * @param {boolean} options.overwrite - Écraser portfolio existant (défaut: false)
 * @returns {Promise<Object>} Résultat de l'import
 */
export const importFinanceData = async (importData, options = {}) => {
  try {
    const opts = {
      merge: false,
      overwrite: false,
      ...options
    };

    // Validation structure
    if (!importData || !importData.data || !Array.isArray(importData.data.portfolio)) {
      throw new Error('Format de données invalide');
    }

    const importedPortfolio = importData.data.portfolio;
    let result = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    if (opts.overwrite) {
      // Écraser portfolio existant
      await financeStorage.savePortfolio(importedPortfolio);
      result.imported = importedPortfolio.length;
    } else if (opts.merge) {
      // Fusionner avec portfolio existant
      const existingPortfolio = await financeStorage.loadPortfolio();
      const existingIds = new Set(existingPortfolio.map(p => p.id));
      
      const toImport = importedPortfolio.filter(pos => {
        if (existingIds.has(pos.id)) {
          result.skipped++;
          return false;
        }
        return true;
      });

      const merged = [...existingPortfolio, ...toImport];
      await financeStorage.savePortfolio(merged);
      result.imported = toImport.length;
    } else {
      // Ajouter seulement si portfolio vide
      const existingPortfolio = await financeStorage.loadPortfolio();
      if (existingPortfolio.length > 0) {
        throw new Error('Portfolio non vide. Utilisez merge ou overwrite pour importer.');
      }
      await financeStorage.savePortfolio(importedPortfolio);
      result.imported = importedPortfolio.length;
    }

    // Importer historique si présent
    if (importData.data.history && Array.isArray(importData.data.history)) {
      try {
        for (const entry of importData.data.history) {
          await financeStorage.saveHistoryEntry(entry);
        }
      } catch (err) {
        log.warn('Erreur import historique:', err);
        result.errors.push('Erreur import historique');
      }
    }

    log.info(`Finance import completed: ${result.imported} imported, ${result.skipped} skipped`);
    return result;
  } catch (error) {
    log.error('Erreur import Finance:', error);
    throw error;
  }
};
