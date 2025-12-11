/**
 * Tests unitaires pour le service de synchronisation temps réel
 * 
 * @module services/sidebar/__tests__/realTimeSyncService.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  realTimeSyncService, 
  SYNC_STATES, 
  CONFLICT_TYPES, 
  HISTORICAL_SYNC_EVENTS 
} from '../realTimeSyncService';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';

// Mock des dépendances
vi.mock('../../../utils/sidebarEvents', () => ({
  sidebarEvents: {
    on: vi.fn(),
    emit: vi.fn(),
    removeAllListeners: vi.fn()
  },
  SIDEBAR_EVENTS: {
    QUEST_COMPLETED: 'quest_completed',
    QUEST_UPDATED: 'quest_updated',
    PAGES_READ: 'pages_read',
    BOOK_UPDATED: 'book_updated',
    WORKOUT_ADDED: 'workout_added',
    MEAL_LOGGED: 'meal_logged',
    FINANCE_UPDATED: 'finance_updated',
    GARMIN_DATA_UPDATED: 'garmin_data_updated',
    REFRESH_SIDEBAR: 'refresh_sidebar'
  }
}));

describe('RealTimeSyncService', () => {
  beforeEach(() => {
    // Réinitialiser les mocks
    vi.clearAllMocks();
    
    // Réinitialiser le service
    realTimeSyncService.stop();
    realTimeSyncService.syncQueue = [];
    realTimeSyncService.activeConflicts.clear();
    realTimeSyncService.syncState = SYNC_STATES.IDLE;
  });

  afterEach(() => {
    realTimeSyncService.stop();
  });

  describe('Initialisation', () => {
    it('devrait démarrer avec l\'état IDLE', () => {
      expect(realTimeSyncService.getSyncState()).toBe(SYNC_STATES.IDLE);
    });

    it('devrait initialiser les listeners d\'événements', () => {
      realTimeSyncService.start();
      
      // Vérifier que les listeners sont configurés
      expect(sidebarEvents.on).toHaveBeenCalledWith(
        SIDEBAR_EVENTS.QUEST_COMPLETED,
        expect.any(Function)
      );
      expect(sidebarEvents.on).toHaveBeenCalledWith(
        SIDEBAR_EVENTS.PAGES_READ,
        expect.any(Function)
      );
    });
  });

  describe('Gestion des événements', () => {
    beforeEach(() => {
      realTimeSyncService.start();
    });

    it('devrait traiter les événements sidebar', async () => {
      const testData = { questId: 'test-quest', completed: true };
      
      // Simuler la réception d'un événement
      await realTimeSyncService.handleSidebarEvent(SIDEBAR_EVENTS.QUEST_COMPLETED, testData);
      
      // Vérifier que l'opération est ajoutée à la queue
      expect(realTimeSyncService.syncQueue.length).toBeGreaterThan(0);
    });

    it('devrait traiter les événements historiques', async () => {
      const testData = { questId: 'test-quest', checked: true };
      
      // Simuler la réception d'un événement historique
      await realTimeSyncService.handleHistoricalEvent(
        HISTORICAL_SYNC_EVENTS.QUEST_CHECKBOX_TOGGLED, 
        testData
      );
      
      // Vérifier que l'opération est ajoutée à la queue
      expect(realTimeSyncService.syncQueue.length).toBeGreaterThan(0);
    });

    it('devrait gérer les erreurs d\'événements gracieusement', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simuler une erreur dans le traitement
      const invalidData = null;
      
      await realTimeSyncService.handleSidebarEvent(SIDEBAR_EVENTS.QUEST_COMPLETED, invalidData);
      
      // Vérifier que l'erreur est loggée
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Queue de synchronisation', () => {
    beforeEach(() => {
      realTimeSyncService.start();
    });

    it('devrait ajouter des opérations à la queue', () => {
      const operation = {
        id: 'test-op',
        type: 'sidebar_to_main',
        eventName: SIDEBAR_EVENTS.QUEST_COMPLETED,
        data: { questId: 'test' },
        timestamp: Date.now(),
        retryCount: 0
      };
      
      realTimeSyncService.queueSyncOperation(operation);
      
      expect(realTimeSyncService.syncQueue).toContain(operation);
    });

    it('devrait traiter la queue automatiquement', async () => {
      const operation = {
        id: 'test-op',
        type: 'sidebar_to_main',
        eventName: SIDEBAR_EVENTS.QUEST_COMPLETED,
        data: { questId: 'test' },
        timestamp: Date.now(),
        retryCount: 0
      };
      
      // Mock de l'exécution
      const executeSpy = vi.spyOn(realTimeSyncService, 'executeSyncOperation')
        .mockResolvedValue();
      
      realTimeSyncService.queueSyncOperation(operation);
      
      // Attendre le traitement
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(executeSpy).toHaveBeenCalledWith(operation);
      
      executeSpy.mockRestore();
    });

    it('devrait changer l\'état pendant le traitement', async () => {
      const operation = {
        id: 'test-op',
        type: 'sidebar_to_main',
        eventName: SIDEBAR_EVENTS.QUEST_COMPLETED,
        data: { questId: 'test' },
        timestamp: Date.now(),
        retryCount: 0
      };
      
      // Mock de l'exécution avec délai
      const executeSpy = vi.spyOn(realTimeSyncService, 'executeSyncOperation')
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)));
      
      realTimeSyncService.queueSyncOperation(operation);
      
      // Vérifier l'état pendant le traitement
      await new Promise(resolve => setTimeout(resolve, 25));
      expect(realTimeSyncService.getSyncState()).toBe(SYNC_STATES.SYNCING);
      
      // Attendre la fin
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(realTimeSyncService.getSyncState()).toBe(SYNC_STATES.IDLE);
      
      executeSpy.mockRestore();
    });
  });

  describe('Détection de conflits', () => {
    beforeEach(() => {
      realTimeSyncService.start();
    });

    it('devrait détecter les conflits de version', async () => {
      const operation = {
        eventName: SIDEBAR_EVENTS.QUEST_UPDATED,
        data: { id: 'test-quest', version: 2 },
        timestamp: Date.now()
      };
      
      // Mock de la version actuelle
      vi.spyOn(realTimeSyncService, 'getCurrentDataVersion')
        .mockResolvedValue(1);
      
      const conflict = await realTimeSyncService.detectConflict(operation);
      
      expect(conflict).toBeTruthy();
      expect(conflict.type).toBe(CONFLICT_TYPES.VERSION_MISMATCH);
    });

    it('devrait détecter les éditions concurrentes', async () => {
      const now = Date.now();
      const operation = {
        eventName: SIDEBAR_EVENTS.QUEST_UPDATED,
        data: { id: 'test-quest' },
        timestamp: now
      };
      
      // Mock du timestamp de dernière modification (très récent)
      vi.spyOn(realTimeSyncService, 'getLastModifiedTimestamp')
        .mockResolvedValue(now - 500);
      
      const conflict = await realTimeSyncService.detectConflict(operation);
      
      expect(conflict).toBeTruthy();
      expect(conflict.type).toBe(CONFLICT_TYPES.CONCURRENT_EDIT);
    });

    it('ne devrait pas détecter de conflit quand tout va bien', async () => {
      const operation = {
        eventName: SIDEBAR_EVENTS.QUEST_UPDATED,
        data: { id: 'test-quest', version: 1 },
        timestamp: Date.now()
      };
      
      // Mock des données actuelles (pas de conflit)
      vi.spyOn(realTimeSyncService, 'getCurrentDataVersion')
        .mockResolvedValue(1);
      vi.spyOn(realTimeSyncService, 'getLastModifiedTimestamp')
        .mockResolvedValue(Date.now() - 10000);
      
      const conflict = await realTimeSyncService.detectConflict(operation);
      
      expect(conflict).toBeNull();
    });
  });

  describe('Résolution de conflits', () => {
    beforeEach(() => {
      realTimeSyncService.start();
    });

    it('devrait résoudre les conflits de version', async () => {
      const conflictId = 'test-conflict';
      const conflict = {
        type: CONFLICT_TYPES.VERSION_MISMATCH,
        currentVersion: 1,
        incomingVersion: 2
      };
      const operation = {
        eventName: SIDEBAR_EVENTS.QUEST_UPDATED,
        data: { id: 'test-quest', timestamp: Date.now() }
      };
      
      // Mock des méthodes de résolution
      vi.spyOn(realTimeSyncService, 'getCurrentData')
        .mockResolvedValue({ timestamp: Date.now() - 1000 });
      vi.spyOn(realTimeSyncService, 'applyResolvedData')
        .mockResolvedValue();
      
      await realTimeSyncService.resolveVersionConflict(conflictId, conflict, operation);
      
      // Vérifier que le conflit est résolu
      expect(realTimeSyncService.activeConflicts.has(conflictId)).toBe(false);
    });

    it('devrait émettre des événements de résolution', async () => {
      const conflictId = 'test-conflict';
      const resolution = 'version_resolved';
      const resolvedData = { test: 'data' };
      
      realTimeSyncService.resolveConflict(conflictId, resolution, resolvedData);
      
      expect(sidebarEvents.emit).toHaveBeenCalledWith(
        HISTORICAL_SYNC_EVENTS.CONFLICT_RESOLVED,
        expect.objectContaining({
          conflictId,
          resolution,
          resolvedData
        })
      );
    });
  });

  describe('Synchronisation spécialisée', () => {
    beforeEach(() => {
      realTimeSyncService.start();
    });

    it('devrait synchroniser les données de quêtes', async () => {
      const data = { questId: 'test-quest', checked: true };
      
      await realTimeSyncService.syncQuestCheckbox(data);
      
      expect(sidebarEvents.emit).toHaveBeenCalledWith(
        SIDEBAR_EVENTS.QUEST_UPDATED,
        expect.objectContaining({
          questId: 'test-quest',
          completed: true
        })
      );
    });

    it('devrait synchroniser les données de lecture', async () => {
      const data = { bookId: 'test-book', progress: 50 };
      
      await realTimeSyncService.syncReadingProgress(data);
      
      expect(sidebarEvents.emit).toHaveBeenCalledWith(
        SIDEBAR_EVENTS.BOOK_UPDATED,
        expect.objectContaining({
          bookId: 'test-book',
          progress: 50
        })
      );
    });

    it('devrait synchroniser les données Garmin', async () => {
      const data = { calories: 2000, steps: 10000 };
      
      await realTimeSyncService.syncGarminMetrics(data);
      
      expect(sidebarEvents.emit).toHaveBeenCalledWith(
        SIDEBAR_EVENTS.GARMIN_DATA_UPDATED,
        data
      );
    });
  });

  describe('API publique', () => {
    it('devrait démarrer et arrêter le service', () => {
      realTimeSyncService.start();
      expect(realTimeSyncService.getSyncState()).toBe(SYNC_STATES.IDLE);
      
      realTimeSyncService.stop();
      expect(realTimeSyncService.syncQueue).toHaveLength(0);
      expect(realTimeSyncService.activeConflicts.size).toBe(0);
    });

    it('devrait retourner l\'état de synchronisation', () => {
      const state = realTimeSyncService.getSyncState();
      expect(Object.values(SYNC_STATES)).toContain(state);
    });

    it('devrait retourner les conflits actifs', () => {
      const conflicts = realTimeSyncService.getActiveConflicts();
      expect(conflicts).toBeInstanceOf(Map);
    });

    it('devrait forcer une synchronisation complète', async () => {
      await realTimeSyncService.forceSyncAll();
      
      expect(sidebarEvents.emit).toHaveBeenCalledWith(
        SIDEBAR_EVENTS.REFRESH_SIDEBAR,
        expect.objectContaining({
          source: 'force_sync'
        })
      );
    });
  });

  describe('Gestion d\'erreurs', () => {
    beforeEach(() => {
      realTimeSyncService.start();
    });

    it('devrait gérer les erreurs de synchronisation', () => {
      const error = new Error('Test error');
      const context = { eventName: 'test_event' };
      
      realTimeSyncService.handleSyncError(error, context);
      
      expect(realTimeSyncService.getSyncState()).toBe(SYNC_STATES.ERROR);
      expect(sidebarEvents.emit).toHaveBeenCalledWith(
        HISTORICAL_SYNC_EVENTS.SYNC_STATE_CHANGED,
        expect.objectContaining({
          state: SYNC_STATES.ERROR,
          error: 'Test error'
        })
      );
    });

    it('devrait retry les opérations échouées', async () => {
      const operation = {
        id: 'test-op',
        type: 'sidebar_to_main',
        eventName: SIDEBAR_EVENTS.QUEST_COMPLETED,
        data: { questId: 'test' },
        timestamp: Date.now(),
        retryCount: 0
      };
      
      // Mock d'une exécution qui échoue puis réussit
      let callCount = 0;
      const executeSpy = vi.spyOn(realTimeSyncService, 'executeSyncOperation')
        .mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error('First attempt fails');
          }
          return Promise.resolve();
        });
      
      // Mock du setTimeout pour accélérer le test
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = (fn) => fn();
      
      realTimeSyncService.queueSyncOperation(operation);
      
      // Attendre le traitement
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(executeSpy).toHaveBeenCalledTimes(2);
      
      // Restaurer
      global.setTimeout = originalSetTimeout;
      executeSpy.mockRestore();
    });
  });

  describe('Utilitaires', () => {
    it('devrait générer des IDs uniques', () => {
      const id1 = realTimeSyncService.generateSyncId();
      const id2 = realTimeSyncService.generateSyncId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^sync_\d+_[a-z0-9]+$/);
    });

    it('devrait émettre des événements de synchronisation', () => {
      const eventName = HISTORICAL_SYNC_EVENTS.SYNC_STATE_CHANGED;
      const data = { test: 'data' };
      
      realTimeSyncService.emitSyncEvent(eventName, data);
      
      expect(sidebarEvents.emit).toHaveBeenCalledWith(eventName, data);
    });
  });
});