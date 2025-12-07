/**
 * Service de synchronisation cross-modules pour le Planificateur Financier
 * Propage les changements de répartition vers les autres modules
 */

import logger from '../../utils/logger';
import { investissementsStorage } from './investissementsStorage';
import { budgetStorage } from './budgetStorage';

const log = logger.module('planificateurSync');

class PlanificateurSyncService {
  constructor() {
    this.eventBus = new EventTarget();
    this.subscribers = new Map();
  }

  /**
   * Propager changement répartition vers tous les modules
   */
  async propagateRepartitionChange(newRepartition) {
    try {
      log.info('Propagating repartition change:', newRepartition);

      // 1. Mettre à jour Investissements
      await this.updateInvestissements(newRepartition);
      
      // 2. Mettre à jour Budget Personnel
      await this.updateBudgetPersonnel(newRepartition);
      
      // 3. Émettre événement pour notifications
      this.eventBus.dispatchEvent(new CustomEvent('repartitionChanged', {
        detail: newRepartition
      }));

      log.info('Repartition change propagated successfully');
    } catch (error) {
      log.error('Error propagating repartition change:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour module Investissements
   */
  async updateInvestissements(repartition) {
    try {
      // Mettre à jour DCA Or
      if (repartition.investissementOr !== undefined) {
        const bourseCryptoData = await investissementsStorage.getBourseCryptoData();
        const updatedDCA = {
          ...bourseCryptoData.dca,
          montants: {
            ...bourseCryptoData.dca?.montants,
            or: repartition.investissementOr
          }
        };
        await investissementsStorage.saveBourseCryptoData({
          ...bourseCryptoData,
          dca: updatedDCA
        });
        log.debug('Updated Or DCA:', repartition.investissementOr);
      }
      
      // Mettre à jour DCA Bourse
      if (repartition.investissementBourse !== undefined) {
        const bourseCryptoData = await investissementsStorage.getBourseCryptoData();
        const updatedDCA = {
          ...bourseCryptoData.dca,
          montants: {
            ...bourseCryptoData.dca?.montants,
            etf: repartition.investissementBourse * 0.6, // 60% ETF
            actions: repartition.investissementBourse * 0.4 // 40% Actions
          }
        };
        await investissementsStorage.saveBourseCryptoData({
          ...bourseCryptoData,
          dca: updatedDCA
        });
        log.debug('Updated Bourse DCA:', repartition.investissementBourse);
      }
      
      // Mettre à jour Cash accumulation
      if (repartition.cashAccumulation !== undefined) {
        const liquiditesData = await investissementsStorage.getLiquiditesData();
        await investissementsStorage.saveLiquiditesData({
          ...liquiditesData,
          objectifMensuel: repartition.cashAccumulation
        });
        log.debug('Updated Cash accumulation:', repartition.cashAccumulation);
      }
    } catch (error) {
      log.error('Error updating investissements:', error);
      // Ne pas bloquer si erreur
    }
  }

  /**
   * Mettre à jour module Budget Personnel
   */
  async updateBudgetPersonnel(repartition) {
    try {
      if (repartition.loisirs !== undefined) {
        // Mettre à jour budget loisirs dans Budget Personnel
        // Note: Cette intégration dépendra de la structure exacte du module Budget
        // Pour l'instant, on log juste
        log.debug('Budget loisirs should be updated to:', repartition.loisirs);
        // TODO: Implémenter mise à jour réelle quand le module Budget sera prêt
      }
    } catch (error) {
      log.error('Error updating budget personnel:', error);
      // Ne pas bloquer si erreur
    }
  }

  /**
   * S'abonner aux changements de répartition
   */
  subscribe(callback) {
    const handler = (e) => callback(e.detail);
    this.eventBus.addEventListener('repartitionChanged', handler);
    
    const unsubscribe = () => {
      this.eventBus.removeEventListener('repartitionChanged', handler);
    };
    
    return unsubscribe;
  }

  /**
   * Obtenir notifications de changement
   */
  getNotifications(repartition) {
    const notifications = [];

    if (repartition.loisirs !== undefined) {
      notifications.push({
        type: 'loisirs',
        message: `Budget loisirs modifié : ${repartition.loisirs}€`,
        icon: '🎮'
      });
    }

    if (repartition.investissementOr !== undefined) {
      notifications.push({
        type: 'or',
        message: `Investissement Or modifié : ${repartition.investissementOr}€`,
        icon: '🥇'
      });
    }

    if (repartition.investissementBourse !== undefined) {
      notifications.push({
        type: 'bourse',
        message: `Investissement Bourse modifié : ${repartition.investissementBourse}€`,
        icon: '📈'
      });
    }

    return notifications;
  }
}

export const planificateurSync = new PlanificateurSyncService();



