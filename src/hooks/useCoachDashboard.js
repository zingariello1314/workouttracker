/**
 * useCoachDashboard.js
 * 
 * Hook React pour gérer le dashboard coach (vue lecture seule).
 * 
 * Fonctionnalités :
 * - Import JSON partagé
 * - Validation format JSON
 * - Affichage données selon scope (stats, charts, progress)
 * - Lecture seule (pas de modification)
 * 
 * @module hooks/useCoachDashboard
 * @see ../../nouvelongletnutritionplan.md Section 6.1
 */

import { useState, useCallback } from 'react';
import {
  validateShareJson,
  parseShareJson,
  loadShareDataFromJson,
  SHARE_SCOPES,
  PERMISSIONS
} from '../services/nutrition/nutritionSharing';
import logger from '../utils/logger';

const log = logger.module('useCoachDashboard');

/**
 * Hook pour gérer le dashboard coach
 * 
 * @param {Object} options - Options du hook
 * @param {boolean} options.autoValidate - Valider automatiquement JSON importé (défaut: true)
 * @returns {Object} { shareData, loading, error, scope, importJson, validateJson, clearData, SHARE_SCOPES, PERMISSIONS }
 */
export const useCoachDashboard = (options = {}) => {
  const { autoValidate = true } = options;

  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scope, setScope] = useState(null);

  /**
   * Importe un fichier JSON partagé
   * 
   * @param {File} file - Fichier JSON à importer
   * @returns {Promise<Object>} Données formatées
   */
  const importJson = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);
      setShareData(null);
      setScope(null);

      // Vérifier type de fichier
      if (!file || file.type !== 'application/json') {
        throw new Error('Type de fichier invalide (attendu: application/json)');
      }

      // Lire fichier
      const fileContent = await file.text();
      
      // Parser JSON
      let jsonData;
      try {
        jsonData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error(`Erreur parsing JSON: ${parseError.message}`);
      }

      // Valider format (si autoValidate)
      if (autoValidate) {
        const validation = validateShareJson(jsonData);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      // Charger données
      const formattedData = loadShareDataFromJson(jsonData);
      
      setShareData(formattedData);
      setScope(formattedData.scope);
      
      log.debug('[importJson] JSON importé avec succès', {
        scope: formattedData.scope,
        hasStats: !!formattedData.stats,
        hasCharts: !!formattedData.charts,
        hasProgress: !!formattedData.progress
      });

      return formattedData;
    } catch (error) {
      log.error('[importJson] Erreur import JSON:', error);
      setError(error.message || 'Erreur import JSON');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [autoValidate]);

  /**
   * Valide un objet JSON (sans import fichier)
   * 
   * @param {Object} jsonData - Données JSON à valider
   * @returns {Object} { valid: boolean, error: string|null, data: Object|null }
   */
  const validateJson = useCallback((jsonData) => {
    try {
      setError(null);

      // Valider format
      const validation = validateShareJson(jsonData);
      if (!validation.valid) {
        setError(validation.error);
        return { valid: false, error: validation.error, data: null };
      }

      // Parser JSON
      const parsed = parseShareJson(jsonData);
      
      // Charger données
      const formattedData = loadShareDataFromJson(jsonData);
      
      setShareData(formattedData);
      setScope(formattedData.scope);

      log.debug('[validateJson] JSON validé avec succès', {
        scope: formattedData.scope,
        hasStats: !!formattedData.stats,
        hasCharts: !!formattedData.charts,
        hasProgress: !!formattedData.progress
      });

      return { valid: true, error: null, data: formattedData };
    } catch (error) {
      log.error('[validateJson] Erreur validation JSON:', error);
      setError(error.message || 'Erreur validation JSON');
      return { valid: false, error: error.message || 'Erreur validation JSON', data: null };
    }
  }, []);

  /**
   * Réinitialise les données (nouveau import)
   */
  const clearData = useCallback(() => {
    setShareData(null);
    setScope(null);
    setError(null);
    setLoading(false);
    
    log.debug('[clearData] Données réinitialisées');
  }, []);

  return {
    shareData,
    loading,
    error,
    scope,
    importJson,
    validateJson,
    clearData,
    SHARE_SCOPES,
    PERMISSIONS
  };
};

export default useCoachDashboard;

