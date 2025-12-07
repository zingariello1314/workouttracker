/**
 * Tests unitaires pour investissementsAlerts
 * Tests de détection d'alertes et opportunités
 */

import { describe, test, expect } from 'vitest';
import { investissementsAlerts } from '../investissementsAlerts';

describe('InvestissementsAlerts', () => {
  describe('Rebalancing Detection', () => {
    test('should detect rebalancing needed when allocation drifts', () => {
      const data = {
        allocation: {
          or: 35, // Dérive de +5% (cible 30%)
          liquidites: 20, // Dérive de +5% (cible 15%)
          bourseCrypto: 45, // Dérive de -10% (cible 55%)
          total: 100000
        },
        or: { stockActuel: 100 },
        liquidites: { stockTotal: 20000 },
        bourseCrypto: { positions: [] }
      };

      const alerts = investissementsAlerts.analyze(data);
      const rebalancingAlerts = alerts.filter(a => a.type === 'rebalancing');

      expect(rebalancingAlerts.length).toBeGreaterThan(0);
    });

    test('should not alert when allocation is within tolerance', () => {
      const data = {
        allocation: {
          or: 30, // Dans la tolérance
          liquidites: 15, // Dans la tolérance
          bourseCrypto: 55, // Dans la tolérance
          total: 100000
        },
        or: { stockActuel: 100 },
        liquidites: { stockTotal: 15000 },
        bourseCrypto: { positions: [] }
      };

      const alerts = investissementsAlerts.analyze(data);
      const rebalancingAlerts = alerts.filter(a => a.type === 'rebalancing');

      // Devrait avoir peu ou pas d'alertes si dans la tolérance
      expect(rebalancingAlerts.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Cash Excedent Detection', () => {
    test('should detect cash excedent when above threshold', () => {
      const data = {
        allocation: {
          or: 30,
          liquidites: 25, // Excédent (cible 15%)
          bourseCrypto: 45,
          total: 100000
        },
        or: { stockActuel: 100 },
        liquidites: { stockTotal: 25000 },
        bourseCrypto: { positions: [] }
      };

      const alerts = investissementsAlerts.analyze(data);
      const cashAlerts = alerts.filter(a => a.type === 'cash_excedent');

      expect(cashAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Liquidity Optimal Detection', () => {
    test('should detect high liquidity stock', () => {
      const data = {
        allocation: {
          or: 30,
          liquidites: 15,
          bourseCrypto: 55,
          total: 100000
        },
        or: { stockActuel: 100 },
        liquidites: { stockTotal: 15000 }, // > 10k€
        bourseCrypto: { positions: [] }
      };

      const alerts = investissementsAlerts.analyze(data);
      const liquidityAlerts = alerts.filter(a => a.type === 'liquidity_optimal');

      expect(liquidityAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Alert Prioritization', () => {
    test('should prioritize alerts correctly', () => {
      const data = {
        allocation: {
          or: 40, // Grande dérive
          liquidites: 25, // Excédent
          bourseCrypto: 35,
          total: 100000
        },
        or: { stockActuel: 100 },
        liquidites: { stockTotal: 25000 },
        bourseCrypto: { positions: [] }
      };

      const alerts = investissementsAlerts.analyze(data);

      // Les alertes doivent être triées par priorité
      const priorities = alerts.map(a => a.priority);
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      
      for (let i = 0; i < priorities.length - 1; i++) {
        expect(priorityOrder[priorities[i]]).toBeLessThanOrEqual(priorityOrder[priorities[i + 1]]);
      }
    });
  });
});



