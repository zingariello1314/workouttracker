/**
 * Service de règles automatiques pour les catégories
 */

import logger from '../../utils/logger';
import { notificationService } from '../../utils/notifications';

const log = logger.module('categoryRules');

class CategoryRulesEngine {
  /**
   * Vérifier règles pour une catégorie
   */
  checkRules(categorie, depenses) {
    if (!categorie || !depenses) return [];

    const rules = categorie.regles || {};
    const depenseActuelle = depenses
      .filter(d => d.categorie === categorie.id)
      .reduce((sum, d) => sum + d.montant, 0);

    const budgetMensuel = categorie.budgetMensuel || 0;
    if (budgetMensuel === 0) return [];

    const pourcentUtilise = (depenseActuelle / budgetMensuel) * 100;
    const alerts = [];

    // Alerte 80%
    if (rules.alerte80 !== false && pourcentUtilise >= 80 && pourcentUtilise < 100) {
      alerts.push({
        type: 'WARNING_80',
        message: `${categorie.nom} : 80% du budget utilisé`,
        action: rules.action80 || 'NOTIFICATION',
        priority: 'medium',
        pourcentUtilise,
        depenseActuelle,
        budgetMensuel
      });
    }

    // Alerte 100%
    if (rules.alerte100 !== false && pourcentUtilise >= 100) {
      alerts.push({
        type: 'CRITICAL_100',
        message: `${categorie.nom} : Budget épuisé`,
        action: rules.action100 || 'BLOCK',
        priority: 'high',
        pourcentUtilise,
        depenseActuelle,
        budgetMensuel
      });
    }

    // Alerte 120%
    if (rules.alerte120 !== false && pourcentUtilise >= 120) {
      alerts.push({
        type: 'CRITICAL_120',
        message: `${categorie.nom} : Budget dépassé de ${(pourcentUtilise - 100).toFixed(1)}%`,
        action: rules.action120 || 'BLOCK_STRICT',
        priority: 'critical',
        pourcentUtilise,
        depenseActuelle,
        budgetMensuel
      });
    }

    return alerts;
  }

  /**
   * Exécuter action selon règle
   */
  async executeAction(alert, categorie) {
    if (!alert || !categorie) return;

    switch (alert.action) {
      case 'NOTIFICATION':
        // Notification navigateur si activée
        if (categorie.settings?.notifications !== false) {
          await notificationService.showFinanceAlert(
            categorie.nom,
            alert.message,
            alert.priority === 'critical' ? 'critical' : 'high'
          );
        }
        break;

      case 'BLOCK':
        // Marquer catégorie comme bloquée (à implémenter dans UI)
        log.warn(`Category ${categorie.nom} should be blocked`);
        break;

      case 'BLOCK_STRICT':
        // Bloquer strictement + alerte
        log.warn(`Category ${categorie.nom} should be strictly blocked`);
        if (categorie.settings?.notifications !== false) {
          await notificationService.showFinanceAlert(
            categorie.nom,
            `⚠️ ${alert.message} - Nouvelles dépenses bloquées`,
            'critical'
          );
        }
        break;

      case 'SUGGEST':
        // Suggérer réduction autres catégories (à implémenter)
        log.info(`Should suggest rebalancing for ${categorie.nom}`);
        break;

      default:
        log.warn(`Unknown action: ${alert.action}`);
    }
  }

  /**
   * Vérifier toutes les règles pour toutes les catégories
   */
  async checkAllRules(categories, depenses) {
    const allAlerts = [];

    for (const categorie of categories) {
      const alerts = this.checkRules(categorie, depenses);
      allAlerts.push(...alerts.map(alert => ({ ...alert, categorieId: categorie.id })));

      // Exécuter actions automatiques
      for (const alert of alerts) {
        if (alert.action !== 'NOTIFICATION' || categorie.settings?.notifications !== false) {
          await this.executeAction(alert, categorie);
        }
      }
    }

    return allAlerts.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

export const categoryRulesEngine = new CategoryRulesEngine();



