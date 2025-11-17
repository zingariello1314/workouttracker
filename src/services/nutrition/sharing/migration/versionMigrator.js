/**
 * versionMigrator.js
 * 
 * ✅ PHASE 12.1 : Système de migration de versions
 * 
 * ✅ PHASE 4 : Migration automatique entre versions
 * - Support migration v1.0 → v2.0 (futur)
 * - Validation version avant migration
 * - Migration progressive avec fallback
 * 
 * @module services/nutrition/sharing/migration/versionMigrator
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 3
 */

import logger from '../../../../utils/logger';

const log = logger.module('versionMigrator');

/**
 * ✅ PHASE 4 : Système de migration de versions
 * 
 * ✅ PHASE 4 : Migration automatique entre versions
 * - Support migration v1.0 → v2.0 (futur)
 * - Validation version avant migration
 * - Migration progressive avec fallback
 */
export class VersionMigrator {
  /**
   * ✅ PHASE 4 : Migre un export vers la version actuelle
   * 
   * @param {Object} data - Données à migrer
   * @param {string} fromVersion - Version source
   * @param {string} toVersion - Version cible (défaut: version actuelle)
   * @returns {Promise<Object>} Données migrées
   */
  static async migrate(data, fromVersion, toVersion = '1.0') {
    try {
      // ✅ PHASE 4 : Si même version, pas de migration
      if (fromVersion === toVersion) {
        return data;
      }

      // ✅ PHASE 4 : Migration progressive (v1.0 → v2.0 → ...)
      let migratedData = data;
      let currentVersion = fromVersion;

      while (currentVersion !== toVersion) {
        const nextVersion = this.getNextVersion(currentVersion);
        
        if (!nextVersion) {
          throw new Error(`Migration impossible de ${currentVersion} vers ${toVersion}`);
        }

        // ✅ PHASE 4 : Migrer vers version suivante
        migratedData = await this.migrateToVersion(migratedData, currentVersion, nextVersion);
        currentVersion = nextVersion;

        log.debug('[migrate] Migration effectuée', {
          from: fromVersion,
          to: currentVersion,
          target: toVersion
        });
      }

      return migratedData;
    } catch (error) {
      log.error('[migrate] Erreur migration:', error);
      throw new Error(`Échec migration de ${fromVersion} vers ${toVersion}: ${error.message}`);
    }
  }

  /**
   * ✅ PHASE 4 : Obtient la version suivante dans la chaîne de migration
   * 
   * @param {string} version - Version actuelle
   * @returns {string|null} Version suivante ou null
   */
  static getNextVersion(version) {
    const migrationPath = {
      '1.0': '2.0', // Futur : v1.0 → v2.0
      '2.0': null // Version finale actuelle
    };

    return migrationPath[version] || null;
  }

  /**
   * ✅ PHASE 4 : Migre vers une version spécifique
   * 
   * @param {Object} data - Données à migrer
   * @param {string} fromVersion - Version source
   * @param {string} toVersion - Version cible
   * @returns {Promise<Object>} Données migrées
   */
  static async migrateToVersion(data, fromVersion, toVersion) {
    const migrationKey = `${fromVersion}_to_${toVersion}`;

    // ✅ PHASE 4 : Migration v1.0 → v2.0 (futur, pour l'instant identique)
    if (migrationKey === '1.0_to_2.0') {
      // Pour l'instant, retourner données telles quelles
      // À implémenter quand v2.0 sera disponible
      return {
        ...data,
        version: '2.0',
        metadata: {
          ...data.metadata,
          migratedFrom: fromVersion,
          migratedAt: new Date().toISOString()
        }
      };
    }

    // ✅ PHASE 4 : Pas de migration définie
    throw new Error(`Migration ${migrationKey} non implémentée`);
  }
}


