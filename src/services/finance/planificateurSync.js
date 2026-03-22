/**
 * Service de synchronisation cross-modules pour le Planificateur Financier
 * Propage les changements de répartition vers les autres modules
 */

import logger from '../../utils/logger';
import { investissementsStorage } from './investissementsStorage';
import { planificateurStorage } from './planificateurStorage';

const log = logger.module('planificateurSync');

function getMontantBySubType(repartition, subType) {
  if (!repartition?.categories) return undefined;
  const cat = repartition.categories.find(c => c.subType === subType);
  return cat ? cat.montant : undefined;
}

function mFixed(repartition, id) {
  const c = (repartition?.categories || []).find((x) => x && x.id === id);
  return c && typeof c.montant === 'number' ? c.montant : undefined;
}

function getTotalByType(repartition, type) {
  if (!repartition?.categories) return undefined;
  return repartition.categories
    .filter(c => c.type === type)
    .reduce((s, c) => s + (c.montant || 0), 0);
}

/** Normalise V2 (categories) ou legacy vers { investissementOr, investissementBourse, ... } pour sync */
function toLegacyShape(repartition) {
  if (!repartition) return {};
  if (repartition.investissementOr !== undefined) return repartition;
  return {
    investissementOr: mFixed(repartition, 'cat_investissementOr') ?? getMontantBySubType(repartition, 'or'),
    investissementBourse: mFixed(repartition, 'cat_bourse') ?? getMontantBySubType(repartition, 'bourse'),
    cashAccumulation: mFixed(repartition, 'cat_cash') ?? getMontantBySubType(repartition, 'cash'),
    loisirs: getTotalByType(repartition, 'loisirs')
  };
}

class PlanificateurSyncService {
  constructor() {
    this.eventBus = new EventTarget();
    this.subscribers = new Map();
  }

  /**
   * Propager changement répartition vers tous les modules (accepte V2 ou legacy)
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
   * Mettre à jour module Investissements (accepte V2 ou legacy)
   */
  async updateInvestissements(repartition) {
    const legacy = toLegacyShape(repartition);
    try {
      if (legacy.investissementOr !== undefined) {
        const orData = await investissementsStorage.getOrData();
        await investissementsStorage.saveOrData({
          ...orData,
          objectifMensuel: legacy.investissementOr
        });
        log.debug('Updated Or objectifMensuel:', legacy.investissementOr);

        const bourseCryptoData = await investissementsStorage.getBourseCryptoData();
        const updatedDCA = {
          ...bourseCryptoData.dca,
          montants: {
            ...bourseCryptoData.dca?.montants,
            or: legacy.investissementOr
          }
        };
        await investissementsStorage.saveBourseCryptoData({
          ...bourseCryptoData,
          dca: updatedDCA
        });
        log.debug('Updated Or DCA montants.or:', legacy.investissementOr);
      }
      if (legacy.investissementBourse !== undefined) {
        const bourseCryptoData = await investissementsStorage.getBourseCryptoData();
        const updatedDCA = {
          ...bourseCryptoData.dca,
          montants: {
            ...bourseCryptoData.dca?.montants,
            etf: legacy.investissementBourse * 0.6,
            actions: legacy.investissementBourse * 0.4
          }
        };
        await investissementsStorage.saveBourseCryptoData({
          ...bourseCryptoData,
          dca: updatedDCA
        });
        log.debug('Updated Bourse DCA:', legacy.investissementBourse);
      }
      if (legacy.cashAccumulation !== undefined) {
        const liquiditesData = await investissementsStorage.getLiquiditesData();
        await investissementsStorage.saveLiquiditesData({
          ...liquiditesData,
          objectifMensuel: legacy.cashAccumulation
        });
        log.debug('Updated Cash accumulation:', legacy.cashAccumulation);
      }
    } catch (error) {
      log.error('Error updating investissements:', error);
    }
  }

  /**
   * Mettre à jour module Budget Personnel
   */
  async updateBudgetPersonnel(repartition) {
    try {
      const salaire = await planificateurStorage.getSalaire();
      const net = salaire?.netMensuel ?? 0;
      const { syncBudgetPersonnelFromPlanificateurData } = await import('./budgetPlanificateurBridge.js');
      const r = await syncBudgetPersonnelFromPlanificateurData(repartition, net);
      log.debug('[updateBudgetPersonnel] Sync budget:', r);
    } catch (error) {
      log.error('Error updating budget personnel:', error);
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
   * Obtenir notifications de changement (accepte V2 ou legacy)
   */
  getNotifications(repartition) {
    const legacy = toLegacyShape(repartition);
    const notifications = [];
    if (legacy.loisirs !== undefined) {
      notifications.push({ type: 'loisirs', message: `Budget loisirs modifié : ${legacy.loisirs}€`, icon: '🎮' });
    }
    if (legacy.investissementOr !== undefined) {
      notifications.push({ type: 'or', message: `Investissement Or modifié : ${legacy.investissementOr}€`, icon: '🥇' });
    }
    if (legacy.investissementBourse !== undefined) {
      notifications.push({ type: 'bourse', message: `Investissement Bourse modifié : ${legacy.investissementBourse}€`, icon: '📈' });
    }
    return notifications;
  }
}

export const planificateurSync = new PlanificateurSyncService();



