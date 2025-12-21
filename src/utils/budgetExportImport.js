/**
 * Utilitaires d'export/import pour le module Budget Personnel
 * 
 * ✅ PHASE 1 - Solution Export JSON : Système d'export/import complet pour Budget
 * - Fonction prepareBudgetExportData pour export complet
 * - Compatible avec système export SettingsTab
 * - Export budget, catégories, dépenses, dépenses planifiées, charges fixes
 * - Validation et migration des données importées
 * 
 * @module utils/budgetExportImport
 * @see docs/finance/ANALYSE_PROFONDE_4_SOUS_ONGLETS_BOURSE.md - Phase 1
 */

import { budgetStorage } from '../services/finance/budgetStorage';
import logger from './logger';

const log = logger.module('budgetExportImport');

const BUDGET_EXPORT_VERSION = '1.0.0';

/**
 * Options d'export par défaut
 */
const DEFAULT_EXPORT_OPTIONS = {
  includeHistory: true,        // Inclure l'historique des actions
  includeMetadata: true,       // Inclure les métadonnées (stats, taille, etc.)
  includeCalculations: false   // Ne pas inclure les calculs temporaires (recalculables)
};

/**
 * Prépare les données Budget pour l'export JSON
 * 
 * ✅ SOLUTION EXPORT JSON : Export complet et cohérent avec les autres modules
 * 
 * @param {Object} options - Options d'export
 * @param {boolean} options.includeHistory - Inclure l'historique (défaut: true)
 * @param {boolean} options.includeMetadata - Inclure métadonnées (défaut: true)
 * @param {boolean} options.includeCalculations - Inclure calculs (défaut: false)
 * @returns {Promise<Object>} Données formatées pour export
 */
export const prepareBudgetExportData = async (options = {}) => {
  try {
    const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
    
    log.debug('[prepareBudgetExportData] Préparation export Budget', opts);
    
    // ✅ Charger toutes les données depuis IndexedDB
    const [budget, categories, depenses, depensesPlanifiees, chargesFixes, history] = await Promise.all([
      budgetStorage.loadBudget(),
      budgetStorage.loadCategories(),
      budgetStorage.loadDepenses(),
      budgetStorage.loadDepensesPlanifiees(),
      budgetStorage.loadChargesFixes(),
      opts.includeHistory ? budgetStorage.loadHistory(1000) : Promise.resolve([])
    ]);
    
    // ✅ Normaliser les données pour l'export (structure cohérente)
    const normalizedBudget = {
      id: budget?.id || 'main',
      revenus: budget?.revenus || 0,
      depenses: budget?.depenses || { categories: [] },
      epargne: {
        objectif: budget?.epargne?.objectif || 0,
        actuelle: budget?.epargne?.actuelle || 0
      },
      createdAt: budget?.createdAt || null,
      updatedAt: budget?.updatedAt || null
    };
    
    // Normaliser catégories
    const normalizedCategories = (categories || []).map(cat => ({
      id: cat.id,
      nom: cat.nom || '',
      icone: cat.icone || '📁',
      couleur: cat.couleur || '#6b7280',
      budgetMensuel: cat.budgetMensuel || 0,
      sousCategories: Array.isArray(cat.sousCategories) ? cat.sousCategories : [],
      ordre: cat.ordre || 0,
      regles: cat.regles || {
        alerte80: false,
        alerte100: false,
        alerte120: false,
        action80: 'NOTIFICATION',
        action100: 'BLOCK',
        action120: 'BLOCK_STRICT'
      },
      createdAt: cat.createdAt || null,
      updatedAt: cat.updatedAt || null
    }));
    
    // Normaliser dépenses
    const normalizedDepenses = (depenses || []).map(dep => ({
      id: dep.id,
      titre: dep.titre || '',
      montant: dep.montant || 0,
      date: dep.date || null,
      categorie: dep.categorie || null,
      statut: dep.statut || 'realise',
      notes: dep.notes || '',
      createdAt: dep.createdAt || null,
      updatedAt: dep.updatedAt || null
    }));
    
    // Normaliser dépenses planifiées
    const normalizedDepensesPlanifiees = (depensesPlanifiees || []).map(dep => ({
      id: dep.id,
      titre: dep.titre || '',
      montant: dep.montant || 0,
      date: dep.date || null,
      categorie: dep.categorie || null,
      statut: dep.statut || 'planifie',
      priorite: dep.priorite || 'normal',
      notes: dep.notes || '',
      createdAt: dep.createdAt || null,
      updatedAt: dep.updatedAt || null
    }));
    
    // Normaliser charges fixes
    const normalizedChargesFixes = (chargesFixes || []).map(charge => ({
      id: charge.id,
      nom: charge.nom || charge.type || '',
      type: charge.type || 'autre',
      montant: charge.montant || 0,
      frequence: charge.frequence || 'mensuel',
      icone: charge.icone || '💰',
      couleur: charge.couleur || '#6b7280',
      dateDebut: charge.dateDebut || null,
      dateFin: charge.dateFin || null,
      notes: charge.notes || '',
      createdAt: charge.createdAt || null,
      updatedAt: charge.updatedAt || null
    }));
    
    // Normaliser historique (optionnel)
    const normalizedHistory = opts.includeHistory ? (history || []).map(entry => ({
      id: entry.id,
      action: entry.action,
      data: entry.data,
      timestamp: entry.timestamp
    })) : [];
    
    // ✅ Calculer métadonnées pour summary
    const summary = {
      budget: {
        revenus: normalizedBudget.revenus,
        epargneActuelle: normalizedBudget.epargne.actuelle,
        epargneObjectif: normalizedBudget.epargne.objectif
      },
      categories: {
        total: normalizedCategories.length,
        avecBudget: normalizedCategories.filter(c => (c.budgetMensuel || 0) > 0).length
      },
      depenses: {
        total: normalizedDepenses.length,
        totalMontant: normalizedDepenses.reduce((sum, d) => sum + (d.montant || 0), 0),
        parStatut: normalizedDepenses.reduce((acc, d) => {
          const statut = d.statut || 'realise';
          acc[statut] = (acc[statut] || 0) + 1;
          return acc;
        }, {})
      },
      depensesPlanifiees: {
        total: normalizedDepensesPlanifiees.length,
        totalMontant: normalizedDepensesPlanifiees.reduce((sum, d) => sum + (d.montant || 0), 0),
        parStatut: normalizedDepensesPlanifiees.reduce((acc, d) => {
          const statut = d.statut || 'planifie';
          acc[statut] = (acc[statut] || 0) + 1;
          return acc;
        }, {}),
        parPriorite: normalizedDepensesPlanifiees.reduce((acc, d) => {
          const priorite = d.priorite || 'normal';
          acc[priorite] = (acc[priorite] || 0) + 1;
          return acc;
        }, {})
      },
      chargesFixes: {
        total: normalizedChargesFixes.length,
        totalMensuel: normalizedChargesFixes
          .filter(c => c.frequence === 'mensuel')
          .reduce((sum, c) => sum + (c.montant || 0), 0),
        parFrequence: normalizedChargesFixes.reduce((acc, c) => {
          const freq = c.frequence || 'mensuel';
          acc[freq] = (acc[freq] || 0) + 1;
          return acc;
        }, {})
      },
      history: {
        total: normalizedHistory.length
      }
    };
    
    // Construire l'objet d'export
    const exportData = {
      version: BUDGET_EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      module: 'budget',
      exportType: 'Budget Personnel Data',
      appName: 'Workout Tracker - Budget Personnel',
      data: {
        budget: normalizedBudget,
        categories: normalizedCategories,
        depenses: normalizedDepenses,
        depensesPlanifiees: normalizedDepensesPlanifiees,
        chargesFixes: normalizedChargesFixes,
        ...(opts.includeHistory && { history: normalizedHistory })
      },
      summary,
      metadata: {
        includeHistory: opts.includeHistory,
        includeMetadata: opts.includeMetadata,
        exportOptions: opts
      }
    };
    
    // ✅ Ajouter métadonnées de taille si demandé
    if (opts.includeMetadata) {
      const rawSize = JSON.stringify(exportData).length;
      exportData.metadata.estimatedSize = rawSize;
      exportData.metadata.estimatedSizeKB = Math.round((rawSize / 1024) * 100) / 100;
    }
    
    log.info('[prepareBudgetExportData] Export Budget préparé', {
      categories: normalizedCategories.length,
      depenses: normalizedDepenses.length,
      depensesPlanifiees: normalizedDepensesPlanifiees.length,
      chargesFixes: normalizedChargesFixes.length,
      history: normalizedHistory.length,
      sizeKB: exportData.metadata?.estimatedSizeKB || 0
    });
    
    return exportData;
  } catch (error) {
    log.error('[prepareBudgetExportData] Erreur préparation export Budget:', error);
    throw error;
  }
};

/**
 * Valide les données Budget importées
 * 
 * @param {Object} data - Données à valider
 * @returns {Object} { valid, errors, warnings, stats }
 */
export const validateBudgetExportData = (data) => {
  const errors = [];
  const warnings = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Les données importées doivent être un objet.');
    return { valid: false, errors, warnings, stats: null };
  }
  
  // Vérifier version
  if (!data.version) {
    warnings.push('Version non spécifiée, traitement comme version 1.0.0');
  }
  
  // Vérifier structure data
  if (!data.data || typeof data.data !== 'object') {
    errors.push('Le champ data est manquant ou invalide.');
    return { valid: false, errors, warnings, stats: null };
  }
  
  // Vérifier budget
  if (!data.data.budget) {
    errors.push('Le champ data.budget est manquant.');
  } else {
    if (typeof data.data.budget.revenus !== 'number') {
      warnings.push('Budget.revenus devrait être un nombre');
    }
  }
  
  // Vérifier catégories
  if (!Array.isArray(data.data.categories)) {
    errors.push('data.categories doit être un tableau');
  } else {
    data.data.categories.forEach((cat, index) => {
      if (!cat.id) {
        errors.push(`Catégorie ${index} sans id`);
      }
      if (!cat.nom) {
        warnings.push(`Catégorie ${index} sans nom (id=${cat.id || '??'})`);
      }
    });
  }
  
  // Vérifier dépenses
  if (!Array.isArray(data.data.depenses)) {
    errors.push('data.depenses doit être un tableau');
  } else {
    data.data.depenses.forEach((dep, index) => {
      if (!dep.id) {
        errors.push(`Dépense ${index} sans id`);
      }
      if (typeof dep.montant !== 'number') {
        warnings.push(`Dépense ${index}: montant devrait être un nombre`);
      }
    });
  }
  
  // Vérifier dépenses planifiées
  if (!Array.isArray(data.data.depensesPlanifiees)) {
    errors.push('data.depensesPlanifiees doit être un tableau');
  }
  
  // Vérifier charges fixes
  if (!Array.isArray(data.data.chargesFixes)) {
    errors.push('data.chargesFixes doit être un tableau');
  }
  
  // Calculer stats
  const stats = {
    budget: data.data.budget ? 1 : 0,
    categories: Array.isArray(data.data.categories) ? data.data.categories.length : 0,
    depenses: Array.isArray(data.data.depenses) ? data.data.depenses.length : 0,
    depensesPlanifiees: Array.isArray(data.data.depensesPlanifiees) ? data.data.depensesPlanifiees.length : 0,
    chargesFixes: Array.isArray(data.data.chargesFixes) ? data.data.chargesFixes.length : 0,
    history: Array.isArray(data.data.history) ? data.data.history.length : 0
  };
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  };
};

/**
 * Migre les données importées vers la structure actuelle si nécessaire
 * 
 * @param {Object} importedData - Données importées
 * @returns {Object} Données migrées vers structure actuelle
 */
export const migrateBudgetImportData = (importedData) => {
  if (!importedData || typeof importedData !== 'object') {
    return { data: { budget: null, categories: [], depenses: [], depensesPlanifiees: [], chargesFixes: [] }, version: BUDGET_EXPORT_VERSION };
  }
  
  const version = importedData.version || '1.0.0';
  
  // ✅ Migration future : adapter selon version si nécessaire
  // Pour l'instant, version 1.0.0, pas de migration
  if (version === '1.0.0') {
    return {
      data: {
        budget: importedData.data?.budget || null,
        categories: importedData.data?.categories || [],
        depenses: importedData.data?.depenses || [],
        depensesPlanifiees: importedData.data?.depensesPlanifiees || [],
        chargesFixes: importedData.data?.chargesFixes || [],
        history: importedData.data?.history || []
      },
      version: BUDGET_EXPORT_VERSION
    };
  }
  
  // Pour les versions futures, ajouter logique de migration ici
  log.warn(`[migrateBudgetImportData] Version ${version} non gérée, utilisation directe`);
  return importedData;
};

/**
 * Traite les données importées (validation + migration)
 * 
 * @param {Object} importedData - Données importées
 * @param {Object} options - Options
 * @returns {Object} { valid, errors, warnings, stats, data }
 */
export const processBudgetImportData = (importedData, options = {}) => {
  const { validate = true, migrate = true } = options;
  
  // Migrer d'abord
  const migrated = migrate ? migrateBudgetImportData(importedData) : importedData;
  
  // Valider ensuite
  const validation = validate ? validateBudgetExportData(migrated) : { valid: true, errors: [], warnings: [], stats: null };
  
  return {
    ...validation,
    data: migrated.data,
    version: migrated.version
  };
};

/**
 * Exporte les données Budget en JSON
 * 
 * @param {Object} options - Options d'export (voir prepareBudgetExportData)
 * @returns {Promise<void>}
 */
export const exportBudgetData = async (options = {}) => {
  try {
    const data = await prepareBudgetExportData(options);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log.info('[exportBudgetData] Export Budget réussi');
  } catch (error) {
    log.error('[exportBudgetData] Erreur export Budget:', error);
    throw error;
  }
};

/**
 * Télécharge les données Budget exportées
 * 
 * @param {Object} exportData - Données exportées
 * @param {string} filename - Nom du fichier (optionnel)
 */
export const downloadBudgetExportFile = (exportData, filename = null) => {
  try {
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `budget_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log.info('[downloadBudgetExportFile] Fichier Budget téléchargé');
  } catch (error) {
    log.error('[downloadBudgetExportFile] Erreur téléchargement:', error);
    throw error;
  }
};

/**
 * Importe les données Budget depuis JSON
 * 
 * @param {Object} importData - Données JSON importées
 * @param {Object} options - Options d'import
 * @param {boolean} options.merge - Fusionner avec données existantes (défaut: false)
 * @param {boolean} options.overwrite - Écraser données existantes (défaut: false)
 * @param {boolean} options.validate - Valider les données (défaut: true)
 * @returns {Promise<Object>} Résultat de l'import
 */
export const importBudgetData = async (importData, options = {}) => {
  try {
    const opts = {
      merge: false,
      overwrite: false,
      validate: true,
      ...options
    };
    
    log.debug('[importBudgetData] Début import Budget', opts);
    
    // Traiter les données (migration + validation)
    const processed = processBudgetImportData(importData, { validate: opts.validate });
    
    if (!processed.valid) {
      throw new Error(`Données invalides: ${processed.errors.join(', ')}`);
    }
    
    const { budget, categories, depenses, depensesPlanifiees, chargesFixes, history } = processed.data;
    
    let result = {
      imported: {
        budget: 0,
        categories: 0,
        depenses: 0,
        depensesPlanifiees: 0,
        chargesFixes: 0,
        history: 0
      },
      skipped: 0,
      errors: [],
      warnings: processed.warnings || []
    };
    
    // ✅ Importer budget
    if (budget) {
      try {
        if (opts.overwrite || !(await budgetStorage.loadBudget())?.id) {
          await budgetStorage.saveBudget(budget);
          result.imported.budget = 1;
        }
      } catch (err) {
        log.error('[importBudgetData] Erreur import budget:', err);
        result.errors.push('Erreur import budget');
      }
    }
    
    // ✅ Importer catégories
    if (Array.isArray(categories) && categories.length > 0) {
      try {
        if (opts.overwrite) {
          // Supprimer toutes les catégories existantes
          const existing = await budgetStorage.loadCategories();
          for (const cat of existing) {
            await budgetStorage.deleteCategory(cat.id);
          }
        }
        
        const existing = opts.overwrite ? [] : await budgetStorage.loadCategories();
        const existingIds = new Set(existing.map(c => c.id));
        
        for (const category of categories) {
          if (opts.merge && existingIds.has(category.id)) {
            result.skipped++;
            continue;
          }
          await budgetStorage.saveCategory(category);
          result.imported.categories++;
        }
      } catch (err) {
        log.error('[importBudgetData] Erreur import categories:', err);
        result.errors.push('Erreur import categories');
      }
    }
    
    // ✅ Importer dépenses
    if (Array.isArray(depenses) && depenses.length > 0) {
      try {
        if (opts.overwrite) {
          const existing = await budgetStorage.loadDepenses();
          for (const dep of existing) {
            await budgetStorage.deleteDepense(dep.id);
          }
        }
        
        const existing = opts.overwrite ? [] : await budgetStorage.loadDepenses();
        const existingIds = new Set(existing.map(d => d.id));
        
        for (const depense of depenses) {
          if (opts.merge && existingIds.has(depense.id)) {
            result.skipped++;
            continue;
          }
          await budgetStorage.saveDepense(depense);
          result.imported.depenses++;
        }
      } catch (err) {
        log.error('[importBudgetData] Erreur import depenses:', err);
        result.errors.push('Erreur import depenses');
      }
    }
    
    // ✅ Importer dépenses planifiées
    if (Array.isArray(depensesPlanifiees) && depensesPlanifiees.length > 0) {
      try {
        if (opts.overwrite) {
          const existing = await budgetStorage.loadDepensesPlanifiees();
          for (const dep of existing) {
            await budgetStorage.deleteDepensePlanifiee(dep.id);
          }
        }
        
        const existing = opts.overwrite ? [] : await budgetStorage.loadDepensesPlanifiees();
        const existingIds = new Set(existing.map(d => d.id));
        
        for (const depense of depensesPlanifiees) {
          if (opts.merge && existingIds.has(depense.id)) {
            result.skipped++;
            continue;
          }
          await budgetStorage.saveDepensePlanifiee(depense);
          result.imported.depensesPlanifiees++;
        }
      } catch (err) {
        log.error('[importBudgetData] Erreur import depensesPlanifiees:', err);
        result.errors.push('Erreur import depensesPlanifiees');
      }
    }
    
    // ✅ Importer charges fixes
    if (Array.isArray(chargesFixes) && chargesFixes.length > 0) {
      try {
        if (opts.overwrite) {
          const existing = await budgetStorage.loadChargesFixes();
          for (const charge of existing) {
            await budgetStorage.deleteChargeFixe(charge.id);
          }
        }
        
        const existing = opts.overwrite ? [] : await budgetStorage.loadChargesFixes();
        const existingIds = new Set(existing.map(c => c.id));
        
        for (const charge of chargesFixes) {
          if (opts.merge && existingIds.has(charge.id)) {
            result.skipped++;
            continue;
          }
          await budgetStorage.saveChargeFixe(charge);
          result.imported.chargesFixes++;
        }
      } catch (err) {
        log.error('[importBudgetData] Erreur import chargesFixes:', err);
        result.errors.push('Erreur import chargesFixes');
      }
    }
    
    // ✅ Importer historique (optionnel, ne pas écraser)
    if (Array.isArray(history) && history.length > 0 && opts.includeHistory !== false) {
      // Historique : toujours en merge (ne jamais écraser)
      // Pas de méthode directe dans budgetStorage, on skip pour l'instant
      // TODO: Implémenter si nécessaire
      log.debug('[importBudgetData] Historique ignoré (à implémenter)');
    }
    
    const totalImported = 
      result.imported.budget +
      result.imported.categories +
      result.imported.depenses +
      result.imported.depensesPlanifiees +
      result.imported.chargesFixes;
    
    log.info('[importBudgetData] Import Budget terminé', {
      imported: totalImported,
      skipped: result.skipped,
      errors: result.errors.length
    });
    
    return result;
  } catch (error) {
    log.error('[importBudgetData] Erreur import Budget:', error);
    throw error;
  }
};

