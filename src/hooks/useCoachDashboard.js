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

      // ✅ PHASE 4 : Valider format (si autoValidate) avec ImportValidator
      if (autoValidate) {
        const validation = await validateShareJson(file); // Support File directement
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        
        // ✅ PHASE 4 : Si export chiffré, demander mot de passe (futur : UI modal)
        // Pour l'instant, on suppose export non chiffré
        jsonData = validation.data;
      }

      // ✅ PHASE 4 : Charger données avec validation profonde
      const formattedData = await loadShareDataFromJson(file, { password: null }); // Support File
      
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
   * ✅ PHASE 4 : Support exports chiffrés et validation profonde
   * 
   * @param {Object|File|string} jsonDataOrFile - Données JSON, File ou string à valider
   * @param {Object} options - Options de validation
   * @param {string} options.password - Mot de passe pour déchiffrement (requis si export chiffré)
   * @returns {Promise<Object>} { valid: boolean, error: string|null, data: Object|null }
   */
  const validateJson = useCallback(async (jsonDataOrFile, options = {}) => {
    try {
      setError(null);
      setLoading(true);

      const { password = null } = options;

      // ✅ PHASE 4 : Valider format avec ImportValidator
      const validation = await validateShareJson(jsonDataOrFile);
      if (!validation.valid) {
        setError(validation.error);
        return { valid: false, error: validation.error, data: null };
      }

      // ✅ PHASE 4 : Parser JSON avec support chiffré
      const parsed = await parseShareJson(jsonDataOrFile);
      
      // ✅ PHASE 4 : Charger données avec support chiffré
      const formattedData = await loadShareDataFromJson(jsonDataOrFile, { password });
      
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
    } finally {
      setLoading(false);
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

