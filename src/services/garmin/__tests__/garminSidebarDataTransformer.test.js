/**
 * Tests pour le transformateur de données Garmin sidebar
 * 
 * Requirements: 1.2, 1.4
 * - Tester la transformation des données pour le graphique sidebar (1.2)
 * - Tester la gestion des cas de données manquantes ou incomplètes (1.4)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GarminSidebarDataTransformer } from '../garminSidebarDataTransformer';

describe('GarminSidebarDataTransformer', () => {
  let transformer;

  beforeEach(() => {
    transformer = new GarminSidebarDataTransformer();
  });

  describe('transformToSidebarData', () => {
    it('should transform valid raw data correctly', async () => {
      const rawData = {
        dailyMetrics: {
          '2025-12-15': {
            heartRate: {
              resting: 65,
              max: 180,
              avg: 85,
              timeSeries: [
                { timestamp: 1734249600000, bpm: 65 }, // 07:00
                { timestamp: 1734274800000, bpm: 85 }, // 14:00
                { timestamp: 1734282000000, bpm: 180 } // 16:00
              ]
            },
            steps: 8500,
            calories: {
              active: 800,
              resting: 1200,
              total: 2000
            },
            bodyBattery: 75,
            sleep: {
              duration: 480,
              deep: 120,
              light: 240,
              rem: 90,
              awake: 30
            }
          }
        }
      };

      const options = {
        selectedDate: '2025-12-15',
        enableTimeSeriesData: true,
        optimizeForSidebar: true
      };

      const result = await transformer.transformToSidebarData(rawData, options);

      // Vérifier la structure de base
      expect(result).toHaveProperty('todayMetrics');
      expect(result).toHaveProperty('heartRateTimeSeries');
      expect(result).toHaveProperty('heartRateZones');
      expect(result).toHaveProperty('selectedDate', '2025-12-15');
      expect(result).toHaveProperty('hasTimeSeriesData', true);
      expect(result).toHaveProperty('hasData', true);

      // Vérifier les métriques quotidiennes
      expect(result.todayMetrics.heartRate.resting).toBe(65);
      expect(result.todayMetrics.heartRate.max).toBe(180);
      expect(result.todayMetrics.heartRate.average).toBe(85);
      expect(result.todayMetrics.steps).toBe(8500);
      expect(result.todayMetrics.calories.total).toBe(2000);
      expect(result.todayMetrics.bodyBattery).toBe(75);

      // Vérifier les données de série temporelle
      expect(result.heartRateTimeSeries).toHaveLength(3);
      expect(result.heartRateTimeSeries[0]).toMatchObject({
        bpm: 65,
        isReal: true
      });
      expect(result.heartRateTimeSeries[0].time).toMatch(/^\d{2}:\d{2}$/);

      // Vérifier les zones FC
      expect(result.heartRateZones).toHaveLength(5);
      expect(result.heartRateZones[0]).toMatchObject({
        zone: 1,
        name: 'Récupération',
        color: '#4ade80'
      });

      // Vérifier les données de sommeil
      expect(result.sleepPhases).toBeDefined();
      expect(result.sleepPhases.length).toBeGreaterThan(0);
    });

    it('should handle missing data gracefully', async () => {
      const rawData = {};
      const options = {
        selectedDate: '2025-12-15',
        enableTimeSeriesData: true
      };

      const result = await transformer.transformToSidebarData(rawData, options);

      // Vérifier que les données de fallback sont créées
      expect(result).toHaveProperty('todayMetrics');
      expect(result.hasData).toBe(false);
      expect(result.todayMetrics.heartRate.resting).toBeNull();
      expect(result.todayMetrics.steps).toBe(0);
      expect(result.heartRateTimeSeries).toHaveLength(0);
      expect(result.heartRateZones).toHaveLength(0);
    });

    it('should generate basic heart rate points when no time series data', async () => {
      const rawData = {
        dailyMetrics: {
          '2025-12-15': {
            heartRate: {
              resting: 65,
              max: 180,
              avg: 85
              // Pas de timeSeries
            }
          }
        }
      };

      const options = {
        selectedDate: '2025-12-15',
        enableTimeSeriesData: true
      };

      const result = await transformer.transformToSidebarData(rawData, options);

      // Vérifier que des points de base sont générés
      expect(result.heartRateTimeSeries.length).toBeGreaterThan(0);
      expect(result.heartRateTimeSeries.some(point => point.bpm === 65)).toBe(true); // Repos
      expect(result.heartRateTimeSeries.some(point => point.bpm === 85)).toBe(true); // Moyenne
      expect(result.heartRateTimeSeries.some(point => point.bpm === 180)).toBe(true); // Max
    });

    it('should optimize data for sidebar when requested', async () => {
      // Créer des données avec beaucoup de points
      const timeSeries = [];
      for (let i = 0; i < 1000; i++) {
        timeSeries.push({
          timestamp: 1734249600000 + (i * 60000), // Chaque minute
          bpm: 70 + Math.sin(i / 100) * 20
        });
      }

      const rawData = {
        dailyMetrics: {
          '2025-12-15': {
            heartRate: {
              resting: 65,
              max: 180,
              avg: 85,
              timeSeries
            }
          }
        }
      };

      const options = {
        selectedDate: '2025-12-15',
        enableTimeSeriesData: true,
        optimizeForSidebar: true,
        maxTimeSeriesPoints: 200
      };

      const result = await transformer.transformToSidebarData(rawData, options);

      // Vérifier que les données sont compressées
      expect(result.heartRateTimeSeries.length).toBeLessThanOrEqual(200);
      expect(result.optimizedForSidebar).toBe(true);
    });

    it('should handle invalid time series points', async () => {
      const rawData = {
        dailyMetrics: {
          '2025-12-15': {
            heartRate: {
              resting: 65,
              timeSeries: [
                { timestamp: 1734249600000, bpm: 65 }, // Valide
                { timestamp: 'invalid', bpm: 85 }, // Timestamp invalide
                { timestamp: 1734274800000, bpm: -10 }, // BPM invalide
                { timestamp: 1734282000000, bpm: 300 }, // BPM trop élevé
                { timestamp: 1734285600000, bpm: 75 } // Valide
              ]
            }
          }
        }
      };

      const options = {
        selectedDate: '2025-12-15',
        enableTimeSeriesData: true
      };

      const result = await transformer.transformToSidebarData(rawData, options);

      // Vérifier que seuls les points valides sont conservés
      expect(result.heartRateTimeSeries.length).toBe(2); // 2 points valides
      expect(result.heartRateTimeSeries.every(point => point.bpm > 30 && point.bpm < 220)).toBe(true);
    });

    it('should calculate sleep quality correctly', async () => {
      const rawData = {
        dailyMetrics: {
          '2025-12-15': {
            sleep: {
              duration: 480, // 8h
              deep: 120,     // 2h (25%)
              light: 240,    // 4h (50%)
              rem: 90,       // 1.5h (18.75%)
              awake: 30      // 0.5h (6.25%)
            }
          }
        }
      };

      const options = {
        selectedDate: '2025-12-15'
      };

      const result = await transformer.transformToSidebarData(rawData, options);

      expect(result.todayMetrics.sleep).toBeDefined();
      expect(result.todayMetrics.sleep.quality).toBe('Excellent'); // Bon sommeil
      expect(result.sleepPhases).toHaveLength(4);
    });

    it('should generate heart rate zones with correct percentages', async () => {
      const rawData = {
        dailyMetrics: {
          '2025-12-15': {
            heartRate: {
              resting: 65,
              max: 180
            },
            intensityMinutes: {
              total: 60,
              vigorous: 20,
              moderate: 40
            }
          }
        }
      };

      const options = {
        selectedDate: '2025-12-15'
      };

      const result = await transformer.transformToSidebarData(rawData, options);

      expect(result.heartRateZones).toHaveLength(5);
      
      // Vérifier que les zones ont des seuils corrects
      const zone1 = result.heartRateZones[0];
      expect(zone1.minBpm).toBe(65); // FC repos
      expect(zone1.maxBpm).toBe(Math.round(180 * 0.68)); // 68% FC max
      
      // Vérifier que les pourcentages totalisent 100%
      const totalPercentage = result.heartRateZones.reduce((sum, zone) => sum + zone.percentage, 0);
      expect(totalPercentage).toBe(100);
    });
  });

  describe('Cache functionality', () => {
    it('should cache transformed data', async () => {
      const rawData = {
        dailyMetrics: {
          '2025-12-15': {
            heartRate: { resting: 65 }
          }
        }
      };

      const options = { selectedDate: '2025-12-15' };

      // Premier appel
      const result1 = await transformer.transformToSidebarData(rawData, options);
      
      // Deuxième appel (devrait utiliser le cache)
      const result2 = await transformer.transformToSidebarData(rawData, options);

      expect(result1).toEqual(result2);
      
      // Vérifier les stats du cache
      const stats = transformer.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should clear cache correctly', async () => {
      const rawData = {
        dailyMetrics: {
          '2025-12-15': {
            heartRate: { resting: 65 }
          }
        }
      };

      await transformer.transformToSidebarData(rawData, { selectedDate: '2025-12-15' });
      
      let stats = transformer.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      transformer.clearCache();
      
      stats = transformer.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
});