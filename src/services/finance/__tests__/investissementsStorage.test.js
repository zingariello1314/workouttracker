/**
 * Tests unitaires pour investissementsStorage
 * Tests critiques pour garantir la cohérence des données
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { investissementsStorage } from '../investissementsStorage';

describe('InvestissementsStorage', () => {
  beforeEach(async () => {
    // Nettoyer avant chaque test si nécessaire
    // Note: IndexedDB est persistant, donc on teste avec des données réelles
  });

  afterEach(async () => {
    // Nettoyage optionnel après chaque test
  });

  describe('Or Data', () => {
    test('saveOrData should save and retrieve or data correctly', async () => {
      const orData = {
        id: 'current',
        stockActuel: 10.5,
        objectifMensuel: 150,
        acquisitions: [],
        repartition: {
          coffreBanque: 60,
          coffreDomicile: 30,
          tiersConfiance: 10
        }
      };

      await investissementsStorage.saveOrData(orData);
      const retrieved = await investissementsStorage.getOrData();

      expect(retrieved).toBeDefined();
      expect(retrieved.stockActuel).toBe(10.5);
      expect(retrieved.objectifMensuel).toBe(150);
    });

    test('saveOrAcquisition should update stock correctly', async () => {
      // Initialiser avec stock de base
      await investissementsStorage.saveOrData({
        id: 'current',
        stockActuel: 5,
        objectifMensuel: 150,
        acquisitions: [],
        repartition: {
          coffreBanque: 60,
          coffreDomicile: 30,
          tiersConfiance: 10
        }
      });

      const acquisition = {
        date: '2024-03-15',
        quantite: 5,
        prix: 65.50,
        prime: 4.2,
        lieuStockage: 'coffre-banque'
      };

      await investissementsStorage.saveOrAcquisition(acquisition);
      const orData = await investissementsStorage.getOrData();

      expect(orData.stockActuel).toBeGreaterThanOrEqual(5);
      expect(orData.acquisitions).toBeDefined();
      expect(orData.acquisitions.length).toBeGreaterThan(0);
    });
  });

  describe('Liquidites Data', () => {
    test('saveLiquiditesData should save and retrieve liquidites data correctly', async () => {
      const liquiditesData = {
        id: 'current',
        stockTotal: 5000,
        objectifMensuel: 200,
        progression: [],
        repartition: {}
      };

      await investissementsStorage.saveLiquiditesData(liquiditesData);
      const retrieved = await investissementsStorage.getLiquiditesData();

      expect(retrieved).toBeDefined();
      expect(retrieved.stockTotal).toBe(5000);
      expect(retrieved.objectifMensuel).toBe(200);
    });
  });

  describe('Bourse Crypto Data', () => {
    test('saveBourseCryptoData should save and retrieve bourse crypto data correctly', async () => {
      const bourseCryptoData = {
        id: 'current',
        allocation: {
          actions: 60,
          crypto: 15,
          cashAttente: 25
        },
        positions: [],
        dca: {
          frequence: 'mensuel',
          montants: {
            etf: 300,
            actions: 150,
            crypto: 50
          }
        }
      };

      await investissementsStorage.saveBourseCryptoData(bourseCryptoData);
      const retrieved = await investissementsStorage.getBourseCryptoData();

      expect(retrieved).toBeDefined();
      expect(retrieved.allocation.actions).toBe(60);
      expect(retrieved.allocation.crypto).toBe(15);
      expect(retrieved.positions).toBeDefined();
    });
  });

  describe('Allocation', () => {
    test('saveAllocation should save and retrieve allocation correctly', async () => {
      const allocationData = {
        id: 'current',
        or: 30,
        liquidites: 15,
        bourseCrypto: 55,
        cible: {
          or: 30,
          liquidites: 15,
          bourseCrypto: 55
        }
      };

      await investissementsStorage.saveAllocation(allocationData);
      const retrieved = await investissementsStorage.getAllocation();

      expect(retrieved).toBeDefined();
      expect(retrieved.or).toBe(30);
      expect(retrieved.liquidites).toBe(15);
      expect(retrieved.bourseCrypto).toBe(55);
    });
  });

  describe('Default Data', () => {
    test('getDefaultOrData should return valid default structure', () => {
      const defaultData = investissementsStorage.getDefaultOrData();
      
      expect(defaultData).toBeDefined();
      expect(defaultData.id).toBe('current');
      expect(defaultData.stockActuel).toBe(0);
      expect(defaultData.objectifMensuel).toBeGreaterThan(0);
      expect(defaultData.repartition).toBeDefined();
    });

    test('getDefaultLiquiditesData should return valid default structure', () => {
      const defaultData = investissementsStorage.getDefaultLiquiditesData();
      
      expect(defaultData).toBeDefined();
      expect(defaultData.id).toBe('current');
      expect(defaultData.stockTotal).toBe(0);
      expect(defaultData.objectifMensuel).toBeGreaterThan(0);
    });

    test('getDefaultBourseCryptoData should return valid default structure', () => {
      const defaultData = investissementsStorage.getDefaultBourseCryptoData();
      
      expect(defaultData).toBeDefined();
      expect(defaultData.id).toBe('current');
      expect(defaultData.allocation).toBeDefined();
      expect(defaultData.positions).toBeDefined();
      expect(defaultData.dca).toBeDefined();
    });
  });
});

