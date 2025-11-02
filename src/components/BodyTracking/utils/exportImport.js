/**
 * 📦 MODULE D'EXPORT/IMPORT OPTIMISÉ - BODY TRACKING
 * 
 * Système professionnel d'export/import avec :
 * - Compression optionnelle des photos
 * - Validation complète des données
 * - Gestion d'erreurs robuste
 * - Support de migration de version
 * - Options d'export personnalisées
 */

import logger from '../../../utils/logger';

const log = logger.module('BodyTrackingExportImport');

/**
 * Version actuelle du format d'export
 */
export const EXPORT_VERSION = '2.0';

/**
 * Options par défaut pour l'export
 */
const DEFAULT_EXPORT_OPTIONS = {
  includePhotos: true,
  compressPhotos: true, // Exclure photos compressées si déjà compressées
  includeMetadata: true,
  includeReminders: true,
  format: 'json' // Pour extension future : 'csv', 'xlsx'
};

/**
 * Options par défaut pour l'import
 */
const DEFAULT_IMPORT_OPTIONS = {
  validateData: true,
  mergeStrategy: 'replace', // 'replace', 'merge', 'skip'
  createBackup: true,
  validateVersion: true
};

/**
 * Valide la structure des données Body Tracking
 * @param {Object} data - Données à valider
 * @returns {Object} - { valid: boolean, errors: Array<string>, warnings: Array<string> }
 */
export const validateBodyTrackingData = (data) => {
  const errors = [];
  const warnings = [];
  
  // Vérifier structure de base
  if (!data || typeof data !== 'object') {
    errors.push('Les données doivent être un objet valide');
    return { valid: false, errors, warnings };
  }
  
  // Vérifier version
  if (data.version && typeof data.version !== 'string' && typeof data.version !== 'number') {
    warnings.push('Version non standard détectée');
  }
  
  // Valider progressPhotos
  if (data.progressPhotos) {
    if (!Array.isArray(data.progressPhotos)) {
      errors.push('progressPhotos doit être un tableau');
    } else {
      data.progressPhotos.forEach((photo, index) => {
        if (!photo.id) warnings.push(`Photo ${index} sans ID`);
        if (!photo.date && !photo.timestamp) warnings.push(`Photo ${index} sans date`);
        if (!photo.url && !photo.photo) warnings.push(`Photo ${index} sans image`);
      });
    }
  }
  
  // Valider progressEntries
  if (data.progressEntries) {
    if (!Array.isArray(data.progressEntries)) {
      errors.push('progressEntries doit être un tableau');
    } else {
      data.progressEntries.forEach((entry, index) => {
        if (!entry.type) errors.push(`Entrée ${index} sans type`);
        if (!entry.date && !entry.timestamp) errors.push(`Entrée ${index} sans date`);
        
        if (entry.type === 'metrics') {
          if (entry.weight != null && (isNaN(entry.weight) || entry.weight < 0 || entry.weight > 500)) {
            warnings.push(`Entrée ${index}: poids suspect (${entry.weight}kg)`);
          }
          if (entry.height != null && (isNaN(entry.height) || entry.height < 50 || entry.height > 300)) {
            warnings.push(`Entrée ${index}: taille suspecte (${entry.height}cm)`);
          }
        }
        
        if (entry.type === 'impedance') {
          const requiredFields = ['bodyFatMass', 'muscleMass', 'bodyWater', 'boneMass'];
          const missingFields = requiredFields.filter(field => entry[field] == null);
          if (missingFields.length === requiredFields.length) {
            warnings.push(`Entrée ${index}: aucune métrique d'impédance`);
          }
        }
      });
    }
  }
  
  // Valider bodyTrackingReminders
  if (data.bodyTrackingReminders) {
    if (!Array.isArray(data.bodyTrackingReminders)) {
      errors.push('bodyTrackingReminders doit être un tableau');
    } else {
      data.bodyTrackingReminders.forEach((reminder, index) => {
        if (!reminder.type) errors.push(`Rappel ${index} sans type`);
        if (!reminder.enabled !== undefined && typeof reminder.enabled !== 'boolean') {
          warnings.push(`Rappel ${index}: enabled devrait être un booléen`);
        }
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      photos: data.progressPhotos?.length || 0,
      entries: data.progressEntries?.length || 0,
      reminders: data.bodyTrackingReminders?.length || 0
    }
  };
};

/**
 * Prépare les données pour l'export avec options personnalisées
 * @param {Object} bodyTrackingData - Données complètes Body Tracking
 * @param {Object} options - Options d'export
 * @returns {Object} - Données préparées pour export
 */
export const prepareExportData = (bodyTrackingData = {}, options = {}) => {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const timestamp = new Date().toISOString();
  
  const exportData = {
    version: EXPORT_VERSION,
    exportDate: timestamp,
    exportType: 'Body Tracking Data',
    appName: 'Workout Tracker - Suivi Corporel',
    exportOptions: opts
  };
  
  // Progress Photos
  if (opts.includePhotos) {
    exportData.progressPhotos = (bodyTrackingData.progressPhotos || []).map(photo => {
      // Si compressPhotos est false, garder photos originales
      // Sinon, photos sont déjà compressées lors de l'ajout
      const photoData = {
        id: photo.id,
        date: photo.date || photo.timestamp,
        weight: photo.weight || null,
        notes: photo.notes || '',
        url: photo.url || photo.photo || null,
        measurements: photo.measurements || {},
        angle: photo.angle || 'front',
        tags: photo.tags || [],
        // Métadonnées de compression si disponibles
        compression: photo.compression ? {
          originalSize: photo.compression.originalSize,
          compressedSize: photo.compression.compressedSize,
          reduction: photo.compression.reduction,
          quality: photo.compression.quality
        } : null,
        savedAt: photo.savedAt || Date.now(),
        version: photo.version || '1.0'
      };
      
      return photoData;
    });
  } else {
    exportData.progressPhotos = [];
    log.info('Photos exclues de l\'export selon options');
  }
  
  // Progress Entries
  exportData.progressEntries = (bodyTrackingData.progressEntries || []).map(entry => {
    return {
      id: entry.id,
      type: entry.type,
      date: entry.date || entry.timestamp,
      timestamp: entry.timestamp || new Date(entry.date).getTime(),
      // Données selon type
      ...(entry.type === 'metrics' && {
        weight: entry.weight,
        height: entry.height,
        waist: entry.waist,
        chest: entry.chest,
        arms: entry.arms,
        thighs: entry.thighs,
        neck: entry.neck,
        hips: entry.hips,
        notes: entry.notes || ''
      }),
      ...(entry.type === 'impedance' && {
        bodyFatMass: entry.bodyFatMass,
        bodyFatPercentage: entry.bodyFatPercentage,
        muscleMass: entry.muscleMass,
        bodyWater: entry.bodyWater,
        boneMass: entry.boneMass,
        visceralFat: entry.visceralFat,
        metabolicAge: entry.metabolicAge,
        bmr: entry.bmr,
        notes: entry.notes || ''
      }),
      tags: entry.tags || [],
      savedAt: entry.savedAt || Date.now(),
      version: entry.version || '1.0'
    };
  });
  
  // Reminders
  if (opts.includeReminders) {
    exportData.bodyTrackingReminders = (bodyTrackingData.bodyTrackingReminders || []).map(reminder => {
      return {
        type: reminder.type,
        enabled: reminder.enabled !== false,
        time: reminder.time || null,
        days: reminder.days || [],
        lastTriggered: reminder.lastTriggered || null,
        nextTrigger: reminder.nextTrigger || null
      };
    });
  } else {
    exportData.bodyTrackingReminders = [];
  }
  
  // Metadata
  if (opts.includeMetadata) {
    exportData.metadata = {
      totalPhotos: exportData.progressPhotos.length,
      totalEntries: exportData.progressEntries.length,
      totalReminders: exportData.bodyTrackingReminders.length,
      lastUpdate: bodyTrackingData.bodyTrackingLastUpdated || null,
      
      // Statistiques photos
      photosWithWeight: exportData.progressPhotos.filter(p => p.weight != null).length,
      photosWithNotes: exportData.progressPhotos.filter(p => p.notes).length,
      photosWithMeasurements: exportData.progressPhotos.filter(p => 
        p.measurements && Object.keys(p.measurements).length > 0
      ).length,
      
      // Statistiques entrées
      entriesByType: exportData.progressEntries.reduce((acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
      }, {}),
      
      // Période couverte
      dateRange: (() => {
        const allDates = [
          ...exportData.progressPhotos.map(p => p.date),
          ...exportData.progressEntries.map(e => e.date)
        ].filter(Boolean).sort();
        
        return {
          earliest: allDates[0] || null,
          latest: allDates[allDates.length - 1] || null
        };
      })(),
      
      // Taille estimée
      estimatedSize: JSON.stringify(exportData).length,
      estimatedSizeKB: Math.round((JSON.stringify(exportData).length / 1024) * 100) / 100
    };
  }
  
  log.info('Données préparées pour export', {
    photos: exportData.progressPhotos.length,
    entries: exportData.progressEntries.length,
    reminders: exportData.bodyTrackingReminders.length,
    sizeKB: exportData.metadata?.estimatedSizeKB || 0
  });
  
  return exportData;
};

/**
 * Migre les données d'une ancienne version vers la version actuelle
 * @param {Object} importedData - Données importées
 * @returns {Object} - Données migrées
 */
export const migrateImportData = (importedData) => {
  const version = parseFloat(importedData.version || '1.0');
  
  // Version 1.0 → 2.0
  if (version < 2.0) {
    log.info('Migration de version 1.0 vers 2.0');
    
    // Normaliser dates
    const normalizeDate = (dateValue) => {
      if (!dateValue) return null;
      if (typeof dateValue === 'string') return dateValue;
      if (typeof dateValue === 'number') return new Date(dateValue).toISOString().split('T')[0];
      return null;
    };
    
    // Migrer photos
    if (importedData.progressPhotos) {
      importedData.progressPhotos = importedData.progressPhotos.map(photo => ({
        ...photo,
        date: normalizeDate(photo.date || photo.timestamp),
        tags: photo.tags || [],
        version: '1.0'
      }));
    }
    
    // Migrer entrées
    if (importedData.progressEntries) {
      importedData.progressEntries = importedData.progressEntries.map(entry => ({
        ...entry,
        date: normalizeDate(entry.date || entry.timestamp),
        tags: entry.tags || [],
        version: '1.0'
      }));
    }
    
    // Migrer rappels
    if (importedData.bodyTrackingReminders) {
      importedData.bodyTrackingReminders = importedData.bodyTrackingReminders.map(reminder => ({
        ...reminder,
        enabled: reminder.enabled !== false,
        days: reminder.days || []
      }));
    }
    
    importedData.version = EXPORT_VERSION;
  }
  
  return importedData;
};

/**
 * Traite et valide les données importées
 * @param {Object|string} importedData - Données importées (objet ou JSON string)
 * @param {Object} options - Options d'import
 * @returns {Object} - { valid: boolean, data: Object, errors: Array, warnings: Array, stats: Object }
 */
export const processImportData = (importedData, options = {}) => {
  const opts = { ...DEFAULT_IMPORT_OPTIONS, ...options };
  
  try {
    // Parser JSON si nécessaire
    let parsedData;
    if (typeof importedData === 'string') {
      parsedData = JSON.parse(importedData);
    } else {
      parsedData = importedData;
    }
    
    // Validation version
    if (opts.validateVersion) {
      const version = parseFloat(parsedData.version || '1.0');
      if (version > parseFloat(EXPORT_VERSION)) {
        return {
          valid: false,
          errors: [`Version ${version} plus récente que la version supportée ${EXPORT_VERSION}`],
          warnings: [],
          stats: null
        };
      }
    }
    
    // Migration si nécessaire
    const migratedData = migrateImportData(parsedData);
    
    // Validation des données
    const validation = opts.validateData 
      ? validateBodyTrackingData(migratedData)
      : { valid: true, errors: [], warnings: [], stats: null };
    
    if (!validation.valid) {
      log.error('Validation échouée', validation.errors);
      return {
        valid: false,
        errors: validation.errors,
        warnings: validation.warnings,
        stats: validation.stats
      };
    }
    
    log.info('Import traité avec succès', {
      photos: migratedData.progressPhotos?.length || 0,
      entries: migratedData.progressEntries?.length || 0,
      reminders: migratedData.bodyTrackingReminders?.length || 0,
      warnings: validation.warnings.length
    });
    
    return {
      valid: true,
      data: migratedData,
      errors: [],
      warnings: validation.warnings,
      stats: validation.stats
    };
    
  } catch (error) {
    log.error('Erreur lors du traitement de l\'import', error);
    return {
      valid: false,
      errors: [`Erreur de parsing: ${error.message}`],
      warnings: [],
      stats: null
    };
  }
};

/**
 * Crée un fichier blob pour téléchargement
 * @param {Object} exportData - Données à exporter
 * @param {string} filename - Nom du fichier
 * @returns {Promise<void>}
 */
export const downloadExportFile = (exportData, filename = null) => {
  try {
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const defaultFilename = `body-tracking-data-${new Date().toISOString().split('T')[0]}.json`;
    const finalFilename = filename || defaultFilename;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    log.info('Fichier export téléchargé', { filename: finalFilename, size: jsonString.length });
    
    return { success: true, filename: finalFilename, size: jsonString.length };
  } catch (error) {
    log.error('Erreur lors du téléchargement', error);
    throw error;
  }
};

