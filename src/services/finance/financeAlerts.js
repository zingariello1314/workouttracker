/**
 * Service d'alertes intelligentes pour le portfolio
 */

import { financeStorage } from './financeStorage';
import logger from '../../utils/logger';
import { notificationService } from '../../utils/notifications';
// ✅ PHASE 3 - Étape 3.17 : Import statique pour éviter require dynamique
import { calculateMovingAverages } from './financeCalculations';

const log = logger.module('financeAlerts');

class FinanceAlertsService {
  constructor() {
    this.alerts = [];
    this.subscribers = new Set();
    this.checkInterval = null;
    // ✅ PHASE 3 - Étape 3.13 : Map pour déduplication efficace des alertes
    this.activeAlertsMap = new Map(); // key: alertId, value: alert object
    this.alertHistory = new Map(); // key: alertId, value: { firstSeen, lastSeen, count }
  }

  /**
   * ✅ PHASE 3 - Étape 3.13 : Générer ID unique stable pour alerte
   * Basé sur type + ticker + condition (pas timestamp) pour déduplication
   */
  generateAlertId(type, ticker, condition = '') {
    // Normaliser condition pour ID stable (arrondir valeurs numériques)
    let normalizedCondition = condition;
    if (typeof condition === 'number') {
      // Arrondir à 2 décimales pour éviter variations mineures
      normalizedCondition = Math.round(condition * 100) / 100;
    }
    return `${type}_${ticker}_${normalizedCondition}`;
  }

  /**
   * ✅ PHASE 3 - Étape 3.13 : Dédupliquer alertes et gérer état
   */
  deduplicateAlerts(newAlerts) {
    const now = Date.now();
    const deduplicated = [];
    const seenIds = new Set();

    for (const alert of newAlerts) {
      // Générer ID stable si pas déjà présent
      if (!alert.stableId) {
        alert.stableId = this.generateAlertId(
          alert.type,
          alert.ticker,
          alert.condition || alert.type
        );
      }

      const stableId = alert.stableId;

      // Vérifier si alerte déjà vue dans cette batch
      if (seenIds.has(stableId)) {
        continue; // Skip doublon dans même batch
      }
      seenIds.add(stableId);

      // Vérifier si alerte existe déjà (persistante)
      const existingAlert = this.activeAlertsMap.get(stableId);
      if (existingAlert) {
        // Alerte persistante : mettre à jour timestamp et compteur
        const history = this.alertHistory.get(stableId) || {
          firstSeen: existingAlert.timestamp,
          lastSeen: existingAlert.timestamp,
          count: 1
        };
        
        history.lastSeen = now;
        history.count += 1;
        this.alertHistory.set(stableId, history);

        // Mettre à jour alerte existante (garder premier timestamp pour "first seen")
        const updatedAlert = {
          ...existingAlert,
          timestamp: now, // Dernière détection
          firstSeen: history.firstSeen, // Première détection
          count: history.count,
          isNew: false, // Pas nouvelle, persistante
          isResolved: false
        };
        
        this.activeAlertsMap.set(stableId, updatedAlert);
        deduplicated.push(updatedAlert);
      } else {
        // Nouvelle alerte : créer entrée
        const history = {
          firstSeen: now,
          lastSeen: now,
          count: 1
        };
        this.alertHistory.set(stableId, history);

        const newAlert = {
          ...alert,
          timestamp: now,
          firstSeen: now,
          count: 1,
          isNew: true,
          isResolved: false
        };

        this.activeAlertsMap.set(stableId, newAlert);
        deduplicated.push(newAlert);
      }
    }

    // ✅ PHASE 3.13 : Marquer alertes résolues (pas dans nouvelles mais dans actives)
    const newAlertIds = new Set(deduplicated.map(a => a.stableId));
    for (const [stableId, alert] of this.activeAlertsMap.entries()) {
      if (!newAlertIds.has(stableId)) {
        // Alerte n'est plus active : marquer comme résolue
        alert.isResolved = true;
        alert.resolvedAt = now;
        // Ne pas inclure dans liste active (optionnel : garder pour historique)
        // this.activeAlertsMap.delete(stableId); // Optionnel : supprimer si on veut pas garder historique
      }
    }

    return deduplicated;
  }

  /**
   * ✅ PHASE 3 - Étape 3.13 : Vérifier toutes les alertes pour un portfolio avec déduplication
   */
  async checkAlerts(portfolio, historicalDataMap = {}) {
    const newAlerts = [];

    for (const position of portfolio) {
      // 1. Alertes seuils gains/pertes
      const gainLossAlerts = this.checkGainLossThresholds(position);
      newAlerts.push(...gainLossAlerts);

      // 2. Alertes techniques (avec historique si disponible)
      const historicalData = historicalDataMap[position.ticker] || [];
      const technicalAlerts = await this.checkTechnicalSignals(position, historicalData);
      newAlerts.push(...technicalAlerts);
    }

    // ✅ PHASE 3.13 : Dédupliquer alertes
    const deduplicatedAlerts = this.deduplicateAlerts(newAlerts);

    // Trier par priorité puis par timestamp (nouvelles en premier)
    deduplicatedAlerts.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Même priorité : nouvelles alertes en premier
      if (a.isNew !== b.isNew) {
        return a.isNew ? -1 : 1;
      }
      
      // Même état : plus récent en premier
      return b.timestamp - a.timestamp;
    });

    this.alerts = deduplicatedAlerts;
    this.notifySubscribers();
    return deduplicatedAlerts;
  }

  /**
   * Vérifier seuils gains/pertes avec seuils personnalisés
   */
  checkGainLossThresholds(position) {
    const alerts = [];
    const { plusValuePourcent } = position.calculs || {};
    const settings = position.settings || {};
    
    // Seuils personnalisés ou par défaut
    const seuils = {
      gain: settings.seuilGain || 20,
      perte: settings.seuilPerte || -10,
      perteSevere: settings.seuilPerteSevere || -20
    };

    if (plusValuePourcent === undefined) return alerts;

    // Alerte gain
    if (plusValuePourcent >= seuils.gain) {
      const alert = {
        type: 'GAIN_THRESHOLD',
        priority: 'high',
        ticker: position.ticker,
        message: `${position.ticker} : Objectif gain atteint (+${plusValuePourcent.toFixed(2)}%)`,
        action: 'PRENDRE_PROFITS',
        condition: `gain_${seuils.gain}`, // Condition pour ID stable
        positionId: position.id
      };
      alerts.push(alert);
      
      // Notification navigateur
      if (settings.notifications !== false) {
        notificationService.showFinanceAlert(
          position.ticker,
          `Gain de +${plusValuePourcent.toFixed(2)}% atteint`,
          'high'
        );
      }
    }

    // Alerte perte
    if (plusValuePourcent <= seuils.perte) {
      const alert = {
        type: 'LOSS_THRESHOLD',
        priority: 'critical',
        ticker: position.ticker,
        message: `${position.ticker} : Seuil perte atteint (${plusValuePourcent.toFixed(2)}%)`,
        action: 'SURVEILLANCE',
        condition: `perte_${seuils.perte}`, // Condition pour ID stable
        positionId: position.id
      };
      alerts.push(alert);
      
      // Notification navigateur
      if (settings.notifications !== false) {
        notificationService.showFinanceAlert(
          position.ticker,
          `Perte de ${plusValuePourcent.toFixed(2)}% détectée`,
          'critical'
        );
      }
    }

    // Alerte perte sévère
    if (plusValuePourcent <= seuils.perteSevere) {
      const alert = {
        type: 'LOSS_SEVERE',
        priority: 'critical',
        ticker: position.ticker,
        message: `${position.ticker} : Perte sévère (${plusValuePourcent.toFixed(2)}%) - Action requise`,
        action: 'REÉVALUER',
        condition: `perte_severe_${seuils.perteSevere}`, // Condition pour ID stable
        positionId: position.id
      };
      alerts.push(alert);
      
      // Notification navigateur
      if (settings.notifications !== false) {
        notificationService.showFinanceAlert(
          position.ticker,
          `Perte sévère de ${plusValuePourcent.toFixed(2)}% - Action requise`,
          'critical'
        );
      }
    }

    return alerts;
  }

  /**
   * Vérifier signaux techniques avec détection croisements MA
   */
  async checkTechnicalSignals(position, historicalData = []) {
    const alerts = [];
    const { prixActuel, ma50, ma200 } = position.yahooData || {};
    const { calculs } = position;
    const settings = position.settings || {};

    if (!prixActuel) return alerts;

    // Détection croisement MA (nécessite historique)
    if (historicalData && historicalData.length >= 2) {
      const recent = historicalData.slice(-2);
      const prevPrice = recent[0]?.close || recent[0]?.prixActuel;
      const currentPrice = recent[1]?.close || recent[1]?.prixActuel || prixActuel;
      
      // ✅ OPTIMISATION Phase 2.3 : Calcul MA optimisé (algorithme incrémental O(n))
      // Note: Accès par index est déjà O(1), mais on garde l'algorithme optimisé
      // ✅ PHASE 3 - Étape 3.17 : Import statique remplace require dynamique
      const ma50Data = calculateMovingAverages(historicalData.slice(-51), 50);
      const ma200Data = calculateMovingAverages(historicalData.slice(-201), 200);
      
      // Accès O(1) par index (déjà optimal)
      if (ma50Data.data.length >= 2 && ma200Data.data.length >= 2) {
        const prevMA50 = ma50Data.data[ma50Data.data.length - 2]?.value;
        const currentMA50 = ma50Data.data[ma50Data.data.length - 1]?.value;
        const prevMA200 = ma200Data.data[ma200Data.data.length - 2]?.value;
        const currentMA200 = ma200Data.data[ma200Data.data.length - 1]?.value;
        
        // Détection croisement haussier (Golden Cross)
        if (prevMA50 <= prevMA200 && currentMA50 > currentMA200) {
          const alert = {
            type: 'GOLDEN_CROSS',
            priority: 'high',
            ticker: position.ticker,
            message: `${position.ticker} : Golden Cross détecté (MA50 > MA200) - Signal haussier`,
            action: 'SIGNAL_ACHAT',
            condition: 'golden_cross', // Condition pour ID stable
            positionId: position.id
          };
          alerts.push(alert);
          
          if (settings.notifications !== false) {
            notificationService.showFinanceAlert(
              position.ticker,
              'Golden Cross détecté - Signal haussier',
              'high'
            );
          }
        }
        
        // Détection croisement baissier (Death Cross)
        if (prevMA50 >= prevMA200 && currentMA50 < currentMA200) {
          const alert = {
            type: 'DEATH_CROSS',
            priority: 'critical',
            ticker: position.ticker,
            message: `${position.ticker} : Death Cross détecté (MA50 < MA200) - Signal baissier`,
            action: 'SIGNAL_VENTE',
            condition: 'death_cross', // Condition pour ID stable
            positionId: position.id
          };
          alerts.push(alert);
          
          if (settings.notifications !== false) {
            notificationService.showFinanceAlert(
              position.ticker,
              'Death Cross détecté - Signal baissier',
              'critical'
            );
          }
        }
      }
    }

    // Alerte cassure MA50 (basique)
    const signal = calculs?.signal;
    if (signal && signal.signal !== 'NEUTRE') {
      alerts.push({
        type: 'TECHNICAL_SIGNAL',
        priority: signal.signal === 'ACHAT' ? 'medium' : 'high',
        ticker: position.ticker,
        message: `${position.ticker} : Signal technique ${signal.signal} détecté`,
        action: signal.signal === 'ACHAT' ? 'SIGNAL_ACHAT' : 'SIGNAL_VENTE',
        condition: `signal_${signal.signal}`, // Condition pour ID stable
        positionId: position.id
      });
    }

    // Alerte position vs MA
    if (ma50) {
      const distanceMA50 = Math.abs((prixActuel - ma50) / ma50) * 100;
      if (distanceMA50 < 2) {
        alerts.push({
          type: 'MA_CLOSE',
          priority: 'low',
          ticker: position.ticker,
          message: `${position.ticker} : Prix très proche de la MA50 (${distanceMA50.toFixed(2)}%)`,
          action: 'SURVEILLANCE',
          condition: 'ma50_close', // Condition pour ID stable
          positionId: position.id
        });
      }
    }

    return alerts;
  }

  /**
   * Monitoring continu
   */
  startMonitoring(portfolio, interval = 60000) {
    this.stopMonitoring();
    this.checkInterval = setInterval(async () => {
      await this.checkAlerts(portfolio);
    }, interval);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * ✅ PHASE 3 - Étape 3.13 : Réinitialiser alertes (utile pour tests ou reset)
   */
  resetAlerts() {
    this.alerts = [];
    this.activeAlertsMap.clear();
    this.alertHistory.clear();
    this.notifySubscribers();
  }

  /**
   * ✅ PHASE 3 - Étape 3.13 : Obtenir statistiques alertes (pour debugging/monitoring)
   */
  getAlertStats() {
    return {
      totalActive: this.alerts.length,
      totalTracked: this.activeAlertsMap.size,
      byPriority: {
        critical: this.alerts.filter(a => a.priority === 'critical').length,
        high: this.alerts.filter(a => a.priority === 'high').length,
        medium: this.alerts.filter(a => a.priority === 'medium').length,
        low: this.alerts.filter(a => a.priority === 'low').length
      },
      byType: this.alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {}),
      newAlerts: this.alerts.filter(a => a.isNew).length,
      persistentAlerts: this.alerts.filter(a => !a.isNew && !a.isResolved).length
    };
  }

  /**
   * Système abonnement (Observer pattern)
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.alerts);
      } catch (error) {
        log.error('Error in alert subscriber:', error);
      }
    });
  }
}

export const financeAlertsService = new FinanceAlertsService();

